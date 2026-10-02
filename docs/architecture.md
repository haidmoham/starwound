# Architecture

## One public body

`App.tsx` creates one `Installation` with a fixed seed/initial condition and renders `RuptureBackdrop` plus one accessible sound toggle. It observes `prefers-reduced-motion`; there is no visible copy, menu, audio-file picker, or decorative layer.

`RuptureBackdrop.tsx` owns the sole animation loop, fixed clock, adaptive budget and Canvas 2D field. The clock advances `Installation` at 120 Hz. Visibility transitions reset wall time and discard accumulated time rather than catching up. Reduced motion discards clock progression and draws the held body. Resize redraws without recreating the model. Animation frames, media-query and visibility listeners, and resize observers are cleaned up.

`CameraDrift.ts` samples a slow observer translation and a maximum 3.6% change of scale from simulation time. The original centered view is preserved at time zero. Translation stays within 7.5% horizontally and 3.5% vertically of the smaller viewport dimension. It affects the complete drawing, never model coordinates or anatomical relationships; reduced motion and hidden tabs hold the same camera position.

## Optional original sound

`AmbientSound.tsx` is a keyboard-accessible, labeled icon toggle. `ambientBed.ts` creates its native Web Audio graph only after deliberate activation, provides a quiet gradual entrance and mute, and suspends when the page is hidden. Original synthesized tones and filtered noise form an evolving ominous bed without an external recording or service. Sound is independent of model forcing and simulation time; no soundtrack-synchronization claim is made. Unmount disposes the graph and its sources.

Music playback requests the optional Audio Session `playback` type before context creation/resume, and restores the previous type when muted, hidden or disposed. Requested intent, pending startup and confirmed playback are separate. An unexpected foreground context interruption clears the active icon and allows a fresh gesture retry. A four-second unresolved resume returns to a retryable off state; late completion cannot unmute it. With `?profile=1`, `data-starwound-audio` contains context state/time, the requested session type and post-master PCM RMS/peak. These samples diagnose generated signal, not physical speaker audibility.

## Shared causality

The deterministic autonomous forcing used by `OrbitWorld` feeds body pressure, and mean bounded radial position contributes strain. `VitalMotion.ts` samples an authored 55.8-second phrase of seven unequal efforts from simulation time: inhale, caught breath, renewed resistance, hold, slow release and rest. A restrained paired pulse lives inside each effort. Modeled departure shock contributes to the shared opening/light response; the effort envelope coordinates body deformation, tearing and root-born ejection. Individual modeled particle angles still influence filament planes. A common center/rotation/contraction transforms every anatomical element together. The effort envelope does not change model forces.

`WoundBloom.ts` grows curled filaments directly from the gash lips. Tips sample the same effort with seeded 0.12–0.60-second delays so roots pull before tips recoil. Detached cohorts use the shared release event and that attempt's strength, with short cohort delays. Filament travel integrates the breath envelope to slow continuously under effort, with no phrase-boundary jump. `ScorchedSurface.ts` attaches seeded charred islands and independent fixed fissures to the body. No full-scene random noise or independently rotating decorative frame exists.

This is an authored generative organism around a physical sketch, not simulated biology, plasma or general relativity. The underlying world remains dimensionless softened-Newtonian test particles around one fixed attractor (`mu=1`, `epsilon=0.12`), kick-drift-kick integration and bounded 128-sample history. Radius-2 outward crossings are compositional departure events, not a gravitational escape claim. Existing model tests remain unchanged.

## Budget

The field uses 16/24/30 redraws per second at low/medium/high detail, with pixel-ratio caps 1/1.5/2. The adaptive budget records the actual complete field draw. Model ticks and event timing do not depend on quality. Wound curls are bounded at 24/42/58 and evaluated detached marks at 40/70/110; char marks remain 150/260/380 plus 13 fixed fissures. Filament and corona budgets remain bounded.

The public entry point no longer imports the separate WebGL trajectory renderer, local-media UI, cue study, or containment planes. Those experimental modules remain unmounted. The current published renderer is intentionally Canvas 2D, so cloud browser inspection covers that actual renderer rather than a WebGL fallback. Physical-device performance still requires separate measurement.

## Release

Vercel previews follow feature branches; production follows main and mirrors the installation at `starwound.shin86.dev` and `starwound.mhaider.dev`. The owner approved landing the reviewed installation on October 2, 2026. No user audio or reference artwork is bundled. See the chronological verification ledger for observed evidence and historical renderer limits.
