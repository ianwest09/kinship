// Zero-network Web Audio settling cadence: a three-step tempo arc, plus an optional
// warm EQ for hearing aids. Locally synthesised — no media files, no network.
// Safe inside sandboxed iframes (no external MP3s or network requests required).

export type HarmonicPreset =
  | 'sundowning_waltz_64bpm'
  | 'iso_phase1_96bpm'
  | 'iso_phase2_76bpm'
  | 'iso_phase3_62bpm'
  | 'cape_jazz_warmth'
  | 'chicago_soul_sixth'
  | 'showa_pentatonic_strings'
  | 'alpine_waltz_joy';

let activeCtx: AudioContext | null = null;
let activeId: string | null = null;
let stopTimers: number[] = [];
let activeStopCallback: (() => void) | null = null;

const CHORD_VOICINGS: Record<HarmonicPreset, { stepMs: number; chords: number[][] }> = {
  iso_phase1_96bpm: {
    stepMs: 1250, // ~96 BPM upbeat 2-beat cadence (matches restless pacing)
    chords: [
      [196.0, 246.94, 293.66, 392.0],  // G
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [196.0, 246.94, 293.66, 369.99], // Gmaj7
      [220.0, 293.66, 369.99, 440.0],  // D9
    ],
  },
  iso_phase2_76bpm: {
    stepMs: 1950, // ~76 BPM swaying waltz bridge
    chords: [
      [174.61, 220.0, 261.63, 349.23], // F
      [233.08, 293.66, 349.23, 440.0], // Bbmaj7
      [196.0, 246.94, 293.66, 349.23], // Gm7
      [196.0, 261.63, 329.63, 392.0],  // C9sus4
    ],
  },
  iso_phase3_62bpm: {
    stepMs: 2850, // ~62 BPM slowest step, for dusk settling
    chords: [
      [130.81, 196.0, 246.94, 329.63], // Cmaj7 warm cello register
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [130.81, 196.0, 246.94, 293.66], // Cadd9
      [130.81, 164.81, 196.0, 246.94], // Cmaj7 deep rest
    ],
  },
  sundowning_waltz_64bpm: {
    stepMs: 2600,
    chords: [
      [174.61, 220.0, 261.63, 329.63],
      [233.08, 293.66, 349.23, 440.0],
      [196.0, 246.94, 293.66, 349.23],
      [174.61, 220.0, 261.63, 349.23],
    ],
  },
  cape_jazz_warmth: {
    stepMs: 2100,
    chords: [
      [196.0, 246.94, 293.66, 369.99],
      [261.63, 329.63, 392.0, 493.88],
      [196.0, 246.94, 293.66, 392.0],
      [220.0, 293.66, 369.99, 440.0],
    ],
  },
  chicago_soul_sixth: {
    stepMs: 2000,
    chords: [
      [130.81, 261.63, 329.63, 440.0],
      [110.0, 220.0, 261.63, 392.0],
      [146.83, 261.63, 329.63, 440.0],
      [196.0, 246.94, 349.23, 440.0],
    ],
  },
  showa_pentatonic_strings: {
    stepMs: 2500,
    chords: [
      [146.83, 220.0, 293.66, 329.63],
      [196.0, 246.94, 293.66, 440.0],
      [164.81, 246.94, 329.63, 392.0],
      [146.83, 220.0, 293.66, 369.99],
    ],
  },
  alpine_waltz_joy: {
    stepMs: 2200,
    chords: [
      [233.08, 293.66, 349.23, 466.16],
      [174.61, 261.63, 349.23, 440.0],
      [196.0, 233.08, 293.66, 392.0],
      [233.08, 293.66, 349.23, 440.0],
    ],
  },
};

export function inferHarmonicPreset(titleOrLabel: string): HarmonicPreset {
  const s = titleOrLabel.toLowerCase();
  if (/makeba|ibrahim|mannenberg|cape|kwela|tems/.test(s)) return 'cape_jazz_warmth';
  if (/sakamoto|misora|showa|ghibli|hisaishi|tokyo|rafi|lata|gardel|panchos/.test(s))
    return 'showa_pentatonic_strings';
  if (/cooke|temptations|my girl|silk sonic|motown|soul/.test(s)) return 'chicago_soul_sixth';
  if (/sound of music|singin|edelweiss|beatles/.test(s)) return 'alpine_waltz_joy';
  return 'sundowning_waltz_64bpm';
}

export function stopHarmonicPreview() {
  for (const t of stopTimers) window.clearTimeout(t);
  stopTimers = [];
  if (activeCtx) {
    try {
      activeCtx.close();
    } catch {
      // ignore
    }
    activeCtx = null;
  }
  activeId = null;
  if (activeStopCallback) {
    const cb = activeStopCallback;
    activeStopCallback = null;
    cb();
  }
}

function createAudioChain(ctx: AudioContext, warmEq: boolean): AudioNode {
  const master = ctx.createGain();
  master.gain.value = 0.17;

  const lowShelf = ctx.createBiquadFilter();
  lowShelf.type = 'lowshelf';
  lowShelf.frequency.value = 250;
  lowShelf.gain.value = warmEq ? 4.5 : 1.5;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = warmEq ? 760 : 1200;
  lowpass.Q.value = 0.65;

  master.connect(lowShelf);
  lowShelf.connect(lowpass);
  lowpass.connect(ctx.destination);
  return master;
}

export function toggleHarmonicPreview(
  id: string,
  preset: HarmonicPreset,
  onEnded: () => void,
  warmEq = false
): boolean {
  if (activeId === id) {
    stopHarmonicPreview();
    return false;
  }
  stopHarmonicPreview();

  const AudioCtx =
    typeof window !== 'undefined'
      ? window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : undefined;
  if (!AudioCtx) return false;

  const ctx = new AudioCtx();
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  activeCtx = ctx;
  activeId = id;
  activeStopCallback = onEnded;

  const spec = CHORD_VOICINGS[preset] || CHORD_VOICINGS.sundowning_waltz_64bpm;
  const dest = createAudioChain(ctx, warmEq);

  const now = ctx.currentTime + 0.04;
  const stepSec = spec.stepMs / 1000;

  spec.chords.forEach((notes, chordIdx) => {
    const start = now + chordIdx * stepSec;
    const dur = stepSec * 0.96;
    notes.forEach((freq, voiceIdx) => {
      const osc = ctx.createOscillator();
      const voiceGain = ctx.createGain();
      osc.type = warmEq || voiceIdx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      const noteStart = start + voiceIdx * 0.06;
      voiceGain.gain.setValueAtTime(0.0001, noteStart);
      voiceGain.gain.exponentialRampToValueAtTime(0.24 / notes.length, noteStart + 0.22);
      voiceGain.gain.exponentialRampToValueAtTime(0.0008, start + dur);

      osc.connect(voiceGain);
      voiceGain.connect(dest);
      osc.start(noteStart);
      osc.stop(start + dur + 0.05);
    });
  });

  const totalMs = spec.chords.length * spec.stepMs + 200;
  stopTimers.push(
    window.setTimeout(() => {
      stopHarmonicPreview();
    }, totalMs)
  );

  return true;
}

export function toggleIsoPrincipleDemoArc(
  id: string,
  warmEq: boolean,
  onPhaseChange: (phase: 1 | 2 | 3 | null) => void
): boolean {
  if (activeId === id) {
    stopHarmonicPreview();
    return false;
  }
  stopHarmonicPreview();

  const AudioCtx =
    typeof window !== 'undefined'
      ? window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : undefined;
  if (!AudioCtx) return false;

  const ctx = new AudioCtx();
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  activeCtx = ctx;
  activeId = id;
  activeStopCallback = () => onPhaseChange(null);

  const dest = createAudioChain(ctx, warmEq);
  const phases: Array<{ phase: 1 | 2 | 3; preset: HarmonicPreset }> = [
    { phase: 1, preset: 'iso_phase1_96bpm' },
    { phase: 2, preset: 'iso_phase2_76bpm' },
    { phase: 3, preset: 'iso_phase3_62bpm' },
  ];

  let cursorSec = ctx.currentTime + 0.05;
  let elapsedMs = 0;

  onPhaseChange(1);

  phases.forEach(({ phase, preset }) => {
    const spec = CHORD_VOICINGS[preset];
    const twoChords = spec.chords.slice(0, 2);
    const stepSec = spec.stepMs / 1000;

    if (phase > 1) {
      const triggerAt = elapsedMs;
      stopTimers.push(window.setTimeout(() => onPhaseChange(phase), triggerAt));
    }

    twoChords.forEach((notes, idx) => {
      const start = cursorSec + idx * stepSec;
      const dur = stepSec * 0.96;
      notes.forEach((freq, vIdx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = warmEq || vIdx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        const ns = start + vIdx * 0.06;
        g.gain.setValueAtTime(0.0001, ns);
        g.gain.exponentialRampToValueAtTime(0.24 / notes.length, ns + 0.2);
        g.gain.exponentialRampToValueAtTime(0.0008, start + dur);
        osc.connect(g);
        g.connect(dest);
        osc.start(ns);
        osc.stop(start + dur + 0.05);
      });
    });

    const phaseDurationSec = twoChords.length * stepSec;
    cursorSec += phaseDurationSec;
    elapsedMs += phaseDurationSec * 1000;
  });

  stopTimers.push(window.setTimeout(() => stopHarmonicPreview(), elapsedMs + 250));
  return true;
}
