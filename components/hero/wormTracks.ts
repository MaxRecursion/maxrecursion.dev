import { arcLengthAtX, createPath, WORM_LANES, type DunePath } from "@/lib/dune-geometry";
import { WORMS, type WormRoute } from "@/lib/sandworms";

export type WormTrack = WormRoute & { path: DunePath };

/** The right edge of the artwork that is on screen at common desktop sizes. */
const ON_SCREEN_X = 1640;

let tracks: readonly WormTrack[] | null = null;

/** Each worm on its lane, built once and shared by the renderer and the seismograph. */
export function getWormTracks(): readonly WormTrack[] {
  tracks ??= WORMS.map((spec) => {
    const path = createPath(WORM_LANES[spec.lane]);
    const eastward = path.xs[path.xs.length - 1] > path.xs[0];
    return {
      spec,
      path,
      length: path.length,
      visibleTo: eastward ? arcLengthAtX(path, ON_SCREEN_X) : path.length,
    };
  });
  return tracks;
}

/** Seconds on the page clock that every worm layer shares. */
export const wormClock = () => performance.now() / 1000;
