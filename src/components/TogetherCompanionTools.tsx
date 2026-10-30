import React, { useEffect, useRef, useState } from 'react';
import {
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
  durationMinutes?: number;
}

type AmbientSound = 'rain' | 'breeze' | 'hearth' | 'tea' | 'vinyl';

type AmbientSession = {
  context: AudioContext;
  master: GainNode;
  nodes: AudioNode[];
};

const AMBIENT_CHOICES: Array<{ id: AmbientSound; label: string }> = [
  { id: 'rain', label: 'Courtyard rain' },
  { id: 'hearth', label: 'Warm hearth' },
  { id: 'tea', label: 'Tea brewing' },
  { id: 'breeze', label: 'Garden breeze' },
  { id: 'vinyl', label: 'Vinyl needle hum' },
];

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function startAmbient(kind: AmbientSound, volume: number): AmbientSession | null {
  const AudioContextClass = window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  const context = new AudioContextClass();
  const master = context.createGain();
  master.gain.value = 0.008 + volume * 0.00055;
  master.connect(context.destination);

  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const samples = buffer.getChannelData(0);
  let previous = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const white = Math.random() * 2 - 1;
    previous = previous * 0.97 + white * 0.03;
    samples[i] =
      kind === 'rain'
        ? white * 0.35 + previous * 0.65
        : kind === 'vinyl'
          ? white * 0.12 + previous * 0.25
          : kind === 'tea'
            ? white * 0.08 + previous * 0.8
            : previous;
  }

  const noise = context.createBufferSource();
  const filter = context.createBiquadFilter();
  noise.buffer = buffer;
  noise.loop = true;
  filter.type = kind === 'rain' || kind === 'tea' ? 'lowpass' : 'bandpass';
  filter.frequency.value =
    kind === 'rain' ? 2200 : kind === 'breeze' ? 520 : kind === 'vinyl' ? 900 : kind === 'tea' ? 1250 : 180;
  filter.Q.value = kind === 'breeze' || kind === 'tea' ? 0.5 : 0.8;
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

  return { context, master, nodes };
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
 * Nothing starts automatically, and generated room audio makes no network
 * request. These are comforts, not part of the recommendation score.
 */
export const TogetherCompanionTools: React.FC<Props> = ({ durationMinutes = 5 }) => {
  const [timerMinutes, setTimerMinutes] = useState(durationMinutes);
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [activeAmbients, setActiveAmbients] = useState<AmbientSound[]>([]);
  const [ambientVolume, setAmbientVolume] = useState(35);
  const ambientSessions = useRef<Map<AmbientSound, AmbientSession>>(new Map());

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
      ambientSessions.current.forEach(stopAmbient);
      ambientSessions.current.clear();
    },
    []
  );

  useEffect(() => {
    ambientSessions.current.forEach((session) => {
      session.master.gain.setTargetAtTime(
        0.008 + ambientVolume * 0.00055,
        session.context.currentTime,
        0.04
      );
    });
  }, [ambientVolume]);

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

  const toggleAmbient = (kind: AmbientSound) => {
    const existing = ambientSessions.current.get(kind);
    if (existing) {
      stopAmbient(existing);
      ambientSessions.current.delete(kind);
      setActiveAmbients((current) => current.filter((item) => item !== kind));
      return;
    }
    const session = startAmbient(kind, ambientVolume);
    if (!session) return;
    ambientSessions.current.set(kind, session);
    setActiveAmbients((current) => [...current, kind]);
  };

  const stopAllAmbients = () => {
    ambientSessions.current.forEach(stopAmbient);
    ambientSessions.current.clear();
    setActiveAmbients([]);
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
              Nothing starts by itself. Room sounds are generated in this browser.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-parchment-200 dark:bg-vinyl-700 md:grid-cols-2">
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
          <p className="mt-3 text-sm text-loam-body dark:text-loam-body-dark">
            Layer one or two quiet textures. Each sound is made locally and starts only when selected.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {AMBIENT_CHOICES.map((choice) => {
              const playing = activeAmbients.includes(choice.id);
              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => toggleAmbient(choice.id)}
                  aria-pressed={playing}
                  className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm font-semibold ${
                    playing
                      ? 'border-plum-700 bg-plum-600 text-white'
                      : 'border-parchment-300 bg-white text-loam-body dark:border-vinyl-600 dark:bg-vinyl-900 dark:text-loam-body-dark'
                  }`}
                >
                  {choice.label}
                </button>
              );
            })}
          </div>
          <label htmlFor="ambient-volume" className="mt-4 block text-sm font-medium text-loam-body dark:text-loam-body-dark">
            Background volume · {ambientVolume}%
          </label>
          <input
            id="ambient-volume"
            type="range"
            min="10"
            max="70"
            step="5"
            value={ambientVolume}
            onChange={(event) => setAmbientVolume(Number(event.target.value))}
            className="kinship-slider mt-2 w-full"
          />
          {activeAmbients.length > 0 && (
            <button type="button" onClick={stopAllAmbients} className="loam-btn-secondary mt-4 w-full text-sm">
              <VolumeX className="h-4 w-4" aria-hidden="true" />
              Stop all room sounds
            </button>
          )}
        </div>

      </div>
    </section>
  );
};
