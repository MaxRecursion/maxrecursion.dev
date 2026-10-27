import type { CaseStudy } from "./types";

// Sources: README.md, plan.md and the test suite in github.com/MaxRecursion/CSVToParquet. Figures in the
// "Reported" table come from that README and were not re-run. The test run and the 3 GB measurements were
// done for this write-up (Apple M4, 10 cores, 16 GB, macOS 27.0.1, .NET SDK 10.0.302, Release build).
export const csvToParquet: CaseStudy = {
  slug: "csv-to-parquet",
  repo: "CSVToParquet",
  title: "Converting multi-gigabyte CSVs to Parquet in bounded memory",
  kicker: "CSV to Parquet",
  summary:
    "An ASP.NET Core service that turns an uploaded CSV into a Parquet file. Both files stream through disk, so input size is limited by disk rather than memory, and DuckDB does the conversion in a single COPY statement.",
  finding:
    "A 3.2 GB CSV converted in about 20 s with peak server memory under 0.9 GB once DuckDB's limit was set to 1 GB (one run at a time, Apple M4).",
  published: "2026-10-26",
  stack: [".NET 10", "ASP.NET Core", "DuckDB", "Parquet", "xUnit"],
  facts: [
    { label: "Hosting", value: "IIS in-process (uploads to ~4 GB) or a Windows Service on Kestrel (no cap)" },
    { label: "Tests", value: "41 xUnit tests; 41 passed in a run for this write-up" },
    { label: "Measured here", value: "3.2 GB CSV on an Apple M4: about 20 s, peak memory 0.8 GB with a 1 GB limit" },
  ],
  sections: [
    {
      id: "problem",
      heading: "Problem",
      blocks: [
        {
          type: "p",
          text: "The service is an internal tool that converts CSV files to Parquet, a compressed columnar format that analytics tools read far faster. Large files, several gigabytes, are the main case.",
        },
        {
          type: "p",
          text: "That rules out the usual shortcuts. According to the project's design notes, ASP.NET's multipart IFormFile buffers the whole upload before application code runs and has a 128 MB default limit, and loading a CSV into memory to convert it cannot scale to multi-gigabyte inputs.",
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
            "Inputs of several gigabytes, with memory that stays bounded however large the file.",
            "One build must run under IIS in-process (uploads up to about 4 GB, a hard IIS limit) or as a Windows Service on Kestrel with no size cap.",
            "DuckDB has no async API, so a conversion blocks its thread for the whole run.",
            "No bytes flow while DuckDB converts, so clients, proxies and load balancers need long timeouts.",
            "Conversions share one CPU and one disk, so concurrency has to be capped and excess load shed cleanly.",
          ],
        },
      ],
    },
    {
      id: "architecture",
      heading: "Architecture",
      blocks: [
        {
          type: "flow",
          label: "One request, from upload to download",
          nodes: [
            { title: "Client", note: "streams the raw CSV as text/csv", edge: "POST /api/convert" },
            { title: "Admission", note: "MaxConcurrentRequests; over the limit gets 503 with Retry-After", edge: "request body" },
            { title: "Temp file on local disk", note: "upload streamed to disk, never held in memory", edge: "waits for a conversion slot" },
            { title: "Conversion slot", note: "MaxConcurrentConversions caps simultaneous COPY statements", edge: "one COPY statement" },
            { title: "DuckDB COPY to Parquet", note: "shared warm instance, dedicated thread, parallel parse, zstd, spills to disk", edge: "Parquet temp file" },
            { title: "Response", note: "streamed from disk with Content-Length, deleted when the response ends" },
          ],
        },
        {
          type: "p",
          text: "Three limits apply from the outside in. Request admission rejects excess load before its upload touches the disk. Conversion slots cap how many DuckDB statements run at once, while uploads and downloads are never capped, so a queued request keeps streaming its body while the ones ahead of it convert. DuckDB's thread and memory settings are totals for the whole service, because every conversion shares one DuckDB instance.",
        },
        {
          type: "p",
          text: "When a client disconnects, its conversion is interrupted and its slot goes to a request that is still waiting. DuckDB stops once the row group it is writing is done.",
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
            ["Raw CSV request body, not multipart", "IFormFile buffers the whole upload and has a 128 MB default limit."],
            [
              "Stream the upload to a temp file and convert with one DuckDB COPY",
              "DuckDB provides parallel parsing, type detection and bounded memory, so no CSV parsing is hand-written.",
            ],
            [
              "Convert synchronously inside the request; the response is the file",
              "There is no job queue, polling endpoint or background service to operate.",
            ],
            [
              "Stream the Parquet back from a delete-on-close temp file",
              "It is never held in memory and is removed when the response ends.",
            ],
            [
              "One warm DuckDB instance shared by every conversion",
              "Creating an instance costs about 15 ms against about 0.3 ms to duplicate a connection, and one instance lets DuckDB's scheduler share threads across conversions.",
            ],
            [
              "Run each COPY on a dedicated thread",
              "On a thread-pool thread a blocking conversion starves the pool that other requests need, and the pool only grows about one thread per second.",
            ],
            [
              "A spill folder per process",
              "An overlapped IIS recycle runs two worker processes against one work directory.",
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
          type: "list",
          items: [
            "Synchronous conversion keeps the API trivial, but the client holds one connection open for the whole conversion, possibly minutes. Clients must stream in both directions and disable short timeouts.",
            "PreserveRowOrder stays on by default. Turning it off is the single biggest speed-up (about 20% off one conversion, per the README) but reorders rows, so it is an opt-in.",
            "zstd compression is the default. Snappy is faster but writes a noticeably larger file.",
            "Type detection samples roughly the first 20,000 rows, so a column whose type changes later makes DuckDB reject the file with a 422.",
            "IIS caps uploads at about 4 GB. Larger files need Windows Service mode.",
            "The free-space check runs per request, so requests that arrive together can all pass it against the same free space. The project's plan lists this as an open item.",
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
          text: "The suite has 41 xUnit tests across four layers:",
        },
        {
          type: "list",
          items: [
            "In-memory host: a valid CSV returns typed Parquet, an empty body returns 400, a CSV DuckDB rejects returns 422, and the OpenAPI document and Swagger UI are served.",
            "Real Kestrel: a CSV of about 100 MB streams in and out with a matching row count, and an upload over MaxUploadBytes returns 413.",
            "Parallel requests: eight concurrent requests each get their own data back, excess requests get 503 with Retry-After, a queue timeout returns 503, and a client that disconnects frees its slot and leaves no temp files.",
            "Options and converter: every unusable setting fails at startup naming the setting, including a codec crafted to inject SQL, and a conversion cancelled at any moment throws OperationCanceledException within a second.",
          ],
        },
        {
          type: "note",
          text: "Run for this write-up: dotnet test with .NET SDK 10.0.302 on macOS completed with 41 passed, 0 failed, 0 skipped, including the large-file test.",
        },
      ],
    },
    {
      id: "results",
      heading: "Results",
      blocks: [
        {
          type: "p",
          text: "Reported in the repository's README, comparing the parallel-request design against the previous behaviour (a fresh DuckDB instance per request, COPY on a thread-pool thread, two conversions at once):",
        },
        {
          type: "table",
          caption:
            "Measured by the repository's author on a 4-core, 16 GB Linux container with a 50 MB CSV. Not re-run for this write-up.",
          head: ["", "Before", "After"],
          rows: [
            ["First conversion after startup", "618 ms", "530 ms"],
            ["One conversion, server idle", "441 ms", "372 ms"],
            ["8 conversions in parallel, default settings", "2,676 ms", "2,409 ms"],
            ["GET /openapi/v1.json during 8 conversions", "940 ms", "43 ms"],
            ["50-row conversion during 8 conversions", "487 ms", "42 ms"],
          ],
        },
        {
          type: "p",
          text: "The last two rows are the point: converting no longer holds thread-pool threads, so the rest of the service stays responsive while the CPU is busy. Raw throughput of eight simultaneous conversions on four cores is unchanged (2,511 ms against 2,589 ms, within run-to-run noise) because at that point the CPU is the limit. The plan also records interrupt latency over a 100 MB CSV at default settings: 57 ms typical and 617 ms worst.",
        },
        {
          type: "p",
          text: "The repository publishes no peak-memory or large-file figures, and bounded memory is the central claim, so this was measured for this write-up with the same endpoint and a 3.2 GB input:",
        },
        {
          type: "table",
          caption: "One 3.21 GB CSV (47 million rows) converted to a 604 MB Parquet file, a fresh server per run.",
          head: ["Setting", "Runs", "Wall time", "Peak server memory"],
          rows: [
            ["Defaults (DuckDB's own memory limit)", "4", "20.0 to 24.2 s", "1.8 to 2.8 GB"],
            ["DuckDbMemoryLimit = 1GB", "3", "19.6 to 23.5 s", "0.77 to 0.88 GB"],
          ],
        },
        {
          type: "p",
          text: "By default DuckDB may use about 80% of RAM, so the 1.8 to 2.8 GB peak is not a bound. With an explicit 1 GB limit the process stayed under 0.9 GB for the same input at similar speed and the same output size, so the configured limit, not the file size, sets the ceiling. The idle service sits at about 127 MB, and the work folder was empty after a clean shutdown. The CSV compressed 5.3 times, which depends on the data and should not be generalised.",
        },
        {
          type: "note",
          text: "Method: a seeded synthetic CSV (7 columns: integer id, account string, date, decimal amount, currency, status and a three-word note) uploaded with curl -T over loopback to the Release build on an Apple M4 (10 cores, 16 GB, macOS 27.0.1, .NET SDK 10.0.302). Wall time is curl's total, covering upload to disk, conversion and download. Memory is the process's resident set sampled every 100 ms, so very short peaks could be missed. This is a single machine and a handful of runs: indicative, not a controlled benchmark. The generator script is not part of the repository.",
        },
      ],
    },
    {
      id: "lessons",
      heading: "Lessons and limits",
      blocks: [
        {
          type: "list",
          items: [
            "A cancel that lands while DuckDB is still binding the statement surfaces as an INTERRUPT error, not OperationCanceledException, so an aborted client briefly received a 422. The converter now treats any failure after its token fires as cancellation, and because Cancel() only interrupts a statement DuckDB has started, the interrupt repeats every 50 ms until the COPY returns.",
            "A review of the parallel-requests work raised nine findings. Each was checked against DuckDB before acting: seven were real and fixed, one was a clean-up, and one is left open (the per-request disk check).",
            "The headline result of the parallelism work is responsiveness, not throughput, which stayed CPU-bound.",
            "Not measured: peak memory under several concurrent multi-gigabyte uploads (the measurement above is one request at a time), the cost of higher compression levels, and behaviour behind a real reverse proxy.",
          ],
        },
      ],
    },
  ],
  evidence: [
    { label: "Design, settings and measurements", path: "README.md" },
    { label: "Locked decisions, deviations, open items", path: "plan.md" },
    { label: "Conversion and cancellation", path: "src/CsvToParquet.Api/ParquetConverter.cs" },
    { label: "Test suite", path: "tests/CsvToParquet.Api.Tests" },
  ],
};
