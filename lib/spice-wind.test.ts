import assert from "node:assert/strict";
import test from "node:test";
import type { SpicePointer } from "./spice-wind";

const { getSpiceGust }: typeof import("./spice-wind") = await import(
  new URL("./spice-wind.ts", import.meta.url).href
);

const pointer: SpicePointer = { x: 100, y: 100, vx: 0, vy: 0, active: true };

test("inactive pointers and particles at or beyond the radius have no effect", () => {
  assert.deepEqual(getSpiceGust(120, 100, { ...pointer, active: false }), { x: 0, y: 0 });
  assert.deepEqual(getSpiceGust(210, 100, pointer), { x: 0, y: 0 });
  assert.deepEqual(getSpiceGust(500, 100, pointer), { x: 0, y: 0 });
  assert.deepEqual(getSpiceGust(130, 100, pointer, 30), { x: 0, y: 0 });
});

test("the cursor center is finite and a stationary cursor adds no arbitrary direction", () => {
  assert.deepEqual(getSpiceGust(100, 100, pointer), { x: 0, y: 0 });
  const moving = getSpiceGust(100, 100, { ...pointer, vx: 500, vy: -250 });
  assert.ok(Number.isFinite(moving.x) && Number.isFinite(moving.y));
  assert.ok(moving.x > 0 && moving.y < 0);

  const near = getSpiceGust(100 + 1e-8, 100 - 1e-8, pointer);
  assert.ok(Math.abs(near.x) < 1e-6 && Math.abs(near.y) < 1e-6);
});

test("particles on either side mostly move away from the pointer with a small curl", () => {
  const left = getSpiceGust(70, 100, pointer);
  const right = getSpiceGust(130, 100, pointer);
  const above = getSpiceGust(100, 70, pointer);
  const below = getSpiceGust(100, 130, pointer);
  assert.ok(left.x < 0 && right.x > 0 && above.y < 0 && below.y > 0);
  assert.ok(Math.abs(left.x) > 3 * Math.abs(left.y));
  assert.ok(Math.abs(right.x) > 3 * Math.abs(right.y));
  assert.ok(Math.abs(above.y) > 3 * Math.abs(above.x));
  assert.ok(Math.abs(below.y) > 3 * Math.abs(below.x));
  assert.ok(left.y < 0 && right.y > 0);
});

test("extreme pointer speeds remain bounded and cannot reverse the main outward push", () => {
  for (const speed of [-Number.MAX_VALUE, -100_000, 100_000, Number.MAX_VALUE]) {
    for (const [x, y] of [[100, 100], [70, 100], [130, 100], [100, 70], [100, 130]]) {
      const gust = getSpiceGust(x, y, { ...pointer, vx: speed, vy: -speed });
      assert.ok(Number.isFinite(gust.x) && Math.abs(gust.x) <= 80);
      assert.ok(Number.isFinite(gust.y) && Math.abs(gust.y) <= 80);
      if (x < pointer.x) assert.ok(gust.x < 0);
      if (x > pointer.x) assert.ok(gust.x > 0);
      if (y < pointer.y) assert.ok(gust.y < 0);
      if (y > pointer.y) assert.ok(gust.y > 0);
    }
  }
});

test("the radius boundary eases smoothly to a negligible force", () => {
  const radius = 100;
  const magnitude = (fraction: number) => {
    const gust = getSpiceGust(pointer.x + radius * fraction, pointer.y, pointer, radius);
    return Math.hypot(gust.x, gust.y);
  };
  assert.ok(magnitude(0.9) < magnitude(0.8));
  assert.ok(magnitude(0.99) < magnitude(0.9));
  assert.ok(magnitude(0.9999) < 1e-4);
  assert.equal(magnitude(1), 0);
  assert.equal(magnitude(1.0001), 0);
});

test("invalid geometry is ignored and invalid velocity does not poison a gust", () => {
  for (const invalid of [NaN, Infinity, -Infinity]) {
    assert.deepEqual(getSpiceGust(invalid, 100, pointer), { x: 0, y: 0 });
    assert.deepEqual(getSpiceGust(100, invalid, pointer), { x: 0, y: 0 });
    assert.deepEqual(getSpiceGust(120, 100, { ...pointer, x: invalid }), { x: 0, y: 0 });
    assert.deepEqual(getSpiceGust(120, 100, { ...pointer, y: invalid }), { x: 0, y: 0 });
    assert.deepEqual(getSpiceGust(120, 100, pointer, invalid), { x: 0, y: 0 });
    assert.deepEqual(
      getSpiceGust(120, 100, { ...pointer, vx: invalid, vy: invalid }),
      getSpiceGust(120, 100, pointer),
    );
  }
  for (const radius of [0, -1]) assert.deepEqual(getSpiceGust(120, 100, pointer, radius), { x: 0, y: 0 });
  assert.deepEqual(
    getSpiceGust(Number.MAX_VALUE, 100, { ...pointer, x: -Number.MAX_VALUE }),
    { x: 0, y: 0 },
  );
});
