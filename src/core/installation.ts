import { syntheticForcing } from "./forcing.ts";
import { OrbitWorld } from "./orbit.ts";
import type { OrbitParameters } from "./orbit.ts";
import { FrameBudget } from "./quality.ts";

/** A compositional boundary, not an escape-energy criterion. */
export const DEPARTURE_RADIUS = 2;
export const MAX_DEPARTURES = 40;
const DEPARTURE_SPACING = 1.4;
const EARLIEST_RUPTURE = 5;
const AUTHORED_FALLBACK = 20;

export interface Departure {
  tick: number;
  particle: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface SceneState {
  ruptureAt: number | null;
  shock: number;
  aftermath: number;
  trajectoryOpacity: number;
}

/** One CPU clock and event history feed both renderer paths and the backdrop. */
export class Installation {
  readonly world: OrbitWorld;
  readonly departures: Departure[] = [];
  readonly budget = new FrameBudget();
  private readonly previousRadius: Float64Array;
  private lastDeparture = -Infinity;
  private ruptureAt: number | null = null;

  constructor(parameters: Readonly<OrbitParameters>) {
    this.world = new OrbitWorld(parameters);
    this.previousRadius = new Float64Array(parameters.particleCount);
    for (let particle = 0; particle < parameters.particleCount; particle++) {
      const index = particle * 2;
      this.previousRadius[particle] = Math.hypot(
        this.world.positions[index],
        this.world.positions[index + 1],
      );
    }
  }

  step(): void {
    this.world.step(syntheticForcing(this.world.time));
    const time = this.world.time;
    for (let particle = 0; particle < this.previousRadius.length; particle++) {
      const index = particle * 2;
      const x = this.world.positions[index];
      const y = this.world.positions[index + 1];
      const radius = Math.hypot(x, y);
      if (
        this.previousRadius[particle] < DEPARTURE_RADIUS &&
        radius >= DEPARTURE_RADIUS &&
        time - this.lastDeparture >= DEPARTURE_SPACING &&
        this.departures.length < MAX_DEPARTURES
      ) {
        const vx = this.world.velocities[index];
        const vy = this.world.velocities[index + 1];
        if (x * vx + y * vy > 0) {
          this.departures.push({
            tick: this.world.ticks,
            particle,
            x,
            y,
            vx,
            vy,
          });
          this.lastDeparture = time;
          this.ruptureAt ??= Math.max(EARLIEST_RUPTURE, time);
        }
      }
      this.previousRadius[particle] = radius;
    }
    // The piece still has an authored arc under tunings with no boundary crossing.
    if (this.ruptureAt === null && time >= AUTHORED_FALLBACK) {
      this.ruptureAt = AUTHORED_FALLBACK;
    }
  }

  scene(): SceneState {
    const time = this.world.time;
    const ruptureAt = this.ruptureAt;
    if (ruptureAt === null || time < ruptureAt) {
      const whisper = Math.min(1, time / 7);
      return {
        ruptureAt,
        shock: 0,
        aftermath: 0,
      trajectoryOpacity: 0.025 + whisper * 0.07,
      };
    }
    const age = time - ruptureAt;
    const rise = Math.min(1, age / 0.8);
    const shock = rise * Math.exp(-Math.max(0, age - 0.8) / 4.5);
    const aftermath = 1 - Math.exp(-age / 7);
    return {
      ruptureAt,
      shock,
      aftermath,
      trajectoryOpacity: Math.min(1, 0.04 + shock * 0.91 + aftermath * 0.35),
    };
  }
}
