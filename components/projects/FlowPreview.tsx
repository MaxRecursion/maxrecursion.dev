/** A labelled pipeline, drawn in place of a screenshot for projects that have none. */
export function FlowPreview({ label, steps }: { label: string; steps: string[] }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-4 bg-background p-6 sm:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.15em] text-accent">{label}</p>
      <ol className="flex flex-col gap-2">
        {steps.map((step, i) => (
          <li key={step} className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-7 shrink-0 place-items-center rounded-full border border-border font-mono text-xs text-muted"
            >
              {i + 1}
            </span>
            <span className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm">{step}</span>
          </li>
        ))}
      </ol>
      <p className="font-mono text-[11px] text-muted">Pipeline overview from the README, not a screenshot</p>
    </div>
  );
}
