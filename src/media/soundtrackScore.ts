import type { SceneState } from "../core/installation.ts";

export interface SoundtrackClock {
  readTime: () => number | null;
}

export const BABY_BLUE_FILE = {
  bytes: 3517804,
  duration: 214.543673,
  sha256: "ca731a8a7956e565329b8f7ce22fff36545650d102da222c59e344839d588185",
} as const;

// Authored structural interpretation of the supplied recording's measured
// RMS / spectral transitions. These are not inferred lyrics or a beat map.
// [media seconds, rupture light, held strain]
const CUES = [
  [0, 0, 0.08],
  [14.81, 0.01, 0.38],
  [23.5, 0.025, 0.94],
  [24.15, 0.62, 0.15],
  [33.9, 0.2, 0.55],
  [38.92, 0.04, 0.16],
  [54.24, 0.015, 0.5],
  [66.65, 0.02, 1],
  [67.38, 1, 0.08],
  [73.33, 0.46, 0.42],
  [79.69, 0.3, 0.68],
  [86.47, 0.63, 0.18],
  [92.8, 0.35, 0.55],
  [93.81, 0.035, 0.12],
  [110.9, 0.2, 0.58],
  [117.77, 0.035, 0.18],
  [133.14, 0.01, 0.6],
  [145.5, 0.025, 1],
  [146.29, 1, 0.05],
  [152.23, 0.62, 0.38],
  [159, 0.42, 0.72],
  [166, 0.72, 0.15],
  [172.5, 0.28, 0.85],
  [173.41, 0.9, 0.08],
  [185.76, 0.4, 0.58],
  [193.52, 0.62, 0.25],
  [199.04, 0.035, 0.12],
  [211, 0.01, 0.05],
  [212.18, 0, 0],
  [214.55, 0, 0],
] as const;

export function soundtrackCue(time: number): {
  shock: number;
  pressure: number;
} {
  const t = Math.max(0, Math.min(BABY_BLUE_FILE.duration, time));
  let index = 1;
  while (index < CUES.length - 1 && CUES[index][0] < t) index++;
  const a = CUES[index - 1];
  const b = CUES[index];
  const fraction = Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0])));
  const blend = fraction * fraction * (3 - 2 * fraction);
  return {
    shock: a[1] + (b[1] - a[1]) * blend,
    pressure: a[2] + (b[2] - a[2]) * blend,
  };
}

export function presentationScene(
  scene: SceneState,
  time: number | null,
): SceneState {
  if (time === null) return scene;
  const { shock } = soundtrackCue(time);
  return {
    ...scene,
    shock,
    aftermath: Math.min(1, time / BABY_BLUE_FILE.duration),
    trajectoryOpacity: 0.12 + shock * 0.76,
  };
}
