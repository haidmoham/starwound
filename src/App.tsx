import { useEffect, useMemo, useState } from "react";
import { Installation } from "./core/installation.ts";
import { DEFAULT_PARAMETERS } from "./core/orbit.ts";
import { RuptureBackdrop } from "./render/RuptureBackdrop.tsx";
import { AmbientSound } from "./media/AmbientSound.tsx";

export function App() {
  const installation = useMemo(
    () =>
      new Installation({
        ...DEFAULT_PARAMETERS,
        angularMomentum: 0.66,
        dispersion: 0.018,
        receptivity: 0.82,
      }),
    [],
  );
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  return (
    <main aria-label="Starwound: a wounded living field">
      <RuptureBackdrop installation={installation} paused={reducedMotion} />
      <a className="cluster-return" href="https://shin86.dev/">
        ← shin86.dev
      </a>
      <AmbientSound />
    </main>
  );
}
