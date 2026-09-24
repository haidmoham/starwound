# Starwound: agent operating contract

The owner's `starwound.x.dev` shorthand means mirror deployment to `starwound.shin86.dev` and `starwound.mhaider.dev`. Verify each host separately.

Read `README.md`, `docs/brief.md`, `docs/architecture.md`, and the assigned issue before coding.

## Preserve the actual project

- The current work is an interstellar physics and generative-art installation. A YouTube link is the optional entrance gesture and playback companion. Video and audio never drive the scene.
- Keep the existing React + TypeScript + Vite + Three.js + plain CSS + npm stack. No framework migration, backend, credentials, paid API, or monorepo without a concrete need.
- This is an art installation in the browser, not a dashboard, equalizer, visualizer, product landing page, or particle preset gallery. The framed exhibit and full-field view must privilege the artwork over controls.
- The world evolves autonomously through a deterministic model. Playback must stay independent of forcing, simulation time, and rendering. Immediate gestures are allowed when their consequences persist in the world.
- Scientific approximations must be named. Do not call softened Newtonian motion general relativity, a framebuffer warp gravitational lensing, or fading trails causal memory.
- Never bundle commercial recordings, movie assets, or paid fonts. Accept only user-selected YouTube links for the companion. Verify licensing before copying third-party code.

## Engineering

- Keep forcing, simulation state, history, and rendering separate. React owns controls and lifecycle, not per-particle state or simulation ticks.
- Keep fixed simulation steps, seeded randomness, bounded buffers, explicit units, and reset semantics. Do not use `Math.random()` inside the model.
- `FixedClock` is a wall-time preview clock which drops long frames. It is the autonomous world's presentation clock, not a media transport.
- Controls affecting initial conditions currently restart the study. Clearly distinguish them from live observer controls. Live simulation changes later need a recorded event timeline for replay.
- Implement one compelling vertical slice before adding a plugin framework, generic ECS, distributed workers, GPU compute, or more simulation families. Profile before choosing complexity.
- Dispose GPU resources, animation frames, event listeners, and observers. Respect reduced motion, tab visibility, pause, and keyboard access.
- For parallel work, use separate branches/worktrees and non-overlapping ownership. Do not change sibling repositories. Never force-push over unrelated work.

## Verification

- Bootstrap: `npm install`, commit the generated lockfile, then use `npm ci` in CI and development verification.
- Run `npm run check` and `npm run build`. Add a browser smoke test and actually inspect the composition at desktop and narrow widths.
- Test same seed + same autonomous forcing, silence, and changed initial conditions. Verify that YouTube playback has no connection to the model.
- Report exactly what ran. Model tests are not browser verification; a successful build is not a visual evaluation. Never invent screenshots or performance figures.
- Update `docs/verification.md` and the issue with results and remaining blockers.
