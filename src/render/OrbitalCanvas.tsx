import { useEffect, useRef } from "react";
import * as THREE from "three";
import { FIXED_DT, FixedClock } from "../core/clock.ts";
import { featureAt } from "../core/audio.ts";
import type { FeatureTimeline } from "../core/audio.ts";
import { SILENCE, syntheticForcing } from "../core/forcing.ts";
import { HISTORY_CAPACITY, HISTORY_STRIDE, OrbitWorld } from "../core/orbit.ts";
import type { OrbitParameters } from "../core/orbit.ts";

export interface ViewParameters {
  exposure: number;
  extent: number;
  traceSeconds: number;
}

interface Props {
  parameters: Readonly<OrbitParameters>;
  view: Readonly<ViewParameters>;
  paused: boolean;
  onError: (message: string) => void;
  audio: HTMLAudioElement | null;
  timeline: FeatureTimeline | null;
  resetKey: number;
}

function startCanvasFallback(
  canvas: HTMLCanvasElement,
  parameters: Readonly<OrbitParameters>,
  viewRef: React.RefObject<Readonly<ViewParameters>>,
  pausedRef: React.RefObject<boolean>,
  audio: HTMLAudioElement | null,
  timeline: FeatureTimeline | null,
): () => void {
  const context = canvas.getContext("2d");
  if (!context) return () => {};
  const world = new OrbitWorld(parameters);
  const clock = new FixedClock();
  let frame = 0;
  let previous = performance.now();
  const draw = (now: number) => {
    const elapsed = Math.max(0, (now - previous) / 1000);
    previous = now;
    if (!document.hidden) {
      if (pausedRef.current) clock.discard();
      else if (audio && timeline) {
        const target = Math.floor(
          Math.min(audio.currentTime, timeline.duration) / FIXED_DT,
        );
        for (let count = 0; world.ticks < target && count < 2400; count++)
          world.step(featureAt(timeline, world.time));
        if (audio.ended && world.ticks >= target)
          clock.advance(elapsed, () => world.step(SILENCE));
      } else
        clock.advance(elapsed, () => world.step(syntheticForcing(world.time)));
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.floor(rect.width * pixelRatio));
      const height = Math.max(1, Math.floor(rect.height * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      context.fillStyle = "#080c11";
      context.fillRect(0, 0, width, height);
      const scale = Math.min(width, height) / (2 * viewRef.current.extent);
      const samples = Math.min(
        world.historyCount,
        Math.max(
          2,
          Math.floor(
            viewRef.current.traceSeconds / (FIXED_DT * HISTORY_STRIDE),
          ),
        ),
      );
      for (let age = samples - 1; age > 0; age--) {
        const older =
          (world.historyHead - age + HISTORY_CAPACITY) % HISTORY_CAPACITY;
        const newer = (older + 1) % HISTORY_CAPACITY;
        context.strokeStyle = `rgba(234,174,151,${(0.07 + 0.38 * (1 - age / samples)) * viewRef.current.exposure})`;
        context.beginPath();
        for (
          let particle = 0;
          particle < parameters.particleCount;
          particle++
        ) {
          const a = (older * parameters.particleCount + particle) * 2;
          const b = (newer * parameters.particleCount + particle) * 2;
          context.moveTo(
            width / 2 + world.history[a] * scale,
            height / 2 - world.history[a + 1] * scale,
          );
          context.lineTo(
            width / 2 + world.history[b] * scale,
            height / 2 - world.history[b + 1] * scale,
          );
        }
        context.stroke();
      }
      context.fillStyle = "#f0c6af";
      for (let particle = 0; particle < parameters.particleCount; particle++) {
        const x = width / 2 + world.positions[particle * 2] * scale;
        const y = height / 2 - world.positions[particle * 2 + 1] * scale;
        context.fillRect(x, y, 1.5 * pixelRatio, 1.5 * pixelRatio);
      }
    }
    frame = requestAnimationFrame(draw);
  };
  frame = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(frame);
}

export function OrbitalCanvas({
  parameters,
  view,
  paused,
  onError,
  audio,
  timeline,
  resetKey,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const viewRef = useRef(view);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: "low-power",
      });
    } catch {
      onError("");
      const fallback = document.createElement("canvas");
      fallback.className = "world";
      fallback.setAttribute("aria-hidden", "true");
      canvas.after(fallback);
      canvas.style.display = "none";
      const stop = startCanvasFallback(
        fallback,
        parameters,
        viewRef,
        pausedRef,
        audio,
        timeline,
      );
      return () => {
        stop();
        fallback.remove();
        canvas.style.display = "";
      };
    }
    onError("");
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor("#080c11");
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-4, 4, 4, -4, 0.1, 100);
    camera.position.z = 10;
    const world = new OrbitWorld(parameters);
    const clock = new FixedClock();
    const maxSegments = parameters.particleCount * (HISTORY_CAPACITY - 1);
    const segmentPositions = new Float32Array(maxSegments * 6);
    const segmentColors = new Float32Array(maxSegments * 6);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(segmentPositions, 3).setUsage(
        THREE.DynamicDrawUsage,
      ),
    );
    geometry.setAttribute(
      "color",
      new THREE.BufferAttribute(segmentColors, 3).setUsage(
        THREE.DynamicDrawUsage,
      ),
    );
    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const trails = new THREE.LineSegments(geometry, material);
    trails.frustumCulled = false;
    scene.add(trails);
    const tipPositions = new Float32Array(parameters.particleCount * 3);
    const tipGeometry = new THREE.BufferGeometry();
    tipGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(tipPositions, 3).setUsage(
        THREE.DynamicDrawUsage,
      ),
    );
    const tipMaterial = new THREE.PointsMaterial({
      color: "#e8af9b",
      size: 1.5,
      sizeAttenuation: false,
      transparent: true,
      depthWrite: false,
    });
    const tips = new THREE.Points(tipGeometry, tipMaterial);
    tips.frustumCulled = false;
    scene.add(tips);

    let aspect = 1;
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      aspect = Math.max(1, width) / Math.max(1, height);
      renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    let contextLost = false;
    const loseContext = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      onError("Graphics context lost. Reload to restart the study.");
    };
    canvas.addEventListener("webglcontextlost", loseContext);
    let frame = 0;
    let previous = performance.now();

    const animate = (now: number) => {
      const elapsed = Math.max(0, (now - previous) / 1000);
      previous = now;
      if (!document.hidden && !contextLost) {
        if (pausedRef.current) clock.discard();
        else if (audio && timeline) {
          // Playback time owns the target tick. Never skip model state on a seek.
          const target = Math.floor(
            Math.min(audio.currentTime, timeline.duration) / FIXED_DT,
          );
          let steps = 0;
          while (world.ticks < target && steps < 2400) {
            world.step(featureAt(timeline, world.time));
            steps++;
          }
          if (audio.ended && world.ticks >= target)
            clock.advance(elapsed, () => world.step(SILENCE));
        } else
          clock.advance(elapsed, () =>
            world.step(syntheticForcing(world.time)),
          );
        const currentView = viewRef.current;
        const samples = Math.min(
          world.historyCount,
          Math.max(
            2,
            Math.floor(currentView.traceSeconds / (FIXED_DT * HISTORY_STRIDE)),
          ),
        );
        let cursor = 0;
        for (let age = samples - 1; age > 0; age--) {
          const older =
            (world.historyHead - age + HISTORY_CAPACITY) % HISTORY_CAPACITY;
          const newer = (older + 1) % HISTORY_CAPACITY;
          const brightness = 0.08 + 0.5 * (1 - age / samples);
          for (
            let particle = 0;
            particle < parameters.particleCount;
            particle++
          ) {
            const a = (older * parameters.particleCount + particle) * 2;
            const b = (newer * parameters.particleCount + particle) * 2;
            segmentPositions[cursor] = world.history[a];
            segmentPositions[cursor + 1] = world.history[a + 1];
            segmentPositions[cursor + 2] = 0;
            segmentPositions[cursor + 3] = world.history[b];
            segmentPositions[cursor + 4] = world.history[b + 1];
            segmentPositions[cursor + 5] = 0;
            for (let end = 0; end < 2; end++) {
              segmentColors[cursor + end * 3] = brightness;
              segmentColors[cursor + end * 3 + 1] = brightness * 0.81;
              segmentColors[cursor + end * 3 + 2] = brightness * 0.76;
            }
            cursor += 6;
          }
        }
        geometry.setDrawRange(0, cursor / 3);
        geometry.getAttribute("position").needsUpdate = true;
        geometry.getAttribute("color").needsUpdate = true;
        for (let i = 0; i < parameters.particleCount; i++) {
          tipPositions[i * 3] = world.positions[i * 2];
          tipPositions[i * 3 + 1] = world.positions[i * 2 + 1];
          tipPositions[i * 3 + 2] = 0;
        }
        tipGeometry.getAttribute("position").needsUpdate = true;
        material.opacity = currentView.exposure;
        tipMaterial.opacity = Math.min(1, currentView.exposure + 0.2);
        camera.left = -currentView.extent * aspect;
        camera.right = currentView.extent * aspect;
        camera.top = currentView.extent;
        camera.bottom = -currentView.extent;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      } else {
        clock.discard();
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", loseContext);
      geometry.dispose();
      material.dispose();
      tipGeometry.dispose();
      tipMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, [parameters, onError, audio, timeline, resetKey]);

  return (
    <canvas
      className="world"
      ref={canvasRef}
      aria-label="Orbital trajectories. A local recording changes particle momentum when loaded."
    />
  );
}
