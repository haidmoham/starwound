import { useEffect, useRef, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Local playback only. No upload, analysis, or coupling to the world clock. */
export function LocalSoundtrack({ open, onClose }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !file) return;
    const url = URL.createObjectURL(file);
    audio.src = url;
    audio.load();
    const hide = () => {
      if (document.hidden) audio.pause();
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const remove = () => {
    setFile(null);
    setError("");
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
        <button type="button" onClick={onClose} aria-label="close soundtrack">
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
        {file ? file.name : "no track selected"}
      </p>
      <audio
        ref={audioRef}
        controls
        preload="metadata"
        aria-label="Local soundtrack playback"
        onError={() =>
          setError(
            "This browser couldn’t play that file. Try MP3, M4A, or WAV.",
          )
        }
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
        Music plays alongside the artwork. Song-specific phrase choreography is
        not mapped yet.
      </p>
    </aside>
  );
}
