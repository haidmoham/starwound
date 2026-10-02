// Authored physiology, sampled from simulation time. This never forces the model.
// Unequal attempts repeat only after a long phrase; every joint has zero velocity
// at its endpoints so a held breath and the phrase seam cannot snap.
const attempts = [
  { duration: 7.8, strength: 0.84, catch: 0.14 },
  { duration: 6.4, strength: 0.61, catch: 0.23 },
  { duration: 9.1, strength: 0.94, catch: 0.19 },
  { duration: 7.2, strength: 0.55, catch: 0.27 },
  { duration: 8.6, strength: 0.72, catch: 0.16 },
  { duration: 6.9, strength: 0.47, catch: 0.25 },
  { duration: 9.8, strength: 0.88, catch: 0.21 },
] as const;
const phraseLength = attempts.reduce(
  (sum, attempt) => sum + attempt.duration,
  0,
);
const smooth = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};
const beat = (age: number, onset: number, strength: number) =>
  age < onset
    ? 0
    : strength *
      smooth((age - onset) / 0.065) *
      Math.exp(-(age - onset) / 0.23);

export function vitalMotion(time: number, seed: number) {
  // The first frame is already partway into an effort. Negative delayed samples
  // wrap the same phrase, rather than inventing a different startup motion.
  const offset = 1.1 + ((seed >>> 0) % 997) / 997;
  const absolute = time + offset;
  const phrase = Math.floor(absolute / phraseLength);
  let local = absolute - phrase * phraseLength;
  let index = 0;
  let start = phrase * phraseLength - offset;
  while (index < attempts.length - 1 && local >= attempts[index].duration) {
    local -= attempts[index].duration;
    start += attempts[index].duration;
    index++;
  }
  const attempt = attempts[index];
  const phase = local / attempt.duration;
  const strength = attempt.strength;
  // Rise, falter, try again, hold, then let the weight fall slowly.
  const knots = [0, 0.2, 0.29, 0.4, 0.48, 0.81, 1];
  const values = [
    0,
    strength * 0.7,
    strength * (0.7 - attempt.catch),
    strength,
    strength,
    0.06,
    0,
  ];
  let joint = 0;
  while (joint < knots.length - 2 && phase > knots[joint + 1]) joint++;
  const fraction = (phase - knots[joint]) / (knots[joint + 1] - knots[joint]);
  const breath =
    values[joint] + (values[joint + 1] - values[joint]) * smooth(fraction);
  const resistance =
    strength *
    smooth((phase - 0.29) / 0.11) *
    (1 - smooth((phase - 0.48) / 0.18));
  const release =
    strength *
    smooth((phase - 0.48) / 0.035) *
    (1 - smooth((phase - 0.53) / 0.22));
  const pulse =
    beat(local, attempt.duration * 0.32, strength * 0.75) +
    beat(local, attempt.duration * 0.32 + 0.29, strength * 0.31);
  // A continuous travel coordinate slows during the hold, then recovers. Its
  // integral uses the same breath envelope; no unrelated animation oscillator.
  let area = 0;
  for (let previous = 0; previous < index; previous++) {
    const a = attempts[previous];
    area += a.duration * (a.strength * (0.4715 - a.catch * 0.1) + 0.0156);
  }
  const phraseArea = attempts.reduce(
    (sum, a) =>
      sum + a.duration * (a.strength * (0.4715 - a.catch * 0.1) + 0.0156),
    0,
  );
  for (let segment = 0; segment <= joint; segment++) {
    const span = knots[segment + 1] - knots[segment];
    const u = segment === joint ? Math.max(0, Math.min(1, fraction)) : 1;
    const integral = u * u * u - 0.5 * u * u * u * u;
    area +=
      attempt.duration *
      span *
      (values[segment] * u +
        (values[segment + 1] - values[segment]) * integral);
  }
  const travel = time * 0.31 - (phrase * phraseArea + area) * 0.18;
  // Detached matter uses the actual release event, including the prior attempt
  // while an older cohort is still fading. Budgets remain index-addressed.
  let releaseAt = start + attempt.duration * 0.48;
  let releaseStrength = strength;
  if (time < releaseAt) {
    const prior = attempts[(index + attempts.length - 1) % attempts.length];
    releaseAt = start - prior.duration * 0.52;
    releaseStrength = prior.strength;
  }
  return {
    breath,
    resistance,
    release,
    pulse,
    travel,
    releaseAge: time - releaseAt,
    releaseStrength,
  };
}
