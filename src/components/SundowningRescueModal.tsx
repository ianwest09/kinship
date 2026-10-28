import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Ear,
  HeartHandshake,
  MoonStar,
  PhoneCall,
  Play,
  ShieldCheck,
  Sparkles,
  Square,
  X,
} from 'lucide-react';
import { KinshipPrescriptionResponse, YouthGeographyId } from '../../shared/types';
import { useDialogBehaviour } from '../hooks/useDialogBehaviour';
import {
  HarmonicPreset,
  stopHarmonicPreview,
  toggleHarmonicPreview,
  toggleIsoPrincipleDemoArc,
} from '../utils/harmonicPlayer';

interface Props {
  open: boolean;
  onClose: () => void;
  data: KinshipPrescriptionResponse | null;
  onToggleWarmEq: () => void;
}

const DEMENTIA_HELPLINES: Record<YouthGeographyId, { org: string; phone: string }> = {
  cape_town: {
    org: 'Dementia SA & Alzheimer’s South Africa National Helpline',
    phone: '0860 636 679 · SADAG 0800 567 567',
  },
  chicago: {
    org: 'Alzheimer’s Association 24/7 Caregiver Helpline (US)',
    phone: '1-800-272-3900 (24/7 Free Clinical Coaches)',
  },
  nyc_brooklyn: {
    org: 'Alzheimer’s Association 24/7 Helpline & CaringKind NYC',
    phone: '1-800-272-3900 · 646-744-2900',
  },
  london: {
    org: 'Dementia UK Admiral Nurse Line & Alzheimer’s Society',
    phone: '0800 888 6678 · 0333 150 3456',
  },
  tokyo: {
    org: 'Alzheimer’s Association Japan (AAJ) Telephone Counseling',
    phone: '0120-294-456',
  },
  kingston: {
    org: 'Alzheimer’s Jamaica & UK Caribbean Dementia Support',
    phone: '+1 876-927-8967 · 0800 888 6678',
  },
  mumbai: {
    org: 'ARDSI (Alzheimer’s & Related Disorders Society of India) Helpline',
    phone: '+91 484-2808088 · Vandrevala 1860-2662-345',
  },
  buenos_aires: {
    org: 'ALMA (Asociación Lucha contra el Mal de Alzheimer Argentina)',
    phone: '+54 11 4861-3986 · Línea 135',
  },
};

export const SundowningRescueModal: React.FC<Props> = ({
  open,
  onClose,
  data,
  onToggleWarmEq,
}) => {
  const [activeIsoPhase, setActiveIsoPhase] = useState<1 | 2 | 3 | null>(null);
  const [playingSinglePhase, setPlayingSinglePhase] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Escape closes, focus is moved in and kept in, the page behind stops
  // scrolling, and focus goes back to whatever opened the dialog. Previously
  // none of that happened: the only way out was to find the Close button, and a
  // keyboard user could tab straight through into the page underneath.
  useDialogBehaviour({
    open,
    onClose,
    dialogRef,
    initialFocusRef: closeButtonRef,
  });

  useEffect(() => {
    if (!open) {
      stopHarmonicPreview();
      setActiveIsoPhase(null);
      setPlayingSinglePhase(null);
    }
  }, [open]);

  // Also stop on unmount. The dialog is now only mounted while it is open, and
  // leaving sound running behind a closed dialog would be the one thing this
  // screen must never do.
  useEffect(() => () => stopHarmonicPreview(), []);

  if (!open || !data) return null;

  const { guardrailsApplied, isoPrincipleArc, sensoryTactileKit } = data;
  const warmEq = Boolean(guardrailsApplied.hearingLossWarmEq);
  const line = DEMENTIA_HELPLINES[guardrailsApplied.youthGeography] || DEMENTIA_HELPLINES.chicago;

  const phasePresetMap: Record<1 | 2 | 3, HarmonicPreset> = {
    1: 'iso_phase1_96bpm',
    2: 'iso_phase2_76bpm',
    3: 'iso_phase3_62bpm',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-vinyl-950/95 backdrop-blur-md p-4 overflow-y-auto no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settling-title"
      aria-describedby="settling-subtitle"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-5xl rounded-3xl border border-brass-800/50 bg-vinyl-900 text-parchment-100 shadow-lift overflow-hidden my-auto"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 border-b border-vinyl-700 bg-vinyl-950">
          <div className="min-w-0">
            {/* This is the screen a distressed family opens at 4:30 in the
                afternoon. It used to be titled with clinical protocol jargon;
                it now says what it is, with the mechanism underneath. */}
            <h2
              id="settling-title"
              className="flex items-center gap-2.5 text-lg md:text-xl font-serif font-semibold text-parchment-50"
            >
              <MoonStar className="w-5 h-5 shrink-0 text-brass-300" aria-hidden="true" />
              <span>Settling sounds for the late afternoon</span>
            </h2>
            <p id="settling-subtitle" className="mt-1 text-meta text-brass-200">
              Sound that eases down in three steps — 96, then 76, then 62 beats a
              minute. Stop it at any point.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleWarmEq}
              aria-pressed={warmEq}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition ${
                warmEq
                  ? 'border-pine-400/70 bg-vinyl-900/80 text-pine-200'
                  : 'border-vinyl-700 bg-vinyl-800 text-loam-body-dark'
              }`}
            >
              <Ear className="w-4 h-4" aria-hidden="true" />
              <span>Warmer, softer sound: {warmEq ? 'on' : 'off'}</span>
            </button>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-vinyl-700 bg-vinyl-800 text-sm font-semibold text-parchment-100 hover:bg-vinyl-700"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              Close
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 4 Cols: Validation Script + Instant Olfactory Grounding */}
          <div className="lg:col-span-4 rounded-2xl border border-vinyl-700 bg-vinyl-950 p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="text-meta font-mono uppercase tracking-wider break-words text-brass-300">
                Three things that help
              </div>
              <h3 className="font-serif text-lg text-parchment-50 leading-snug">
                “I want to go home” is usually about feeling safe — not a question
                about a place.
              </h3>
              <div className="space-y-2.5 text-xs leading-relaxed">
                <div className="p-3 rounded-xl bg-vinyl-900 border border-vinyl-700">
                  <div className="font-semibold text-brass-200">01 · Agree with the feeling</div>
                  <p className="text-loam-body-dark mt-1">
                    <em>“You miss home so much, {guardrailsApplied.elderName}. You’re completely safe tonight — everything is looked after.”</em>
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-vinyl-900 border border-vinyl-700">
                  <div className="font-semibold text-brass-200">02 · Soften the room, add a familiar smell</div>
                  <p className="text-loam-body-dark mt-1">
                    Close the curtains — reflections in dark glass can look like
                  strangers — and offer something familiar such as{' '}
                    <strong className="text-brass-100">{sensoryTactileKit[0]?.name}</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-brass-950/40 border border-brass-700/40 text-meta text-brass-100">
              <strong>Why start at their pace?</strong> Music that begins close to
              how someone is moving right now is easier to follow than something
              immediately slow, so the sound starts near 96 beats a minute and
              eases down over about 15 minutes. It is a common music-therapy
              approach — not a treatment, and it will not work every time.
            </div>
          </div>

          {/* Right 8 Cols: Interactive 3-Phase Iso-Principle Step-Down Sequencer */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-brass-200 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-pine-300" />
                  About 15 minutes, slowing in three steps (96 → 76 → 62 beats a minute)
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setPlayingSinglePhase(null);
                    toggleIsoPrincipleDemoArc('iso-full-arc', warmEq, (ph) => setActiveIsoPhase(ph));
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brass-500 hover:bg-brass-400 text-vinyl-950 text-sm md:text-base font-bold transition"
                >
                  {activeIsoPhase !== null ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop Step-Down Arc (Phase {activeIsoPhase}/3)</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play the whole 15 minutes</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-2.5">
                {isoPrincipleArc.map((step) => {
                  const isHighlighted = activeIsoPhase === step.phase || playingSinglePhase === step.phase;
                  return (
                    <div
                      key={step.phase}
                      className={`rounded-2xl border p-4 transition-all ${
                        isHighlighted
                          ? 'border-brass-400 bg-vinyl-800 ring-1 ring-brass-400'
                          : 'border-brass-800/40 bg-vinyl-800'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-brass-500/20 border border-brass-400/40 font-mono text-meta font-bold text-brass-200">
                            PHASE 0{step.phase} · {step.minuteRange} · {step.targetBpm} BPM
                          </span>
                          <span className="text-xs font-semibold text-white">{step.phaseTitle}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveIsoPhase(null);
                            const started = toggleHarmonicPreview(
                              `iso-single-${step.phase}`,
                              phasePresetMap[step.phase],
                              () => setPlayingSinglePhase(null),
                              warmEq
                            );
                            setPlayingSinglePhase(started ? step.phase : null);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-vinyl-950 border border-vinyl-700 text-meta text-brass-200 hover:bg-vinyl-700"
                        >
                          {playingSinglePhase === step.phase ? (
                            <>
                              <Square className="w-3 h-3 fill-current" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current" />
                              <span>Hear step {step.phase} · {step.targetBpm} bpm</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="mt-1.5 text-sm font-serif font-semibold text-brass-100">
                        {step.cueName} ({step.cueYear} · Age {step.elderAgeThen})
                      </div>
                      <p className="text-xs text-loam-body-dark mt-0.5">{step.clinicalMechanism}</p>
                      <div className="mt-2 text-meta text-pine-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>{step.whisperPrompt}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-vinyl-700 bg-vinyl-950 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start gap-2">
                <HeartHandshake className="w-4 h-4 text-brass-300 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-parchment-100 flex items-center gap-1.5">
                    <span>{line.org}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-pine-300" />
                  </div>
                  <div className="text-meta text-loam-muted">
                    Free, confidential support lines published by these organisations. Check the number before you rely on it — Kinship does not maintain this list.
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-brass-950/70 border border-brass-700/60 px-3 py-1.5 text-xs font-mono font-semibold text-brass-200 shrink-0">
                <PhoneCall className="w-3.5 h-3.5" />
                {line.phone}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
