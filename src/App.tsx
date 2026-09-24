import { useEffect, useState } from "react";
import { DEFAULT_PARAMETERS } from "./core/orbit.ts";
import type { OrbitParameters } from "./core/orbit.ts";
import { parseYouTubeId } from "./core/youtube.ts";
import { OrbitalCanvas } from "./render/OrbitalCanvas.tsx";
import type { ViewParameters } from "./render/OrbitalCanvas.tsx";
import { RuptureBackdrop } from "./render/RuptureBackdrop.tsx";
import { YouTubeMini } from "./YouTubeMini.tsx";

const STUDIES = [
  { name: "fall", momentum: 0.66, dispersion: 0.018, receptivity: 0.72 },
  { name: "shear", momentum: 1.02, dispersion: 0.015, receptivity: 0.35 },
  { name: "eject", momentum: 1.24, dispersion: 0.11, receptivity: 0.9 },
];

const INITIAL_PARAMETERS: OrbitParameters = {
  ...DEFAULT_PARAMETERS,
  angularMomentum: STUDIES[0].momentum,
  dispersion: STUDIES[0].dispersion,
  receptivity: STUDIES[0].receptivity,
};

export function App() {
  const [parameters, setParameters] = useState<OrbitParameters>({
    ...INITIAL_PARAMETERS,
  });
  const [draft, setDraft] = useState<OrbitParameters>({
    ...INITIAL_PARAMETERS,
  });
  const [view, setView] = useState<ViewParameters>({
    exposure: 0.85,
    extent: 3.1,
    traceSeconds: 7,
  });
  const [paused, setPaused] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [entered, setEntered] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [link, setLink] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const hide = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);

  useEffect(() => {
    const leave = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowControls(false);
        setEntered(false);
      }
    };
    window.addEventListener("keydown", leave);
    return () => window.removeEventListener("keydown", leave);
  }, []);

  const enter = (event: React.FormEvent) => {
    event.preventDefault();
    const value = link.trim();
    if (value) {
      const parsed = parseYouTubeId(value);
      if (!parsed) {
        setError("use a youtube video link, or leave this empty.");
        return;
      }
      setVideoId(parsed);
    }
    setError("");
    setEntered(true);
  };

  const restart = () => {
    setResetKey((value) => value + 1);
    setPaused(false);
  };

  const apply = (next: OrbitParameters) => {
    setParameters({ ...next });
    setDraft({ ...next });
    restart();
  };

  const saveStill = () => {
    const backdrop = document.querySelector<HTMLCanvasElement>(
      "canvas.rupture-backdrop",
    );
    const world = [
      ...document.querySelectorAll<HTMLCanvasElement>("canvas.world"),
    ].find((item) => getComputedStyle(item).display !== "none");
    if (!backdrop || !world) return;
    const canvas = document.createElement("canvas");
    canvas.width = backdrop.width;
    canvas.height = backdrop.height;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(backdrop, 0, 0, canvas.width, canvas.height);
    context.drawImage(world, 0, 0, canvas.width, canvas.height);
    const anchor = document.createElement("a");
    anchor.download = `starwound-${parameters.seed}.png`;
    anchor.href = canvas.toDataURL("image/png");
    anchor.click();
  };

  return (
    <main
      className={`gallery ${entered ? "entered" : ""} ${showControls ? "tuning-open" : ""}`}
    >
      <a className="skip-link" href="#field-controls">
        skip to controls
      </a>
      <header className="gallery-header">
        <a href="https://shin86.dev/" className="home-link">
          ← shin86.dev
        </a>
        <span>starwound / 001</span>
        <button type="button" onClick={() => setEntered(!entered)}>
          {entered ? "frame ↙" : "full field ↗"}
        </button>
      </header>

      <section className="exhibit" aria-label="Starwound orbital installation">
        <div className="artwork-frame">
          <RuptureBackdrop seed={parameters.seed} paused={paused} />
          <OrbitalCanvas
            parameters={parameters}
            view={view}
            paused={paused}
            onError={setError}
            resetKey={resetKey}
          />
          <div className="art-grain" aria-hidden="true" />
          <div className="art-index" aria-hidden="true">
            <span>SW—001</span>
            <span>softened newtonian study</span>
          </div>
          <div className="art-corner" aria-hidden="true">
            ✳
          </div>
        </div>
        {!entered && (
          <div className="placard">
            <div>
              <span>001 / a study of matter in flight</span>
              <h1>
                starwound<span>.</span>
              </h1>
            </div>
            <span className="placard-aside">the field keeps moving.</span>
          </div>
        )}
      </section>

      {!entered && (
        <form className="entrance" onSubmit={enter}>
          <label htmlFor="entrance-link">
            a youtube link <span>/ optional</span>
          </label>
          <div className="entrance-line">
            <input
              id="entrance-link"
              type="url"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="paste any video link"
              autoComplete="off"
            />
            <button type="submit">
              enter <span>↗</span>
            </button>
          </div>
          {error && <p role="alert">{error}</p>}
        </form>
      )}

      <nav className="study-rail" aria-label="Choose orbital study">
        {STUDIES.map((study, index) => (
          <button
            key={study.name}
            type="button"
            aria-pressed={
              parameters.angularMomentum === study.momentum &&
              parameters.dispersion === study.dispersion
            }
            onClick={() =>
              apply({
                ...parameters,
                angularMomentum: study.momentum,
                dispersion: study.dispersion,
                receptivity: study.receptivity,
              })
            }
          >
            <small>0{index + 1}</small> {study.name}
          </button>
        ))}
      </nav>

      <div
        id="field-controls"
        className="field-controls"
        role="group"
        aria-label="Field controls"
      >
        <button type="button" onClick={() => setPaused(!paused)}>
          {paused ? "move ↗" : "freeze Ⅱ"}
        </button>
        <button type="button" onClick={restart}>
          begin again ↺
        </button>
        <button type="button" onClick={saveStill}>
          take a still ↓
        </button>
        <button
          type="button"
          onClick={() => setShowControls(!showControls)}
          aria-expanded={showControls}
          aria-controls="tuning"
        >
          tune {showControls ? "−" : "+"}
        </button>
      </div>

      {showControls && (
        <aside
          id="tuning"
          className="tuning"
          aria-label="Tune the orbital study"
        >
          <div className="tuning-head">
            <span>the instrument</span>
            <button
              type="button"
              onClick={() => setShowControls(false)}
              aria-label="close tuning"
            >
              ×
            </button>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              apply(draft);
            }}
          >
            <label htmlFor="seed">
              seed{" "}
              <input
                id="seed"
                type="number"
                min="0"
                max="4294967295"
                step="1"
                required
                value={draft.seed}
                onChange={(event) =>
                  setDraft({ ...draft, seed: Number(event.target.value) })
                }
              />
            </label>
            <label htmlFor="momentum">
              angular momentum{" "}
              <output>{draft.angularMomentum.toFixed(2)}</output>
            </label>
            <input
              id="momentum"
              type="range"
              min="0.4"
              max="1.35"
              step="0.01"
              value={draft.angularMomentum}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  angularMomentum: Number(event.target.value),
                })
              }
            />
            <label htmlFor="dispersion">
              dispersion <output>{draft.dispersion.toFixed(3)}</output>
            </label>
            <input
              id="dispersion"
              type="range"
              min="0"
              max="0.15"
              step="0.001"
              value={draft.dispersion}
              onChange={(event) =>
                setDraft({ ...draft, dispersion: Number(event.target.value) })
              }
            />
            <label htmlFor="receptivity">
              tidal drive <output>{draft.receptivity.toFixed(2)}</output>
            </label>
            <input
              id="receptivity"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={draft.receptivity}
              onChange={(event) =>
                setDraft({ ...draft, receptivity: Number(event.target.value) })
              }
            />
            <button className="apply" type="submit">
              apply + restart ↗
            </button>
          </form>
          <div className="observer">
            <span>the observer / live</span>
            <label htmlFor="exposure">
              exposure <output>{view.exposure.toFixed(2)}</output>
            </label>
            <input
              id="exposure"
              type="range"
              min="0.1"
              max="1"
              step="0.01"
              value={view.exposure}
              onChange={(event) =>
                setView({ ...view, exposure: Number(event.target.value) })
              }
            />
            <label htmlFor="extent">
              field of view <output>{view.extent.toFixed(1)}</output>
            </label>
            <input
              id="extent"
              type="range"
              min="2"
              max="7"
              step="0.1"
              value={view.extent}
              onChange={(event) =>
                setView({ ...view, extent: Number(event.target.value) })
              }
            />
            <label htmlFor="trace">
              trace window <output>{view.traceSeconds.toFixed(1)}s</output>
            </label>
            <input
              id="trace"
              type="range"
              min="0.5"
              max="8"
              step="0.5"
              value={view.traceSeconds}
              onChange={(event) =>
                setView({ ...view, traceSeconds: Number(event.target.value) })
              }
            />
          </div>
          <p>
            softened newtonian test particles. the rupture is an authored
            projection, not gravitational lensing.
          </p>
        </aside>
      )}

      <YouTubeMini videoId={videoId} onVideoIdChange={setVideoId} />
      {entered && error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </main>
  );
}
