/** A slow observer drift, sampled from world time so a held image stays held. */
export function cameraDrift(time: number) {
  return {
    x: Math.sin(time * 0.045) * 0.075,
    y: Math.sin(time * 0.029) * 0.035,
    scale: 1 + (1 - Math.cos(time * 0.031)) * 0.018,
  };
}
