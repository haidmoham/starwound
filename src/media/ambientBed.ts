export interface AmbientBedOptions {
  /** Called only by setEnabled(true), never by construction or visibility. */
  createContext?: () => AudioContext;
  onEnabledChange?: (enabled: boolean) => void;
}

export interface AmbientBed {
  readonly enabled: boolean;
  /** Call directly from a user gesture, not from a React effect. */
  setEnabled(enabled: boolean): Promise<boolean>;
  /** Hiding preserves the user's choice but suspends the audio clock. */
  setVisible(visible: boolean): void;
  dispose(): void;
}

const LISTENING_GAIN = 0.24;
const FADE_IN_SECONDS = 1.2;
const FADE_OUT_SECONDS = 0.14;

interface SoundGraph {
  context: AudioContext;
  master: GainNode;
  release(): void;
}

/** Original D-minor/flat-second drone; no recordings or media/model inputs. */
function buildGraph(context: AudioContext): SoundGraph {
  const nodes: AudioNode[] = [];
  const sources: AudioScheduledSourceNode[] = [];
  const own = <T extends AudioNode>(node: T): T => {
    nodes.push(node);
    return node;
  };
  const start = <T extends AudioScheduledSourceNode>(source: T): T => {
    sources.push(source);
    source.start();
    return source;
  };
  const release = () => {
    for (const source of sources) {
      try {
        source.stop();
      } catch {
        // A partially constructed or already stopped source is still detached.
      }
    }
    for (const node of nodes) node.disconnect();
    sources.length = 0;
    nodes.length = 0;
  };

  try {
    const master = own(context.createGain());
    master.gain.value = 0;
    master.connect(context.destination);

    const lowCut = own(context.createBiquadFilter());
    lowCut.type = "highpass";
    lowCut.frequency.value = 28;
    lowCut.Q.value = 0.45;
    lowCut.connect(master);

    const body = own(context.createBiquadFilter());
    body.type = "lowpass";
    body.frequency.value = 820;
    body.Q.value = 0.45;
    body.connect(lowCut);

    // A very dark, bounded echo lends distance without a bright reverb wash.
    const delay = own(context.createDelay(1));
    delay.delayTime.value = 0.71;
    const room = own(context.createBiquadFilter());
    room.type = "lowpass";
    room.frequency.value = 360;
    room.Q.value = 0.45;
    const feedback = own(context.createGain());
    feedback.gain.value = 0.23;
    const wet = own(context.createGain());
    wet.gain.value = 0.16;
    body.connect(delay);
    delay.connect(room);
    room.connect(feedback);
    feedback.connect(delay);
    room.connect(wet);
    wet.connect(lowCut);

    const modulate = (target: AudioParam, rate: number, depth: number) => {
      const oscillator = own(context.createOscillator());
      oscillator.frequency.value = rate;
      const amount = own(context.createGain());
      amount.gain.value = depth;
      oscillator.connect(amount);
      amount.connect(target);
      start(oscillator);
    };

    // Unequal long swells and tiny detuning suggest strain, never a beat.
    const voices = [
      { hz: 36.708, level: 0.075, pan: 0, rate: 0.031, type: "sine" },
      { hz: 73.416, level: 0.11, pan: -0.08, rate: 0.043, type: "triangle" },
      { hz: 110, level: 0.058, pan: 0.22, rate: 0.023, type: "sine" },
      { hz: 146.832, level: 0.026, pan: -0.28, rate: 0.019, type: "sine" },
      { hz: 174.614, level: 0.019, pan: 0.31, rate: 0.017, type: "sine" },
      { hz: 155.563, level: 0.011, pan: -0.2, rate: 0.013, type: "sine" },
    ] as const;

    voices.forEach((voice, index) => {
      const oscillator = own(context.createOscillator());
      oscillator.type = voice.type;
      oscillator.frequency.value = voice.hz;
      oscillator.detune.value = index % 2 === 0 ? -2 : 2;
      const gain = own(context.createGain());
      gain.gain.value = voice.level;
      const pan = own(context.createStereoPanner());
      pan.pan.value = voice.pan;
      oscillator.connect(gain);
      gain.connect(pan);
      pan.connect(body);
      modulate(gain.gain, voice.rate, voice.level * 0.38);
      modulate(oscillator.detune, 0.009 + index * 0.0023, 3 + index);
      start(oscillator);
    });
    modulate(body.frequency, 0.011, 180);

    // Locally synthesized, seeded air. The finite buffer loops on the audio
    // clock; there is no wall-time scheduler to catch up after a hidden tab.
    const noise = own(context.createBufferSource());
    const buffer = context.createBuffer(1, context.sampleRate * 8, context.sampleRate);
    const samples = buffer.getChannelData(0);
    let seed = 0x53574152;
    for (let index = 0; index < samples.length; index += 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      samples[index] = (seed / 0x100000000) * 2 - 1;
    }
    noise.buffer = buffer;
    noise.loop = true;
    const air = own(context.createBiquadFilter());
    air.type = "bandpass";
    air.frequency.value = 410;
    air.Q.value = 0.55;
    const airGain = own(context.createGain());
    airGain.gain.value = 0.022;
    noise.connect(air);
    air.connect(airGain);
    airGain.connect(body);
    modulate(airGain.gain, 0.037, 0.009);
    start(noise);

    return { context, master, release };
  } catch (error) {
    release();
    throw error;
  }
}

/**
 * Opt-in audio transport, deliberately independent of the installation clock.
 * Construction is silent and allocates no browser resources. Resume is called
 * synchronously by setEnabled so the first call retains browser user activation.
 */
export function createAmbientBed(options: AmbientBedOptions = {}): AmbientBed {
  let graph: SoundGraph | null = null;
  let enabled = false;
  let visible = true;
  let disposed = false;
  let revision = 0;
  let suspendTimer: ReturnType<typeof setTimeout> | undefined;
  let envelope = { from: 0, to: 0, start: 0, end: 0 };

  const shouldPlay = () => enabled && visible && !disposed;
  const clearSuspendTimer = () => {
    if (suspendTimer !== undefined) clearTimeout(suspendTimer);
    suspendTimer = undefined;
  };
  const changeEnabled = (value: boolean) => {
    if (enabled === value) return;
    enabled = value;
    options.onEnabledChange?.(value);
  };
  const ramp = (target: number, seconds: number) => {
    if (!graph || graph.context.state === "closed") return;
    const now = graph.context.currentTime;
    const fraction =
      envelope.end <= envelope.start
        ? 1
        : Math.max(0, Math.min(1, (now - envelope.start) / (envelope.end - envelope.start)));
    const current = envelope.from + (envelope.to - envelope.from) * fraction;
    const gain = graph.master.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(seconds === 0 ? target : current, now);
    if (seconds > 0) gain.linearRampToValueAtTime(target, now + seconds);
    envelope = { from: current, to: target, start: now, end: now + seconds };
  };
  const close = (context: AudioContext) => {
    if (context.state !== "closed") void context.close().catch(() => undefined);
  };

  const suspend = (ticket: number) => {
    const current = graph;
    if (!current || disposed || ticket !== revision || shouldPlay()) return;
    if (current.context.state === "closed") return;
    void current.context.suspend().then(
      () => {
        // An enable/visibility gesture may have overtaken an in-flight suspend.
        if (current === graph && shouldPlay() && current.context.state !== "running") {
          void resume(revision);
        }
      },
      () => {
        // Gain is already zero even if the browser cannot suspend its device.
      },
    );
  };

  const resume = (ticket: number): Promise<boolean> => {
    const current = graph;
    if (!current || !shouldPlay()) return Promise.resolve(enabled);
    const failed = () => {
      if (current === graph && ticket === revision && !disposed) {
        ramp(0, 0);
        changeEnabled(false);
        suspend(ticket);
      }
      return enabled;
    };
    try {
      // Do not defer this call into a promise queue: that loses user activation.
      return current.context.resume().then(() => {
        if (disposed || current !== graph) return false;
        if (!shouldPlay()) {
          ramp(0, 0);
          suspend(revision);
        } else if (ticket === revision) {
          if (current.context.state !== "running") return failed();
          ramp(LISTENING_GAIN, FADE_IN_SECONDS);
        }
        return enabled;
      }, failed);
    } catch {
      return Promise.resolve(failed());
    }
  };

  return {
    get enabled() {
      return enabled;
    },
    setEnabled(value) {
      if (disposed) return Promise.resolve(false);
      const ticket = ++revision;
      clearSuspendTimer();
      changeEnabled(value);
      if (!value) {
        ramp(0, FADE_OUT_SECONDS);
        if (graph) {
          suspendTimer = setTimeout(() => {
            suspendTimer = undefined;
            suspend(ticket);
          }, FADE_OUT_SECONDS * 1000 + 30);
        }
        return Promise.resolve(false);
      }
      if (!graph) {
        let context: AudioContext | undefined;
        try {
          context = options.createContext?.() ?? new AudioContext();
          graph = buildGraph(context);
        } catch {
          if (context) close(context);
          changeEnabled(false);
          return Promise.resolve(false);
        }
      }
      if (!visible) {
        ramp(0, 0);
        suspend(ticket);
        return Promise.resolve(enabled);
      }
      return resume(ticket);
    },
    setVisible(value) {
      if (disposed || value === visible) return;
      visible = value;
      const ticket = ++revision;
      clearSuspendTimer();
      if (!shouldPlay()) {
        // Hide immediately, including when a first resume is still pending.
        ramp(0, 0);
        suspend(ticket);
      } else {
        void resume(ticket);
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      enabled = false;
      revision += 1;
      clearSuspendTimer();
      if (!graph) return;
      ramp(0, 0);
      const current = graph;
      graph = null;
      current.release();
      close(current.context);
    },
  };
}
