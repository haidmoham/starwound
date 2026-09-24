# Starwound: agent operating contract

The owner's `starwound.x.dev` shorthand means mirror deployment to `starwound.shin86.dev` and `starwound.mhaider.dev`. Verify each host separately.

Read `README.md`, `docs/brief.md`, `docs/architecture.md`, and the assigned issue before coding.

## Preserve the actual project

- The thesis is **life**. Science + generative processes + music are invariant; a particular model, organism, camera, or visual style is not.
- Keep the existing React + TypeScript + Vite + Three.js + plain CSS + npm stack. No framework migration, backend, credentials, paid API, or monorepo without a concrete need.
- This is an art instrument, not a dashboard, equalizer, product landing page, or a particle preset gallery. Black, negative space, deliberate typography, and restrained motion are starting constraints, not substitutes for composition.
- Musical influence must change a modeled process. Renderer-only pulsing is not the primary mechanism. Immediate gestures are allowed when their consequences persist in the world.
- Scientific approximations must be named. Do not call softened Newtonian motion general relativity, a framebuffer warp gravitational lensing, or fading trails causal memory.
- Never bundle commercial recordings, movie assets, or paid fonts. Use user-selected local audio and small generated test fixtures. Verify licensing before copying third-party code.

## Engineering

- Keep forcing, simulation state, history, and rendering separate. React owns controls and lifecycle, not per-particle state or simulation ticks.
- Keep fixed simulation steps, seeded randomness, bounded buffers, explicit units, and reset semantics. Do not use `Math.random()` inside the model.
- Current `FixedClock` is a wall-time preview clock which drops long frames. It MUST NOT become the audio synchronization authority unchanged.
- Controls affecting initial conditions currently restart the study. Clearly distinguish them from live observer controls. Live simulation changes later need a recorded event timeline for replay.
- Implement one compelling vertical slice before adding a plugin framework, generic ECS, distributed workers, GPU compute, or more simulation families. Profile before choosing complexity.
- Dispose GPU/audio resources, object URLs, animation frames, event listeners, and workers. Respect reduced motion, tab visibility, pause, and keyboard access.
- For parallel work, use separate branches/worktrees and non-overlapping ownership. Do not change sibling repositories. Never force-push over unrelated work.

## Verification

- Bootstrap: `npm install`, commit the generated lockfile, then use `npm ci` in CI and development verification.
- Run `npm run check` and `npm run build`. Add a browser smoke test and actually inspect the composition at desktop and narrow widths.
- Test same seed + same forcing + same control events, silence, shuffled forcing, and the same passage after different histories.
- Report exactly what ran. Model tests are not browser verification; a successful build is not a visual or musical evaluation. Never invent screenshots, performance figures, or recording-specific conclusions.
- Update `docs/verification.md` and the issue with results and remaining blockers.
