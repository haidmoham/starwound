import { useEffect, useRef } from "react";

function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function drawRupture(canvas: HTMLCanvasElement, seed: number, phase: number) {
  const bounds = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(bounds.width * ratio));
  const height = Math.max(1, Math.round(bounds.height * ratio));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return;
  const next = random(seed);
  const size = Math.min(width, height);
  const centerX = width * 0.5;
  const centerY = height * 0.5;
  const radius = size * 0.37;

  context.fillStyle = "#050506";
  context.fillRect(0, 0, width, height);
  const haze = context.createRadialGradient(
    centerX,
    centerY,
    radius * 0.1,
    centerX,
    centerY,
    radius * 2.1,
  );
  haze.addColorStop(0, "#170607");
  haze.addColorStop(0.32, "#3b0a0a");
  haze.addColorStop(0.65, "#16090b");
  haze.addColorStop(1, "#050506");
  context.fillStyle = haze;
  context.fillRect(0, 0, width, height);

  for (let index = 0; index < Math.round((width * height) / 3600); index++) {
    const x = next() * width;
    const y = next() * height;
    const distance = Math.hypot(x - centerX, y - centerY);
    if (distance < radius * 0.75) continue;
    const cold = next() > 0.92;
    context.fillStyle = cold ? "#9cc9d6" : "#f2e9d4";
    context.globalAlpha = cold ? 0.55 : 0.15 + next() * 0.48;
    const point = (next() > 0.985 ? 1.8 : 0.7) * ratio;
    context.fillRect(x, y, point, point);
  }
  context.globalAlpha = 1;

  // A projected, authored accretion-like mark. It is scenery, not a GR simulation.
  context.save();
  context.translate(centerX, centerY);
  context.rotate(-0.33);
  context.scale(1, 0.59);
  for (let index = 0; index < 350; index++) {
    const band = radius * (0.72 + next() * 0.77);
    const start = -Math.PI + next() * Math.PI * 2 + phase * 0.035;
    const length = 0.04 + next() * 0.75;
    const hot = Math.cos(start + 0.5) > 0.5;
    context.strokeStyle = hot
      ? "#ffe8c3"
      : next() > 0.35
        ? "#ed4b27"
        : "#76151a";
    context.globalAlpha = hot ? 0.12 + next() * 0.55 : 0.07 + next() * 0.27;
    context.lineWidth = (hot ? 0.45 + next() * 2.2 : 0.4 + next() * 3) * ratio;
    context.beginPath();
    context.arc(0, 0, band, start, start + length);
    context.stroke();
  }
  context.restore();
  context.globalAlpha = 1;

  // The tearing fan is asymmetric and finite; the quiet field gives it force.
  for (let index = 0; index < 170; index++) {
    const angle =
      -2.58 + next() * 0.53 + Math.sin(phase * 0.34 + index * 0.08) * 0.055;
    const distance =
      radius *
      (1.05 + next() * 1.58) *
      (1 + Math.sin(phase * 0.48 + index * 0.13) * 0.065);
    const start = radius * (0.5 + next() * 0.42);
    const x1 = centerX + Math.cos(angle) * start;
    const y1 = centerY + Math.sin(angle) * start * 0.58;
    const x2 = centerX + Math.cos(angle) * distance;
    const y2 = centerY + Math.sin(angle) * distance * 0.78;
    context.strokeStyle =
      index % 11 === 0 ? "#fff0d7" : index % 3 === 0 ? "#fa572b" : "#9b1d1c";
    context.globalAlpha = 0.08 + next() * 0.53;
    context.lineWidth = (index % 14 === 0 ? 2.5 : 0.55) * ratio;
    context.beginPath();
    context.moveTo(x1, y1);
    context.quadraticCurveTo(
      (x1 + x2) / 2 - radius * 0.13,
      (y1 + y2) / 2,
      x2,
      y2,
    );
    context.stroke();
  }
  context.globalAlpha = 1;

  context.save();
  context.translate(centerX, centerY);
  context.rotate(-0.33);
  context.scale(1, 0.59);
  const rim = context.createRadialGradient(
    0,
    0,
    radius * 0.43,
    0,
    0,
    radius * 0.84,
  );
  rim.addColorStop(0, "#000000");
  rim.addColorStop(0.64, "#000000");
  rim.addColorStop(0.79, "#230507");
  rim.addColorStop(0.9, "#d44928");
  rim.addColorStop(0.96, "#fff0d2");
  rim.addColorStop(1, "#34100c");
  context.fillStyle = rim;
  context.beginPath();
  context.arc(0, 0, radius * 0.84, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

export function RuptureBackdrop({
  seed,
  paused,
}: {
  seed: number;
  paused: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let phase = 0;
    let previous = performance.now();
    let lastDraw = 0;
    let frame = 0;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const render = () => drawRupture(canvas, seed, phase);
    const observer = new ResizeObserver(render);
    observer.observe(canvas);
    render();
    const animate = (now: number) => {
      const elapsed = Math.min(0.1, Math.max(0, (now - previous) / 1000));
      previous = now;
      if (!pausedRef.current && !document.hidden && !still) {
        phase += elapsed;
        if (now - lastDraw > 1000 / 18) {
          render();
          lastDraw = now;
        }
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [seed]);
  return (
    <canvas className="rupture-backdrop" ref={canvasRef} aria-hidden="true" />
  );
}
