"use client";

import { useEffect, useRef } from "react";

/**
 * Large statement whose words light up one at a time as they cross a trigger line, in reading
 * order. Words start at 30% opacity (globals.css has the no-JS and reduced-motion fallbacks).
 */
export function TaglineReveal({ text, eyebrow }: { text: string; eyebrow: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(" ");

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const spans = Array.from(root.querySelectorAll<HTMLElement>("[data-word]"));
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      spans.forEach((s) => (s.dataset.on = "true"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        // Words on one line cross together, so step them 45ms apart (400ms at most) to keep reading order.
        const crossing = entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target as HTMLElement)
          .sort((a, b) => spans.indexOf(a) - spans.indexOf(b));
        crossing.forEach((el, i) => {
          el.style.transitionDelay = `${Math.min(i * 45, 400)}ms`;
          el.dataset.on = "true";
          observer.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -40% 0px" },
    );
    spans.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <section aria-label="Tagline" className="mx-auto max-w-5xl px-6 py-24 sm:py-40">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
      <p ref={ref} className="mt-6 max-w-[680px] text-4xl font-semibold tracking-tight text-pretty sm:text-5xl">
        {words.map((word, i) => (
          <span key={i} data-word data-on="false" className="tagline-word">
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </p>
    </section>
  );
}
