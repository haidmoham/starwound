# Verification ledger

## Tidal installation revision — 2026-09-24, local

- Follow-up: after starting an embedded video, collapsing and reopening the dock kept the same iframe DOM node mounted. This guards against restarting the embed on collapse. Playback continuity of its audio was not directly measured.
- `npm run check` passed: TypeScript, Oxlint, and 13 tests. Two new tests cover common YouTube URL forms and rejection of unrelated or malformed URLs. `npm run build` passed with Vite's existing large-chunk warning; `git diff --check` passed.
- Browser screenshots were inspected at 1440 × 900 and 390 × 844. The framed stage, full-field view, and tuning sheet rendered without horizontal overflow at 390 px. This browser used Canvas 2D fallback because WebGL was unavailable; hardware WebGL and a physical phone remain unverified.
- An empty link entered the work. An unrelated URL stayed at the entrance with a validation message. A nonmusic YouTube video loaded in the dock and its embedded Play control worked. A video that forbade embedding showed YouTube's unavailable state; the dock retained its `open on youtube` fallback link.
- Changing between frame and full field left the player mounted. At desktop width, the dock moved by pointer drag, moved 10 CSS pixels by one arrow-key press, and returned to its original position with reset. The 390 px tuning sheet hid the dock while open so the two surfaces did not collide.
- Freeze held both the authored backdrop and the trajectory canvas byte-for-byte across a one-second wait. Resume changed both. Still export produced a 1020 × 466 PNG containing the authored backdrop and modeled trajectories.
- The link is used only to select an iframe ID; no video or audio value enters the model, its clock, or either renderer. End-to-end playback continuity on a physical phone remains unverified.

## Live mirrored domains — 2026-09-24

- Cloudflare has DNS-only `CNAME starwound → 6891e8c0e292e643.vercel-dns-017.com` in both `shin86.dev` and `mhaider.dev`. Each record was confirmed in the Cloudflare DNS table. The authoritative Cloudflare nameserver returned the `mhaider.dev` CNAME; public resolvers returned the `shin86.dev` CNAME and one public resolver returned the new `mhaider.dev` CNAME while caches were still updating.
- `vercel domains verify` returned `configured_correctly` and `verified: true` for both `starwound.shin86.dev` and `starwound.mhaider.dev`. Vercel certificates were issued separately for the two hosts.
- HTTPS requests to both hosts returned HTTP 200 with certificate validation enabled. While local DNS caches settled, `curl --resolve` pinned each host to Vercel edge IP `216.198.79.65`; no TLS bypass was used.
- The HTML SHA-256 on both custom hosts matched local `dist/index.html` (`f88529b0…f0e5`). The JavaScript and CSS asset hashes also matched the built files on both hosts.
- Both HTTPS URLs loaded in Chrome with the orbital canvas and study controls visible. The listening room opened on `starwound.mhaider.dev`. The earlier 390 px local browser pass and identical hosted assets support the responsive layout; a physical phone and external YouTube playback remain unverified.

## V1 local pass — 2026-09-24

- `npm install --no-audit --no-fund` generated `package-lock.json`; CI now uses `npm ci`.
- `npm run check`: TypeScript, Oxlint, and 13 core tests passed. The added replay test compares measured forcing with silence, reordered input, and a different prior history.
- `npm run build`: passed. Vite reported a 766 kB JavaScript chunk warning; this is a size warning, not a build failure.
- Browser at `http://127.0.0.1:5173/`: inspected 1280×633 and 390×844 screenshots. No horizontal overflow at 390 px. The browser lacked WebGL, so Canvas 2D fallback showed the orbital trajectories.
- Uploaded a generated four-second WAV fixture. The UI changed to `your recording`; playback time advanced to 2.58 s, and restart paused audio at 0 s. The YouTube dock opened at 390 px; playback of an external video was not verified.
- At 1280 px, dragging the YouTube dock moved it from `(44, 689)` to `(444, 459)` CSS pixels. Still export produced a 1280 × 800 PNG of the actual orbital canvas.
- The browser pass does not establish performance or appearance on a physical phone or a hardware WebGL browser. No commercial recording was tested.

## Hosted release — 2026-09-24

- Vercel project `zarnab/starwound` is connected to `haidmoham/starwound` with `main` as the production branch and repository-owned `vercel.json` build/routing configuration.
- PR #2 passed GitHub Checks and Vercel preview checks. Merge commit `3170cad` triggered a separate production deployment, `starwound-4zhr5uu35-zarnab.vercel.app`, which reached Ready. GitHub Actions run `36041315634` passed.
- `https://starwound.vercel.app/` returned HTTP 200 and its HTML SHA-256 matched local `dist/index.html` before the main-push deployment. Repeat asset parity against the final production deployment and both custom hosts after DNS activation.
- `starwound.shin86.dev` and `starwound.mhaider.dev` are attached to the project. Vercel requested DNS-only `CNAME starwound → 6891e8c0e292e643.vercel-dns-017.com.` in each Cloudflare zone. DNS, TLS, and browser verification remain pending.
- The final CLI production deployment `dpl_3dWgPz13iDErdtQhRBEyKbsceXow` reached Ready. `starwound.vercel.app` returned HTTP 200 with HTML matching local `dist/index.html` by SHA-256. Headers are `no-cache` for `/` and `public, max-age=31536000, immutable` for hashed assets. Its 390 px browser layout had no horizontal overflow.

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
