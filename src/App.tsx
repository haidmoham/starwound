import { useState } from "react";
import { DEFAULT_PARAMETERS } from "./core/orbit.ts";
import type { OrbitParameters } from "./core/orbit.ts";
import { OrbitalCanvas } from "./render/OrbitalCanvas.tsx";
import type { ViewParameters } from "./render/OrbitalCanvas.tsx";

export function App() {
  const [parameters, setParameters] = useState<OrbitParameters>({ ...DEFAULT_PARAMETERS });
  const [draft, setDraft] = useState<OrbitParameters>({ ...DEFAULT_PARAMETERS });
  const [view, setView] = useState<ViewParameters>({ exposure: 0.55, extent: 3.1, traceSeconds: 6 });
  const [paused, setPaused] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState("");

  return (
    <main>
      <OrbitalCanvas parameters={parameters} view={view} paused={paused} onError={setError} />
      <header className="masthead">
        <div><h1>starwound</h1><p className="eyebrow">studies of life through time</p></div>
        <span className="study-label">01 / orbital study<br /><strong>synthetic forcing</strong></span>
      </header>
      <section className="caption" aria-label="About this study">
        <p className="eyebrow">science · generative processes · music</p>
        <h2>What remains<br /><em>in motion.</em></h2>
        <p>A world with its own rules.<br />An encounter that changes its path.</p>
        <p className="status">Scaffold: no recording loaded. Audio is the next slice.</p>
      </section>
      <aside className="instrument" aria-label="Study controls">
        <div className="transport">
          <button onClick={() => setPaused(!paused)}>{paused ? "Resume" : "Pause"}</button>
          <button aria-expanded={showControls} aria-controls="controls" onClick={() => setShowControls(!showControls)}>{showControls ? "Hide controls" : "Show controls"}</button>
        </div>
        <div id="controls" hidden={!showControls}>
          <form onSubmit={(event) => { event.preventDefault(); setParameters({ ...draft }); }}>
            <h3>World <span>applied on restart</span></h3>
            <label htmlFor="seed">Seed<input id="seed" type="number" min="0" max="4294967295" step="1" required value={draft.seed} onChange={(event) => setDraft({ ...draft, seed: Number(event.target.value) })} /></label>
            <label htmlFor="momentum">Angular momentum <output>{draft.angularMomentum.toFixed(2)}</output></label>
            <input id="momentum" type="range" min="0.4" max="1.35" step="0.01" value={draft.angularMomentum} onChange={(event) => setDraft({ ...draft, angularMomentum: Number(event.target.value) })} />
            <label htmlFor="dispersion">Velocity dispersion <output>{draft.dispersion.toFixed(3)}</output></label>
            <input id="dispersion" type="range" min="0" max="0.15" step="0.005" value={draft.dispersion} onChange={(event) => setDraft({ ...draft, dispersion: Number(event.target.value) })} />
            <label htmlFor="receptivity">Receptivity <output>{draft.receptivity.toFixed(2)}</output></label>
            <input id="receptivity" type="range" min="0" max="1" step="0.01" value={draft.receptivity} onChange={(event) => setDraft({ ...draft, receptivity: Number(event.target.value) })} />
            <button className="apply" type="submit">Apply &amp; restart</button>
          </form>
          <section aria-label="Observer controls">
            <h3>Observer <span>live; does not change physics</span></h3>
            <label htmlFor="exposure">Exposure <output>{view.exposure.toFixed(2)}</output></label>
            <input id="exposure" type="range" min="0.1" max="1" step="0.01" value={view.exposure} onChange={(event) => setView({ ...view, exposure: Number(event.target.value) })} />
            <label htmlFor="extent">Field of view <output>{view.extent.toFixed(1)}</output></label>
            <input id="extent" type="range" min="2" max="7" step="0.1" value={view.extent} onChange={(event) => setView({ ...view, extent: Number(event.target.value) })} />
            <label htmlFor="trace">Trace window <output>{view.traceSeconds.toFixed(1)} s</output></label>
            <input id="trace" type="range" min="0.5" max="8" step="0.5" value={view.traceSeconds} onChange={(event) => setView({ ...view, traceSeconds: Number(event.target.value) })} />
          </section>
          <p className="model-note">Softened Newtonian test particles.<br />Not a black-hole or relativity simulation.</p>
        </div>
      </aside>
      {error && <p className="error" role="alert">{error}</p>}
    </main>
  );
}
