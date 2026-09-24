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

`npm run preview` serves the production build. Use `npm ci` for a clean install from the checked-in lockfile.

## V1 experience

Open the study and watch the named synthetic preview, or choose a local audio file. The file stays in the browser. The app decodes it into 50 ms RMS energy and positive energy-change windows; those measurements alter a bounded external drive in the orbital model. Playback time is the simulation authority. Seeking is intentionally unavailable until state restoration exists. Pause, restart, file replacement, hidden-tab pause, and end-of-track silence are supported.

Three model presets offer different initial motion. The instrument exposes seed, momentum, dispersion, receptivity, and observer controls. A still export captures the visible renderer. The YouTube miniplayer accepts a video link as a separate listening companion. Its audio does not drive the model because YouTube embeds do not expose decoded samples to this page.

The site uses Canvas 2D when WebGL is unavailable. `starwound.x.dev` means mirrored release to `starwound.shin86.dev` and `starwound.mhaider.dev`.

## Scaffold history

The initial scaffold provided an orbital study driven by an explicitly labeled **synthetic fixture**, seeded state, a fixed simulation timestep, bounded trajectory history, controls, a Three.js renderer, and model tests.

Preset import/export, full checkpoints, and scientific validation beyond the seed model remain future work. Do not mistake synthetic forcing for analysis of *Nabokov*.

The seed model is softened Newtonian test-particle motion around one fixed attractor with a localized external drive. It is not general relativity, a self-gravitating N-body model, an accretion fluid, or gravitational lensing. Trail history is a rendering record, not a field that exerts forces.

## Read first

- [`AGENTS.md`](AGENTS.md): operating contract for coding agents.
- [`docs/brief.md`](docs/brief.md): thesis, aesthetic direction, and scope.
- [`docs/architecture.md`](docs/architecture.md): implemented boundaries and extension points.
- [`docs/prior-art.md`](docs/prior-art.md): starting references and reuse cautions.
- [`docs/verification.md`](docs/verification.md): what was actually checked.

No commercial recording, movie footage, paid font, or third-party implementation is included. Source links are references, not permission to copy their contents.
