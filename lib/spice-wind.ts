export type SpicePointer = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
};

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

/**
 * A small local gust around a mouse pointer. Coordinates and radius use CSS
 * pixels, pointer velocity uses px/s, and the result is acceleration in px/s².
 * The softened center and smooth falloff avoid spikes or a hard radius edge.
 */
export function getSpiceGust(
  x: number,
  y: number,
  pointer: SpicePointer,
  radius = 110,
): { x: number; y: number } {
  if (
    !pointer.active ||
    !Number.isFinite(x) || !Number.isFinite(y) ||
    !Number.isFinite(pointer.x) || !Number.isFinite(pointer.y) ||
    !Number.isFinite(radius) || radius <= 0
  ) return { x: 0, y: 0 };

  const dx = x - pointer.x;
  const dy = y - pointer.y;
  const distance = Math.hypot(dx, dy);
  if (distance >= radius) return { x: 0, y: 0 };

  const t = distance / radius;
  const falloff = 1 - t * t * (3 - 2 * t);
  const softenedDistance = Math.max(distance, radius * 0.12, 1);
  const nx = dx / softenedDistance;
  const ny = dy / softenedDistance;
  const vx = Number.isFinite(pointer.vx) ? clamp(pointer.vx, 600) : 0;
  const vy = Number.isFinite(pointer.vy) ? clamp(pointer.vy, 600) : 0;

  // Repulsion leads; the perpendicular term adds a little curl. Pointer speed
  // contributes at most 18 px/s² per axis, even after a jump between events.
  return {
    x: clamp((58 * nx - 10 * ny + vx * 0.03) * falloff, 80),
    y: clamp((58 * ny + 10 * nx + vy * 0.03) * falloff, 80),
  };
}
