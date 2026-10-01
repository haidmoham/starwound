# Architecture

## One public body

`App.tsx` creates one `Installation` with a fixed seed/initial condition and renders only `RuptureBackdrop`. It observes `prefers-reduced-motion`; there are no public controls, visible text, audio elements, or decorative layers.

`RuptureBackdrop.tsx` owns the sole animation loop, fixed clock, adaptive budget and Canvas 2D field. The clock advances `Installation` at 120 Hz. A hidden tab discards elapsed time rather than catching up. Reduced motion discards clock progression and draws the held body. Resize redraws without recreating the model. Animation frames, media-query listeners and resize observers are cleaned up.

## Shared causality

The deterministic autonomous forcing used by `OrbitWorld` feeds body pressure, and mean bounded radial position contributes strain. `VitalMotion.ts` samples an authored 55.8-second phrase of seven unequal efforts from simulation time: inhale, caught breath, renewed resistance, hold, slow release and rest. A restrained paired pulse lives inside each effort. Modeled departure shock contributes to the shared opening/light response; the effort envelope coordinates body deformation, tearing and root-born ejection. Individual modeled particle angles still influence filament planes. A common center/rotation/contraction transforms every anatomical element together. The effort envelope does not change model forces.

`WoundBloom.ts` grows curled filaments directly from the gash lips. Tips sample the same effort with seeded 0.12–0.60-second delays so roots pull before tips recoil. Detached cohorts use the shared release event and that attempt's strength, with short cohort delays. Filament travel integrates the breath envelope to slow continuously under effort, with no phrase-boundary jump. `ScorchedSurface.ts` attaches seeded charred islands and independent fixed fissures to the body. No full-scene random noise or independently rotating decorative frame exists.

This is an authored generative organism around a physical sketch, not simulated biology, plasma or general relativity. The underlying world remains dimensionless softened-Newtonian test particles around one fixed attractor (`mu=1`, `epsilon=0.12`), kick-drift-kick integration and bounded 128-sample history. Radius-2 outward crossings are compositional departure events, not a gravitational escape claim. Existing model tests remain unchanged.

## Budget

The field uses 16/24/30 redraws per second at low/medium/high detail, with pixel-ratio caps 1/1.5/2. The adaptive budget records the actual complete field draw. Model ticks and event timing do not depend on quality. Wound curls are bounded at 24/42/58 and evaluated detached marks at 40/70/110; char marks remain 150/260/380 plus 13 fixed fissures. Filament and corona budgets remain bounded.

The public entry point no longer imports the separate WebGL trajectory renderer, local-media UI, cue study, or containment planes. Those experimental modules remain unmounted. The current published renderer is intentionally Canvas 2D, so cloud browser inspection covers that actual renderer rather than a WebGL fallback. Physical-device performance still requires separate measurement.

## Release

Vercel previews follow the feature branch. Main and production mirrors remain held for visual review. No user audio or reference artwork is bundled. See the chronological verification ledger for observed evidence and historical renderer limits.
