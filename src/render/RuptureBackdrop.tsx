import { useEffect, useRef } from "react";
import { FIXED_DT } from "../core/clock.ts";
import { Installation } from "../core/installation.ts";

function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function drawRupture(canvas: HTMLCanvasElement, installation: Installation) {
  const seed = installation.world.parameters.seed;
  const phase = installation.world.time;
  const scene = installation.scene();
  const detail = installation.budget.detail;
  const bounds = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, detail === 0 ? 1 : detail === 1 ? 1.5 : 2);
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

  context.fillStyle = "#020203";
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
  context.globalAlpha = Math.min(1, scene.shock * 0.92 + scene.aftermath * 0.16);
  context.fillRect(0, 0, width, height);
  context.globalAlpha = 1;

  const starDensity = detail === 0 ? 7000 : detail === 1 ? 4200 : 2900;
  for (let index = 0; index < Math.round((width * height) / starDensity); index++) {
    const x = next() * width;
    const y = next() * height;
    const distance = Math.hypot(x - centerX, y - centerY);
    if (distance < radius * 0.75) continue;
    const cold = next() > 0.92;
    context.fillStyle = cold ? "#9cc9d6" : "#f2e9d4";
    context.globalAlpha = (cold ? 0.48 : 0.12 + next() * 0.39) * (0.42 + scene.aftermath * 0.58);
    const point = (next() > 0.985 ? 1.8 : 0.7) * ratio;
    context.fillRect(x, y, point, point);
  }
  context.globalAlpha = 1;

  // A projected, authored accretion-like mark. It is scenery, not a GR simulation.
  context.save();
  context.translate(centerX, centerY);
  context.rotate(-0.33);
  context.scale(1, 0.59);
  const ringAlpha = Math.min(1, scene.shock * 0.9 + scene.aftermath * 0.17);
  const ringMarks = detail === 0 ? 150 : detail === 1 ? 300 : 490;
  for (let index = 0; index < ringMarks; index++) {
    const band = radius * (0.72 + next() * 0.77);
    const start = -Math.PI + next() * Math.PI * 2 + phase * 0.035;
    const length = 0.04 + next() * 0.75;
    const hot = Math.cos(start + 0.5) > 0.5;
    context.strokeStyle = hot
      ? "#ffe8c3"
      : next() > 0.35
        ? "#ed4b27"
        : "#76151a";
    context.globalAlpha = (hot ? 0.12 + next() * 0.55 : 0.07 + next() * 0.27) * ringAlpha;
    context.lineWidth = (hot ? 0.45 + next() * 2.2 : 0.4 + next() * 3) * ratio;
    context.beginPath();
    context.arc(0, 0, band, start, start + length);
    context.stroke();
  }
  context.restore();
  context.globalAlpha = 1;

  // The tearing fan is asymmetric and finite; the quiet field gives it force.
  const ejectAlpha = Math.min(1, scene.shock * 0.83 + scene.aftermath * 0.1);
  const ejectMarks = detail === 0 ? 70 : detail === 1 ? 150 : 250;
  for (let index = 0; index < ejectMarks; index++) {
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
    context.globalAlpha = (0.08 + next() * 0.53) * ejectAlpha;
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
  context.globalAlpha = ringAlpha;
  context.beginPath();
  context.arc(0, 0, radius * 0.84, 0, Math.PI * 2);
  context.fill();
  context.restore();
  context.globalAlpha = 1;

  // Modeled outward crossings leave quiet, bounded scars after the flash.
  if (scene.ruptureAt !== null && phase >= scene.ruptureAt) {
    const scale = size / 6.2;
    const project = (x: number, y: number): [number, number] => {
      const py = y * 0.59;
      const rx = Math.cos(0.33) * x - Math.sin(0.33) * py;
      const ry = Math.sin(0.33) * x + Math.cos(0.33) * py;
      return [centerX + rx * scale, centerY - ry * scale];
    };
    for (const event of installation.departures) {
      const eventTime = event.tick * FIXED_DT;
      const age = phase - Math.max(scene.ruptureAt, eventTime);
      if (age < 0) continue;
      const [x1, y1] = project(event.x, event.y);
      const [x2, y2] = project(event.x + event.vx * 0.82, event.y + event.vy * 0.82);
      context.strokeStyle = event.particle % 7 === 0 ? "#fff1da" : "#e75b3d";
      context.globalAlpha = Math.min(1, age / 1.5) * (0.15 + scene.shock * 0.35);
      context.lineWidth = (event.particle % 7 === 0 ? 1.15 : 0.7) * ratio;
      context.beginPath();
      context.moveTo(x1, y1);
      context.quadraticCurveTo((x1 + x2) / 2 - 0.05 * size, (y1 + y2) / 2, x2, y2);
      context.stroke();
    }
    context.globalAlpha = 1;
  }
}

export function RuptureBackdrop({ installation }: { installation: Installation }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let lastDraw = 0;
    let lastTick = -1;
    let lastDetail = -1;
    let frame = 0;
    const render = () => drawRupture(canvas, installation);
    const observer = new ResizeObserver(render);
    observer.observe(canvas);
    render();
    const animate = (now: number) => {
      const tick = installation.world.ticks;
      const detail = installation.budget.detail;
      const fps = detail === 0 ? 10 : detail === 1 ? 16 : 24;
      if (!document.hidden && (tick !== lastTick || detail !== lastDetail) && now - lastDraw > 1000 / fps) {
        render();
        lastDraw = now;
        lastTick = tick;
        lastDetail = detail;
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [installation]);
  return (
    <canvas className="rupture-backdrop" ref={canvasRef} aria-hidden="true" />
  );
}
