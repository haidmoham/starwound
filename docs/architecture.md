# Architecture and model contract

## Boundaries

```text
src/core/forcing.ts             deterministic autonomous drive
src/core/orbit.ts               seeded fixed-step state and bounded history
src/core/clock.ts               wall-time preview to fixed tick requests
src/render/OrbitalCanvas.tsx    modeled trajectories, WebGL and Canvas 2D
src/render/RuptureBackdrop.tsx  authored projected field and ejecta
src/YouTubeMini.tsx             independent, optional YouTube dock
src/App.tsx                     entrance, controls, lifecycle, still export
```

The YouTube URL becomes an embed ID only. It is never passed to the model, forcing function, clock, or renderers. No audio analysis, file upload, or media synchronization exists. The renderer keeps its world instance when the CSS stage changes from framed to immersive.

## Model

Coordinates and time are dimensionless. Particles move in a plane around one fixed attractor, with `mu = 1` and softening `epsilon = 0.12`:

```text
a_gravity(r) = -mu * r / (|r|² + epsilon²)^(3/2)
Phi(r)      = -mu / sqrt(|r|² + epsilon²)
```

A seeded narrow arc supplies initial positions. The momentum control is a multiplier on local softened circular speed, not absolute angular momentum. Dispersion adds bounded initial velocity variation. The autonomous external drive points in +y and has a Gaussian envelope near `(1.2, 0)`. It is an authored perturbation, not a measurement from a song or video.

Integration uses kick-drift-kick at 120 Hz. The history ring holds 128 samples at one sample per eight ticks, roughly 8.5 simulated seconds. Recent trajectory history is visual evidence of state; it does not exert force. Every scene opens after three deterministic seconds of model evolution so the first frame has structure. A reset returns to that opening state.

`FixedClock` caps a wall frame at 100 ms and drops paused or hidden-tab partial time. This bounds preview catch-up. It is not an exact real-time physical clock. Seed, initial conditions, and autonomous forcing determine replay; view controls change observation without restarting the world.

## Projection and materials

WebGL lines and Canvas 2D fallback use the same orthographic projection: vertical factor `0.59` followed by a `0.33` world-space rotation, equivalent to `-0.33` in the backdrop canvas's downward-y coordinates. The starfield, incandescent annulus, and ejecta are drawn procedurally with a seeded random generator. Their slow phase is paused with the model and held still under reduced motion. They are authored presentation, not gravitational lensing, an accretion-fluid solver, or general relativity.

The framed and immersive layouts share the same mounted canvas. Resize observers update pixels and cameras without recreating model state. WebGL buffers, geometries, materials, animation frames, and observers are disposed on teardown. Still export composites the authored backdrop and the visible trajectory canvas.

## Release

`vercel.json` owns the static Vite build and routing. GitHub `main` is the Vercel production branch. The two mirrored custom domains have separate DNS and TLS verification. `index.html` revalidates; hashed assets are immutable. See [verification.md](verification.md) for observed results.
