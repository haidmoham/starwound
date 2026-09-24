import { useEffect, useRef, useState } from "react";
import { analyzeSamples } from "./core/audio.ts";
import type { FeatureTimeline } from "./core/audio.ts";
import { DEFAULT_PARAMETERS } from "./core/orbit.ts";
import type { OrbitParameters } from "./core/orbit.ts";
import { OrbitalCanvas } from "./render/OrbitalCanvas.tsx";
import type { ViewParameters } from "./render/OrbitalCanvas.tsx";
import { YouTubeMini } from "./YouTubeMini.tsx";

const PRESETS = [
  { name: "orbit", momentum: 1.02, dispersion: 0.015, receptivity: 0.35 },
  { name: "fall", momentum: 0.66, dispersion: 0.018, receptivity: 0.72 },
  { name: "scatter", momentum: 1.24, dispersion: 0.11, receptivity: 0.9 },
];
const initial = {
  ...DEFAULT_PARAMETERS,
  angularMomentum: PRESETS[0].momentum,
  dispersion: PRESETS[0].dispersion,
  receptivity: PRESETS[0].receptivity,
};
const clockText = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export function App() {
  const [parameters, setParameters] = useState<OrbitParameters>({ ...initial });
  const [draft, setDraft] = useState<OrbitParameters>({ ...initial });
  const [view, setView] = useState<ViewParameters>({
    exposure: 0.68,
    extent: 3.1,
    traceSeconds: 7,
  });
  const [paused, setPaused] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [showControls, setShowControls] = useState(false);
  const [exhibition, setExhibition] = useState(false);
  const [timeline, setTimeline] = useState<FeatureTimeline | null>(null);
  const [fileName, setFileName] = useState("");
  const [position, setPosition] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const urlRef = useRef<string | null>(null);
  const loadId = useRef(0);

  useEffect(() => {
    const hide = () => {
      if (document.hidden) {
        audioRef.current?.pause();
        setPaused(true);
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const loadAudio = async (file: File) => {
    const current = ++loadId.current;
    audioRef.current?.pause();
    setPaused(true);
    setBusy(true);
    setError("");
    try {
      const context = new AudioContext();
      let decoded: AudioBuffer;
      try {
        decoded = await context.decodeAudioData(await file.arrayBuffer());
      } finally {
        await context.close();
      }
      if (current !== loadId.current) return;
      const channels = Array.from(
        { length: decoded.numberOfChannels },
        (_, index) => decoded.getChannelData(index),
      );
      const features = analyzeSamples(channels, decoded.sampleRate);
      const url = URL.createObjectURL(file);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
      }
      setTimeline(features);
      setFileName(file.name);
      setPosition(0);
      setResetKey((value) => value + 1);
    } catch {
      if (current === loadId.current)
        setError(
          "this audio file could not be decoded. try another local file.",
        );
    } finally {
      if (current === loadId.current) setBusy(false);
    }
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (timeline && audio) {
      if (!paused && !audio.paused) {
        audio.pause();
        setPaused(true);
        return;
      }
      if (audio.ended) {
        audio.currentTime = 0;
        setResetKey((value) => value + 1);
      }
      try {
        await audio.play();
        setPaused(false);
      } catch {
        setError("playback was blocked. select play again.");
      }
    } else setPaused((value) => !value);
  };
  const restart = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPaused(true);
    setPosition(0);
    setResetKey((value) => value + 1);
  };
  const apply = (next: OrbitParameters) => {
    setParameters({ ...next });
    setDraft({ ...next });
    restart();
  };
  const saveStill = () => {
    const canvas = [
      ...document.querySelectorAll<HTMLCanvasElement>("canvas.world"),
    ].find((item) => getComputedStyle(item).display !== "none");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "starwound.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <main className={exhibition ? "exhibition" : ""}>
      <OrbitalCanvas
        parameters={parameters}
        view={view}
        paused={paused}
        onError={setError}
        audio={timeline ? audioRef.current : null}
        timeline={timeline}
        resetKey={resetKey}
      />
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={(event) => setPosition(event.currentTarget.currentTime)}
        onError={() => {
          if (timeline)
            setError("audio playback failed. try another local file.");
        }}
      />
      <a className="skip-link" href="#instrument">
        skip to instrument
      </a>
      <header className="masthead">
        <a href="https://shin86.dev/">← shin86.dev</a>
        <span>an orbital study / 001</span>
        <button type="button" onClick={() => setExhibition(!exhibition)}>
          {exhibition ? "leave exhibition" : "exhibition ↗"}
        </button>
      </header>
      <div className="identity">
        <p className="eyebrow">science / generative process / music</p>
        <h1>
          star<span>wound</span>
          <i>.</i>
        </h1>
        <p>a world keeps the shape of what passes through it.</p>
      </div>
      <div className="coordinate" aria-hidden="true">
        <span>01 — softened newtonian motion</span>
        <span>seed {parameters.seed}</span>
      </div>
      <aside
        id="instrument"
        className="instrument"
        aria-label="Study instrument"
      >
        <div className="instrument-top">
          <div>
            <span className="eyebrow">now observing</span>
            <strong>{timeline ? "your recording" : "synthetic current"}</strong>
          </div>
          <span className="live-indicator">
            {paused ? "still" : "in motion"}
            <i />
          </span>
        </div>
        <div className="transport">
          <button className="play" type="button" onClick={togglePlayback}>
            {paused ? "play" : "pause"} <span>{paused ? "▶" : "Ⅱ"}</span>
          </button>
          <button type="button" onClick={restart}>
            restart ↺
          </button>
          <button type="button" onClick={saveStill}>
            save still ↓
          </button>
        </div>
        <div className="audio-source">
          <label htmlFor="audio-file">
            {busy
              ? "reading audio…"
              : timeline
                ? "replace local audio ↗"
                : "choose local audio ↗"}
          </label>
          <input
            id="audio-file"
            type="file"
            accept="audio/*"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void loadAudio(file);
              event.currentTarget.value = "";
            }}
          />
          <p>
            {timeline
              ? `${fileName} · ${clockText(position)} / ${clockText(timeline.duration)}`
              : "a local file drives the model. it stays on this device."}
          </p>
        </div>
        <div
          className="preset-row"
          role="group"
          aria-label="World configurations"
        >
          {PRESETS.map((preset, index) => (
            <button
              key={preset.name}
              type="button"
              className={
                parameters.angularMomentum === preset.momentum &&
                parameters.dispersion === preset.dispersion
                  ? "selected"
                  : ""
              }
              onClick={() =>
                apply({
                  ...parameters,
                  angularMomentum: preset.momentum,
                  dispersion: preset.dispersion,
                  receptivity: preset.receptivity,
                })
              }
            >
              <small>0{index + 1}</small>
              {preset.name}
            </button>
          ))}
        </div>
        <button
          className="detail-toggle"
          type="button"
          aria-controls="controls"
          aria-expanded={showControls}
          onClick={() => setShowControls(!showControls)}
        >
          {showControls ? "close instrument" : "tune the world"}
          <span>{showControls ? "−" : "+"}</span>
        </button>
        {showControls && (
          <div id="controls" className="controls">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                apply(draft);
              }}
            >
              <h2>
                world <span>apply + restart</span>
              </h2>
              <label htmlFor="seed">
                seed
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
                step="0.005"
                value={draft.dispersion}
                onChange={(event) =>
                  setDraft({ ...draft, dispersion: Number(event.target.value) })
                }
              />
              <label htmlFor="receptivity">
                receptivity <output>{draft.receptivity.toFixed(2)}</output>
              </label>
              <input
                id="receptivity"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={draft.receptivity}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    receptivity: Number(event.target.value),
                  })
                }
              />
              <button className="apply" type="submit">
                apply + restart
              </button>
            </form>
            <section aria-label="Observer controls">
              <h2>
                observer <span>live view only</span>
              </h2>
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
            </section>
            <p className="model-note">
              test particles around one fixed attractor. a local recording
              changes a bounded external drive. this is neither relativity nor
              gravitational lensing.
            </p>
          </div>
        )}
      </aside>
      {!exhibition && <YouTubeMini />}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </main>
  );
}
