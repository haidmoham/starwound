import { useEffect, useRef } from "react";
import * as THREE from "three";
import { FIXED_DT, FixedClock } from "../core/clock.ts";
import { Installation } from "../core/installation.ts";
import { HISTORY_CAPACITY, HISTORY_STRIDE } from "../core/orbit.ts";

// Canvas has a downward y axis, so this is the opposite sign of the backdrop's rotation.
const PROJECTION_ANGLE = 0.33;
const PROJECTION_HEIGHT = 0.59;
const PROJECTION_COS = Math.cos(PROJECTION_ANGLE);
const PROJECTION_SIN = Math.sin(PROJECTION_ANGLE);

export interface ViewParameters {
  exposure: number;
  extent: number;
  traceSeconds: number;
}

interface Props {
  installation: Installation;
  view: Readonly<ViewParameters>;
  paused: boolean;
  onError: (message: string) => void;
}

function startCanvasFallback(
  canvas: HTMLCanvasElement,
  installation: Installation,
  viewRef: React.RefObject<Readonly<ViewParameters>>,
  pausedRef: React.RefObject<boolean>,
): () => void {
  const context = canvas.getContext("2d");
  if (!context) return () => {};
  const world = installation.world;
  const parameters = world.parameters;
  const clock = new FixedClock();
  const profiling = new URLSearchParams(window.location.search).has("profile");
  let lastProfile = installation.budget.stats;
  let frame = 0;
  let previous = performance.now();
  const draw = (now: number) => {
    const workStart = performance.now();
    const elapsed = Math.max(0, (now - previous) / 1000);
    previous = now;
    if (!document.hidden) {
      if (pausedRef.current) clock.discard();
      else clock.advance(elapsed, () => installation.step());
      canvas.style.opacity = String(installation.scene().trajectoryOpacity);
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.floor(rect.width * pixelRatio));
      const height = Math.max(1, Math.floor(rect.height * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      context.clearRect(0, 0, width, height);
      const scale = Math.min(width, height) / (2 * viewRef.current.extent);
      const project = (x: number, y: number): [number, number] => {
        const projectedY = y * PROJECTION_HEIGHT;
        const rotatedX = PROJECTION_COS * x - PROJECTION_SIN * projectedY;
        const rotatedY = PROJECTION_SIN * x + PROJECTION_COS * projectedY;
        return [width / 2 + rotatedX * scale, height / 2 - rotatedY * scale];
      };
      const samples = Math.min(
        world.historyCount,
        Math.max(
          2,
          Math.floor(
            viewRef.current.traceSeconds / (FIXED_DT * HISTORY_STRIDE),
          ),
        ),
      );
      const particleStride = installation.budget.detail === 0 ? 2 : 1;
      const historyStride = installation.budget.detail === 0 ? 2 : 1;
      for (let age = samples - 1; age > 0; age -= historyStride) {
        const older =
          (world.historyHead - age + HISTORY_CAPACITY) % HISTORY_CAPACITY;
        const newer = (older + 1) % HISTORY_CAPACITY;
        context.strokeStyle = `rgba(255,223,198,${(0.08 + 0.66 * (1 - age / samples)) * viewRef.current.exposure})`;
        context.beginPath();
        for (
          let particle = 0;
          particle < parameters.particleCount;
          particle += particleStride
        ) {
          const a = (older * parameters.particleCount + particle) * 2;
          const b = (newer * parameters.particleCount + particle) * 2;
          const start = project(world.history[a], world.history[a + 1]);
          const end = project(world.history[b], world.history[b + 1]);
          context.moveTo(start[0], start[1]);
          context.lineTo(end[0], end[1]);
        }
        context.stroke();
      }
      context.fillStyle = "#fff5e5";
      context.globalAlpha = Math.min(1, viewRef.current.exposure + 0.2);
      for (
        let particle = 0;
        particle < parameters.particleCount;
        particle += particleStride
      ) {
        const [x, y] = project(
          world.positions[particle * 2],
          world.positions[particle * 2 + 1],
        );
        context.fillRect(x, y, 1.5 * pixelRatio, 1.5 * pixelRatio);
      }
      context.globalAlpha = 1;
      installation.budget.record(elapsed * 1000, performance.now() - workStart);
      if (profiling && installation.budget.stats !== lastProfile) {
        lastProfile = installation.budget.stats;
        document.documentElement.dataset.starwoundProfile = JSON.stringify({
          renderer: "canvas2d",
          time: world.time,
          ...lastProfile,
        });
      }
    } else {
      clock.discard();
      installation.budget.discard();
    }
    frame = requestAnimationFrame(draw);
  };
  frame = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(frame);
}

export function OrbitalCanvas({ installation, view, paused, onError }: Props) {
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
        alpha: true,
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
        installation,
        viewRef,
        pausedRef,
      );
      return () => {
        stop();
        fallback.remove();
        canvas.style.display = "";
      };
    }
    onError("");
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-4, 4, 4, -4, 0.1, 100);
    camera.position.z = 10;
    const world = installation.world;
    const parameters = world.parameters;
    const clock = new FixedClock();
    const profiling = new URLSearchParams(window.location.search).has(
      "profile",
    );
    let lastProfile = installation.budget.stats;
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
    trails.scale.y = PROJECTION_HEIGHT;
    trails.rotation.z = PROJECTION_ANGLE;
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
      color: "#fff1dc",
      size: 1.5,
      sizeAttenuation: false,
      transparent: true,
      depthWrite: false,
    });
    const tips = new THREE.Points(tipGeometry, tipMaterial);
    tips.frustumCulled = false;
    tips.scale.y = PROJECTION_HEIGHT;
    tips.rotation.z = PROJECTION_ANGLE;
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
    let stopFallback: (() => void) | null = null;
    let fallbackCanvas: HTMLCanvasElement | null = null;
    const loseContext = (event: Event) => {
      event.preventDefault();
      if (contextLost) return;
      contextLost = true;
      fallbackCanvas = document.createElement("canvas");
      fallbackCanvas.className = "world";
      fallbackCanvas.setAttribute("aria-hidden", "true");
      canvas.after(fallbackCanvas);
      canvas.style.display = "none";
      stopFallback = startCanvasFallback(
        fallbackCanvas,
        installation,
        viewRef,
        pausedRef,
      );
      onError("");
    };
    canvas.addEventListener("webglcontextlost", loseContext);
    let frame = 0;
    let previous = performance.now();

    const animate = (now: number) => {
      const workStart = performance.now();
      const elapsed = Math.max(0, (now - previous) / 1000);
      previous = now;
      if (!document.hidden && !contextLost) {
        if (pausedRef.current) clock.discard();
        else clock.advance(elapsed, () => installation.step());
        const currentView = viewRef.current;
        const samples = Math.min(
          world.historyCount,
          Math.max(
            2,
            Math.floor(currentView.traceSeconds / (FIXED_DT * HISTORY_STRIDE)),
          ),
        );
        let cursor = 0;
        const particleStride = installation.budget.detail === 0 ? 2 : 1;
        const historyStride = installation.budget.detail === 0 ? 2 : 1;
        for (let age = samples - 1; age > 0; age -= historyStride) {
          const older =
            (world.historyHead - age + HISTORY_CAPACITY) % HISTORY_CAPACITY;
          const newer = (older + 1) % HISTORY_CAPACITY;
          const brightness = 0.08 + 0.5 * (1 - age / samples);
          for (
            let particle = 0;
            particle < parameters.particleCount;
            particle += particleStride
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
              segmentColors[cursor + end * 3 + 1] = brightness * 0.72;
              segmentColors[cursor + end * 3 + 2] = brightness * 0.56;
            }
            cursor += 6;
          }
        }
        geometry.setDrawRange(0, cursor / 3);
        geometry.getAttribute("position").needsUpdate = true;
        geometry.getAttribute("color").needsUpdate = true;
        let tipCount = 0;
        for (let i = 0; i < parameters.particleCount; i += particleStride) {
          tipPositions[tipCount * 3] = world.positions[i * 2];
          tipPositions[tipCount * 3 + 1] = world.positions[i * 2 + 1];
          tipPositions[tipCount * 3 + 2] = 0;
          tipCount++;
        }
        tipGeometry.getAttribute("position").needsUpdate = true;
        tipGeometry.setDrawRange(0, tipCount);
        const sceneState = installation.scene();
        material.opacity = currentView.exposure * sceneState.trajectoryOpacity;
        tipMaterial.opacity =
          Math.min(1, currentView.exposure + 0.2) *
          sceneState.trajectoryOpacity;
        const halfHeight = currentView.extent * Math.max(1, 1 / aspect);
        camera.left = -halfHeight * aspect;
        camera.right = halfHeight * aspect;
        camera.top = halfHeight;
        camera.bottom = -halfHeight;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
        installation.budget.record(
          elapsed * 1000,
          performance.now() - workStart,
        );
        if (profiling && installation.budget.stats !== lastProfile) {
          lastProfile = installation.budget.stats;
          document.documentElement.dataset.starwoundProfile = JSON.stringify({
            renderer: "webgl",
            time: world.time,
            ...lastProfile,
          });
        }
      } else {
        clock.discard();
        if (document.hidden) installation.budget.discard();
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", loseContext);
      stopFallback?.();
      fallbackCanvas?.remove();
      canvas.style.display = "";
      geometry.dispose();
      material.dispose();
      tipGeometry.dispose();
      tipMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, [installation, onError]);

  return (
    <canvas
      className="world"
      ref={canvasRef}
      aria-label="Autonomous orbital trajectories around a fixed softened attractor."
    />
  );
}
