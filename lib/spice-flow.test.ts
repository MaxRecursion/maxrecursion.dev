import assert from "node:assert/strict";
import test from "node:test";

const geo: typeof import("./dune-geometry") = await import(
  new URL("./dune-geometry.ts", import.meta.url).href
);
const flow: typeof import("./spice-flow") = await import(
  new URL("./spice-flow.ts", import.meta.url).href
);
const {
  GRAIN_COUNT, HOP_HEIGHT, LIFT_SHARE, LIFT_WINDOW, OFFSET_LIMIT, allocateGrains, layoutLanes, liftoffChance,
  liftoffFade, liftoffFlight, saltation, spanFade, springStep, surfaceOffset, visibleSpan, windFactor, wrapToStart,
} = flow;

/** The lanes as SpiceDrift builds them. */
const tracks = geo.SPICE_LANES.map((lane) => {
  const path = geo.createPath(lane.points);
  return { path, spread: lane.spread, weight: lane.weight, crests: (lane.liftoff ?? []).map((x) => geo.arcLengthAtX(path, x)) };
});
const ids = geo.SPICE_LANES.map((lane) => lane.id);
const ridge = ids.indexOf("ridge");
const crescent = ids.indexOf("crescent");

/** The lanes on a hero of this size, laid out the way SpiceDrift does on a canvas at `box`. */
function layout(width: number, height: number, compact = false, box = { x: 0, y: 0, width, height }) {
  const artwork = geo.coverTransform(width, height, compact ? geo.DESERT_FOCUS.compact : geo.DESERT_FOCUS.wide);
  return layoutLanes(tracks, artwork, box, compact ? GRAIN_COUNT.compact : GRAIN_COUNT.wide);
}
const length = (span: { from: number; to: number } | null) => (span ? span.to - span.from : 0);
const desktop = layout(1440, 900);
const phone = layout(390, 844, true);
/** Hero sizes from a small phone to an ultrawide monitor. */
const heroes = [
  [320, 790, true], [390, 844, true], [768, 1024, false], [1024, 780, false],
  [1440, 900, false], [1920, 1080, false], [2560, 1080, false], [2560, 1440, false],
] as const;

test("the field is twice the earlier one and every grain is allocated", () => {
  // Five times the earlier 660 and 288: a fine-grained flow.
  assert.equal(GRAIN_COUNT.wide, 5 * 2 * 110 * 3);
  assert.equal(GRAIN_COUNT.compact, 5 * 2 * 48 * 3);
  for (const [{ spans, counts }, total] of [[desktop, GRAIN_COUNT.wide], [phone, GRAIN_COUNT.compact]] as const) {
    assert.equal(counts.reduce((a, b) => a + b, 0), total);
    const sum = spans.reduce((a, span, i) => a + tracks[i].weight * length(span), 0);
    spans.forEach((span, i) => {
      const quota = (total * tracks[i].weight * length(span)) / sum;
      assert.ok(Math.abs(counts[i] - quota) < 1, `${ids[i]}: ${counts[i]} for a quota of ${quota}`);
      if (!span) assert.equal(counts[i], 0, ids[i]);
    });
  }
  for (const [width, height, compact] of heroes) {
    const { counts } = layout(width, height, compact);
    assert.equal(counts.reduce((a, b) => a + b, 0), compact ? GRAIN_COUNT.compact : GRAIN_COUNT.wide, `${width}×${height}`);
  }
});

test("lanes partly off screen get proportionally fewer grains", () => {
  assert.deepEqual(allocateGrains([{ weight: 1, length: 100 }, { weight: 1, length: 100 }], 10), [5, 5]);
  assert.deepEqual(allocateGrains([{ weight: 1, length: 100 }, { weight: 1, length: 50 }], 10), [7, 3]);
  assert.deepEqual(allocateGrains([{ weight: 2, length: 50 }, { weight: 1, length: 100 }, { weight: 1, length: 0 }], 7), [4, 3, 0]);

  // A phone shows a narrow window of the artwork, so no lane is longer there than on a desktop.
  phone.spans.forEach((span, i) => {
    assert.ok(length(span) * phone.cover.scale <= length(desktop.spans[i]) * desktop.cover.scale + 1e-6, ids[i]);
  });
  assert.ok(phone.spans.some((span, i) => length(span) < length(desktop.spans[i]) / 2));
});

test("degenerate allocations stay finite and never invent grains", () => {
  assert.deepEqual(allocateGrains([], 10), []);
  assert.deepEqual(allocateGrains([{ weight: 1, length: 0 }, { weight: 0, length: 40 }], 10), [0, 0]);
  assert.deepEqual(allocateGrains([{ weight: 1, length: 10 }], -5), [0]);
  assert.deepEqual(allocateGrains([{ weight: 1, length: 10 }], NaN), [0]);
  assert.deepEqual(allocateGrains([{ weight: NaN, length: 10 }, { weight: -1, length: 10 }, { weight: 1, length: Infinity }], 9), [0, 0, 0]);
  assert.deepEqual(allocateGrains([{ weight: 1, length: 10 }, { weight: 3, length: 10 }], 4.9), [1, 3]);
});

test("visible spans cover the on-screen part of each lane and nothing else", () => {
  const { path } = tracks[ridge];
  const { cover } = desktop;
  const span = desktop.spans[ridge];
  assert.ok(span);
  // The ridge starts on screen at the left and runs off the right edge.
  assert.equal(span.from, 0);
  assert.ok(span.to < path.length);
  for (const s of [span.from, span.to]) {
    const { x } = geo.samplePath(path, s);
    const screenX = cover.x + x * cover.scale;
    assert.ok(screenX >= -24 && screenX <= 1440 + 24);
  }
  const beyond = geo.samplePath(path, span.to + 2 * path.step);
  assert.ok(cover.x + beyond.x * cover.scale > 1440 + 24);

  // On a phone the same ridge starts well off the left edge.
  const narrow = phone.spans[ridge];
  assert.ok(narrow && narrow.from > 0);

  const offscreen = geo.createPath([[0, 0], [400, 0]]);
  assert.equal(visibleSpan(offscreen, { scale: 1, x: 2000, y: 0 }, 1440, 900, 24), null);
  assert.equal(visibleSpan(offscreen, { scale: 1, x: 0, y: -100 }, 1440, 900, 24), null);
  const shifted = visibleSpan(offscreen, { scale: 1, x: -200, y: 0 }, 1440, 900, 0);
  assert.ok(shifted && Math.abs(shifted.from - 200) <= offscreen.step && Math.abs(shifted.to - 400) < 1e-6);
});

test("a canvas offset inside the artwork's box sees the lanes from its own corner", () => {
  const box = { x: 600, y: 450, width: 840, height: 450 };
  const inset = layout(1440, 900, false, box);
  assert.deepEqual(inset.cover, { scale: desktop.cover.scale, x: desktop.cover.x - box.x, y: desktop.cover.y - box.y });
  assert.equal(inset.counts.reduce((a, b) => a + b, 0), GRAIN_COUNT.wide);
  inset.spans.forEach((span, i) => {
    if (!span) return;
    const full = desktop.spans[i];
    assert.ok(full && span.from >= full.from && span.to <= full.to, ids[i]);
    for (const s of [span.from, span.to]) {
      const { x, y } = geo.samplePath(tracks[i].path, s);
      const screenX = inset.cover.x + x * inset.cover.scale;
      const screenY = inset.cover.y + y * inset.cover.scale;
      assert.ok(screenX >= -24 && screenX <= box.width + 24 && screenY >= -24 && screenY <= box.height + 24, ids[i]);
    }
  });
  // The ridge starts left of this canvas, so its span starts later along the lane.
  const span = inset.spans[ridge];
  const full = desktop.spans[ridge];
  assert.ok(span && full && span.from > full.from + 100);
  // A canvas over the sky alone carries no grains.
  const sky = layout(1440, 900, false, { x: 0, y: 0, width: 1440, height: 300 });
  assert.ok(sky.spans.every((lane) => lane === null));
  assert.ok(sky.counts.every((count) => count === 0));
});

test("plumes leave every crest at full strength", () => {
  for (const [width, height, compact] of heroes) {
    const { spans } = layout(width, height, compact);
    spans.forEach((span, i) => {
      if (!span) return;
      assert.ok(span.rampOut > 0 && span.rampOut <= span.rampIn, `${ids[i]} at ${width}×${height}`);
      for (const crest of span.crests) {
        assert.ok(crest > span.from && crest < span.to);
        for (let offset = LIFT_WINDOW[0]; offset <= LIFT_WINDOW[1]; offset += 0.5) {
          const fade = spanFade(crest + offset, span.from, span.to, span.rampIn, span.rampOut);
          assert.ok(fade >= 0.9, `${ids[i]} at ${width}×${height}: ${fade.toFixed(2)} at ${offset} from its crest`);
        }
      }
    });
  }
  // The crescent's crest sits at the tip of its horn, so it moves back a little and the fade-out shortens.
  const span = desktop.spans[crescent];
  assert.ok(span && span.crests.length === 1);
  const moved = tracks[crescent].crests[0] - span.crests[0];
  assert.ok(moved > 0 && moved < 20, `${moved}`);
  assert.ok(span.rampOut < span.rampIn / 2);
  // A lane whose crests are far from its ends keeps the same fade at both.
  const full = desktop.spans[ridge];
  assert.ok(full && full.crests.length === 1 && full.crests[0] === tracks[ridge].crests[0]);
  assert.equal(full.rampOut, full.rampIn);
  // A crest beyond the end of a span is not brought onto it.
  const tablet = layout(768, 1024);
  const backCrest = tablet.spans[ids.indexOf("back-crest")];
  assert.ok(backCrest && backCrest.crests.length === 1);
  assert.equal(tablet.spans[crescent]?.crests.length, 0);
});

test("grains fade in and out at the ends of a span", () => {
  assert.equal(spanFade(100, 100, 500, 40), 0);
  assert.equal(spanFade(500, 100, 500, 40), 0);
  assert.equal(spanFade(90, 100, 500, 40), 0);
  assert.equal(spanFade(300, 100, 500, 40), 1);
  assert.ok(Math.abs(spanFade(120, 100, 500, 40) - spanFade(480, 100, 500, 40)) < 1e-12);
  let previous = 0;
  for (let s = 100; s <= 140; s += 2) {
    const fade = spanFade(s, 100, 500, 40);
    assert.ok(fade >= previous && fade <= 1);
    previous = fade;
  }
  // A span shorter than two ramps still peaks at 1 in the middle.
  assert.equal(spanFade(110, 100, 120, 40), 1);
  assert.equal(spanFade(110, 120, 100, 40), 0);

  // A shorter fade-out holds full strength closer to the end.
  assert.ok(spanFade(130, 100, 500, 40, 10) < 1);
  assert.equal(spanFade(490, 100, 500, 40, 10), 1);
  assert.ok(spanFade(495, 100, 500, 40, 10) > 0 && spanFade(495, 100, 500, 40, 10) < 1);
  assert.equal(spanFade(500, 100, 500, 40, 10), 0);
  // Uneven ramps that do not fit shrink together.
  assert.ok(Math.abs(spanFade(112, 100, 120, 15, 10) - 1) < 1e-12);
  assert.ok(spanFade(110, 100, 120, 15, 10) < 1 && spanFade(114, 100, 120, 15, 10) < 1);
  assert.equal(spanFade(300, 100, 500, Infinity), 1);
  assert.ok(Math.abs(spanFade(200, 100, 500, Infinity) - 0.5) < 1e-12);
  // Without ramps the ends are hard edges.
  assert.equal(spanFade(100, 100, 500, 0), 1);
  assert.equal(spanFade(500, 100, 500, 0, NaN), 1);
  assert.equal(spanFade(501, 100, 500, 0), 0);
});

test("wrapping keeps the overshoot and staggers re-entry behind the start", () => {
  assert.equal(wrapToStart(250, 100, 500, 10), 250);
  assert.equal(wrapToStart(506, 100, 500, 0), 106);
  assert.equal(wrapToStart(506, 100, 500, 10), 96);
  for (let s = 500.5; s < 2500; s += 37.3) {
    const wrapped = wrapToStart(s, 100, 500, 15);
    assert.ok(wrapped >= 100 - 15 && wrapped < 500 - 15, `${s} → ${wrapped}`);
  }
});

test("grains rest just below the contour, mostly near the line", () => {
  const spread = 18;
  let total = 0;
  let samples = 0;
  for (let r = 0; r <= 1; r += 0.01) {
    for (let s = 0; s < 1600; s += 23) {
      const depth = surfaceOffset(spread, r, s, r * 7);
      assert.ok(depth >= 0 && depth <= spread, `${depth} at r=${r}`);
      total += depth;
      samples++;
    }
  }
  assert.ok(total / samples < spread / 3);
  assert.equal(surfaceOffset(spread, 0, 400, 1), 0);
  assert.equal(surfaceOffset(-5, 0.8, 400, 1), 0);
  assert.ok(surfaceOffset(spread, 2, 400, 1) <= spread);
});

test("saltation hops are short, low, irregular arcs that start and end on the sand", () => {
  const heights = new Set<number>();
  let slides = 0;
  for (const seed of [1, 77, 4_000_000_000]) {
    const hop = 16;
    for (let k = 0; k < 120; k++) {
      let peak = 0;
      for (let u = 0; u < 1; u += 0.02) {
        const h = saltation((k + u) * hop, hop, seed);
        assert.ok(h >= 0 && h <= HOP_HEIGHT, `${h}`);
        peak = Math.max(peak, h);
      }
      assert.ok(saltation(k * hop + 1e-6, hop, seed) < 0.01);
      assert.ok(saltation((k + 1) * hop - 1e-6, hop, seed) === 0);
      if (peak === 0) slides++;
      else heights.add(Math.round(peak * 100));
    }
  }
  assert.ok(slides > 60 && slides < 200, `${slides} slides in 360 cycles`);
  assert.ok(heights.size > 50, "hop heights vary");
  assert.equal(saltation(123.4, 16, 9), saltation(123.4, 16, 9));
  for (const [s, hop] of [[NaN, 16], [Infinity, 16], [10, 0], [10, -4], [10, NaN]]) assert.equal(saltation(s, hop, 1), 0);
});

test("about 30% of grains lift off a crest, mostly those riding the line", () => {
  let sum = 0;
  const n = 100_000;
  for (let i = 0; i < n; i++) sum += liftoffChance((i + 0.5) / n);
  assert.ok(Math.abs(sum / n - LIFT_SHARE) < 1e-3);
  assert.equal(liftoffChance(1), 0);
  assert.ok(liftoffChance(0) > liftoffChance(0.5) && liftoffChance(0.5) > liftoffChance(0.9));
  assert.ok(liftoffChance(0) <= 1 && liftoffChance(-1) === liftoffChance(0));
});

test("a lifted grain climbs downwind, levels off and fades to nothing", () => {
  const life = 1.2;
  assert.equal(liftoffFade(0, life), 1);
  assert.equal(liftoffFade(life, life), 0);
  assert.equal(liftoffFade(5, life), 0);
  assert.equal(liftoffFade(0.5, 0), 0);
  let previousFade = 1;
  const flight = { forward: 0, up: 0, vForward: 0, vUp: 0 };
  let previous = { ...liftoffFlight(0, 30, 20, flight) };
  assert.equal(previous.forward, 0);
  assert.equal(previous.up, 0);
  assert.ok(previous.vForward > 0 && previous.vUp > 0);
  const dt = 1 / 120;
  for (let age = dt; age <= 1.5; age += dt) {
    const fade = liftoffFade(age, life);
    assert.ok(fade <= previousFade);
    previousFade = fade;
    const now = { ...liftoffFlight(age, 30, 20, flight) };
    assert.ok(now.forward > previous.forward && now.up > previous.up && now.up < 20);
    assert.ok(Math.abs((now.forward - previous.forward) / dt - (now.vForward + previous.vForward) / 2) < 0.05);
    assert.ok(Math.abs((now.up - previous.up) / dt - (now.vUp + previous.vUp) / 2) < 0.05);
    previous = now;
  }
  // It stays a low plume: most of its rise and a modest run downwind.
  assert.ok(previous.up > 0.85 * 20 && previous.forward < 30 * 1.5 * 1.5);
});

test("the wind quickens up windward slopes and slackens in the lee", () => {
  assert.equal(windFactor(0), 1);
  assert.ok(windFactor(-0.2) > 1 && windFactor(0.2) < 1);
  for (const ty of [-1, -0.5, 0.5, 1]) assert.ok(windFactor(ty) >= 0.8 && windFactor(ty) <= 1.25);
  assert.equal(windFactor(NaN), 1);
});

test("a gust pushes a grain off the sand and the spring settles it back", () => {
  const offset = new Float32Array(1);
  const velocity = new Float32Array(1);
  const dt = 1 / 30;
  for (let t = 0; t < 6; t += dt) springStep(offset, velocity, 0, 100, dt);
  const held = offset[0];
  assert.ok(Math.abs(held - 100 / 2.6 ** 2) < 0.2, `${held}`);

  let lowest = Infinity;
  let settled = Infinity;
  for (let t = 0; t < 8; t += dt) {
    springStep(offset, velocity, 0, 0, dt);
    lowest = Math.min(lowest, offset[0]);
    if (offset[0] < held * 0.05 && settled === Infinity) settled = t;
  }
  assert.ok(settled < 2.5, `settled after ${settled}s`);
  assert.ok(lowest > -0.02 * held, "no visible overshoot");
  assert.equal(offset[0], 0);
  assert.equal(velocity[0], 0);

  for (const force of [1e6, -1e6]) {
    offset[0] = 0;
    velocity[0] = 0;
    for (let t = 0; t < 1; t += dt) {
      springStep(offset, velocity, 0, force, dt);
      assert.ok(Math.abs(offset[0]) <= OFFSET_LIMIT);
    }
    assert.equal(Math.abs(offset[0]), OFFSET_LIMIT);
  }
});
