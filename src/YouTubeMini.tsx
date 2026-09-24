import { useEffect, useRef, useState } from "react";
import { parseYouTubeId } from "./core/youtube.ts";

interface Props {
  videoId: string | null;
  onVideoIdChange: (id: string) => void;
}

function clampPosition(x: number, y: number, element: HTMLElement | null) {
  const box = element?.getBoundingClientRect();
  const width = box?.width ?? 340;
  const height = box?.height ?? 80;
  return {
    x: Math.max(12, Math.min(window.innerWidth - width - 12, x)),
    y: Math.max(12, Math.min(window.innerHeight - height - 12, y)),
  };
}

export function YouTubeMini({ videoId, onVideoIdChange }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const sectionRef = useRef<HTMLElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);

  useEffect(() => {
    if (videoId) {
      setOpen(true);
      setEditing(false);
    }
  }, [videoId]);

  useEffect(() => {
    const keepVisible = () => {
      setPosition((current) =>
        current
          ? clampPosition(current.x, current.y, sectionRef.current)
          : null,
      );
    };
    window.addEventListener("resize", keepVisible);
    return () => window.removeEventListener("resize", keepVisible);
  }, []);

  const load = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = parseYouTubeId(input.trim());
    if (!parsed) {
      setError("use a youtube video link.");
      return;
    }
    setError("");
    onVideoIdChange(parsed);
    setEditing(false);
    setOpen(true);
  };

  return (
    <section
      ref={sectionRef}
      className={`youtube-mini ${open ? "is-open" : ""}`}
      style={
        position
          ? { left: position.x, top: position.y, right: "auto", bottom: "auto" }
          : undefined
      }
      aria-label="YouTube companion"
    >
      <div
        className="mini-head"
        tabIndex={0}
        role="group"
        aria-label="YouTube player. Drag to move, or use arrow keys while focused."
        onKeyDown={(event) => {
          if (
            !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
              event.key,
            )
          )
            return;
          event.preventDefault();
          const box = sectionRef.current?.getBoundingClientRect();
          if (!box) return;
          const distance = event.shiftKey ? 40 : 10;
          const x =
            box.left +
            (event.key === "ArrowRight"
              ? distance
              : event.key === "ArrowLeft"
                ? -distance
                : 0);
          const y =
            box.top +
            (event.key === "ArrowDown"
              ? distance
              : event.key === "ArrowUp"
                ? -distance
                : 0);
          setPosition(clampPosition(x, y, sectionRef.current));
        }}
        onPointerDown={(event) => {
          if (
            event.pointerType === "touch" ||
            !(event.target instanceof HTMLElement) ||
            event.target.closest("button")
          )
            return;
          const box = sectionRef.current!.getBoundingClientRect();
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            left: box.left,
            top: box.top,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          setPosition(
            clampPosition(
              drag.current.left + event.clientX - drag.current.x,
              drag.current.top + event.clientY - drag.current.y,
              sectionRef.current,
            ),
          );
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <span>
          youtube <i>↗</i>
        </span>
        <div>
          {position && (
            <button
              type="button"
              onClick={() => setPosition(null)}
              title="reset player position"
            >
              reset
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={
              open ? "collapse YouTube player" : "expand YouTube player"
            }
          >
            {open ? "−" : "+"}
          </button>
        </div>
      </div>
      {(open || videoId) && (
        <div className="mini-body" hidden={!open}>
          {videoId && (
            <div hidden={editing}>
              <iframe
                title="YouTube companion player"
                src={`https://www.youtube.com/embed/${videoId}?playsinline=1&origin=${encodeURIComponent(window.location.origin)}`}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
              <div className="mini-actions">
                <button type="button" onClick={() => setEditing(true)}>
                  change link
                </button>
                <a
                  href={`https://www.youtube.com/watch?v=${videoId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  open on youtube ↗
                </a>
              </div>
            </div>
          )}
          {(editing || !videoId) && (
            <form onSubmit={load}>
              <label htmlFor="youtube-url">youtube video link</label>
              <div className="mini-input">
                <input
                  id="youtube-url"
                  type="url"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="paste a link"
                  autoComplete="off"
                />
                <button type="submit">load ↗</button>
              </div>
              {videoId && (
                <button
                  className="mini-cancel"
                  type="button"
                  onClick={() => setEditing(false)}
                >
                  keep current video
                </button>
              )}
              {error && <p role="alert">{error}</p>}
            </form>
          )}
        </div>
      )}
    </section>
  );
}
