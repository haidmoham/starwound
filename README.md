# Starwound

An interstellar generative-art installation for the browser. It opens directly on a dying, wounded star, with a distant last point of light across a severe black field. A deterministic softened-Newtonian particle world keeps moving without sound. Modeled outward crossings bring a brief flare; sparse marks remain as the work settles into a changed quiet.

There is no entry gate or media companion. The work is autonomous generative art, with no music input or reactivity.

## Experience

The full-viewport field is present immediately. The `fall`, `shear`, and `eject` studies change initial conditions and restart the world. Freeze, restart, still export, and a small tuning sheet remain available. A wounded ember is visible from the first frame; a modeled departure drives the temporary violence. The distant point and event scars hold the theme of distance in the quieter passages.

The orbital trajectories come from seeded test particles around one fixed softened attractor with a bounded autonomous external drive. Crossings of a compositional radius are departures, not a claim of gravitational escape. The luminous star, its black wound, its corona, and the far point of light are authored presentation, not simulated plasma or general relativity. The flare and scars follow the world's seeded event history; restart replays both together.

## Development

React, TypeScript, Vite, Three.js, plain CSS, and npm. No backend, credentials, media upload, or paid service is required.

```sh
npm ci
npm run dev
npm run check
npm run build
```

WebGL draws the trajectories when available; Canvas 2D is the fallback, including after a lost WebGL context. Both read the same world and event history. Drawing density adapts to sustained frame times without changing simulation ticks or events. The artwork respects reduced motion and pauses when the tab is hidden. Add `?profile=1` to expose rolling frame statistics in `document.documentElement.dataset.starwoundProfile` for diagnostics. The `starwound.x.dev` shorthand means mirrored release to `starwound.shin86.dev` and `starwound.mhaider.dev`.

## Project notes

- [AGENTS.md](AGENTS.md): current operating contract.
- [docs/brief.md](docs/brief.md): art direction and source transformations.
- [docs/architecture.md](docs/architecture.md): model and rendering boundaries.
- [docs/verification.md](docs/verification.md): observed checks and release evidence.

The first release explored local audio forcing. The owner's later direction explicitly removed audio reactivity. Historical checks remain in the verification ledger; the current experience has no local audio ingestion. No commercial recording, film footage, paid font, or third-party artwork is bundled.
