import { useEffect, useRef } from "react";
import { FixedClock } from "../core/clock.ts";
import { Installation } from "../core/installation.ts";
import { syntheticForcing } from "../core/forcing.ts";
import { drawScorchedSurface } from "./ScorchedSurface.ts";
import { vitalMotion } from "./VitalMotion.ts";
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
  const drive = syntheticForcing(phase);
  const vital = vitalMotion(phase, seed);
  const modeled = installation.scene();
  const scene = {
    ...modeled,
    shock: Math.min(
      1,
      modeled.shock * 0.55 + vital.release * 0.68 + vital.pulse * 0.22,
    ),
  };
  const positions = installation.world.positions;
  let load = 0;
  for (let index = 0; index < positions.length; index += 2) {
    load += Math.min(
      1,
      Math.hypot(positions[index], positions[index + 1]) / 2.4,
    );
  }
  const pressure = drive.energy * 0.65 + (load / (positions.length / 2)) * 0.35;
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
  const radius = size * 0.3;
  // One effort envelope feeds contraction, tearing, filaments, light and ejecta.
  // The field is authored anatomy around the model, not simulated biology.
  const motion = vital.travel;
  const opening =
    scene.shock * 0.37 +
    vital.resistance * 0.19 +
    vital.breath * 0.07 +
    pressure * 0.05;

  context.fillStyle = "#020203";
  context.fillRect(0, 0, width, height);
  context.save();
  context.translate(centerX, centerY);
  context.rotate(
    vital.resistance * 0.09 - vital.breath * 0.035 + vital.release * 0.08,
  );
  context.scale(
    1 -
      pressure * 0.025 +
      vital.breath * 0.13 -
      vital.resistance * 0.08 +
      vital.pulse * 0.022 +
      scene.shock * 0.11,
    1 -
      pressure * 0.04 +
      vital.breath * 0.055 -
      vital.resistance * 0.095 -
      scene.shock * 0.09,
  );
  context.translate(-centerX, -centerY);
  const haze = context.createRadialGradient(
    centerX,
    centerY,
    radius * 0.1,
    centerX,
    centerY,
    radius * 2.1,
  );
  haze.addColorStop(0, "#230d2c");
  haze.addColorStop(0.32, "#3b0a0a");
  haze.addColorStop(0.65, "#23122d");
  haze.addColorStop(1, "rgba(2, 2, 3, 0)");
  context.fillStyle = haze;
  context.globalAlpha = Math.min(
    1,
    0.16 + scene.shock * 0.75 + scene.aftermath * 0.035,
  );
  context.fillRect(0, 0, width, height);
  context.globalAlpha = 1;

  // The corona is an authored image of a wounded star, not simulated plasma.
  context.save();
  context.translate(centerX, centerY);
  const coronaAlpha = Math.min(
    1,
    0.22 + scene.shock * 0.78 + scene.aftermath * 0.04,
  );
  const rays = detail === 0 ? 70 : detail === 1 ? 135 : 230;
  for (let index = 0; index < rays; index++) {
    const angle = next() * Math.PI * 2;
    const inner = radius * (0.37 + next() * 0.4);
    const outer = radius * (0.92 + next() * (1.0 + scene.shock));
    const arc = Math.sin(angle * 3 + motion * 0.08) * radius * 0.05;
    context.strokeStyle =
      index % 9 === 0 ? "#fff0dd" : index % 3 === 0 ? "#d84e42" : "#76517e";
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
  const ejectAlpha = Math.min(
    1,
    Math.pow(scene.shock, 1.6) * 0.95 + scene.aftermath * 0.025,
  );
  const ejectMarks = detail === 0 ? 70 : detail === 1 ? 150 : 250;
  for (let index = 0; index < ejectMarks; index++) {
    const angle =
      -2.58 + next() * 0.53 + Math.sin(motion * 0.34 + index * 0.08) * 0.055;
    const distance =
      radius *
      (1.2 + next() * 2.6) *
      (1 + Math.sin(motion * 0.48 + index * 0.13) * 0.065);
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
  ember.addColorStop(0, "#d9cba9");
  ember.addColorStop(0.27, "#bba58c");
  ember.addColorStop(0.55, "#923128");
  ember.addColorStop(0.8, "#452143");
  ember.addColorStop(1, "#020203");
  context.fillStyle = ember;
  context.globalAlpha = Math.min(
    1,
    0.56 + vital.breath * 0.12 + vital.pulse * 0.17 + scene.shock * 0.26,
  );
  context.beginPath();
  context.arc(0, 0, coreRadius * 1.42, 0, Math.PI * 2);
  context.fill();
  drawScorchedSurface(context, coreRadius, seed, detail, scene.shock);
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
    const delayed = vitalMotion(phase - 0.1 - (ring % 7) * 0.065, seed);
    const particle =
      ((ring * 7) % installation.world.parameters.particleCount) * 2;
    const strainAngle = Math.atan2(
      positions[particle + 1],
      positions[particle],
    );
    const angleOfPlane =
      plane +
      motion * rate +
      strainAngle * 0.13 +
      (delayed.breath - vital.breath) * 0.24 +
      delayed.release * (ring % 2 === 0 ? 0.08 : -0.06);
    const c = Math.cos(angleOfPlane);
    const sn = Math.sin(angleOfPlane);
    const head = offset + motion * (0.38 + Math.abs(rate) * 4);
    const pointAt = (angle: number): [number, number] => {
      const nearPass = Math.sin(angle * 2 + whipPhase + motion * 0.27);
      const whip =
        Math.pow(Math.max(0, Math.cos(angle - head)), 12) *
        (0.08 + opening * 1.2 + delayed.release * 0.3);
      const reach =
        orbitRadius *
        (1 -
          pressure * 0.03 +
          delayed.breath * 0.06 -
          delayed.resistance * 0.035 +
          nearPass * 0.085 +
          whip +
          Math.sin(angle * 19 + whipPhase) * 0.019 +
          Math.sin(angle * 37 + offset) * 0.008);
      const x = Math.cos(angle) * reach;
      const y = Math.sin(angle) * reach * flatten;
      return [x * c - y * sn, x * sn + y * c];
    };
    context.strokeStyle =
      ring % 5 === 0 ? "#c7b392" : ring % 3 === 0 ? "#a64c38" : "#745078";
    context.globalAlpha =
      0.16 + (ring % 5 === 0 ? 0.12 : 0) + scene.shock * 0.37;
    context.lineWidth = 0.55 * ratio;
    context.beginPath();
    for (let point = 0; point <= 84; point++) {
      const position = pointAt((point / 84) * Math.PI * 2);
      if (point === 0 || (point + ring * 7) % 13 < 4)
        context.moveTo(...position);
      else context.lineTo(...position);
    }
    context.stroke();
    // Unequal luminous passages make the tangled planes readable in motion.
    context.strokeStyle =
      ring % 4 === 0 ? "#d8c29a" : ring % 3 === 0 ? "#92639e" : "#b64934";
    context.globalAlpha = 0.28 + scene.shock * 0.5;
    context.lineWidth = (ring % 4 === 0 ? 0.9 : 0.6) * ratio;
    context.beginPath();
    for (let point = 0; point <= 18; point++) {
      const position = pointAt(head - 0.7 + (point / 18) * 0.7);
      if (point === 0 || (point + ring) % 7 === 0) context.moveTo(...position);
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
        Math.sin(t * 18 + 0.7) * 0.075 +
        Math.sin(t * 47) * 0.04 -
        shoulder * 0.09 +
        envelope * 0.24);
    const bite =
      (0.08 + Math.pow(tear(), 2) * 0.31 + shoulder * 0.26 + opening) *
      envelope;
    upper.push([x, spine - coreRadius * bite]);
    lower.push([
      x + (tear() - 0.5) * coreRadius * 0.11,
      spine + coreRadius * (0.015 + tear() * 0.16 + opening * 0.25) * envelope,
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
    if (tear() < 0.56) continue;
    context.strokeStyle = index % 7 === 0 ? "#cabc94" : "#a75336";
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
      index % 8 === 0 ? "#bfa585" : index % 5 === 0 ? "#823323" : "#020203";
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

  context.restore();
}

export function RuptureBackdrop({
  installation,
  paused,
}: {
  installation: Installation;
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
    const clock = new FixedClock();
    let frame = 0;
    let previous = performance.now();
    let lastDraw = 0;
    let lastTick = -1;
    let lastDetail = -1;
    const profiling = new URLSearchParams(window.location.search).has(
      "profile",
    );
    let lastProfile = installation.budget.stats;
    const render = () => drawRupture(canvas, installation);
    const observer = new ResizeObserver(render);
    observer.observe(canvas);
    render();
    const animate = (now: number) => {
      const elapsed = Math.max(0, (now - previous) / 1000);
      previous = now;
      if (!document.hidden) {
        if (pausedRef.current) clock.discard();
        else clock.advance(elapsed, () => installation.step());
        const start = performance.now();
        const detail = installation.budget.detail;
        const fps = detail === 0 ? 16 : detail === 1 ? 24 : 30;
        if (
          (installation.world.ticks !== lastTick || detail !== lastDetail) &&
          now - lastDraw >= 1000 / fps
        ) {
          render();
          lastDraw = now;
          lastTick = installation.world.ticks;
          lastDetail = detail;
        }
        installation.budget.record(elapsed * 1000, performance.now() - start);
        if (profiling && installation.budget.stats !== lastProfile) {
          lastProfile = installation.budget.stats;
          document.documentElement.dataset.starwoundProfile = JSON.stringify({
            renderer: "canvas2d-organism",
            time: installation.world.time,
            reducedMotion: pausedRef.current,
            ...lastProfile,
          });
        }
      } else {
        clock.discard();
        installation.budget.discard();
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
