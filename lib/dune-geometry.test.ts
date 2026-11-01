import assert from "node:assert/strict";
import test from "node:test";

const geo: typeof import("./dune-geometry") = await import(
  new URL("./dune-geometry.ts", import.meta.url).href
);
const { DESERT_IMAGE, SPICE_LANES, WORM_LANES, arcLengthAtX, coverTransform, createPath, samplePath, toImage, toScreen } = geo;

test("cover placement matches CSS object-fit: cover with an object-position", () => {
  // A 16:9 box crops nothing noticeable and keeps the artwork's scale.
  const exact = coverTransform(1672, 941, 0.72);
  assert.deepEqual(exact, { scale: 1, x: 0, y: 0 });

  // A narrow, tall box scales to the height and shifts by 72% of the overflow.
  const tall = coverTransform(1440, 900, 0.72);
  assert.ok(Math.abs(tall.scale - 900 / 941) < 1e-12);
  assert.ok(Math.abs(tall.x - (1440 - 1672 * tall.scale) * 0.72) < 1e-9);
  assert.equal(tall.y, 0);

  // A wide, short box scales to the width and centres vertically.
  const wide = coverTransform(2000, 1030, 0.72);
  assert.ok(Math.abs(wide.scale - 2000 / 1672) < 1e-12);
  assert.equal(wide.x, 0);
  assert.ok(Math.abs(wide.y - (1030 - 941 * wide.scale) / 2) < 1e-9);

  const [x, y] = toScreen(tall, 1084, 669);
  const [u, v] = toImage(tall, x, y);
  assert.ok(Math.abs(u - 1084) < 1e-9 && Math.abs(v - 669) < 1e-9);
});

test("paths pass through their control points and sample at a fixed step", () => {
  const path = createPath([[0, 0], [100, 0], [200, 50]], 2);
  assert.ok(path.length > 200 && path.length < 215);
  const start = samplePath(path, 0);
  const end = samplePath(path, path.length);
  assert.ok(Math.hypot(start.x, start.y) < 1e-9);
  assert.ok(Math.hypot(end.x - 200, end.y - 50) < 1e-6);
  const middle = samplePath(path, 100);
  assert.ok(Math.abs(middle.x - 100) < 3 && Math.abs(middle.y) < 3);
  assert.ok(Math.abs(Math.hypot(middle.tx, middle.ty) - 1) < 1e-9);

  // Beyond either end the path extends straight along its end tangent.
  const before = samplePath(path, -10);
  assert.ok(Math.abs(before.x + 10) < 0.5 && Math.abs(before.y) < 0.5);
  assert.throws(() => createPath([[0, 0]]));
});

test("arcLengthAtX finds where a path crosses a vertical line in either direction", () => {
  const east = createPath([[0, 0], [100, 0]], 3);
  assert.ok(Math.abs(arcLengthAtX(east, 40) - 40) < 1e-6);
  const west = createPath([[100, 0], [0, 0]], 3);
  assert.ok(Math.abs(arcLengthAtX(west, 40) - 60) < 1e-6);
  assert.equal(arcLengthAtX(east, 500), east.length);
  assert.equal(arcLengthAtX(east, -5), 0);
});

test("every lane stays within reach of the artwork and runs with its travel direction", () => {
  for (const lane of SPICE_LANES) {
    assert.ok(lane.points.length >= 2 && lane.spread > 0 && lane.weight > 0, lane.id);
    for (let i = 1; i < lane.points.length; i++) {
      assert.ok(lane.points[i][0] > lane.points[i - 1][0], `${lane.id} runs with the wind`);
    }
    for (const [x, y] of lane.points) {
      assert.ok(x >= 0 && x <= DESERT_IMAGE.width + 80 && y >= 540 && y <= DESERT_IMAGE.height + 10, lane.id);
    }
  }
  for (const [id, points] of Object.entries(WORM_LANES)) {
    for (const [x, y] of points) {
      assert.ok(x >= 900 && x <= DESERT_IMAGE.width + 120 && y >= 560 && y <= 800, id);
    }
  }
});
