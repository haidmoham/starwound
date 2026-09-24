# Starwound

An interstellar generative-art installation for the browser. A deterministic softened-Newtonian particle world keeps moving without sound. Its trajectories pass through an authored field of projected light, rupture, and debris.

The entrance accepts any YouTube video link, or no link. The video plays in a small movable dock beside the artwork. It does not drive the model or renderer. The scene is an installation, not an audio visualizer.

## Experience

The opening presents one framed study in a quiet gallery space. Entering expands that same running world to the viewport. The `fall`, `shear`, and `eject` studies change initial conditions and restart the world. Freeze, restart, still export, and a small tuning sheet remain available. The YouTube dock accepts watch, short, live, embed, and `youtu.be` links; a video can forbid embedding, in which case the dock offers an ordinary YouTube link.

The orbital trajectories come from seeded test particles around one fixed softened attractor with a bounded autonomous external drive. The tilted incandescent annulus and black center are authored presentation. They are not general relativity, an accretion simulation, or gravitational lensing. The drawn rupture evolves slowly; freeze stops both the world and that presentation motion.

## Development

React, TypeScript, Vite, Three.js, plain CSS, and npm. No backend, credentials, media upload, or paid service is required.

```sh
npm ci
npm run dev
npm run check
npm run build
```

WebGL draws the trajectories when available; Canvas 2D is the fallback. Both use the same projected geometry. The artwork respects reduced motion and pauses when the tab is hidden. The `starwound.x.dev` shorthand means mirrored release to `starwound.shin86.dev` and `starwound.mhaider.dev`.

## Project notes

- [AGENTS.md](AGENTS.md): current operating contract.
- [docs/brief.md](docs/brief.md): art direction and source transformations.
- [docs/architecture.md](docs/architecture.md): model and rendering boundaries.
- [docs/verification.md](docs/verification.md): observed checks and release evidence.

The first release explored local audio forcing. The owner's later direction explicitly removed audio reactivity. Historical checks remain in the verification ledger; the current experience has no local audio ingestion. No commercial recording, film footage, paid font, or third-party artwork is bundled.
