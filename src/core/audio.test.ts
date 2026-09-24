import assert from "node:assert/strict";
import test from "node:test";
import { analyzeSamples, featureAt } from "./audio.ts";
import { FIXED_DT } from "./clock.ts";
import { SILENCE } from "./forcing.ts";
import { DEFAULT_PARAMETERS, OrbitWorld } from "./orbit.ts";

test("silent audio stays unforced; a later pulse changes the feature timeline", () => {
  const samples = new Float32Array(1000);
  samples.fill(0.5, 500, 600);
  const timeline = analyzeSamples([samples], 1000);
  assert.deepEqual(featureAt(timeline, 0.1), { energy: 0, onset: 0 });
  assert.ok(featureAt(timeline, 0.5).energy > 0);
  assert.ok(featureAt(timeline, 0.5).onset > 0);
  assert.equal(featureAt(timeline, 1).energy, 0);
  const silent = analyzeSamples([new Float32Array(1000)], 1000);
  assert.ok(
    silent.frames.every((frame) => frame.energy === 0 && frame.onset === 0),
  );
});

test("measured forcing replays by tick and differs from silence, shuffled input, and a prior history", () => {
  const samples = new Float32Array(2000);
  samples.fill(0.7, 300, 600);
  samples.fill(0.3, 1100, 1450);
  const timeline = analyzeSamples([samples], 1000);
  const makeWorld = () =>
    new OrbitWorld({ ...DEFAULT_PARAMETERS, particleCount: 12 });
  const first = makeWorld();
  const replay = makeWorld();
  const silent = makeWorld();
  const shuffled = makeWorld();
  const withHistory = makeWorld();
  for (let tick = 0; tick < 120; tick++)
    withHistory.step({ energy: 1, onset: 1 });
  for (let tick = 0; tick < 240; tick++) {
    const forcing = featureAt(timeline, tick * FIXED_DT);
    first.step(forcing);
    replay.step(forcing);
    silent.step(SILENCE);
    shuffled.step(featureAt(timeline, (239 - tick) * FIXED_DT));
    withHistory.step(forcing);
  }
  assert.deepEqual(first.positions, replay.positions);
  assert.notDeepEqual(first.positions, silent.positions);
  assert.notDeepEqual(first.positions, shuffled.positions);
  assert.notDeepEqual(first.positions, withHistory.positions);
});
