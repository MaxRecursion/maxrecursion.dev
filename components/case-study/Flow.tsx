import type { FlowNode } from "@/content/case-studies";

/**
 * A chain of steps, plain HTML so it reads as an ordered list. Short chains run left to right from md up
 * and stack on narrow screens; long chains (more than four steps) always stack, so no arrow points at a
 * wrapped row.
 */
export function Flow({ label, nodes }: { label: string; nodes: FlowNode[] }) {
  const vertical = nodes.length > 4;
  return (
    <figure className="my-6 rounded-xl border border-border bg-surface p-5">
      <figcaption className="mb-4 font-mono text-xs uppercase tracking-[0.15em] text-accent">{label}</figcaption>
      <ol className={vertical ? "flex flex-col gap-2" : "flex flex-col gap-2 md:flex-row md:flex-wrap md:items-stretch md:gap-y-3"}>
        {nodes.map((node, i) => (
          <li key={node.title} className={vertical ? "flex flex-col gap-2" : "flex flex-col gap-2 md:flex-row md:items-center"}>
            <div className="rounded-lg border border-border bg-background px-3 py-2">
              <p className="text-sm font-medium">{node.title}</p>
              {node.note && (
                <p className={`mt-0.5 text-xs leading-snug text-muted ${vertical ? "" : "max-w-[22ch]"}`}>{node.note}</p>
              )}
            </div>
            {node.edge && i < nodes.length - 1 && (
              <p className={`flex items-center gap-1.5 px-1 font-mono text-[11px] text-muted ${vertical ? "" : "md:max-w-[16ch]"}`}>
                <span aria-hidden="true" className={`text-accent ${vertical ? "" : "md:hidden"}`}>
                  ↓
                </span>
                <span>{node.edge}</span>
                {!vertical && (
                  <span aria-hidden="true" className="hidden text-accent md:inline">
                    →
                  </span>
                )}
              </p>
            )}
          </li>
        ))}
      </ol>
    </figure>
  );
}
