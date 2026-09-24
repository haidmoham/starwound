import assert from "node:assert/strict";
import test from "node:test";
import { analyzeSamples, featureAt } from "./audio.ts";

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
