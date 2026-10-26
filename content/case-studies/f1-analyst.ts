import type { CaseStudy } from "./types";

// Every figure below is taken from demo/docs/RESULTS.md and README.md in github.com/MaxRecursion/f1analyst
// (measured 2026-08-07). They were not re-run for this page. Only the technical study is reproduced,
// which uses synthetic data throughout.
export const f1Analyst: CaseStudy = {
  slug: "f1-analyst",
  repo: "f1analyst",
  kicker: "F1 Analyst",
  title: "Where should a client-side query engine live?",
  summary:
    "The same million-row workload, queries and UI run against three Blazor WebAssembly engine topologies. The deciding measurement was not speed but whether the browser stayed responsive and the query could be cancelled.",
  finding:
    "The in-process engine had the fastest engine times but blocked the UI for 1,793 ms during a 1,780 ms query and could not be cancelled; the worker-based one cancelled in 74 ms.",
  stack: ["Blazor WebAssembly", "DuckDB", "duckdb-wasm", "Emscripten", "Parquet"],
  facts: [
    { label: "Workload", value: "1,000,000 rows × 25 columns, synthetic" },
    { label: "Measured", value: "2026-08-07, M-series Mac, Chromium 148, .NET 10 runtime" },
    { label: "Status", value: "All three arms built and measured; results are the repository's own" },
  ],
  sections: [
    {
      id: "problem",
      heading: "Problem",
      blocks: [
        {
          type: "p",
          text: "If an analytics interface is a Blazor WebAssembly app, where should its query engine run? Answering reporting queries over millions of rows inside the browser could turn minutes of server round trips into milliseconds and keep working offline, but only if the engine can load, run and be cancelled without freezing the page.",
        },
        {
          type: "p",
          text: "The repository treats this as measurement rather than opinion: every number comes from code in the repo, and all data is synthetic.",
        },
      ],
    },
    {
      id: "constraints",
      heading: "Constraints",
      blocks: [
        {
          type: "list",
          items: [
            "Dataset: 1,000,000 rows × 25 heterogeneous columns, 43.2 MB as ZSTD Parquet against 483 MB as equivalent JSON, 11 times larger.",
            "Memory: the duckdb-wasm bundles compile with a 4 GiB maximum, while the .NET WebAssembly heap is capped at 2 GiB (--max-memory=2147483648, read from the linker command line).",
            "Threads: the threaded duckdb-wasm bundle cannot load the Parquet extension or register OPFS files, whereas the non-threaded bundle does both. Blazor is not supported on the multithreaded .NET runtime in any shipped version.",
            "Toolchain: DuckDB v1.4.3 cross-compiles with Emscripten 3.1.56, the version .NET 10 pins. Against .NET 11 the same archives fail with a mixed exception-handling error, so two arms target net10.0.",
            "Application code stays C#, with no JavaScript above the IQueryEngine interface.",
            "The UI must stay responsive during a query, and a running query must be cancellable.",
          ],
        },
      ],
    },
    {
      id: "architecture",
      heading: "Architecture",
      blocks: [
        {
          type: "p",
          text: "Three real Blazor WebAssembly apps run the same Assessment page over the same dataset. They differ only in which IQueryEngine implementation is registered in Program.cs, so application code never learns which engine is underneath. The shared project holds the interface, a query IR, columnar results and stage timing.",
        },
        {
          type: "table",
          head: ["", "Arm A", "Arm B", "Arm C"],
          rows: [
            ["Engine", "duckdb-wasm", "DuckDB statically linked into .NET", "DuckDB statically linked into .NET"],
            ["Runs in", "Web Worker", "UI thread", ".NET in a Web Worker"],
            ["Called via", "JS gateway, 4 functions", "P/Invoke", "C# to C# WebWorkerClient"],
            ["Result crosses as", "Arrow IPC, one memcpy", "Nothing: same heap", "JSON"],
            ["Wasm payload", "2.9 MB + 32.7 MB engine", "29.5 MB", "29.5 MB"],
            ["Cancellable", "Yes (74 ms)", "No", "Yes (CancellationToken)"],
          ],
        },
        {
          type: "flow",
          label: "Arm A: engine in a Web Worker",
          nodes: [
            { title: "Blazor UI", note: "UI thread", edge: "4-function JS gateway" },
            { title: "duckdb-wasm", note: "Web Worker", edge: "Arrow IPC, one memcpy" },
            { title: "Decode into .NET columns", note: "UI thread" },
          ],
        },
        {
          type: "flow",
          label: "Arm B: engine in the same heap",
          nodes: [
            { title: "Blazor UI and DuckDB", note: "one thread, one heap", edge: "P/Invoke, zero-copy results" },
            { title: "Result vectors", note: "already in managed memory" },
          ],
        },
        {
          type: "flow",
          label: "Arm C: .NET in a Web Worker",
          nodes: [
            { title: "Blazor UI", note: "UI thread", edge: "WebWorkerClient" },
            { title: "DuckDB in .NET", note: "Web Worker", edge: "JSON" },
            { title: "Parse into .NET columns", note: "UI thread" },
          ],
        },
      ],
    },
    {
      id: "decisions",
      heading: "Technical decisions",
      blocks: [
        {
          type: "table",
          head: ["Decision", "Why"],
          rows: [
            [
              "One IQueryEngine, one query set, one UI for every arm",
              "The comparison isolates topology. Swapping the engine is a one-line change in Program.cs.",
            ],
            [
              "Record stage timings (execute, transfer, decode), not just totals",
              "Totals hid where time went: the arm that won on small results lost badly on a 50,000-row result.",
            ],
            [
              "Judge on blocking, not only latency",
              "A timer loop on the UI thread records the largest gap between iterations. If the thread is blocked the loop cannot run, so the maximum gap is the block duration.",
            ],
            [
              "Statically link DuckDB into the .NET runtime (arm B)",
              "The approach is widely assumed to be impossible. It cross-compiles in 132 seconds and runs; the wasm payload grows from 2.9 MB to 29.5 MB.",
            ],
            [
              "Query a ZSTD Parquet file instead of JSON",
              "43.2 MB against 483 MB for the same million rows makes in-browser analytics practical at all.",
            ],
          ],
        },
      ],
    },
    {
      id: "tradeoffs",
      heading: "Trade-offs",
      blocks: [
        {
          type: "table",
          caption: "Warm timings in milliseconds. Lower is better.",
          head: ["Query", "Arm A", "Arm B", "Arm C"],
          rows: [
            ["Portfolio summary (9 rows)", "886", "734", "644"],
            ["Monthly trend (180 rows)", "550", "475", "280"],
            ["Top counterparties (500 rows)", "1,647", "813", "878"],
            ["Detail drill-through (50k rows)", "3,579", "1,647", "6,877"],
            ["Heavy analytical scan (36 rows)", "1,862", "1,780", "1,831"],
            ["Cold start (engine init)", "1,180", "283", "627"],
            ["Dataset attach (43 MB)", "215", "92", "167"],
          ],
        },
        {
          type: "p",
          text: "The 50,000-row query separates the arms because it is cheap to compute and expensive to move. Where its time goes:",
        },
        {
          type: "table",
          head: ["Stage (ms)", "Arm A", "Arm B", "Arm C"],
          rows: [
            ["Query execute", "2,305", "747", "800"],
            ["Result transfer", "27", "0", "1,162"],
            ["Decode into .NET", "1,186", "810", "4,835"],
            ["Total", "3,579", "1,647", "6,877"],
          ],
        },
        {
          type: "list",
          items: [
            "Arm A (duckdb-wasm in a worker): consistent across result sizes, never blocks, and cancels in 74 ms. Its weakness is decode: turning 50,000 rows of Arrow into managed columns costs 1,186 ms because per-value loops are expensive in the Blazor interpreter.",
            "Arm B (in-process): the fastest engine times, a zero-copy result path, the fastest cold start and the smallest payload. It also blocks the browser for the whole query and cannot be cancelled.",
            "Arm C (.NET in a worker): the best small-result times and a clean CancellationToken API. Its JSON boundary costs 4,835 ms of decode on the large result, a cost the study introduced rather than one the topology forces.",
          ],
        },
      ],
    },
    {
      id: "validation",
      heading: "Validation",
      blocks: [
        {
          type: "p",
          text: "The repository documents how to reproduce the numbers: acquire the toolchain (emsdk 3.1.56 plus DuckDB source, about 2 GB), cross-compile DuckDB to static wasm (about 2 minutes), generate the dataset, then dotnet publish each arm and serve them side by side.",
        },
        {
          type: "p",
          text: "Blocking was measured with a timer-loop probe on the UI thread, using the largest gap between iterations as the block duration:",
        },
        {
          type: "table",
          head: ["", "Baseline gap", "Max gap during query", "Query duration", "Verdict"],
          rows: [
            ["Arm A", "1,001 ms", "1,001 ms", "3,392 ms", "Unaffected"],
            ["Arm B", "650 ms", "1,793 ms", "1,780 ms", "Blocked throughout"],
            ["Arm C", "999 ms", "1,000 ms", "1,831 ms", "Unaffected"],
          ],
        },
        {
          type: "note",
          text: "The first instrument was wrong. A requestAnimationFrame heartbeat reported a 0 ms freeze for every arm because rAF is fully throttled in a hidden pane, so it measured nothing. The timer-loop probe replaced it; its resolution is limited by the roughly one-second background timer clamp, so blocks shorter than a second would not show. Query timings come from Stopwatch inside the app and are unaffected.",
        },
        {
          type: "note",
          text: "These measurements were not re-run for this write-up. Reproducing them needs the 2 GB toolchain and the .NET wasm workloads, so the figures here are the repository's own.",
        },
      ],
    },
    {
      id: "results",
      heading: "Results",
      blocks: [
        {
          type: "p",
          text: "The study's conclusion is to ship arm A. It is not the fastest, but it is the only arm that is both non-blocking and predictable across result sizes, and the only one whose engine does not have to be maintained in-house.",
        },
        {
          type: "list",
          items: [
            "Arm B is genuinely faster and its zero-copy path is real, but it blocked the UI for 1,793 ms during a 1,780 ms query and could not honour a Cancel click, because the click handler was queued behind the query it was meant to stop. It remains the best engine here for a batch or export path where blocking does not matter.",
            "Arm C removes the freeze and wins on small results (280 ms against 550 ms on the monthly trend), but its JSON boundary makes the large result almost twice as slow as arm A (6,877 ms against 3,579 ms).",
            "The highest-value next experiment is replacing JSON with Arrow IPC across the worker boundary in arm C, which the stage timings suggest would combine arm B's speed with arm A's responsiveness.",
          ],
        },
      ],
    },
    {
      id: "lessons",
      heading: "Lessons learned",
      blocks: [
        {
          type: "p",
          text: "The results document records four earlier claims that did not survive measurement:",
        },
        {
          type: "list",
          items: [
            "“Statically linking DuckDB into Blazor WASM is a dead end” was false: it compiles and runs.",
            "“The interop boundary is cheap, about 6 ms” was misleading. The transfer is cheap (27 ms for 50,000 rows) but decoding into managed columns is not (1,186 ms); the earlier figure measured the wrong boundary.",
            "“The exception-handling scheme matches cleanly” holds for .NET 10 only, which is why two arms target net10.0.",
            "“UI never blocked, 0 ms” was not valid evidence because the instrument was not running.",
          ],
        },
        {
          type: "p",
          text: "Two practical traps from the feasibility harness: opening a database with an opfs:// path silently breaks the statically linked Parquet extension (use the in-memory catalogue plus registerOPFSFileName instead), and the threaded bundle cannot do Parquet-from-OPFS at all.",
        },
        {
          type: "p",
          text: "Limits that remain: all data is synthetic, everything was measured on one machine in one Chromium build with the pane often backgrounded, and the repository itself recommends re-running in a foreground managed Chrome before quoting the numbers externally. The top-level README still lists arm C as in progress, while the results document reports all three measured.",
        },
      ],
    },
  ],
  evidence: [
    { label: "Results and method", path: "demo/docs/RESULTS.md" },
    { label: "Feasibility findings", path: "README.md" },
    { label: "Feasibility harness", path: "spikes/duckdb-wasm" },
    { label: "Shared engine interface", path: "demo/src/Demo.Shared" },
  ],
};
