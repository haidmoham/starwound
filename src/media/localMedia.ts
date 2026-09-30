interface MediaElement {
  src: string;
  load: () => void;
  pause: () => void;
  removeAttribute: (name: string) => void;
}
interface ObjectUrls {
  createObjectURL: (blob: Blob) => string;
  revokeObjectURL: (url: string) => void;
}

/** Browser API boundary; cleanup is safe to call again after a failed mount. */
export function bindLocalMedia(
  audio: MediaElement,
  file: Blob,
  urls: ObjectUrls = URL,
): () => void {
  const url = urls.createObjectURL(file);
  audio.src = url;
  audio.load();
  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    urls.revokeObjectURL(url);
  };
}
