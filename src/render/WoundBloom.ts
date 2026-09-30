import type { DetailLevel } from "../core/quality.ts";

type Point = readonly [number, number];

interface WoundBloom {
  upper: readonly Point[];
  lower: readonly Point[];
  radius: number;
  time: number;
  pressure: number;
  shock: number;
  detail: DetailLevel;
  pixelRatio: number;
  seed: number;
}

// Index-addressed variation: a quality change never reshuffles surviving marks.
function sample(seed: number, index: number, channel: number): number {
  let value =
    (seed ^
      Math.imul(index + 1, 0x9e3779b1) ^
      Math.imul(channel + 1, 0x85ebca6b)) >>>
    0;
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

/** Authored, bounded filament/petal motion. No force is added to OrbitWorld. */
export function drawWoundBloom(
  context: CanvasRenderingContext2D,
  bloom: WoundBloom,
): void {
  const {
    upper,
    lower,
    radius,
    time,
    pressure,
    shock,
    detail,
    pixelRatio,
    seed,
  } = bloom;
  const curls = detail === 0 ? 18 : detail === 1 ? 30 : 44;
  context.save();
  context.lineCap = "round";
  for (let index = 0; index < curls; index++) {
    const pick = (channel: number) => sample(seed, index, channel);
    const side = pick(0) < 0.76 ? -1 : 1;
    const lip = side < 0 ? upper : lower;
    const root = lip[Math.floor((0.18 + pick(1) * 0.62) * (lip.length - 1))];
    const stamen = index % 3 !== 0;
    const reach =
      radius * (stamen ? 0.32 + pick(2) * 0.83 : 0.18 + pick(2) * 0.46);
    const lean = (pick(3) - 0.65) * radius * 0.72;
    const bend = Math.sin(time * (0.31 + pick(4) * 0.24) + pick(5) * 9) * 0.045;
    const extension = 0.85 + shock * 0.32 - pressure * 0.12;
    const tipX = root[0] + lean + radius * bend;
    const tipY = root[1] + side * reach * extension;
    const hook = radius * (0.065 + pick(6) * 0.14);
    context.strokeStyle =
      index % 11 === 0 ? "#ffd0a2" : index % 3 === 0 ? "#e8463b" : "#a92832";
    context.globalAlpha = 0.35 + pick(7) * 0.27 + shock * 0.22;
    context.lineWidth =
      (stamen ? 0.48 + pick(8) * 0.55 : 1.0 + pick(8) * 1.1) * pixelRatio;
    context.beginPath();
    context.moveTo(...root);
    context.bezierCurveTo(
      root[0] + lean * 0.2,
      root[1] + side * reach * 0.55,
      tipX - hook,
      tipY - side * hook,
      tipX,
      tipY,
    );
    if (!stamen) {
      // Recurved petals turn back toward the wound rather than radiating straight out.
      context.bezierCurveTo(
        tipX + hook * 1.7,
        tipY + side * hook * 0.25,
        tipX + hook * 1.2,
        tipY - side * hook * 1.1,
        tipX + hook * 0.35,
        tipY - side * hook * 0.6,
      );
    }
    context.stroke();
    if (stamen && index % 4 === 1) {
      context.fillStyle = "#f29367";
      context.beginPath();
      context.ellipse(
        tipX,
        tipY,
        1.15 * pixelRatio,
        0.55 * pixelRatio,
        -0.7,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
  }

  // Six staggered releases; small cohorts detach together rather than constant confetti.
  const particles = detail === 0 ? 30 : detail === 1 ? 60 : 96;
  for (let index = 0; index < particles; index++) {
    const pick = (channel: number) => sample(seed ^ 0x57b10, index, channel);
    const cohort = index % 6;
    const period = 6.7 + cohort * 1.13;
    const age =
      ((time + cohort * 1.41) % period) - Math.floor(index / 6) * 0.023;
    const lifetime = 1.15 + pick(0) * 1.35;
    if (age < 0 || age > lifetime) continue;
    const life = age / lifetime;
    const side = pick(1) < 0.8 ? -1 : 1;
    const lip = side < 0 ? upper : lower;
    const root =
      lip[
        Math.floor(
          (0.21 + cohort * 0.088 + (pick(2) - 0.5) * 0.11) * (lip.length - 1),
        )
      ];
    const speed = radius * (0.2 + pick(3) * 0.57) * (1 + shock * 0.65);
    const drift = (pick(4) - 0.62) * speed;
    const x =
      root[0] +
      drift * age +
      Math.sin(age * 3.5 + index) * radius * 0.025 * life;
    const y = root[1] + side * speed * (age - age * age * 0.13);
    const fade = Math.min(1, age / 0.12) * Math.pow(1 - life, 1.6);
    context.globalAlpha = fade * (0.45 + shock * 0.4);
    context.strokeStyle =
      index % 7 === 0 ? "#ffd7ab" : index % 3 === 0 ? "#ff6350" : "#ae293a";
    context.lineWidth = (index % 5 === 0 ? 1.3 : 0.65) * pixelRatio;
    const curl = radius * (0.018 + pick(5) * 0.045);
    context.beginPath();
    context.moveTo(x - drift * 0.07, y - side * curl);
    context.quadraticCurveTo(x + curl, y - side * curl * 0.3, x, y);
    context.stroke();
  }
  context.restore();
}
