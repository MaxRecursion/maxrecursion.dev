import assert from "node:assert/strict";
import test from "node:test";

// Node's built-in runner loads the TypeScript URL without a transpiler; the
// type-only import keeps the same module types as the production consumer.
const { getSolarCycle, getSolarCycleAtMinutes }: typeof import("./solar-cycle") = await import(
  new URL("./solar-cycle.ts", import.meta.url).href
);

function close(actual: number, expected: number, tolerance = 1e-8) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be within ${tolerance} of ${expected}`);
}

test("uses Pune time across the UTC date boundary and retains seconds", () => {
  const midnight = getSolarCycle(new Date("2026-10-30T18:30:00.000Z"));
  assert.equal(midnight.minutes, 0);
  assert.equal(midnight.phase, "night");

  const noon = getSolarCycle(new Date("2026-10-31T06:30:30.500Z"));
  close(noon.minutes, 12 * 60 + 30.5 / 60);
  assert.equal(noon.phase, "day");
  close(noon.elevation, 1, 1e-5);
});

test("follows the dawn, noon, dusk and night anchors", () => {
  const dawn = getSolarCycleAtMinutes(6 * 60);
  const noon = getSolarCycleAtMinutes(12 * 60);
  const dusk = getSolarCycleAtMinutes(18 * 60);
  const night = getSolarCycleAtMinutes(0);

  assert.equal(dawn.phase, "dawn");
  assert.equal(dawn.elevation, 0);
  close(dawn.x, 68);
  close(dawn.y, 60);
  assert.equal(noon.phase, "day");
  close(noon.elevation, 1);
  close(noon.x, 77);
  close(noon.y, 20);
  assert.equal(dusk.phase, "dusk");
  assert.equal(dusk.elevation, 0);
  close(dusk.x, 86);
  close(dusk.y, 60);
  assert.equal(night.phase, "night");
  assert.equal(night.elevation, 0);
  close(night.x, 77);
  close(night.y, 42);

  assert.ok(noon.brightness > dawn.brightness && dawn.brightness > night.brightness);
  assert.ok(noon.glow > dawn.glow && dawn.glow > night.glow);
  assert.ok(dawn.warmth > noon.warmth);
});

test("phase labels have explicit, non-overlapping boundaries", () => {
  const cases = [
    [0, "night"], [299.99, "night"], [300, "dawn"], [479.99, "dawn"],
    [480, "day"], [1019.99, "day"], [1020, "dusk"], [1199.99, "dusk"],
    [1200, "night"], [1439.99, "night"],
  ] as const;
  for (const [minutes, phase] of cases) assert.equal(getSolarCycleAtMinutes(minutes).phase, phase);
});

test("position and styling stay continuous at midnight, horizons and phase changes", () => {
  const styling = ["x", "y", "elevation", "warmth", "glow", "brightness"] as const;
  for (const boundary of [0, 300, 360, 480, 720, 1020, 1080, 1200, 1440]) {
    const before = getSolarCycleAtMinutes(boundary - 0.001);
    const after = getSolarCycleAtMinutes(boundary + 0.001);
    for (const key of styling) close(before[key], after[key], 0.001);
  }
});

test("every minute stays in a finite, visible right-hand orbit", () => {
  const unitValues = ["elevation", "warmth", "glow", "brightness"] as const;
  for (let minutes = 0; minutes < 24 * 60; minutes++) {
    const cycle = getSolarCycleAtMinutes(minutes);
    assert.ok(Number.isFinite(cycle.x) && cycle.x >= 68 && cycle.x <= 86);
    assert.ok(Number.isFinite(cycle.y) && cycle.y >= 20 && cycle.y <= 60);
    for (const key of unitValues) {
      assert.ok(Number.isFinite(cycle[key]) && cycle[key] >= 0 && cycle[key] <= 1, `${key} at minute ${minutes}`);
    }
    if (minutes < 360 || minutes >= 1080) assert.equal(cycle.elevation, 0);
  }
});

test("wraps finite offsets and rejects invalid time inputs", () => {
  assert.deepEqual(getSolarCycleAtMinutes(-30), getSolarCycleAtMinutes(1410));
  assert.deepEqual(getSolarCycleAtMinutes(3 * 1440 + 720), getSolarCycleAtMinutes(720));
  for (const value of [NaN, Infinity, -Infinity]) {
    assert.throws(() => getSolarCycleAtMinutes(value), RangeError);
  }
  assert.throws(() => getSolarCycle(new Date(NaN)), RangeError);
});
