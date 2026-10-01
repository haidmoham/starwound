import type { DetailLevel } from "../core/quality.ts";

/** Seeded material damage attached to the body, never a full-screen noise layer. */
export function drawScorchedSurface(
  context: CanvasRenderingContext2D,
  radius: number,
  seed: number,
  detail: DetailLevel,
  shock: number,
): void {
  let state = (seed ^ 0x68a34) >>> 0;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  context.save();
  context.rotate(-0.44);
  const marks = detail === 0 ? 150 : detail === 1 ? 260 : 380;
  for (let index = 0; index < marks; index++) {
    const angle = next() * Math.PI * 2;
    const distance = Math.sqrt(next()) * radius * 1.4;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const length = radius * (0.025 + Math.pow(next(), 2) * 0.36);
    const breadth = radius * (0.006 + next() * 0.055);
    const lean = (next() - 0.7) * radius * 0.12;
    const dry = index % 7 === 0;
    context.fillStyle = dry ? "#c6b393" : index % 5 === 0 ? "#593255" : "#100a12";
    context.globalAlpha = dry ? 0.15 + shock * 0.22 : 0.35 + next() * 0.58;
    context.beginPath();
    context.moveTo(x - length, y);
    context.lineTo(x - length * 0.28, y - breadth);
    context.lineTo(x + length * 0.43, y - breadth * 0.4 + lean);
    context.lineTo(x + length, y + lean);
    context.lineTo(x + length * 0.15, y + breadth * 0.35);
    context.lineTo(x - length * 0.63, y + breadth);
    context.closePath();
    context.fill();
  }
  // A separate seed keeps major fissures fixed when adaptive detail changes.
  state = (seed ^ 0x4dca13) >>> 0;
  // Broad charred fissures break the airbrushed disc into unequal islands.
  for (let index = 0; index < 13; index++) {
    const x = (next() * 2 - 1) * radius;
    const y = (next() * 2 - 1) * radius;
    context.strokeStyle = index % 4 === 0 ? "#9c7761" : "#090608";
    context.globalAlpha = index % 4 === 0 ? 0.28 : 0.65;
    context.lineWidth = radius * (0.006 + next() * 0.022);
    context.beginPath();
    context.moveTo(x - radius * 0.27, y + radius * 0.12);
    context.lineTo(x, y);
    context.lineTo(x + radius * 0.11, y + radius * 0.025);
    context.lineTo(x + radius * 0.34, y - radius * 0.09);
    context.stroke();
  }
  context.restore();
}
