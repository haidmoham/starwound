import assert from "node:assert/strict";
import test from "node:test";
import { FIXED_DT, FixedClock } from "./clock.ts";
import { driveStrength, SILENCE, syntheticForcing } from "./forcing.ts";
import { DEFAULT_PARAMETERS, GRAVITY, HISTORY_CAPACITY, OrbitWorld, SOFTENING } from "./orbit.ts";
import { createRandom } from "./random.ts";

function world(seed = 1997): OrbitWorld {
  return new OrbitWorld({ ...DEFAULT_PARAMETERS, seed, particleCount: 16 });
}

function energy(model: OrbitWorld): number {
  let total = 0;
  for (let i = 0; i < model.positions.length; i += 2) {
    const x = model.positions[i];
    const y = model.positions[i + 1];
    const vx = model.velocities[i];
    const vy = model.velocities[i + 1];
    total += 0.5 * (vx * vx + vy * vy) - GRAVITY / Math.sqrt(x * x + y * y + SOFTENING * SOFTENING);
  }
  return total;
}

test("seeded generator is repeatable, bounded, and rejects invalid seeds", () => {
  const a = createRandom(0);
  const b = createRandom(0);
  for (let i = 0; i < 1000; i++) {
    const value = a();
    assert.equal(value, b());
    assert.ok(value >= 0 && value < 1);
  }
  assert.throws(() => createRandom(NaN), RangeError);
  assert.throws(() => createRandom(-1), RangeError);
});

test("same seed and forcing reproduce the same state and history", () => {
  const a = world();
  const b = world();
  for (let i = 0; i < 1500; i++) {
    const input = syntheticForcing(a.time);
    a.step(input);
    b.step(input);
  }
  assert.deepEqual(a.positions, b.positions);
  assert.deepEqual(a.velocities, b.velocities);
  assert.deepEqual(a.history, b.history);
});

test("different seeds produce different initial conditions", () => {
  assert.notDeepEqual(world(1).positions, world(2).positions);
});

test("fixed steps agree across 30 and 60 Hz preview schedules", () => {
  const a = world();
  const b = world();
  const aClock = new FixedClock();
  const bClock = new FixedClock();
  for (let i = 0; i < 300; i++) aClock.advance(1 / 30, () => a.step(syntheticForcing(a.time)));
  for (let i = 0; i < 600; i++) bClock.advance(1 / 60, () => b.step(syntheticForcing(b.time)));
  assert.equal(a.ticks, 1200);
  assert.deepEqual(a.positions, b.positions);
});

test("silence still permits physical evolution", () => {
  const a = world();
  const before = a.positions.slice();
  a.step(SILENCE);
  assert.notDeepEqual(a.positions, before);
});

test("forcing changes momentum and eventually the trajectory", () => {
  const a = world();
  const b = world();
  for (let i = 0; i < 1200; i++) {
    a.step(SILENCE);
    b.step({ energy: 1, onset: 1 });
  }
  assert.notDeepEqual(a.velocities, b.velocities);
  assert.notDeepEqual(a.positions, b.positions);
});

test("zero receptivity isolates physical evolution from forcing", () => {
  const a = new OrbitWorld({ ...DEFAULT_PARAMETERS, receptivity: 0, particleCount: 16 });
  const b = new OrbitWorld({ ...DEFAULT_PARAMETERS, receptivity: 0, particleCount: 16 });
  for (let i = 0; i < 120; i++) {
    a.step(SILENCE);
    b.step({ energy: 1, onset: 1 });
  }
  assert.deepEqual(a.positions, b.positions);
});

test("unforced softened-energy drift stays below 0.5% over ten simulated seconds", () => {
  const a = world();
  const start = energy(a);
  for (let i = 0; i < 1200; i++) a.step(SILENCE);
  assert.ok(Math.abs((energy(a) - start) / start) < 0.005);
});

test("history wraps within a fixed allocation and state remains finite", () => {
  const a = world();
  const buffer = a.history.buffer;
  for (let i = 0; i < 10000; i++) a.step(syntheticForcing(a.time));
  assert.equal(a.historyCount, HISTORY_CAPACITY);
  assert.equal(a.history.buffer, buffer);
  assert.ok([...a.positions, ...a.velocities, ...a.history].every(Number.isFinite));
});

test("invalid parameters and forcing fail explicitly", () => {
  assert.throws(() => new OrbitWorld({ ...DEFAULT_PARAMETERS, particleCount: 0 }), RangeError);
  assert.throws(() => new OrbitWorld({ ...DEFAULT_PARAMETERS, angularMomentum: Infinity }), RangeError);
  assert.throws(() => driveStrength({ energy: NaN, onset: 0 }, 1), RangeError);
  assert.throws(() => driveStrength({ energy: 1, onset: 2 }, 1), RangeError);
});

test("preview clock bounds catch-up, clears partial time, and rejects invalid elapsed time", () => {
  const clock = new FixedClock();
  assert.equal(clock.advance(10, () => {}), 12);
  clock.advance(FIXED_DT / 2, () => {});
  clock.discard();
  assert.equal(clock.advance(FIXED_DT / 2, () => {}), 0);
  assert.throws(() => clock.advance(-1, () => {}), RangeError);
});
