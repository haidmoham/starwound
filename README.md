# Starwound

**Life, expressed through scientific models and music.**

A browser-based generative-art instrument. Music changes the conditions of a simulated world; the world evolves under its own rules; an authored observer makes its history visible.

Inspired by *Nabokov* by Fontaines D.C. and *Interstellar*. These are artistic references, not bundled assets or claims of affiliation.

## Invariant

Science + generative processes + music. Physics, biology, chemistry, typography, and visual treatment are variables, not a commitment to one universal simulator. The thesis is life, not a spectrum analyzer.

## Stack

Matches the neighboring `haidmoham/seaglass` frontend: React, TypeScript, Vite, Three.js, plain CSS, npm, Oxlint, and Node/tsx tests. Vercel-compatible static output. No backend, credentials, paid services, or music-platform integration are required.

## Development

Use Node 22.12+ (22.x recommended).

```sh
npm install
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

`npm run preview` serves the production build. Dependency versions follow Seaglass's checked-in manifest; a lockfile must be generated and committed in a registry-enabled environment before changing CI to `npm ci`.

## Scaffold status

The initial scaffold provides an orbital study driven by an explicitly labeled **synthetic fixture**, seeded state, a fixed simulation timestep, bounded trajectory history, controls, a Three.js renderer, and model tests. It is not yet the finished music-driven artwork.

Actual audio loading/analysis, transport synchronization, reproducible musical auditions, preset/checkpoint export, scientific validation beyond the seed model, and finished art direction belong to the Codex handoff issue. Do not mistake synthetic forcing for analysis of *Nabokov*.

The seed model is softened Newtonian test-particle motion around one fixed attractor with a localized external drive. It is not general relativity, a self-gravitating N-body model, an accretion fluid, or gravitational lensing. Trail history is a rendering record, not a field that exerts forces.

## Read first

- [`AGENTS.md`](AGENTS.md): operating contract for coding agents.
- [`docs/brief.md`](docs/brief.md): thesis, aesthetic direction, and scope.
- [`docs/architecture.md`](docs/architecture.md): implemented boundaries and extension points.
- [`docs/prior-art.md`](docs/prior-art.md): starting references and reuse cautions.
- [`docs/verification.md`](docs/verification.md): what was actually checked.

No commercial recording, movie footage, paid font, or third-party implementation is included. Source links are references, not permission to copy their contents.
