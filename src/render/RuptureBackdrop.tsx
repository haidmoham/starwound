import { useEffect, useRef } from "react";
import { FIXED_DT } from "../core/clock.ts";
import { Installation } from "../core/installation.ts";
import { drawWoundBloom } from "./WoundBloom.ts";

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
  // A long held contraction and short release, anchored to the world's clock.
  // This is authored pressure, not another physical force or a camera shake.
  const breath = (phase % 13) / 13;
  const pressure =
    breath < 0.84
      ? Math.pow(breath / 0.84, 2)
      : Math.pow((1 - breath) / 0.16, 3);
  const opening = scene.shock * 0.24 + pressure * 0.055;

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
    context.globalAlpha = (0.025 + next() * 0.13) * coronaAlpha;
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

  // Concentric heat gives the torn, seeded gash an order to violate.
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
  // Electron-orbit metaphor only: authored planes share the wounded nucleus.
  // Eccentricity, precession and passing phases differ; the camera never wanders.
  const filament = random(seed ^ 0x32bfa1);
  const rings = detail === 0 ? 14 : detail === 1 ? 26 : 40;
  for (let ring = 0; ring < rings; ring++) {
    const orbitRadius = coreRadius * (0.88 + filament() * 2.15);
    const flatten = 0.16 + filament() * 0.65;
    const plane = filament() * Math.PI;
    const rate = (0.045 + filament() * 0.13) * (ring % 2 === 0 ? 1 : -1);
    const offset = filament() * Math.PI * 2;
    const whipPhase = filament() * Math.PI * 2;
    const angleOfPlane = plane + phase * rate;
    const c = Math.cos(angleOfPlane);
    const sn = Math.sin(angleOfPlane);
    const head = offset + phase * (0.38 + Math.abs(rate) * 4);
    const pointAt = (angle: number): [number, number] => {
      const nearPass = Math.sin(angle * 2 + whipPhase + phase * 0.27);
      const whip =
        Math.pow(Math.max(0, Math.cos(angle - head)), 12) *
        (0.06 + opening * 0.9);
      const reach =
        orbitRadius * (1 - pressure * 0.06 + nearPass * 0.085 + whip);
      const x = Math.cos(angle) * reach;
      const y = Math.sin(angle) * reach * flatten;
      return [x * c - y * sn, x * sn + y * c];
    };
    context.strokeStyle =
      ring % 5 === 0 ? "#f7d5b4" : ring % 3 === 0 ? "#ba554b" : "#71383e";
    context.globalAlpha =
      0.08 + (ring % 5 === 0 ? 0.07 : 0) + scene.shock * 0.09;
    context.lineWidth = 0.55 * ratio;
    context.beginPath();
    for (let point = 0; point <= 84; point++) {
      const position = pointAt((point / 84) * Math.PI * 2);
      if (point === 0) context.moveTo(...position);
      else context.lineTo(...position);
    }
    context.stroke();
    // Unequal luminous passages make the tangled planes readable in motion.
    context.strokeStyle = ring % 4 === 0 ? "#ffe4c5" : "#d55d50";
    context.globalAlpha = 0.18 + scene.shock * 0.16;
    context.lineWidth = (ring % 4 === 0 ? 0.9 : 0.6) * ratio;
    context.beginPath();
    for (let point = 0; point <= 18; point++) {
      const position = pointAt(head - 0.7 + (point / 18) * 0.7);
      if (point === 0) context.moveTo(...position);
      else context.lineTo(...position);
    }
    context.stroke();
  }
  context.rotate(-0.44);
  const tear = random(seed ^ 0x75a91c);
  const upper: [number, number][] = [];
  const lower: [number, number][] = [];
  const teeth = 76;
  for (let index = 0; index <= teeth; index++) {
    const t = index / teeth;
    const x = (t * 2.95 - 1.83) * coreRadius;
    // Unequal lips and a broad torn shoulder instead of a serrated lozenge.
    const envelope = Math.pow(Math.sin(t * Math.PI), 1.1);
    const shoulder = Math.exp(-Math.pow((t - 0.36) / 0.18, 2));
    const spine =
      coreRadius *
      (Math.sin(t * 7.4) * 0.14 +
        Math.sin(t * 18 + 0.7) * 0.045 -
        shoulder * 0.09 +
        envelope * 0.24);
    const bite = (0.1 + tear() * 0.095 + shoulder * 0.26 + opening) * envelope;
    upper.push([x, spine - coreRadius * bite]);
    lower.push([
      x + (tear() - 0.5) * coreRadius * 0.03,
      spine + coreRadius * (0.035 + tear() * 0.055 + opening * 0.25) * envelope,
    ]);
  }
  context.fillStyle = "#030305";
  context.globalAlpha = 0.98;
  context.beginPath();
  context.moveTo(...upper[0]);
  for (const point of upper.slice(1)) context.lineTo(...point);
  for (const point of [...lower].reverse()) context.lineTo(...point);
  context.closePath();
  context.fill();
  // Light clings to fragments of the lip, never outlines a clean emblem.
  for (let index = 1; index < upper.length - 1; index++) {
    if (tear() < 0.38) continue;
    context.strokeStyle = index % 7 === 0 ? "#fff3df" : "#de7351";
    context.globalAlpha = 0.28 + tear() * 0.36 + scene.shock * 0.2;
    context.lineWidth = (0.5 + tear() * 1.6) * ratio;
    context.beginPath();
    context.moveTo(...upper[index - 1]);
    context.lineTo(...upper[index]);
    context.stroke();
  }
  // Branches, torn islands and dragged ink follow the same shear axis.
  const fragments = detail === 0 ? 24 : detail === 1 ? 42 : 62;
  for (let index = 0; index < fragments; index++) {
    const side = index % 3 === 0 ? 1 : -1;
    const t = tear();
    const x = (t * 2.65 - 1.65) * coreRadius;
    const envelope = Math.sin(t * Math.PI);
    const y = side * coreRadius * (0.2 + tear() * 0.48 + opening) * envelope;
    const length = coreRadius * (0.035 + tear() * 0.3);
    const breadth = coreRadius * (0.012 + tear() * 0.065);
    context.fillStyle =
      index % 8 === 0 ? "#f3c2a0" : index % 5 === 0 ? "#9f302e" : "#020203";
    context.globalAlpha = 0.3 + tear() * 0.65;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + length, y - breadth);
    context.lineTo(x + length * 0.37, y + breadth * 0.5);
    context.lineTo(x - length * 0.2, y + breadth);
    context.closePath();
    context.fill();
    if (index % 7 === 0) {
      context.strokeStyle = "#020203";
      context.lineWidth = (0.7 + tear() * 2.3) * ratio;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x + length * 0.5, y * 0.6);
      context.lineTo(x + length * 0.2, y * 1.3);
      context.stroke();
    }
  }
  drawWoundBloom(context, {
    upper,
    lower,
    radius: coreRadius,
    time: phase,
    pressure,
    shock: scene.shock,
    detail,
    pixelRatio: ratio,
    seed,
  });
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
