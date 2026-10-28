import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!open) {
      stopHarmonicPreview();
      setActiveIsoPhase(null);
      setPlayingSinglePhase(null);
    }
  }, [open]);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#120F16]/95 backdrop-blur-md p-4 overflow-y-auto no-print"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-5xl rounded-3xl border border-amber-800/50 bg-[#1B1620] text-[#F7F1E5] shadow-2xl overflow-hidden my-auto">
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 border-b border-[#31283A] bg-[#151119]">
          <div className="flex items-center gap-2.5">
            <MoonStar className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-200">
              4:30 PM Sundowning Iso-Principle Step-Down &amp; De-Escalation Protocol
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleWarmEq}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                warmEq
                  ? 'border-emerald-500/70 bg-emerald-950/80 text-emerald-200'
                  : 'border-[#3B3046] bg-[#241D2B] text-stone-300'
              }`}
            >
              <Ear className="w-3.5 h-3.5" />
              <span>Hearing-Aid Warm EQ: {warmEq ? 'ON (<760 Hz)' : 'Standard'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#3B3046] bg-[#241D2B] text-xs text-stone-300 hover:bg-[#2F2638]"
            >
              <X className="w-3.5 h-3.5" />
              Close
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 4 Cols: Validation Script + Instant Olfactory Grounding */}
          <div className="lg:col-span-4 rounded-2xl border border-[#332A3D] bg-[#151119] p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-amber-300">
                3-Step Caregiver Validation
              </div>
              <h3 className="font-serif text-lg text-white leading-snug">
                “I want to go home” is a longing for safety, never a geography quiz.
              </h3>
              <div className="space-y-2.5 text-xs leading-relaxed">
                <div className="p-3 rounded-xl bg-[#211B27] border border-[#32293C]">
                  <div className="font-semibold text-amber-200">01 · Join Emotional Reality</div>
                  <p className="text-stone-300 mt-1">
                    <em>“You miss home so much, {guardrailsApplied.elderName}. You’re completely safe tonight — everything is looked after.”</em>
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#211B27] border border-[#32293C]">
                  <div className="font-semibold text-amber-200">02 · Eliminate Dusk Glare + Add Scent</div>
                  <p className="text-stone-300 mt-1">
                    Close curtains (dusk reflections mimic strangers outside) and pair with{' '}
                    <strong className="text-amber-100">{sensoryTactileKit[0]?.name}</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-700/40 text-[11px] text-amber-100">
              <strong>Why Iso-Principle?</strong> Playing 60 BPM lullabies to someone pacing at 100 BPM clashes with sympathetic arousal. Matching ~96 BPM first and stepping down over 15 minutes lowers heart rate safely.
            </div>
          </div>

          {/* Right 8 Cols: Interactive 3-Phase Iso-Principle Step-Down Sequencer */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-200 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-300" />
                  15-Minute Iso-Principle Autonomic Step-Down (96 → 76 → 62 BPM)
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setPlayingSinglePhase(null);
                    toggleIsoPrincipleDemoArc('iso-full-arc', warmEq, (ph) => setActiveIsoPhase(ph));
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#151119] text-xs font-bold transition"
                >
                  {activeIsoPhase !== null ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop Step-Down Arc (Phase {activeIsoPhase}/3)</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play Full 96→76→62 BPM Step-Down Demo</span>
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
                          ? 'border-amber-400 bg-[#2C2236] ring-1 ring-amber-400'
                          : 'border-amber-800/40 bg-[#231C2B]'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 font-mono text-[11px] font-bold text-amber-200">
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#17121D] border border-[#3E324B] text-[11px] text-amber-200 hover:bg-[#2F253B]"
                        >
                          {playingSinglePhase === step.phase ? (
                            <>
                              <Square className="w-3 h-3 fill-current" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current" />
                              <span>Audition {step.targetBpm} BPM</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="mt-1.5 text-sm font-serif font-semibold text-amber-100">
                        {step.cueName} ({step.cueYear} · Age {step.elderAgeThen})
                      </div>
                      <p className="text-xs text-stone-300 mt-0.5">{step.clinicalMechanism}</p>
                      <div className="mt-2 text-[11px] text-emerald-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>{step.whisperPrompt}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-[#332A3D] bg-[#151119] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start gap-2">
                <HeartHandshake className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                    <span>{line.org}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-[11px] text-stone-400">
                    24/7 confidential clinical dementia coaching — never carry evening distress alone.
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-950/70 border border-amber-700/60 px-3 py-1.5 text-xs font-mono font-semibold text-amber-200 shrink-0">
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
