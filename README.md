# Starwound

One wounded being in the void. It opens directly into motion with no artwork copy, menus, decorative framing, or audio picker. Purple bruising, charred matter, a brutal irregular gash, living filaments and root-born ejecta inhabit one fixed nucleus. A restrained camera drifts through the quiet field without disturbing the body's own anchor.

The entire public artwork is one Canvas 2D field. One seeded, fixed-step particle world and its autonomous drive feed the body's pressure, contraction, tearing and release. The anatomy is authored generative art, not a simulated biological organism or relativistic star. Reduced-motion preferences hold the image and camera still; hidden tabs suspend progression and resume without catch-up.

The quiet sound icon starts an original ominous ambient bed, generated locally with Web Audio. Sound is off until a deliberate click or keyboard activation, fades in gently, and can be muted with the same control. Hidden tabs suspend the sound too. No recording, external audio service or uploaded file is involved; the artwork remains complete in silence.

## Development

React, TypeScript, Vite, Canvas 2D and npm. The existing Three.js and local-media experiments remain in source history/modules but are not imported into the public experience. No backend, credentials, uploaded media, or paid service is needed.

```sh
npm ci
npm run dev
npm run check
npm run build
```

Rendering detail, pixel density and redraw rate adapt within bounded budgets without altering fixed simulation steps. `?profile=1` exposes rolling frame/draw statistics through `document.documentElement.dataset.starwoundProfile`. Cloud measurements do not establish physical-device performance.

The owner approved the reviewed installation for landing on October 2, 2026. Production mirrors are `starwound.shin86.dev` and `starwound.mhaider.dev`; verify each host separately. Remaining work is tracked in [todo.md](todo.md).

See [brief](docs/brief.md), [architecture](docs/architecture.md), and the chronological [verification ledger](docs/verification.md).

## cluster navigation — october 3

the owner approved a minimal `← shin86.dev` return link as an exception to the wordless artwork direction. it sits at bottom left opposite the sound icon, with safe-area spacing and visible keyboard focus. it does not intercept the canvas, change the sound flow, or affect the model.
