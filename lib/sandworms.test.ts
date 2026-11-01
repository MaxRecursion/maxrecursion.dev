import assert from "node:assert/strict";
import test from "node:test";

const geo: typeof import("./dune-geometry") = await import(
  new URL("./dune-geometry.ts", import.meta.url).href
);
const worms: typeof import("./sandworms") = await import(
  new URL("./sandworms.ts", import.meta.url).href
);
const {
  THUMP_LEAD, WORMS, passDuration, planThumper, rearDuration, spineHeight, summonedDuration, thumperReady, wormPeriod,
  wormPose, wormsignAt, bodyRadius,
} = worms;

// Built the same way as components/hero/wormTracks.ts.
const tracks = WORMS.map((spec) => {
  const path = geo.createPath(geo.WORM_LANES[spec.lane]);
  const eastward = path.xs[path.xs.length - 1] > path.xs[0];
  return { spec, path, length: path.length, visibleTo: eastward ? geo.arcLengthAtX(path, 1640) : path.length };
});
const [shaiHulud, east, west] = tracks;

/** Image-x span of the parts of a body above the sand and on the artwork, or null. */
function surfaced(track: (typeof tracks)[number], t: number, summons?: Parameters<typeof wormPose>[2]) {
  const pose = wormPose(track, t, summons);
  if (!pose.active) return null;
  let low = Infinity;
  let high = -Infinity;
  for (let s = pose.head - track.spec.length; s <= pose.head; s += 2) {
    if (spineHeight(track, pose, s) <= -1) continue;
    const { x } = geo.samplePath(track.path, s);
    if (x > 1640) continue;
    low = Math.min(low, x);
    high = Math.max(high, x);
  }
  return low < high ? [low, high] : null;
}

test("Shai-Hulud is twice the size of the two small worms", () => {
  assert.deepEqual(WORMS.map((worm) => worm.id), ["shai-hulud", "east", "west"]);
  for (const small of [east, west]) {
    assert.equal(shaiHulud.spec.radius, small.spec.radius * 2);
    assert.equal(shaiHulud.spec.length, small.spec.length * 2);
  }
});

test("a pass swims the lane and a body length, then rests below the sand", () => {
  for (const track of tracks) {
    const period = wormPeriod(track);
    assert.ok(period >= passDuration(track) + 2);
    let restingSeen = false;
    for (let t = 0; t < period * 2; t += 0.25) {
      const pose = wormPose(track, t);
      if (!pose.active) {
        restingSeen = true;
        for (let s = 0; s <= track.length; s += 4) assert.ok(spineHeight(track, pose, s) <= -1);
      } else {
        assert.ok(pose.head >= 0 && pose.head <= track.length + track.spec.length + 1e-6);
      }
      assert.ok(pose.mouth >= 0 && pose.mouth <= 1);
      assert.ok(pose.lift > 0 && pose.lift < 5);
    }
    assert.ok(restingSeen, track.spec.id);
  }
});

test("bodies are buried where they surface and dive, and nowhere outside the body", () => {
  for (const track of tracks) {
    const pose = { head: track.length * 0.5, entry: 0, lift: 1, mouth: 0, rearing: 0, sink: 0, active: true };
    assert.ok(spineHeight(track, pose, track.length * 0.5 + 1) < -5);
    assert.ok(spineHeight(track, pose, track.length * 0.5 - track.spec.length - 1) < -5);
    const nearEnd = { ...pose, head: track.length };
    assert.ok(spineHeight(track, nearEnd, track.length) < -1);
    const justOut = { ...pose, head: 1 };
    assert.ok(spineHeight(track, justOut, 1) < -1);
  }
  assert.ok(bodyRadius(0) > 1 && bodyRadius(0.5) === 1 && bodyRadius(1) < 0.5);
});

test("the two small worms never meet, and at least one worm is always out", () => {
  for (let t = 0; t < 4000; t += 0.5) {
    const ranges = tracks.map((track) => surfaced(track, t));
    const [, e, w] = ranges;
    if (e && w) assert.ok(e[0] > w[1] + 10 || w[0] > e[1] + 10, `east and west overlap at ${t}s`);
    assert.ok(ranges.some(Boolean), `no worm visible at ${t}s`);
  }
});

test("Shai-Hulud is out on load and rears up within the first twenty seconds", () => {
  assert.ok(surfaced(shaiHulud, 0.5));
  const rear = [...Array(80).keys()].map((i) => wormPose(shaiHulud, i * 0.25)).find((pose) => pose.rearing > 0.99);
  assert.ok(rear && rear.mouth > 0.9 && rear.lift > 3);
  assert.ok(rearDuration > 5 && summonedDuration > 5);
});

test("a thumper makes a visible Shai-Hulud rear up in place", () => {
  // Find a moment when the head is mid-ridge.
  let t = 0;
  while (wormPose(shaiHulud, t + THUMP_LEAD).head < shaiHulud.length * 0.3 || !wormPose(shaiHulud, t + THUMP_LEAD).active) t += 0.5;
  const before = wormPose(shaiHulud, t + THUMP_LEAD);
  const summons = planThumper(shaiHulud, t);
  assert.equal(summons.breach, null);
  assert.ok(summons.rearAt >= t + THUMP_LEAD && summons.rearAt < t + THUMP_LEAD + 4);
  const answering = wormPose(shaiHulud, summons.rearAt + 2, summons);
  assert.ok(answering.lift > 4 && answering.mouth > 0.95);
  // The pass itself is unchanged: no jump along the lane.
  assert.ok(Math.abs(wormPose(shaiHulud, t + THUMP_LEAD, summons).head - before.head) < 1e-9);
  assert.equal(thumperReady(summons.rearAt + 1, summons), false);
  assert.equal(thumperReady(summons.rearAt + summonedDuration, summons), true);
  assert.equal(planThumper(shaiHulud, summons.rearAt + 1, summons), summons);
});

test("a thumper planted while Shai-Hulud is out of sight makes it breach mid-ridge", () => {
  let t = 0;
  while (wormPose(shaiHulud, t).active) t += 0.5; // resting
  const summons = planThumper(shaiHulud, t);
  assert.ok(summons.breach);
  const { breach } = summons;
  assert.ok(breach.entry > 0 && breach.entry < shaiHulud.visibleTo);
  assert.ok(summons.rearAt - t >= THUMP_LEAD - 1e-9 && summons.rearAt - t < THUMP_LEAD + 1);
  const rising = wormPose(shaiHulud, summons.rearAt + 2, summons);
  assert.ok(rising.active && rising.head > breach.entry && rising.head < shaiHulud.visibleTo);
  assert.ok(rising.lift > 4 && rising.mouth > 0.95);
  assert.ok(surfaced(shaiHulud, summons.rearAt + 2, summons));
  // Afterwards the regular passes resume after a rest, without overlapping the breach.
  const after = wormPose(shaiHulud, breach.end + 0.1, summons);
  assert.equal(after.active, false);
  assert.ok(wormPose(shaiHulud, breach.after + 1, summons).active);
  assert.equal(thumperReady(summons.rearAt + 1, summons), false);
  assert.equal(thumperReady(summons.rearAt + summonedDuration, summons), true);
});

test("a thumper planted while Shai-Hulud swims away from a breach never makes it jump", () => {
  let t = 0;
  while (wormPose(shaiHulud, t).active) t += 0.5;
  const first = planThumper(shaiHulud, t);
  assert.ok(first.breach);
  let rears = 0;
  let breaches = 0;
  for (let again = first.rearAt + summonedDuration; again < first.breach.end; again += 1.5) {
    const second = planThumper(shaiHulud, again, first);
    assert.notEqual(second, first);
    if (second.breach === first.breach) rears++;
    else breaches++;
    // Until the new answer begins, the worm keeps swimming exactly where it was.
    const until = second.breach && second.breach !== first.breach ? second.breach.start : second.rearAt;
    for (let dt = 0; again + dt < until; dt += 0.25) {
      assert.equal(wormPose(shaiHulud, again + dt, second).head, wormPose(shaiHulud, again + dt, first).head);
    }
    if (second.breach && second.breach !== first.breach) {
      assert.equal(surfaced(shaiHulud, second.breach.start - 0.05, second), null);
      assert.ok(second.rearAt - again <= THUMP_LEAD + 1e-9);
      assert.ok(surfaced(shaiHulud, second.rearAt + 2, second));
    } else {
      assert.ok(wormPose(shaiHulud, second.rearAt + 2, second).lift > 4);
    }
  }
  assert.ok(rears > 0 && breaches > 0);
});

test("a thumper never moves a worm whose body is still showing", () => {
  for (let t = 0; t < 400; t += 1.5) {
    const summons = planThumper(shaiHulud, t);
    const start = summons.breach?.start ?? Infinity;
    for (let dt = 0; dt < 30 && t + dt < start; dt += 0.5) {
      assert.deepEqual(wormPose(shaiHulud, t + dt, summons).head, wormPose(shaiHulud, t + dt).head);
    }
    if (summons.breach) {
      // The breach only begins once nothing of the regular pass is showing, and soon.
      assert.equal(surfaced(shaiHulud, summons.breach.start - 0.05, summons), null);
      assert.ok(summons.rearAt - t <= THUMP_LEAD + 1e-9);
    } else {
      assert.ok(summons.rearAt - t < THUMP_LEAD + 4);
    }
  }
});

test("the wormsign trace is bounded and beats while a thumper waits", () => {
  for (let t = 0; t < 600; t += 0.1) {
    const sign = wormsignAt(tracks, t);
    assert.ok(Number.isFinite(sign.value) && Math.abs(sign.value) <= 1);
    assert.ok(sign.level >= 0 && sign.level <= 1.5);
    assert.equal(sign.thump, 0);
  }
  const summons = planThumper(shaiHulud, 100);
  const beats = [0, 0.8, 1.6, 2.4].map((dt) => wormsignAt(tracks, 100 + dt + 0.01, summons).thump);
  assert.ok(beats.every((beat) => beat > 0.8));
  assert.ok(wormsignAt(tracks, 100 + 0.5, summons).thump < 0.1);
  assert.equal(wormsignAt(tracks, summons.rearAt + 0.1, summons).thump, 0);
});
