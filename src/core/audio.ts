import type { Forcing } from "./forcing.ts";

export interface FeatureTimeline {
  interval: number;
  frames: Forcing[];
  duration: number;
}

/** RMS energy and positive energy change, sampled in 50 ms windows. */
export function analyzeSamples(
  channels: readonly Float32Array[],
  sampleRate: number,
): FeatureTimeline {
  if (!channels.length || !Number.isFinite(sampleRate) || sampleRate <= 0) {
    throw new RangeError("Audio needs channels and a valid sample rate.");
  }
  const length = Math.min(...channels.map((channel) => channel.length));
  const windowSize = Math.max(1, Math.round(sampleRate * 0.05));
  const energies: number[] = [];
  for (let start = 0; start < length; start += windowSize) {
    const end = Math.min(length, start + windowSize);
    let sum = 0;
    for (const channel of channels) {
      for (let sample = start; sample < end; sample++)
        sum += channel[sample] ** 2;
    }
    energies.push(Math.sqrt(sum / ((end - start) * channels.length)));
  }
  const sorted = [...energies].sort((a, b) => a - b);
  const reference = Math.max(
    0.02,
    sorted[Math.floor(sorted.length * 0.95)] ?? 0,
  );
  const normalized = energies.map((energy) => Math.min(1, energy / reference));
  const frames = normalized.map((energy, index) => ({
    energy,
    onset: Math.min(1, Math.max(0, energy - (normalized[index - 1] ?? 0)) * 4),
  }));
  return {
    interval: windowSize / sampleRate,
    frames,
    duration: length / sampleRate,
  };
}

export function featureAt(timeline: FeatureTimeline, seconds: number): Forcing {
  if (seconds < 0 || seconds >= timeline.duration)
    return { energy: 0, onset: 0 };
  return (
    timeline.frames[
      Math.min(
        timeline.frames.length - 1,
        Math.floor(seconds / timeline.interval),
      )
    ] ?? { energy: 0, onset: 0 }
  );
}
