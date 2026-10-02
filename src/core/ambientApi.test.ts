import assert from "node:assert/strict";
import test from "node:test";
import { createAmbientBed } from "../media/ambientBed.ts";

class FakeParam {
  value = 0;
  events: { kind: string; value: number; time: number }[] = [];
  cancelScheduledValues(time: number) {
    this.events.push({ kind: "cancel", value: this.value, time });
  }
  setValueAtTime(value: number, time: number) {
    this.value = value;
    this.events.push({ kind: "set", value, time });
  }
  linearRampToValueAtTime(value: number, time: number) {
    this.events.push({ kind: "ramp", value, time });
  }
}

class FakeNode {
  gain = new FakeParam();
  frequency = new FakeParam();
  detune = new FakeParam();
  pan = new FakeParam();
  Q = new FakeParam();
  delayTime = new FakeParam();
  starts = 0;
  stops = 0;
  disconnects = 0;
  connect() {}
  disconnect() {
    this.disconnects += 1;
  }
  start() {
    this.starts += 1;
  }
  stop() {
    this.stops += 1;
  }
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

class FakeContext {
  state = "suspended";
  currentTime = 0;
  sampleRate = 8000;
  destination = new FakeNode();
  nodes: FakeNode[] = [];
  resumes = 0;
  suspends = 0;
  closes = 0;
  nextResume: Promise<void> | undefined;
  nextSuspend: Promise<void> | undefined;
  resume() {
    this.resumes += 1;
    const pending = this.nextResume ?? Promise.resolve();
    this.nextResume = undefined;
    return pending.then(() => {
      if (this.state !== "closed") this.state = "running";
    });
  }
  suspend() {
    this.suspends += 1;
    const pending = this.nextSuspend ?? Promise.resolve();
    this.nextSuspend = undefined;
    return pending.then(() => {
      if (this.state !== "closed") this.state = "suspended";
    });
  }
  close() {
    this.closes += 1;
    this.state = "closed";
    return Promise.resolve();
  }
  createGain() {
    const node = new FakeNode();
    this.nodes.push(node);
    return node;
  }
  createBiquadFilter = this.createGain;
  createDelay = this.createGain;
  createOscillator = this.createGain;
  createStereoPanner = this.createGain;
  createBufferSource = this.createGain;
  createBuffer(_channels: number, length: number) {
    return { getChannelData: () => new Float32Array(length) };
  }
  asAudioContext() {
    return this as unknown as AudioContext;
  }
}

async function flush() {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
}

test("ambient transport stays lazy until enabled, resumes in the gesture, and fully disposes", async () => {
  const context = new FakeContext();
  let creates = 0;
  const bed = createAmbientBed({
    createContext: () => {
      creates += 1;
      return context.asAudioContext();
    },
  });
  bed.setVisible(false);
  bed.setVisible(true);
  await bed.setEnabled(false);
  assert.equal(creates, 0);
  assert.equal(bed.enabled, false);
  const enabling = bed.setEnabled(true);
  assert.equal(creates, 1);
  assert.equal(context.resumes, 1, "resume is invoked before returning the promise");
  assert.equal(context.nodes[0].gain.value, 0);
  assert.equal(await enabling, true);
  assert.deepEqual(context.nodes[0].gain.events.at(-1), { kind: "ramp", value: 0.24, time: 1.2 });
  bed.dispose();
  bed.dispose();
  assert.equal(context.closes, 1);
  assert.ok(context.nodes.every((node) => node.disconnects === 1));
  assert.ok(context.nodes.every((node) => node.starts === node.stops));
  assert.equal(await bed.setEnabled(true), false);
  assert.equal(creates, 1);
});

test("rapid enable/mute/enable keeps one graph and cancels the stale mute timer", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const context = new FakeContext();
  const pending = deferred();
  context.nextResume = pending.promise;
  const bed = createAmbientBed({ createContext: () => context.asAudioContext() });
  const first = bed.setEnabled(true);
  const nodeCount = context.nodes.length;
  await bed.setEnabled(false);
  assert.equal(await bed.setEnabled(true), true);
  pending.resolve();
  assert.equal(await first, true, "stale calls return the current enabled choice");
  t.mock.timers.tick(1000);
  await flush();
  assert.equal(context.suspends, 0);
  assert.equal(context.nodes.length, nodeCount);
  context.currentTime = 0.6;
  await bed.setEnabled(false);
  const events = context.nodes[0].gain.events;
  assert.equal(events.at(-2)?.value, 0.12, "muting holds the in-progress fade without jumping");
  assert.equal(events.at(-1)?.value, 0);
  t.mock.timers.tick(170);
  await flush();
  assert.equal(context.state, "suspended");
  assert.equal(await bed.setEnabled(true), true);
  assert.equal(context.nodes.length, nodeCount);
  bed.dispose();
});

test("hiding during first resume stays silent, and showing resumes the same audio clock", async () => {
  const context = new FakeContext();
  const pending = deferred();
  context.nextResume = pending.promise;
  const bed = createAmbientBed({ createContext: () => context.asAudioContext() });
  const enabling = bed.setEnabled(true);
  bed.setVisible(false);
  await flush();
  pending.resolve();
  await enabling;
  await flush();
  assert.equal(context.state, "suspended");
  assert.equal(context.nodes[0].gain.value, 0);
  assert.equal(bed.enabled, true);
  const nodeCount = context.nodes.length;
  context.currentTime = 7;
  bed.setVisible(true);
  await flush();
  assert.equal(context.state, "running");
  assert.equal(context.nodes.length, nodeCount);
  assert.equal(context.nodes[0].gain.events.at(-1)?.time, 8.2);
  bed.dispose();
});

test("a delayed suspension cannot overtake a newer visible/enabled choice", async () => {
  const context = new FakeContext();
  const bed = createAmbientBed({ createContext: () => context.asAudioContext() });
  await bed.setEnabled(true);
  const pending = deferred();
  context.nextSuspend = pending.promise;
  bed.setVisible(false);
  bed.setVisible(true);
  await flush();
  pending.resolve();
  await flush();
  assert.equal(bed.enabled, true);
  assert.equal(context.state, "running");
  bed.dispose();
});

test("failed resumes are silent and retryable; dispose invalidates pending callbacks", async () => {
  const context = new FakeContext();
  const states: boolean[] = [];
  context.nextResume = Promise.reject(new Error("browser denied playback"));
  const bed = createAmbientBed({
    createContext: () => context.asAudioContext(),
    onEnabledChange: (enabled) => states.push(enabled),
  });
  assert.equal(await bed.setEnabled(true), false);
  assert.equal(bed.enabled, false);
  assert.equal(context.nodes[0].gain.value, 0);
  assert.deepEqual(states, [true, false]);
  assert.equal(await bed.setEnabled(true), true);
  bed.setVisible(false);
  await flush();
  const pending = deferred();
  context.nextResume = pending.promise;
  bed.setVisible(true);
  bed.dispose();
  pending.resolve();
  await flush();
  assert.equal(context.state, "closed");
  assert.equal(bed.enabled, false);
  assert.equal(context.closes, 1);
  assert.deepEqual(states, [true, false, true], "dispose does not notify an unmounted UI");
});

test("a failed context factory is recoverable on a later gesture", async () => {
  let creates = 0;
  const context = new FakeContext();
  const bed = createAmbientBed({
    createContext: () => {
      creates += 1;
      if (creates === 1) throw new Error("audio unavailable");
      return context.asAudioContext();
    },
  });
  assert.equal(await bed.setEnabled(true), false);
  assert.equal(await bed.setEnabled(true), true);
  assert.equal(creates, 2);
  bed.dispose();
});
