import { useEffect, useRef, useState } from "react";
import { createAmbientBed } from "./ambientBed.ts";

/** The only public control: deliberate opt-in, with the same gesture to mute. */
export function AmbientSound() {
  const bedRef = useRef<ReturnType<typeof createAmbientBed> | null>(null);
  const requestRef = useRef(0);
  const [enabled, setEnabled] = useState(false);
  const [failed, setFailed] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const profiling = new URLSearchParams(window.location.search).has("profile");
    const bed = createAmbientBed({
      onEnabledChange: (value) => {
        if (bedRef.current === bed && !value) setEnabled(false);
      },
      onPlaybackChange: (value) => {
        if (bedRef.current === bed) setEnabled(value);
      },
      inspectOutput: profiling,
    });
    bedRef.current = bed;
    const visibilityChanged = () => bed.setVisible(!document.hidden);
    visibilityChanged();
    document.addEventListener("visibilitychange", visibilityChanged);
    const inspect = () => {
      document.documentElement.dataset.starwoundAudio = JSON.stringify(bed.inspect());
    };
    const profileTimer = profiling ? window.setInterval(inspect, 250) : undefined;
    return () => {
      document.removeEventListener("visibilitychange", visibilityChanged);
      if (profileTimer !== undefined) window.clearInterval(profileTimer);
      if (profiling) delete document.documentElement.dataset.starwoundAudio;
      requestRef.current += 1;
      bedRef.current = null;
      bed.dispose();
    };
  }, []);

  const toggle = async () => {
    const bed = bedRef.current;
    if (!bed) return;
    const request = ++requestRef.current;
    const next = !bed.enabled;
    setFailed(false);
    setStarting(next);
    try {
      const active = await bed.setEnabled(next);
      if (bedRef.current === bed && requestRef.current === request) {
        setStarting(false);
        setEnabled(bed.playing);
        setFailed(next && !active && !bed.enabled);
      }
    } catch {
      if (bedRef.current === bed && requestRef.current === request) {
        setEnabled(false);
        setStarting(false);
        setFailed(true);
      }
    }
  };

  const label = starting ? "Cancel starting ambient sound" : failed
    ? "Sound unavailable. Try ambient sound again"
    : enabled
      ? "Mute ambient sound"
      : "Play ambient sound";

  return (
    <>
      <button
        className="ambient-sound"
        type="button"
        onClick={() => void toggle()}
        aria-label={label}
        aria-pressed={enabled}
        aria-busy={starting}
        title={label}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 9h4l5-4v14l-5-4H4Z" />
          {enabled ? (
            <>
              <path d="M16 9a5 5 0 0 1 0 6" />
              <path d="M19 6a9 9 0 0 1 0 12" />
            </>
          ) : (
            <path d="m17 9 5 6m0-6-5 6" />
          )}
        </svg>
      </button>
      <span className="sound-status" role="status">
        {failed ? "Ambient sound could not start. Use the sound button to try again." : ""}
      </span>
    </>
  );
}
