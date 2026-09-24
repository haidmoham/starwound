export const FIXED_DT = 1 / 120;

/** Preview clock. Long frames deliberately drop wall time; not an audio transport. */
export class FixedClock {
  private accumulator = 0;

  advance(elapsed: number, step: () => void): number {
    if (!Number.isFinite(elapsed) || elapsed < 0) {
      throw new RangeError("Elapsed time must be finite and nonnegative.");
    }
    this.accumulator += Math.min(elapsed, 0.1);
    let count = 0;
    while (this.accumulator + 1e-12 >= FIXED_DT) {
      step();
      this.accumulator = Math.max(0, this.accumulator - FIXED_DT);
      count++;
    }
    return count;
  }

  discard(): void {
    this.accumulator = 0;
  }
}
