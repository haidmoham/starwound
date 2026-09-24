# Architecture and model contract

## Stack lineage

The frontend baseline was read from `haidmoham/seaglass/package.json` on 2026-09-24: React 19, TypeScript, Vite 8, Three.js, Oxlint, npm, Node/tsx tests, and ordinary CSS. `soundspace/package.json` also confirmed npm and Oxlint. Versions in this scaffold follow Seaglass's manifest; registry installation was blocked in the setup environment. No package compatibility or production-build result is implied by copying them.

We have not copied Seaglass's backend, search integration, or repository-local anti-slop lint plugin. The baseline Oxlint configuration is intentionally standalone.

## Implemented boundaries

```text
src/core/forcing.ts  synthetic normalized input -> bounded external-drive strength
src/core/orbit.ts    fixed-step world state + bounded trajectory history
src/core/clock.ts    wall-clock preview -> fixed tick requests
src/render/         world/history -> Three.js buffers + observer controls
src/App.tsx         React controls, restart, pause, errors, presentation
```

Core modules do not import React, Three.js, DOM APIs, or audio APIs. The renderer cannot rewrite the world's coordinates to make a beat visible. Typed arrays and GPU resources have bounded allocation. Rendering settings are held separately from model parameters.

## Seed model

Coordinates and time are dimensionless. Particles move in a plane; Three.js presents them in an orthographic view. There is one fixed attractor, `mu = 1`, with softening `epsilon = 0.12`:

```text
a_gravity(r) = -mu * r / (|r|^2 + epsilon^2)^(3/2)
Phi(r)      = -mu / sqrt(|r|^2 + epsilon^2)
```

A seeded narrow arc supplies initial positions. The angular-momentum control multiplies the local softened circular speed; it is a dimensionless speed factor, not an absolute conserved angular-momentum value. Dispersion introduces bounded initial velocity variation.

The current external drive points in +y and has a Gaussian spatial envelope centered at `(1.2, 0)`. Its amplitude is `receptivity * (0.012 * energy + 0.08 * onset)`. These coefficients are authored choices, not measured astrophysical constants. The synthetic `onset` value is an envelope, not a discrete physical impulse. Drive is held constant over each tick.

Integration is kick-drift-kick at 120 Hz. Energy conservation applies to the unforced softened model, not to the externally driven scene. The included aggregate-energy check is a smoke test, not a general error-bound proof. Convergence, angular momentum, extreme configurations, and long-run behavior need additional validation as the model expands.

## History and clocks

The ring buffer stores 128 samples at one sample per eight ticks: roughly 8.5 simulated seconds of recent trajectories. It is NOT a whole-recording archive. Current positions/velocities carry dynamical state; fading/displayed trails do not exert forces. No ecological scarring or irreversible material change is implemented.

`FixedClock` caps a wall frame at 100 ms and discards paused/hidden-tab partial time. That keeps the synthetic preview bounded. It deliberately loses wall time on long frames and is unsuitable as an audio-master clock.

The audio slice must use an explicit transport with simulation tick targets derived from the authoritative playback time. Define behavior for pause, resume, hidden tabs, seeking, and end-of-track. A seek must restore a checkpoint and replay, or restart/replay; it must not set only `world.time` while leaving the state unchanged. At the end, stop external musical input while allowing already-started dynamics to continue when exhibition mode calls for it.

## Next vertical slice

1. Local audio selection, decode/analysis, and playback. No upload or streaming credentials.
2. Deterministic feature timeline (minimum: energy and onset/novelty envelope), explicit normalization, and optional authored cues. Never relabel measured energy as inferred emotion.
3. Audio-master synchronization with the existing pure model and bounded input coupling.
4. Known-interesting presets and reproducible experiments. Store model/version, seed, analysis settings, recording fingerprint, cue/control timeline, and observer settings. Do not store private audio in exported presets.
5. Save/reload configurations, then complete checkpoints (positions, velocities, tick, history, relevant RNG state) and still exports. Seeds alone do not reconstruct live-edited sessions.
6. Profile on actual hardware; only then consider workers, instanced trail meshes, GPU simulation, or a new scientific family.

## Deployment

`vercel.json` describes a static Vite build producing `dist/`. No Vercel project, domain, secrets, or deployment was created by this setup. CI checks only; it does not deploy. CI temporarily runs `npm install` until Codex commits a real lockfile, then must switch to `npm ci`.
