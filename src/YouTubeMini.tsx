import { useRef, useState } from "react";

function videoId(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const host = url.hostname.toLowerCase();
    const id =
      host === "youtu.be"
        ? url.pathname.slice(1)
        : ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)
          ? url.pathname === "/watch"
            ? url.searchParams.get("v")
            : url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)$/)?.[1]
          : null;
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function YouTubeMini() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [id, setId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const drag = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);

  const load = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = videoId(input.trim());
    if (!parsed) {
      setError("paste a YouTube video link.");
      return;
    }
    setError("");
    setId(parsed);
    setOpen(true);
  };
  const move = (event: React.PointerEvent) => {
    if (!drag.current || event.pointerType === "touch") return;
    const width = Math.min(340, window.innerWidth - 24);
    const x = Math.min(
      window.innerWidth - width - 12,
      Math.max(12, drag.current.left + event.clientX - drag.current.x),
    );
    const y = Math.min(
      window.innerHeight - 260,
      Math.max(12, drag.current.top + event.clientY - drag.current.y),
    );
    setPosition({ x, y });
  };
  return (
    <section
      className={`youtube-mini ${open ? "is-open" : ""}`}
      style={
        position
          ? { left: position.x, top: position.y, right: "auto", bottom: "auto" }
          : undefined
      }
      aria-label="YouTube listening companion"
    >
      <div
        className="mini-head"
        onPointerDown={(event) => {
          if (
            event.pointerType === "touch" ||
            !(event.target instanceof HTMLElement) ||
            event.target.closest("button")
          )
            return;
          const box =
            event.currentTarget.parentElement!.getBoundingClientRect();
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            left: box.left,
            top: box.top,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={move}
        onPointerUp={() => {
          drag.current = null;
        }}
      >
        <span>
          listening room <i>↗</i>
        </span>
        <div>
          <button
            type="button"
            onClick={() => setPosition(null)}
            title="reset player position"
          >
            reset
          </button>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
          >
            {open ? "−" : "+"}
          </button>
        </div>
      </div>
      {open && (
        <div className="mini-body">
          <form onSubmit={load}>
            <label htmlFor="youtube-url">youtube link</label>
            <div className="mini-input">
              <input
                id="youtube-url"
                type="url"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="paste a video link"
              />
              <button type="submit">load</button>
            </div>
          </form>
          {error && <p role="alert">{error}</p>}
          {id && (
            <>
              <iframe
                title="YouTube companion player"
                src={`https://www.youtube.com/embed/${id}?playsinline=1&origin=${encodeURIComponent(window.location.origin)}`}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
              <a
                href={`https://www.youtube.com/watch?v=${id}`}
                target="_blank"
                rel="noreferrer"
              >
                open on youtube ↗
              </a>
            </>
          )}
          <p className="mini-note">
            youtube plays beside the study. choose a local audio file to let
            music move the world.
          </p>
        </div>
      )}
    </section>
  );
}
