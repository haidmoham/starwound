/** Bounded components of the world's autonomous external drive. */
export interface Forcing {
  energy: number;
  onset: number;
}

export const SILENCE: Readonly<Forcing> = { energy: 0, onset: 0 };

/** A deterministic autonomous drive, unrelated to video or audio playback. */
export function syntheticForcing(time: number): Forcing {
  return {
    energy: 0.5 + 0.45 * Math.sin(time * 0.22),
    onset: Math.pow(Math.max(0, Math.sin(time * 1.3)), 12),
  };
}

export function driveStrength(
  forcing: Readonly<Forcing>,
  receptivity: number,
): number {
  for (const value of [forcing.energy, forcing.onset, receptivity]) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new RangeError(
        "Forcing and receptivity must be finite values in [0, 1].",
      );
    }
  }
  return receptivity * (0.012 * forcing.energy + 0.08 * forcing.onset);
}
