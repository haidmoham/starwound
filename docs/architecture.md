# Architecture and model contract

## Boundaries

```text
src/core/forcing.ts             deterministic autonomous drive
src/core/orbit.ts               seeded fixed-step state and bounded history
src/core/clock.ts               wall-time preview to fixed tick requests
src/core/installation.ts        one world, departure history, and composition envelope
src/core/quality.ts             frame-time statistics and drawing-detail adaptation
src/render/OrbitalCanvas.tsx    modeled trajectories, WebGL and Canvas 2D
src/render/RuptureBackdrop.tsx  authored projected field and ejecta
src/YouTubeMini.tsx             independent, optional YouTube dock
src/App.tsx                     entrance, controls, lifecycle, still export
```

The YouTube URL becomes an embed ID only. It is never passed to the model, forcing function, clock, or renderers. No audio analysis, file upload, or media synchronization exists. The renderer keeps its world instance when the CSS stage changes from framed to immersive. Both renderer paths and the authored backdrop read one `Installation` object. Only the trajectory renderer advances its clock; the backdrop reads the world's logical time and event history.

## Model

Coordinates and time are dimensionless. Particles move in a plane around one fixed attractor, with `mu = 1` and softening `epsilon = 0.12`:

```text
a_gravity(r) = -mu * r / (|r|² + epsilon²)^(3/2)
Phi(r)      = -mu / sqrt(|r|² + epsilon²)
```

A seeded narrow arc supplies initial positions. The momentum control is a multiplier on local softened circular speed, not absolute angular momentum. Dispersion adds bounded initial velocity variation. The autonomous external drive points in +y and has a Gaussian envelope near `(1.2, 0)`. It is an authored perturbation, not a measurement from a song or video.

Integration uses kick-drift-kick at 120 Hz. The history ring holds 128 samples at one sample per eight ticks, roughly 8.5 simulated seconds. Recent trajectory history is visual evidence of state; it does not exert force. The installation now starts at tick zero, in a near-void. An outward crossing of radius 2 (dimensionless model units) records a bounded departure event with particle, tick, position, and velocity. Departures are spaced by at least 1.4 simulated seconds and capped at 40. They are not claims of positive orbital energy or gravitational escape. The first event opens the rupture no earlier than five seconds; a 20-second authored fallback preserves a complete arc for unusual tunings with no crossing. A reset creates a new installation, returning the world, event marks, and backdrop time to the same opening.

`FixedClock` caps a wall frame at 100 ms and drops paused or hidden-tab partial time. This bounds preview catch-up. It is not an exact real-time physical clock. Seed, initial conditions, and autonomous forcing determine replay; view controls change observation without restarting the world.

## Projection and materials

WebGL lines and Canvas 2D fallback use the same orthographic projection: vertical factor `0.59` followed by a `0.33` world-space rotation, equivalent to `-0.33` in the backdrop canvas's downward-y coordinates. The starfield, incandescent annulus, and ejecta are drawn procedurally with a seeded random generator. Their slow phase is paused with the model and held still under reduced motion. They are authored presentation, not gravitational lensing, an accretion-fluid solver, or general relativity.

The framed and immersive layouts share the same mounted canvas. Resize observers update pixels and cameras without recreating model state. WebGL buffers, geometries, materials, animation frames, and observers are disposed on teardown. If WebGL fails at startup or loses its context later, a Canvas 2D renderer takes over the same installation state. Still export composites the authored backdrop and the visible trajectory canvas.

The adaptive budget records 120 visible frame intervals and CPU drawing durations at a time. It lowers detail after two sustained slow windows and raises it after three fast windows, with hysteresis. It changes star, ring, ejecta, sample, and pixel density only; `OrbitWorld.step` and departure detection are unchanged. Hidden-tab or debugger stalls above 150 ms are excluded from the adaptation sample and counted diagnostically. `?profile=1` exposes rolling mean, p90, p99, maximum interval, and p95 draw time through a DOM dataset for browser QA. A cloud-browser measurement is not evidence of phone performance.

## Release

`vercel.json` owns the static Vite build and routing. GitHub `main` is the Vercel production branch. The two mirrored custom domains have separate DNS and TLS verification. `index.html` revalidates; hashed assets are immutable. See [verification.md](verification.md) for observed results.
