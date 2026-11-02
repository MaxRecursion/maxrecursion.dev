import assert from "node:assert/strict";
import test from "node:test";

const geo: typeof import("./dune-geometry") = await import(
  new URL("./dune-geometry.ts", import.meta.url).href
);
const worms: typeof import("./sandworms") = await import(
  new URL("./sandworms.ts", import.meta.url).href
);
const trace: typeof import("./wormsign-trace") = await import(
  new URL("./wormsign-trace.ts", import.meta.url).href
);
const { THUMPER_DROP, THUMP_INTERVAL, WORMS, planThumper, summonedDuration, thumperReady, wormsignAt } = worms;
const {
  PAPER_SPEED, SLOT_SECONDS, createStrip, growStrip, nextPhaseChange, penDeflection, recordStrip, thumperPhase, walkStrip,
} = trace;

// Built the same way as components/hero/wormTracks.ts.
const tracks = WORMS.map((spec) => {
  const path = geo.createPath(geo.WORM_LANES[spec.lane]);
  const eastward = path.xs[path.xs.length - 1] > path.xs[0];
  return {
    spec, path, length: path.length,
    visibleTo: eastward ? geo.arcLengthAtX(path, 1640) : path.length,
    thumperTo: eastward ? geo.arcLengthAtX(path, 1560) : path.length,
  };
});
const [shaiHulud] = tracks;
const calm = (t: number) => wormsignAt(tracks, t).value;

/** Every sample on a strip as [clock time, reading], from the pen down the paper. */
function samples(strip: ReturnType<typeof createStrip>) {
  const out: [number, number][] = [];
  walkStrip(strip, (time, value) => out.push([time, value]));
  return out;
}

test("a strip covers its paper, from the pen back into the past", () => {
  const height = 640;
  const now = 1234.567;
  const strip = createStrip(height);
  assert.deepEqual(samples(strip), []);
  recordStrip(strip, now, calm);
  const paper = samples(strip);
  assert.equal(paper.length, strip.values.length);
  assert.ok(paper[0][0] <= now && now - paper[0][0] < SLOT_SECONDS);
  for (let k = 1; k < paper.length; k++) assert.ok(paper[k][0] < paper[k - 1][0]);
  assert.ok((now - paper[paper.length - 1][0]) * PAPER_SPEED >= height);
  assert.ok(paper.every(([, value]) => Number.isFinite(value) && Math.abs(value) <= 1));
  for (const nonsense of [0, -20, Number.NaN]) assert.equal(createStrip(nonsense).values.length, 2);
});

test("the paper reads the same at any frame rate and after any pause", () => {
  const once = createStrip(300);
  recordStrip(once, 500, calm);
  for (const fps of [144, 30, 24, 7]) {
    const live = createStrip(300);
    for (let t = 470; t < 500; t += 1 / fps) recordStrip(live, t, calm);
    recordStrip(live, 500, calm);
    assert.deepEqual(live.values, once.values, `${fps} fps`);
    assert.deepEqual(live.times, once.times, `${fps} fps`);
  }
  // Left behind for longer than the paper holds, a strip starts over as if it had been recording.
  for (const since of [5, 499]) {
    const resumed = createStrip(300);
    recordStrip(resumed, since, calm);
    recordStrip(resumed, 500, calm);
    assert.deepEqual(resumed.values, once.values, `resumed after ${500 - since} s`);
    assert.deepEqual(resumed.times, once.times, `resumed after ${500 - since} s`);
    assert.equal(resumed.last, once.last);
  }
  // A clock that runs backwards reads nothing new.
  const before = Float32Array.from(once.values);
  recordStrip(once, 480, calm);
  assert.deepEqual(once.values, before);
});

test("a strip grown taller keeps the paper it holds, an earlier thumper included", () => {
  // Thumper A rears where the worm is; B is planted the moment A is done, as the page keeps only the latest.
  let first = 100;
  while (planThumper(shaiHulud, first).breach) first += 0.5;
  const a = planThumper(shaiHulud, first);
  let summons = a;
  const read = (t: number) => wormsignAt(tracks, t, summons).value;
  const tall = createStrip(900);
  const short = createStrip(600);
  let now = 0;
  for (let t = a.planted - 5; t < a.planted + 40; t += 1 / 30) {
    if (summons === a && thumperReady(t, a)) summons = planThumper(shaiHulud, t, a);
    recordStrip(tall, t, read);
    recordStrip(short, t, read);
    now = t;
  }
  assert.notEqual(summons, a);
  // The short strip holds all of A; below it lies paper from before A was planted.
  assert.ok(samples(short).at(-1)![0] < a.planted && samples(tall).at(-1)![0] < samples(short).at(-1)![0]);
  const grown = growStrip(short, 900, read);
  assert.deepEqual(grown.values, tall.values);
  assert.deepEqual(grown.times, tall.times);
  assert.equal(grown.last, tall.last);
  // Read back from the clock instead, the paper would lose A's beats and answer.
  const reread = createStrip(900);
  recordStrip(reread, now, read);
  assert.equal(reread.last, tall.last);
  assert.notDeepEqual(reread.values, tall.values);

  assert.equal(growStrip(tall, 900, read), tall);
  assert.equal(growStrip(tall, 300, read), tall);
  const blank = growStrip(createStrip(100), 300, read);
  assert.equal(blank.values.length, createStrip(300).values.length);
  assert.deepEqual(samples(blank), []);
});

test("each slot keeps its strongest reading, so a short spike survives", () => {
  // A 20 ms swing every 0.8 s on a quiet line, recorded at a choppy 10 fps.
  const spiky = (t: number) => (t - Math.floor(t / 0.8) * 0.8 < 0.02 ? -0.9 : 0.05);
  const strip = createStrip(240);
  for (let t = 100; t <= 120; t += 1 / 10) recordStrip(strip, t, spiky);
  const paper = samples(strip);
  const oldest = paper[paper.length - 1][0];
  for (let spike = Math.ceil(oldest / 0.8) * 0.8; spike < paper[0][0] - 0.02; spike += 0.8) {
    assert.ok(paper.some(([time, value]) => value === Math.fround(-0.9) && time >= spike - 1e-9 && time < spike + 0.02), `spike at ${spike}`);
  }
});

test("every thumper beat swings the pen", () => {
  for (let planted = 3.1; planted < 400; planted += 7.3) {
    const summons = planThumper(shaiHulud, planted);
    const strip = createStrip(((summons.rearAt - planted) + 2) * PAPER_SPEED);
    recordStrip(strip, summons.rearAt + 1, (t) => wormsignAt(tracks, t, summons).value);
    const paper = samples(strip);
    for (let beat = planted + THUMPER_DROP; beat < summons.rearAt - 0.3; beat += THUMP_INTERVAL) {
      // The beat may land late in its slot and peak in the next one.
      const slot = Math.floor(beat / SLOT_SECONDS);
      const swing = Math.max(...paper
        .filter(([time]) => Math.floor(time / SLOT_SECONDS) - slot <= 1 && Math.floor(time / SLOT_SECONDS) >= slot)
        .map(([, value]) => Math.abs(value)));
      assert.ok(swing > 0.4, `beat at ${beat.toFixed(2)} s swings ${swing.toFixed(2)}`);
    }
  }
});

test("the pen swings both ways within its amplitude and keeps faint tremor near the baseline", () => {
  assert.equal(penDeflection(0, 15), 0);
  assert.equal(penDeflection(1, 15), 15);
  assert.equal(penDeflection(-1, 15), -15);
  assert.equal(penDeflection(4, 15), 15);
  assert.equal(penDeflection(-4, 15), -15);
  assert.equal(penDeflection(-0.4, 15), -penDeflection(0.4, 15));
  assert.ok(penDeflection(0.1, 15) > 0 && penDeflection(0.1, 15) < 0.1 * 15 * 0.5);
  for (let value = -1; value < 1; value += 0.01) assert.ok(penDeflection(value + 0.01, 15) > penDeflection(value, 15));
});

test("the thumper is ready again exactly when Shai-Hulud has answered", () => {
  const order = ["beating", "answering", "ready"];
  let breaches = 0;
  let plantings = 0;
  for (let planted = 2.3; planted < 330; planted += 3.7, plantings++) {
    const summons = planThumper(shaiHulud, planted);
    if (summons.breach) breaches++;
    let previous = "beating";
    for (let t = planted; t < planted + 150; t += 0.05) {
      const phase = thumperPhase(t, summons, summonedDuration);
      assert.equal(phase === "ready", thumperReady(t, summons), `${phase} at ${t.toFixed(2)} s`);
      assert.equal(phase === "answering", t >= summons.rearAt && t < summons.rearAt + summonedDuration);
      assert.ok(order.indexOf(phase) >= order.indexOf(previous), `${previous} then ${phase}`);
      previous = phase;
    }
    assert.equal(previous, "ready");
  }
  // Both answers were tried: rearing in place, and breaching from out of sight.
  assert.ok(breaches > 0 && breaches < plantings);
  assert.equal(thumperPhase(10, null, summonedDuration), "ready");
});

test("the thumper label changes only at the times its summons names", () => {
  assert.equal(nextPhaseChange(10, null, summonedDuration), null);
  for (let planted = 1.7; planted < 330; planted += 11.3) {
    const summons = planThumper(shaiHulud, planted);
    const phaseAt = (t: number) => thumperPhase(t, summons, summonedDuration);
    let t = planted;
    let changes = 0;
    for (let next = nextPhaseChange(t, summons, summonedDuration); next !== null; next = nextPhaseChange(t, summons, summonedDuration)) {
      assert.ok(next > t);
      for (let s = t; s < next; s += 0.1) assert.equal(phaseAt(s), phaseAt(t));
      assert.equal(phaseAt(next - 1e-6), phaseAt(t));
      assert.notEqual(phaseAt(next), phaseAt(t));
      t = next;
      changes++;
    }
    assert.equal(phaseAt(t), "ready");
    assert.equal(changes, 2);
  }
});
