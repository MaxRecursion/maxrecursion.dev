"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";

const PULL = 8;

/** A link that leans toward the cursor while it hovers. Mouse only, and off for reduced motion. */
export function MagneticLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null);

  const lean = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.translate = `${(x * PULL).toFixed(2)}px ${(y * PULL).toFixed(2)}px`;
  };

  const settle = () => {
    if (ref.current) ref.current.style.translate = "";
  };

  return (
    <Link ref={ref} href={href} className={className} onPointerMove={lean} onPointerLeave={settle}>
      {children}
    </Link>
  );
}
