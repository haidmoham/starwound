import assert from "node:assert/strict";
import test from "node:test";
import { FIXED_DT, FixedClock } from "./clock.ts";
import {
  DEPARTURE_RADIUS,
  Installation,
  MAX_DEPARTURES,
} from "./installation.ts";
import { DEFAULT_PARAMETERS } from "./orbit.ts";
import { FrameBudget } from "./quality.ts";

const fall = {
  ...DEFAULT_PARAMETERS,
  angularMomentum: 0.66,
  dispersion: 0.018,
  receptivity: 0.72,
};

function advance(installation: Installation, seconds: number): void {
  for (let tick = 0; tick < seconds / FIXED_DT; tick++) installation.step();
}

test("the default fall study has a quiet interval before its first modeled disturbance", () => {
  const installation = new Installation(fall);
  assert.equal(installation.world.time, 0);
  assert.equal(installation.scene().shock, 0);
  assert.equal(installation.departures.length, 0);
  advance(installation, 7);
  assert.equal(installation.scene().shock, 0);
  assert.equal(installation.departures.length, 0);
  advance(installation, 4);
  assert.ok(installation.departures.length > 0);
  assert.ok(installation.departures.length <= MAX_DEPARTURES);
  assert.ok(installation.scene().aftermath > 0);
  assert.ok(installation.scene().trajectoryOpacity > 0.1);
  for (const event of installation.departures) {
    assert.ok(Math.hypot(event.x, event.y) >= DEPARTURE_RADIUS);
    assert.ok(event.x * event.vx + event.y * event.vy > 0);
  }
});

test("resetting the whole installation replays the same world and marks", () => {
  const first = new Installation(fall);
  const replay = new Installation(fall);
  advance(first, 28);
  advance(replay, 28);
  assert.deepEqual(first.world.positions, replay.world.positions);
  assert.deepEqual(first.departures, replay.departures);
  assert.deepEqual(first.scene(), replay.scene());
  assert.ok(first.departures.length < MAX_DEPARTURES);
  assert.equal(new Installation(fall).scene().aftermath, 0);
});

test("logical events are independent of 30 and 60 Hz render schedules", () => {
  const a = new Installation(fall);
  const b = new Installation(fall);
  const aClock = new FixedClock();
  const bClock = new FixedClock();
  for (let frame = 0; frame < 30 * 30; frame++) {
    aClock.advance(1 / 30, () => a.step());
  }
  for (let frame = 0; frame < 60 * 30; frame++) {
    bClock.advance(1 / 60, () => b.step());
  }
  assert.deepEqual(a.departures, b.departures);
  assert.deepEqual(a.world.positions, b.world.positions);
});

test("render adaptation does not change simulation or event timing", () => {
  const a = new Installation(fall);
  const b = new Installation(fall);
  for (let tick = 0; tick < 30 / FIXED_DT; tick++) {
    a.step();
    b.step();
    b.budget.record(32, 18);
  }
  assert.equal(b.budget.detail, 0);
  assert.deepEqual(a.departures, b.departures);
  assert.deepEqual(a.world.positions, b.world.positions);
});

test("other studies delay the flare after early departures", () => {
  for (const parameters of [
    { ...fall, angularMomentum: 1.02, dispersion: 0.015, receptivity: 0.35 },
    { ...fall, angularMomentum: 1.24, dispersion: 0.11, receptivity: 0.9 },
  ]) {
    const installation = new Installation(parameters);
    advance(installation, 3);
    assert.ok(installation.departures.length > 0);
    assert.equal(installation.scene().shock, 0);
    advance(installation, 4);
    assert.ok(installation.scene().aftermath > 0);
  }
});

test("invalid model configuration fails before installation begins", () => {
  assert.throws(() => new Installation({ ...fall, seed: -1 }), RangeError);
  assert.throws(
    () => new Installation({ ...fall, particleCount: Infinity }),
    RangeError,
  );
});

test("the frame budget uses sustained evidence and records upper-tail spikes", () => {
  const budget = new FrameBudget();
  for (let i = 0; i < 120; i++) budget.record(32, 18);
  assert.equal(budget.detail, 1);
  for (let i = 0; i < 120; i++) budget.record(32, 18);
  assert.equal(budget.detail, 0);
  assert.equal(budget.stats?.p99Ms, 32);
  assert.equal(budget.stats?.maxMs, 32);
  for (let window = 0; window < 3; window++) {
    for (let i = 0; i < 120; i++) budget.record(16.7, 4);
  }
  assert.equal(budget.detail, 1);
  budget.discard();
});
