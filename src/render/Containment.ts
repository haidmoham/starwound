/** Original monumental framing. A rigid exterior holds the living central tear. */
export function drawContainment(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  shock: number,
  pressure: number,
): void {
  const size = Math.min(width, height);
  const center = width * 0.5;
  const gap = size * (0.36 - pressure * 0.006);
  context.save();
  // Cropped masses continue beyond the viewport. Their unequal cuts prevent a HUD frame.
  for (const side of [-1, 1]) {
    const edge = center + side * gap;
    const outer = side < 0 ? 0 : width;
    const shoulder = height * (side < 0 ? 0.21 : 0.71);
    const face = context.createLinearGradient(outer, 0, edge, 0);
    face.addColorStop(0, "#020204");
    face.addColorStop(0.82, "#07080b");
    face.addColorStop(1, side < 0 ? "#111016" : "#0b0d12");
    context.fillStyle = face;
    context.beginPath();
    context.moveTo(outer, 0);
    context.lineTo(edge + side * size * 0.055, 0);
    context.lineTo(edge + side * size * 0.055, shoulder);
    context.lineTo(edge, shoulder + size * 0.09);
    context.lineTo(edge, height);
    context.lineTo(outer, height);
    context.closePath();
    context.fill();
    // Reflected wound light touches an edge; it never illuminates the entire chamber.
    context.strokeStyle = shock > 0.25 ? "#bd4b40" : "#5b5360";
    context.globalAlpha = 0.16 + shock * 0.35;
    context.lineWidth = Math.max(0.7, size * 0.001);
    context.beginPath();
    context.moveTo(edge + side * size * 0.055, shoulder - size * 0.18);
    context.lineTo(edge + side * size * 0.055, shoulder);
    context.lineTo(edge, shoulder + size * 0.09);
    context.lineTo(edge, shoulder + size * 0.27);
    context.stroke();
    context.globalAlpha = 1;
  }
  // One empty incision runs behind the nucleus, ending before the distant light.
  context.strokeStyle = "#797078";
  context.globalAlpha = 0.13;
  context.lineWidth = Math.max(0.6, size * 0.0007);
  context.beginPath();
  context.moveTo(center - gap, height * 0.57);
  context.lineTo(center - size * 0.19, height * 0.57);
  context.moveTo(center + size * 0.24, height * 0.57);
  context.lineTo(center + gap, height * 0.57);
  context.stroke();
  context.restore();
}

/** Slow creep, long hold, then one continuous release. No strobe or camera cut. */
export function heldMotion(time: number): number {
  const cycle = 17;
  const whole = Math.floor(time / cycle);
  const part = (time % cycle) / cycle;
  const release = Math.max(0, Math.min(1, (part - 0.89) / 0.11));
  const ease = release * release * (3 - 2 * release);
  return whole * cycle + part * cycle * 0.12 + ease * cycle * 0.88;
}
