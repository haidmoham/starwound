import { FIXED_DT } from "./clock.ts";
import { driveStrength } from "./forcing.ts";
import type { Forcing } from "./forcing.ts";
import { createRandom } from "./random.ts";

export const HISTORY_CAPACITY = 128;
export const HISTORY_STRIDE = 8;
export const GRAVITY = 1;
export const SOFTENING = 0.12;

export interface OrbitParameters {
  seed: number;
  particleCount: number;
  angularMomentum: number;
  dispersion: number;
  receptivity: number;
}

export const DEFAULT_PARAMETERS: Readonly<OrbitParameters> = {
  seed: 1997,
  particleCount: 192,
  angularMomentum: 0.82,
  dispersion: 0.025,
  receptivity: 0.55,
};

function requireRange(name: string, value: number, min: number, max: number): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${name} must be in [${min}, ${max}].`);
  }
}

/**
 * Dimensionless, planar, softened Newtonian test particles.
 * One fixed attractor; no self-gravity, gas, GR, or collision model.
 * A localized external drive changes momentum, never rendered size/color.
 */
export class OrbitWorld {
  readonly parameters: Readonly<OrbitParameters>;
  readonly positions: Float64Array;
  readonly velocities: Float64Array;
  readonly history: Float32Array;
  ticks = 0;
  historyHead = 0;
  historyCount = 1;

  constructor(parameters: Readonly<OrbitParameters>) {
    requireRange("Particle count", parameters.particleCount, 1, 2048);
    if (!Number.isInteger(parameters.particleCount)) throw new RangeError("Particle count must be an integer.");
    requireRange("Angular momentum", parameters.angularMomentum, 0.35, 1.4);
    requireRange("Dispersion", parameters.dispersion, 0, 0.25);
    requireRange("Receptivity", parameters.receptivity, 0, 1);
    const random = createRandom(parameters.seed);
    this.parameters = Object.freeze({ ...parameters });
    this.positions = new Float64Array(parameters.particleCount * 2);
    this.velocities = new Float64Array(parameters.particleCount * 2);
    this.history = new Float32Array(HISTORY_CAPACITY * this.positions.length);
    for (let i = 0; i < this.positions.length; i += 2) {
      const radius = 0.8 + 1.3 * random();
      const angle = (random() - 0.5) * 0.65;
      const circularSpeed = Math.sqrt(GRAVITY * radius * radius / Math.pow(radius * radius + SOFTENING * SOFTENING, 1.5));
      const speed = circularSpeed * parameters.angularMomentum;
      this.positions[i] = Math.cos(angle) * radius;
      this.positions[i + 1] = Math.sin(angle) * radius;
      this.velocities[i] = -Math.sin(angle) * speed + (random() - 0.5) * parameters.dispersion;
      this.velocities[i + 1] = Math.cos(angle) * speed + (random() - 0.5) * parameters.dispersion;
    }
    this.history.set(this.positions);
  }

  get time(): number {
    return this.ticks * FIXED_DT;
  }

  step(forcing: Readonly<Forcing>): void {
    const drive = driveStrength(forcing, this.parameters.receptivity);
    // Kick-drift-kick. Forcing is held constant within this fixed tick.
    this.kick(FIXED_DT / 2, drive);
    for (let i = 0; i < this.positions.length; i++) {
      this.positions[i] += this.velocities[i] * FIXED_DT;
    }
    this.kick(FIXED_DT / 2, drive);
    this.ticks++;
    if (this.ticks % HISTORY_STRIDE === 0) {
      this.historyHead = (this.historyHead + 1) % HISTORY_CAPACITY;
      this.history.set(this.positions, this.historyHead * this.positions.length);
      this.historyCount = Math.min(HISTORY_CAPACITY, this.historyCount + 1);
    }
  }

  private kick(dt: number, drive: number): void {
    for (let i = 0; i < this.positions.length; i += 2) {
      const x = this.positions[i];
      const y = this.positions[i + 1];
      const scale = -GRAVITY / Math.pow(x * x + y * y + SOFTENING * SOFTENING, 1.5);
      // External +y drive in a localized region near the initial ribbon.
      const locality = Math.exp(-((x - 1.2) ** 2 + y * y) / 0.35);
      this.velocities[i] += x * scale * dt;
      this.velocities[i + 1] += (y * scale + drive * locality) * dt;
    }
  }
}
