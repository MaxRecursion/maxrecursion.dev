"use client";

import { useEffect, useState, type RefObject } from "react";

export type AnimationGate = {
  /** On screen, in a visible tab, and motion is allowed. */
  running: boolean;
  /** The visitor prefers reduced motion; render a still frame instead. */
  still: boolean;
};

/** One visibility controller for hero animation: idle when unseen or when motion is reduced. */
export function useAnimationGate(ref: RefObject<Element | null>): AnimationGate {
  const [gate, setGate] = useState<AnimationGate>({ running: false, still: false });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const update = () => {
      const still = motion.matches;
      const running = visible && !document.hidden && !still;
      setGate((current) => (current.running === running && current.still === still ? current : { running, still }));
    };
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        update();
      },
      { threshold: 0 },
    );

    if (observer) observer.observe(element);
    else {
      visible = true;
      update();
    }
    document.addEventListener("visibilitychange", update);
    motion.addEventListener("change", update);
    update();
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", update);
      motion.removeEventListener("change", update);
    };
  }, [ref]);

  return gate;
}
