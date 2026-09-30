export type DetailLevel = 0 | 1 | 2;

export interface FrameStats {
  meanMs: number;
  p90Ms: number;
  p99Ms: number;
  maxMs: number;
  workP95Ms: number;
  samples: number;
  excludedStalls: number;
  detail: DetailLevel;
}

function percentile(sorted: readonly number[], fraction: number): number {
  return sorted[Math.min(sorted.length - 1, Math.ceil(fraction * sorted.length) - 1)];
}

/** Changes drawing density only. The simulation and event order never depend on it. */
export class FrameBudget {
  detail: DetailLevel = 1;
  stats: FrameStats | null = null;
  private intervals: number[] = [];
  private work: number[] = [];
  private fastWindows = 0;
  private slowWindows = 0;
  private excludedStalls = 0;

  record(intervalMs: number, workMs: number): void {
    // Hidden tabs, debugger stops, and transition stalls are not device throughput.
    if (!Number.isFinite(intervalMs) || intervalMs <= 0) return;
    if (intervalMs > 150) {
      this.excludedStalls++;
      return;
    }
    if (!Number.isFinite(workMs) || workMs < 0) return;
    this.intervals.push(intervalMs);
    this.work.push(workMs);
    if (this.intervals.length < 120) return;

    const intervals = this.intervals.sort((a, b) => a - b);
    const work = this.work.sort((a, b) => a - b);
    const meanMs = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
    const p90Ms = percentile(intervals, 0.9);
    const p99Ms = percentile(intervals, 0.99);
    const workP95Ms = percentile(work, 0.95);
    this.stats = { meanMs, p90Ms, p99Ms, maxMs: intervals.at(-1) ?? 0, workP95Ms, samples: intervals.length, excludedStalls: this.excludedStalls, detail: this.detail };
    this.intervals = [];
    this.work = [];
    this.excludedStalls = 0;

    const slow = p90Ms > 27 || workP95Ms > 15;
    const fast = p90Ms < 19 && workP95Ms < 8;
    this.slowWindows = slow ? this.slowWindows + 1 : 0;
    this.fastWindows = fast ? this.fastWindows + 1 : 0;
    if (this.slowWindows >= 2 && this.detail > 0) {
      this.detail = (this.detail - 1) as DetailLevel;
      this.slowWindows = 0;
      this.fastWindows = 0;
    } else if (this.fastWindows >= 3 && this.detail < 2) {
      this.detail = (this.detail + 1) as DetailLevel;
      this.slowWindows = 0;
      this.fastWindows = 0;
    }
    this.stats.detail = this.detail;
  }

  discard(): void {
    this.intervals = [];
    this.work = [];
    this.excludedStalls = 0;
    this.fastWindows = 0;
    this.slowWindows = 0;
  }
}
