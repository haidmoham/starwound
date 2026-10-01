import { useEffect, useRef, useState } from "react";
import { BABY_BLUE_FILE } from "./soundtrackScore.ts";
import { bindLocalMedia } from "./localMedia.ts";
import type { SoundtrackClock } from "./soundtrackScore.ts";

interface Props {
  open: boolean;
  onClose: () => void;
  clock: SoundtrackClock;
}

/** Local playback only. No upload, analysis, or coupling to the world clock. */
export function LocalSoundtrack({ open, onClose, clock }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [matched, setMatched] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !file) return;
    let disposed = false;
    let verified = false;
    clock.readTime = () =>
      verified && audio.readyState >= 1 ? audio.currentTime : null;
    setMatched(false);
    if (file.size === BABY_BLUE_FILE.bytes) {
      void file
        .arrayBuffer()
        .then((bytes) => crypto.subtle.digest("SHA-256", bytes))
        .then((digest) => {
          if (disposed) return;
          const fingerprint = Array.from(new Uint8Array(digest), (byte) =>
            byte.toString(16).padStart(2, "0"),
          ).join("");
          verified = fingerprint === BABY_BLUE_FILE.sha256;
          setMatched(verified);
        })
        .catch(() => {
          if (!disposed) setMatched(false);
        });
    }
    const releaseMedia = bindLocalMedia(audio, file);
    const hide = () => {
      if (document.hidden) audio.pause();
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      disposed = true;
      clock.readTime = () => null;
      document.removeEventListener("visibilitychange", hide);
      releaseMedia();
    };
  }, [file, clock]);

  const remove = () => {
    setFile(null);
    setError("");
    setMatched(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <aside
      id="soundtrack"
      className="tuning soundtrack"
      hidden={!open}
      aria-label="Local soundtrack"
    >
      <div className="tuning-head">
        <span>sound, if you want it</span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="close soundtrack"
        >
          ×
        </button>
      </div>
      <p className="soundtrack-intro">
        Bring a track from your device. The void is here either way.
      </p>
      <label className="soundtrack-file" htmlFor="local-audio">
        choose local audio
      </label>
      <input
        ref={inputRef}
        id="local-audio"
        type="file"
        accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac"
        onChange={(event) => {
          const next = event.target.files?.[0];
          if (!next) return;
          setError("");
          setFile(next);
        }}
      />
      <p className="soundtrack-name">
        {file
          ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`
          : "no track selected"}
      </p>
      <audio
        ref={audioRef}
        controls
        preload="metadata"
        aria-label="Local soundtrack playback"
        onError={(event) => {
          const failure = event.currentTarget.error;
          setError(
            `This browser couldn’t play that file (media ${failure?.code ?? "unknown"}${failure?.message ? `: ${failure.message}` : ""}). Try MP3, M4A, or WAV.`,
          );
        }}
      />
      {file && (
        <button className="soundtrack-remove" type="button" onClick={remove}>
          remove track
        </button>
      )}
      {error && <p role="alert">{error}</p>}
      <p>
        Your file stays in this browser. Press play to begin; closing this panel
        keeps it playing. Playback pauses when this tab is hidden.
      </p>
      <p>
        {matched
          ? "Baby Blue · supplied version matched. The wound follows a structural cue study from this recording’s measured dynamics. This is an authored interpretation, not a beat map. Seeking moves the wound’s cue timeline; physical trajectories remain autonomous."
          : "Music plays alongside the artwork. Select the supplied Baby Blue MP3 to enable its version-matched structural cue study."}
      </p>
    </aside>
  );
}
