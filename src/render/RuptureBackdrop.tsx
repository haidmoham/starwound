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
  const ratio = Math.min(
    window.devicePixelRatio || 1,
    detail === 0 ? 1 : detail === 1 ? 1.5 : 2,
  );
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
  const radius = size * 0.22;

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
  context.globalAlpha = Math.min(
    1,
    0.16 + scene.shock * 0.75 + scene.aftermath * 0.12,
  );
  context.fillRect(0, 0, width, height);
  context.globalAlpha = 1;

  const starDensity = detail === 0 ? 7000 : detail === 1 ? 4200 : 2900;
  for (
    let index = 0;
    index < Math.round((width * height) / starDensity);
    index++
  ) {
    const x = next() * width;
    const y = next() * height;
    const distance = Math.hypot(x - centerX, y - centerY);
    if (distance < radius * 0.75) continue;
    const cold = next() > 0.92;
    context.fillStyle = cold ? "#9cc9d6" : "#f2e9d4";
    context.globalAlpha =
      (cold ? 0.48 : 0.12 + next() * 0.39) * (0.65 + scene.aftermath * 0.35);
    const point = (next() > 0.985 ? 1.8 : 0.7) * ratio;
    context.fillRect(x, y, point, point);
  }
  context.globalAlpha = 1;
  for (let index = 0; index < 17; index++) {
    const x = next() * width;
    const y = next() * height;
    if (Math.hypot(x - centerX, y - centerY) < radius * 0.9) continue;
    context.fillStyle = index % 5 === 0 ? "#9cc9d6" : "#e5dfd4";
    context.globalAlpha = 0.15 + next() * 0.22;
    context.fillRect(x, y, 1.1 * ratio, 1.1 * ratio);
  }
  context.globalAlpha = 1;

  // The corona is an authored image of a wounded star, not simulated plasma.
  context.save();
  context.translate(centerX, centerY);
  const coronaAlpha = Math.min(
    1,
    0.24 + scene.shock * 0.76 + scene.aftermath * 0.17,
  );
  const rays = detail === 0 ? 70 : detail === 1 ? 135 : 230;
  for (let index = 0; index < rays; index++) {
    const angle = next() * Math.PI * 2;
    const inner = radius * (0.37 + next() * 0.4);
    const outer = radius * (0.92 + next() * (1.0 + scene.shock));
    const arc = Math.sin(angle * 3 + phase * 0.08) * radius * 0.05;
    context.strokeStyle =
      index % 9 === 0 ? "#fff0dd" : index % 3 === 0 ? "#d84e42" : "#77333b";
    context.globalAlpha = (0.05 + next() * 0.24) * coronaAlpha;
    context.lineWidth = (index % 9 === 0 ? 1.1 : 0.55) * ratio;
    context.beginPath();
    context.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    context.quadraticCurveTo(
      Math.cos(angle + 0.08) * (inner + outer) * 0.5 + arc,
      Math.sin(angle + 0.08) * (inner + outer) * 0.5,
      Math.cos(angle) * outer,
      Math.sin(angle) * outer,
    );
    context.stroke();
  }
  context.restore();
  context.globalAlpha = 1;

  // The tearing fan is asymmetric and finite; the quiet field gives it force.
  const ejectAlpha = Math.min(1, scene.shock * 0.83 + scene.aftermath * 0.13);
  const ejectMarks = detail === 0 ? 70 : detail === 1 ? 150 : 250;
  for (let index = 0; index < ejectMarks; index++) {
    const angle =
      -2.58 + next() * 0.53 + Math.sin(phase * 0.34 + index * 0.08) * 0.055;
    const distance =
      radius *
      (1.2 + next() * 2.6) *
      (1 + Math.sin(phase * 0.48 + index * 0.13) * 0.065);
    const start = radius * (0.35 + next() * 0.5);
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

  // A small, live ember is present from the first frame. The dark cut is the wound.
  context.save();
  context.translate(centerX, centerY);
  const coreRadius = radius * 0.52;
  const ember = context.createRadialGradient(0, 0, 1, 0, 0, coreRadius * 1.42);
  ember.addColorStop(0, "#fff0dc");
  ember.addColorStop(0.27, "#edab91");
  ember.addColorStop(0.55, "#bc433f");
  ember.addColorStop(0.8, "#501921");
  ember.addColorStop(1, "#020203");
  context.fillStyle = ember;
  context.globalAlpha = Math.min(1, 0.62 + scene.shock * 0.38);
  context.beginPath();
  context.arc(0, 0, coreRadius * 1.42, 0, Math.PI * 2);
  context.fill();
  context.rotate(-0.44);
  context.fillStyle = "#030305";
  context.globalAlpha = 0.9;
  context.beginPath();
  context.moveTo(-coreRadius * 1.28, -coreRadius * 0.21);
  context.lineTo(-coreRadius * 0.18, -coreRadius * 0.08);
  context.lineTo(coreRadius * 0.22, coreRadius * 0.21);
  context.lineTo(coreRadius * 1.2, coreRadius * 0.12);
  context.lineTo(coreRadius * 0.17, coreRadius * 0.42);
  context.lineTo(-coreRadius * 0.27, coreRadius * 0.09);
  context.closePath();
  context.fill();
  context.strokeStyle = "#fff0dc";
  context.globalAlpha = 0.34 + scene.shock * 0.54;
  context.lineWidth = (1.2 + scene.shock * 1.8) * ratio;
  context.beginPath();
  context.moveTo(-coreRadius * 1.19, -coreRadius * 0.24);
  context.lineTo(-coreRadius * 0.18, -coreRadius * 0.11);
  context.lineTo(coreRadius * 0.25, coreRadius * 0.18);
  context.lineTo(coreRadius * 1.08, coreRadius * 0.09);
  context.stroke();
  context.restore();
  context.globalAlpha = 1;

  // A distant, nearly unreachable point holds the negative space open.
  const farX = width * 0.84;
  const farY = height * 0.31;
  const farGlow = context.createRadialGradient(
    farX,
    farY,
    0,
    farX,
    farY,
    size * 0.045,
  );
  farGlow.addColorStop(0, "#dcecf0");
  farGlow.addColorStop(0.1, "#789dad");
  farGlow.addColorStop(1, "#020203");
  context.fillStyle = farGlow;
  context.globalAlpha = 0.3 + scene.aftermath * 0.23;
  context.beginPath();
  context.arc(farX, farY, size * 0.045, 0, Math.PI * 2);
  context.fill();
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
      const [x2, y2] = project(
        event.x + event.vx * 0.82,
        event.y + event.vy * 0.82,
      );
      const maturity = Math.min(1, age / 1.5);
      context.strokeStyle = "#020203";
      context.globalAlpha = maturity * 0.6;
      context.lineWidth = 3.2 * ratio;
      context.beginPath();
      context.moveTo(x1, y1);
      context.quadraticCurveTo(
        (x1 + x2) / 2 - 0.05 * size,
        (y1 + y2) / 2,
        x2,
        y2,
      );
      context.stroke();
      context.strokeStyle = event.particle % 7 === 0 ? "#fff1da" : "#e75b3d";
      context.globalAlpha = maturity * (0.35 + scene.shock * 0.38);
      context.lineWidth = (event.particle % 7 === 0 ? 1.4 : 1) * ratio;
      context.beginPath();
      context.moveTo(x1, y1);
      context.quadraticCurveTo(
        (x1 + x2) / 2 - 0.05 * size,
        (y1 + y2) / 2,
        x2,
        y2,
      );
      context.stroke();
    }
    context.globalAlpha = 1;
  }
}

export function RuptureBackdrop({
  installation,
}: {
  installation: Installation;
}) {
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
      if (
        !document.hidden &&
        (tick !== lastTick || detail !== lastDetail) &&
        now - lastDraw > 1000 / fps
      ) {
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
