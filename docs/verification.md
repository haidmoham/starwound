# Verification ledger

## Initial setup — 2026-09-24

### Executed successfully

- Eleven core tests via `node --experimental-strip-types --test src/core/orbit.test.ts` on Node v22.16.0.
- Syntax transpilation of all nine TypeScript/TSX files using the installed TypeScript 5.8.3; this is not a dependency-aware typecheck or build.
- Strict standalone typecheck of `clock.ts`, `random.ts`, `forcing.ts`, and `orbit.ts` using the environment's installed TypeScript 5.8.3:

```sh
tsc --noEmit --strict --target ES2022 --module ESNext \
  --moduleResolution Bundler --allowImportingTsExtensions \
  src/core/clock.ts src/core/random.ts src/core/forcing.ts src/core/orbit.ts
```

Tests cover seeded replay, distinct seeds, 30/60 Hz fixed-step equivalence, ongoing motion in silence, consequential forcing, zero coupling, an unforced aggregate-energy drift bound, finite state, bounded history allocation, invalid inputs, and bounded preview catch-up.

### Not verified here

The container could not resolve `registry.npmjs.org`; package installation could not complete. Consequently:

- No package lockfile was fabricated or copied from an incompatible project.
- The checked-in TypeScript 7 / React / Vite / Three.js dependency combination has not been installed here.
- `npm run check`, `npm test` through tsx, `npm run build`, and Oxlint were not executed with the repository's declared toolchain.
- React/Three.js integration, browser rendering, accessibility, responsiveness, WebGL cleanup, and real-device performance remain unverified.
- No actual recording was loaded or evaluated; no audio subsystem exists yet.
- No deployment or successful hosted CI run is asserted.

Codex's first step is dependency resolution, committing `package-lock.json`, switching CI to `npm ci`, running all declared checks, and inspecting the actual browser output. Update this ledger with commands and observed outcomes, not inferred success.
