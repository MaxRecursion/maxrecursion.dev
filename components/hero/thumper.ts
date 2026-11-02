import { planThumper, thumperReady, type Summons } from "@/lib/sandworms";
import { playThumper, prepareThumperAudio } from "./thumperSound";
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
  if (!route || !thumperReady(now, summons)) return false;
  // Planted a moment ahead by the audio's output latency, so each strike is heard as it is seen.
  let lead = 0;
  try {
    lead = prepareThumperAudio();
  } catch {
    // No audio: the thumper still works, silently.
  }
  const next = planThumper(route, now + lead, summons);
  if (next === summons) return false;
  summons = next;
  listeners.forEach((listener) => listener());
  try {
    playThumper(next);
  } catch {
    // As above: sound is a bonus, never a reason for the planting to fail.
  }
  return true;
}
