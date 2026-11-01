import { planThumper, type Summons } from "@/lib/sandworms";
import { getWormTracks, wormClock } from "./wormTracks";

let summons: Summons | null = null;
const listeners = new Set<() => void>();

/** The latest thumper plan; worm layers read it every frame. */
export const getSummons = () => summons;

export function subscribeSummons(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Plants a thumper. Returns false while Shai-Hulud is still answering the last one. */
export function plantThumper(now = wormClock()) {
  const route = getWormTracks().find((track) => track.spec.id === "shai-hulud");
  if (!route) return false;
  const next = planThumper(route, now, summons);
  if (next === summons) return false;
  summons = next;
  listeners.forEach((listener) => listener());
  return true;
}
