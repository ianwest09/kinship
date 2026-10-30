import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AudioLines,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Timer,
  Volume2,
  VolumeX,
  Waves,
} from 'lucide-react';

interface Props {
  title: string;
  invitation: string;
  durationMinutes?: number;
}

type AmbientSound = 'rain' | 'breeze' | 'hearth';

type AmbientSession = {
  context: AudioContext;
  nodes: AudioNode[];
};

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function startAmbient(kind: AmbientSound): AmbientSession | null {
  const AudioContextClass = window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  const context = new AudioContextClass();
  const master = context.createGain();
  master.gain.value = 0.045;
  master.connect(context.destination);

  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const samples = buffer.getChannelData(0);
  let previous = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const white = Math.random() * 2 - 1;
    previous = previous * 0.97 + white * 0.03;
    samples[i] = kind === 'rain' ? white * 0.35 + previous * 0.65 : previous;
  }

  const noise = context.createBufferSource();
  const filter = context.createBiquadFilter();
  noise.buffer = buffer;
  noise.loop = true;
  filter.type = kind === 'rain' ? 'lowpass' : 'bandpass';
  filter.frequency.value = kind === 'rain' ? 2200 : kind === 'breeze' ? 520 : 180;
  filter.Q.value = kind === 'breeze' ? 0.5 : 0.8;
  noise.connect(filter);
  filter.connect(master);
  noise.start();

  const nodes: AudioNode[] = [noise, filter, master];
  if (kind === 'hearth') {
    const oscillator = context.createOscillator();
    const glow = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 74;
    glow.gain.value = 0.08;
    oscillator.connect(glow);
    glow.connect(master);
    oscillator.start();
    nodes.push(oscillator, glow);
  }

  return { context, nodes };
}

function stopAmbient(session: AmbientSession | null) {
  if (!session) return;
  session.nodes.forEach((node) => {
    if ('stop' in node && typeof node.stop === 'function') {
      try {
        node.stop();
      } catch {
        /* already stopped */
      }
    }
    try {
      node.disconnect();
    } catch {
      /* already disconnected */
    }
  });
  void session.context.close();
}

/**
 * Optional, browser-only session helpers adapted from the Drive prototype.
 * Nothing starts automatically, and neither audio nor narration makes a
 * network request. These are comforts, not part of the recommendation score.
 */
export const TogetherCompanionTools: React.FC<Props> = ({
  title,
  invitation,
  durationMinutes = 5,
}) => {
  const [timerMinutes, setTimerMinutes] = useState(durationMinutes);
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [ambient, setAmbient] = useState<AmbientSound>('breeze');
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const ambientSession = useRef<AmbientSession | null>(null);

  const narration = useMemo(
    () => `${title}. ${invitation} There is no need to remember anything. We can stop whenever you like.`,
    [title, invitation]
  );
  const speechAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!timerRunning) return undefined;
    const id = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  useEffect(
    () => () => {
      stopAmbient(ambientSession.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    },
    []
  );

  const changeTimer = (delta: number) => {
    const next = Math.min(15, Math.max(1, timerMinutes + delta));
    setTimerMinutes(next);
    setSecondsLeft(next * 60);
    setTimerRunning(false);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setSecondsLeft(timerMinutes * 60);
  };

  const toggleAmbient = () => {
    if (ambientPlaying) {
      stopAmbient(ambientSession.current);
      ambientSession.current = null;
      setAmbientPlaying(false);
      return;
    }
    ambientSession.current = startAmbient(ambient);
    setAmbientPlaying(Boolean(ambientSession.current));
  };

  const chooseAmbient = (next: AmbientSound) => {
    const wasPlaying = ambientPlaying;
    stopAmbient(ambientSession.current);
    ambientSession.current = null;
    setAmbient(next);
    setAmbientPlaying(false);
    if (wasPlaying) {
      ambientSession.current = startAmbient(next);
      setAmbientPlaying(Boolean(ambientSession.current));
    }
  };

  const toggleNarration = () => {
    if (!speechAvailable) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(narration);
    utterance.rate = 0.82;
    utterance.pitch = 0.92;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  return (
    <section className="loam-card overflow-hidden" aria-labelledby="together-tools-heading">
      <div className="border-b border-parchment-200 bg-parchment-50 px-5 py-4 dark:border-vinyl-700 dark:bg-vinyl-900 md:px-7">
        <div className="flex items-start gap-3">
          <Waves className="mt-0.5 h-5 w-5 shrink-0 text-plum-600 dark:text-plum-300" aria-hidden="true" />
          <div>
            <h3 id="together-tools-heading" className="text-base font-semibold text-loam-ink dark:text-parchment-50">
              Optional things to make the room gentler
            </h3>
            <p className="mt-1 text-sm text-loam-body dark:text-loam-body-dark">
              Nothing starts by itself. Sound and speech stay in this browser.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-parchment-200 dark:bg-vinyl-700 md:grid-cols-3">
        <div className="bg-loam-card p-5 dark:bg-vinyl-800 md:p-6">
          <div className="flex items-center gap-2 text-loam-ink dark:text-parchment-50">
            <Timer className="h-5 w-5" aria-hidden="true" />
            <h4 className="font-semibold">Gentle timer</h4>
          </div>
          <p className="mt-3 font-serif text-4xl tabular-nums text-loam-ink dark:text-parchment-50" aria-live="off">
            {formatTime(secondsLeft)}
          </p>
          <p className="mt-1 text-xs text-loam-muted dark:text-loam-muted-dark">
            A guide only. No need to finish.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTimerRunning((value) => !value)}
              className="loam-btn-secondary text-sm"
              aria-label={timerRunning ? 'Pause gentle timer' : 'Start gentle timer'}
            >
              {timerRunning ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
              {timerRunning ? 'Pause' : 'Start'}
            </button>
            <button type="button" onClick={resetTimer} className="loam-btn-quiet" aria-label="Reset gentle timer">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button type="button" onClick={() => changeTimer(-1)} className="loam-btn-quiet" aria-label="Subtract one minute">
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="text-sm text-loam-body dark:text-loam-body-dark">{timerMinutes} min</span>
            <button type="button" onClick={() => changeTimer(1)} className="loam-btn-quiet" aria-label="Add one minute">
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="bg-loam-card p-5 dark:bg-vinyl-800 md:p-6">
          <div className="flex items-center gap-2 text-loam-ink dark:text-parchment-50">
            <Volume2 className="h-5 w-5" aria-hidden="true" />
            <h4 className="font-semibold">Room sound</h4>
          </div>
          <label htmlFor="ambient-sound" className="mt-3 block text-sm font-medium text-loam-body dark:text-loam-body-dark">
            Choose a quiet texture
          </label>
          <select
            id="ambient-sound"
            value={ambient}
            onChange={(event) => chooseAmbient(event.target.value as AmbientSound)}
            className="mt-2 w-full rounded-xl border border-parchment-300 bg-white px-3 py-2.5 text-sm text-loam-ink dark:border-vinyl-600 dark:bg-vinyl-900 dark:text-parchment-50"
          >
            <option value="breeze">Soft breeze</option>
            <option value="rain">Distant rain</option>
            <option value="hearth">Low hearth hum</option>
          </select>
          <button type="button" onClick={toggleAmbient} className="loam-btn-secondary mt-4 w-full text-sm" aria-pressed={ambientPlaying}>
            {ambientPlaying ? <VolumeX className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}
            {ambientPlaying ? 'Stop room sound' : 'Play room sound'}
          </button>
        </div>

        <div className="bg-loam-card p-5 dark:bg-vinyl-800 md:p-6">
          <div className="flex items-center gap-2 text-loam-ink dark:text-parchment-50">
            <AudioLines className="h-5 w-5" aria-hidden="true" />
            <h4 className="font-semibold">Read it aloud</h4>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-loam-body dark:text-loam-body-dark">
            Your browser can read the invitation slowly. It is generated on this device.
          </p>
          <button
            type="button"
            onClick={toggleNarration}
            disabled={!speechAvailable}
            className="loam-btn-secondary mt-4 w-full text-sm disabled:cursor-not-allowed disabled:opacity-50"
            aria-pressed={speaking}
          >
            {speaking ? <VolumeX className="h-4 w-4" aria-hidden="true" /> : <AudioLines className="h-4 w-4" aria-hidden="true" />}
            {speaking ? 'Stop reading' : 'Read invitation'}
          </button>
          {!speechAvailable && (
            <p className="mt-2 text-xs text-loam-muted dark:text-loam-muted-dark">Read-aloud is not available in this browser.</p>
          )}
        </div>
      </div>
    </section>
  );
};
