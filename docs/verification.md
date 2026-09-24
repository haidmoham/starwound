# Verification ledger

## V1 local pass — 2026-09-24

- `npm install --no-audit --no-fund` generated `package-lock.json`; CI now uses `npm ci`.
- `npm run check`: TypeScript, Oxlint, and 12 core tests passed.
- `npm run build`: passed. Vite reported a 766 kB JavaScript chunk warning; this is a size warning, not a build failure.
- Browser at `http://127.0.0.1:5173/`: inspected 1280×633 and 390×844 screenshots. No horizontal overflow at 390 px. The browser lacked WebGL, so Canvas 2D fallback showed the orbital trajectories.
- Uploaded a generated four-second WAV fixture. The UI changed to `your recording`; playback time advanced to 2.58 s, and restart paused audio at 0 s. The YouTube dock opened at 390 px; playback of an external video was not verified.
- The browser pass does not establish performance or appearance on a physical phone or a hardware WebGL browser. No commercial recording was tested.

## Initial setup — 2026-09-24

### Hosted CI: passed

[GitHub Actions run 36030523441](https://github.com/haidmoham/starwound/actions/runs/36030523441) completed successfully on scaffold commit `1b051ea7fcc79df6f69fa99eedcecff91585517b`.

The `check` job and its individual steps were read back through GitHub. These all completed successfully:

- `npm install --no-audit --no-fund`
- `npm run check` (TypeScript typecheck, Oxlint, and Node/tsx tests)
- `npm run build` (TypeScript typecheck and Vite production build)

This validates the declared frontend dependency combination and build in the GitHub runner. It does not constitute a browser screenshot, musical evaluation, real-device performance measurement, or deployment. CI's generated lockfile was not committed or uploaded as an artifact; generating and committing the lockfile remains work for Codex.

### Additional checks executed in the setup container

- Eleven core tests via `node --experimental-strip-types --test src/core/orbit.test.ts` on Node v22.16.0.
- Syntax transpilation of all nine TypeScript/TSX files using installed TypeScript 5.8.3.
- Strict standalone typecheck of the four pure core modules:

```sh
tsc --noEmit --strict --target ES2022 --module ESNext \
  --moduleResolution Bundler --allowImportingTsExtensions \
  src/core/clock.ts src/core/random.ts src/core/forcing.ts src/core/orbit.ts
```

Tests cover seeded replay, distinct seeds, 30/60 Hz fixed-step equivalence, ongoing motion in silence, consequential forcing, zero coupling, an unforced aggregate-energy drift bound, finite state, bounded history allocation, invalid inputs, and bounded preview catch-up.

The published Git blob hashes for the package manifest, simulation, model tests, App, and renderer were compared with the local files and matched.

### Local environment limitation

The setup container could not resolve `registry.npmjs.org`; local package-install attempts timed out. No full local frontend install/build is claimed. The separate hosted CI result above supplies the dependency/build verification that the container could not perform.

### Still unverified or not implemented

- Browser rendering, actual art direction, accessibility, responsiveness, WebGL cleanup, and real-device performance.
- Real audio loading, feature analysis, playback synchronization, and recording-specific evaluation: no audio subsystem exists yet.
- Committed dependency lockfile and lockfile-based CI (`npm ci`).
- Preset/checkpoint round trips, complete performance replay, and art-only exports.
- No Vercel project, deployment, domain, or secrets were created.

Codex should generate and commit `package-lock.json`, switch CI to `npm ci`, reproduce the checks, inspect the actual browser output, and complete issue #1. Record exact commands and observed outcomes as work progresses.
