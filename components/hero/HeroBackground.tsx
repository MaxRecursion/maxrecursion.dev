"use client";

import dynamic from "next/dynamic";

// WebGL only runs in the browser, and loading it lazily keeps it off the critical path.
const FluidCanvas = dynamic(() => import("./FluidCanvas"), { ssr: false });

export function HeroBackground() {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(60%_50%_at_30%_40%,color-mix(in_srgb,var(--accent)_22%,transparent),transparent_70%),radial-gradient(50%_45%_at_75%_65%,color-mix(in_srgb,var(--accent-2)_18%,transparent),transparent_70%)]"
      />
      <FluidCanvas />
    </>
  );
}
