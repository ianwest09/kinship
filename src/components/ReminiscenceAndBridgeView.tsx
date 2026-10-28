import React, { useEffect, useState } from 'react';
import {
  AlertOctagon,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coffee,
  Copy,
  Disc3,
  Ear,
  ExternalLink,
  Eye,
  GitCompare,
  Heart,
  MapPin,
  MessageCircleHeart,
  Music,
  PenLine,
  Play,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Square,
  Users,
  Utensils,
  XCircle,
} from 'lucide-react';
import {
  KinshipPrescriptionResponse,
  ReminiscenceCue,
  SparkJournalEntry,
} from '../../shared/types';
import {
  inferHarmonicPreset,
  stopHarmonicPreview,
  toggleHarmonicPreview,
} from '../utils/harmonicPlayer';
import { safeCopyText } from '../utils/qrAndPassport';

interface Props {
  data: KinshipPrescriptionResponse;
  sparkLog: SparkJournalEntry[];
  excludedCount: number;
  onResetExcludes: () => void;
  onCueReaction: (
    cue: ReminiscenceCue,
    reaction: 'lit_up_sang' | 'calm_soothed' | 'restless_skip',
    lucidQuote?: string
  ) => void;
}

export const ReminiscenceAndBridgeView: React.FC<Props> = ({
  data,
  sparkLog,
  excludedCount,
  onResetExcludes,
  onCueReaction,
}) => {
  const [elderCoViewingMode, setElderCoViewingMode] = useState(false);
  const [showBlindLlmCompare, setShowBlindLlmCompare] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [quoteCue, setQuoteCue] = useState<ReminiscenceCue | null>(null);
  const [quoteDraft, setQuoteDraft] = useState('');

  useEffect(() => {
    return () => stopHarmonicPreview();
  }, []);

  const warmEq = Boolean(data.guardrailsApplied.hearingLossWarmEq);

  const handleToggleAudio = (id: string, label: string) => {
    const started = toggleHarmonicPreview(
      id,
      inferHarmonicPreset(label),
      () => setPlayingId(null),
      warmEq
    );
    setPlayingId(started ? id : null);
  };

  const copyPrompt = (id: string, text: string) => {
    safeCopyText(text).finally(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Large-Print Heirloom Co-Viewing Album Mode (for sitting side-by-side with Grandma/Grandpa)
  if (elderCoViewingMode) {
    return (
      <div className="space-y-7">
        <div className="rounded-3xl border-2 border-plum-600 bg-parchment-50 dark:bg-vinyl-900 p-6 md:p-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-plum-600 dark:text-brass-200">
              Elder Co-Viewing Album Mode · Zero Medical Jargon · Extra-Large Type
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-stone-900 dark:text-parchment-50 mt-1">
              Songs &amp; Favorites from {data.bumpWindow.bumpStartYear}–{data.bumpWindow.bumpEndYear}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setElderCoViewingMode(false)}
            className="px-4 py-2.5 rounded-2xl bg-stone-900 text-white text-sm font-semibold"
          >
            Exit Co-Viewing Mode
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.reconstructedYouthUniverse.slice(0, 4).map((cue) => (
            <div
              key={cue.entity_id}
              className="rounded-3xl border-2 border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 p-7 space-y-4 shadow-sm"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brass-100 text-brass-700 font-serif text-base font-semibold">
                <Disc3 className="w-4 h-4" />
                <span>{cue.releaseYear} Favorite</span>
              </div>
              <h3 className="font-serif text-2xl md:text-3xl font-semibold text-stone-900 dark:text-parchment-50 leading-snug">
                {cue.name}
              </h3>
              <p className="font-serif text-xl italic text-plum-700 dark:text-brass-200 leading-relaxed">
                {cue.sensoryInvitationPrompt}
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleAudio(`coview-${cue.entity_id}`, cue.name)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brass-500 hover:bg-brass-600 text-vinyl-950 text-sm font-bold"
                >
                  {playingId === `coview-${cue.entity_id}` ? (
                    <>
                      <Square className="w-4 h-4 fill-current" />
                      <span>Stop Gentle Chords</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Play Gentle Melody Chords</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onCueReaction(cue, 'lit_up_sang')}
                  className="px-4 py-2.5 rounded-2xl bg-plum-600 hover:bg-plum-700 text-white text-sm font-semibold"
                >
                  ♥ Loved This One!
                </button>
                <button
                  type="button"
                  onClick={() => onCueReaction(cue, 'restless_skip')}
                  className="px-4 py-2.5 rounded-2xl bg-parchment-200 dark:bg-vinyl-700 text-sm font-medium"
                >
                  Try Another Song
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Era Portrait Banner + Elder Co-Viewing Mode Switch */}
      <div className="rounded-3xl border border-parchment-300 dark:border-vinyl-700 bg-parchment-50 dark:bg-vinyl-900 p-5 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-plum-600 dark:text-brass-200">
            <span>
              Reminiscence Bump: {data.bumpWindow.bumpStartYear}–{data.bumpWindow.bumpEndYear} (Ages 10–30)
            </span>
            <span>·</span>
            <span>{data.geographyInfo.name}</span>
          </div>
          <p className="text-sm text-stone-700 dark:text-stone-300">
            {data.geographyInfo.eraCulturalPortrait}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowBlindLlmCompare((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-plum-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 text-plum-700 dark:text-brass-200 text-xs font-semibold shadow-sm"
          >
            <GitCompare className="w-4 h-4" />
            <span>Blind LLM vs. Qloo Taste AI™</span>
            {showBlindLlmCompare ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setElderCoViewingMode(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-plum-600 hover:bg-plum-700 text-white text-xs font-semibold shadow-sm"
          >
            <Eye className="w-4 h-4" />
            <span>Switch to Elder Big-Type Co-Viewing Screen</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* UPGRADE 3: WITHOUT QLOO (BLIND LLM) VS. WITH QLOO TASTE AI™ PROOF     */}
      {/* ===================================================================== */}
      {showBlindLlmCompare && data.blindLlmComparison?.length > 0 && (
        <section className="rounded-3xl border border-plum-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-900 p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-parchment-200 dark:border-vinyl-700">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-plum-600 dark:text-brass-200">
                <GitCompare className="w-4 h-4" />
                <span>Why “Agents With Taste” Matter in Clinical Care · Live Patient-Personalized Diff</span>
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-stone-900 dark:text-parchment-50 mt-0.5">
                Without Qloo (Generic Prompted LLM) vs. With Qloo Taste AI™ for {data.guardrailsApplied.elderName}
              </h3>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-pine-50 dark:bg-vinyl-800 text-pine-700 dark:text-emerald-300 self-start sm:self-auto">
              Zero PII · 6 Cross-Domain Entity Types
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {data.blindLlmComparison.map((row) => (
              <div
                key={row.dimension}
                className="rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-parchment-50/70 dark:bg-vinyl-800 p-4 space-y-2.5 text-xs"
              >
                <div className="font-semibold text-stone-900 dark:text-parchment-50 text-sm">
                  {row.dimension}
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-rose-800 dark:text-rose-300">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Blind LLM Guess:</span>
                  </div>
                  <p className="text-stone-700 dark:text-stone-300">{row.blindLlmGuess}</p>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 italic">
                    Why it fails: {row.whyBlindLlmFails}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-pine-50 dark:bg-vinyl-900 border border-pine-500/30 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-pine-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Kinship + Qloo Taste AI™:</span>
                  </div>
                  <p className="text-stone-800 dark:text-parchment-100 font-medium">{row.qlooTasteAiResult}</p>
                  <div className="text-[10px] font-mono text-plum-700 dark:text-brass-200 pt-0.5">
                    {row.qlooApiMechanism}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* PART 1: INTERGENERATIONAL SOUL BRIDGE (GET /v2/analysis/compare)      */}
      {/* ===================================================================== */}
      <section className="rounded-3xl border-2 border-plum-600/35 dark:border-brass-500/40 bg-parchment-50 dark:bg-vinyl-900 p-6 md:p-7 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-parchment-200 dark:border-vinyl-700">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-plum-600 dark:text-brass-200">
              <Users className="w-4 h-4" />
              <span>Agent 04 · GET /v2/analysis/compare · Intergenerational Bridge</span>
            </div>
            <h3 className="text-xl md:text-2xl font-semibold text-stone-900 dark:text-parchment-50 mt-1">
              {data.guardrailsApplied.grandchildName} ↔ {data.guardrailsApplied.elderName}: Shared Cultural DNA Across 60 Years
            </h3>
            <p className="text-xs md:text-sm text-stone-600 dark:text-stone-400">
              Translates modern favorites into the exact youth-era recordings that share their harmonic, rhythmic, or domestic soul — turning awkward visits into 15 minutes of magic.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {data.intergenerationalBridges.map((br) => (
            <div
              key={br.bridge_id}
              className="rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                {/* Visual Cross-Era Pairing Header */}
                <div className="flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-gradient-to-r from-pine-50 via-parchment-100 to-plum-50 dark:from-vinyl-900 dark:via-vinyl-900 dark:to-plum-900/40 border border-parchment-200 dark:border-vinyl-700">
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase text-pine-700 dark:text-emerald-300 font-semibold">
                      {data.guardrailsApplied.grandchildName} ({br.grandchildSeedYear})
                    </div>
                    <div className="font-semibold text-sm text-stone-900 dark:text-parchment-50 truncate">
                      {br.grandchildSeedName.split('(')[0].trim()}
                    </div>
                  </div>

                  <div className="px-2.5 py-1 rounded-full bg-plum-600 text-white font-mono text-xs font-bold shrink-0">
                    {br.overlapPct}% DNA
                  </div>

                  <div className="min-w-0 text-right">
                    <div className="text-[10px] font-mono uppercase text-plum-700 dark:text-brass-200 font-semibold">
                      {data.guardrailsApplied.elderName} ({br.elderAnchorYear} · Age {br.elderAgeThen})
                    </div>
                    <div className="font-semibold text-sm text-stone-900 dark:text-parchment-50 truncate">
                      {br.elderAnchorName.split('(')[0].trim()}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {br.harmonicExplanation}
                </p>

                {/* Shared Tag Bars */}
                <div className="p-3 rounded-xl bg-parchment-50 dark:bg-vinyl-900 space-y-1.5 text-xs">
                  <div className="font-mono text-[10px] text-stone-500">
                    Qloo Shared Tag Co-Occurrence (a.signal ∩ b.signal):
                  </div>
                  {br.sharedTags.map((st) => (
                    <div key={st.tag_id} className="flex items-center justify-between">
                      <span className="font-medium">{st.label}</span>
                      <span className="font-mono text-[11px] text-plum-700 dark:text-brass-200">
                        Elder {Math.round(st.elderAffinity * 100)}% · Youth {Math.round(st.grandchildAffinity * 100)}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* 3-Step 15-Minute Visit Playbook */}
                <div className="space-y-1.5 text-xs">
                  <div className="font-semibold text-stone-800 dark:text-parchment-100 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-plum-600 dark:text-brass-200" />
                    Side-by-Side 15-Minute Visit Playbook:
                  </div>
                  {br.threeStepPlaybook.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-parchment-100/70 dark:bg-vinyl-900/60 border border-parchment-200 dark:border-vinyl-700 text-[11px] text-stone-700 dark:text-stone-300"
                    >
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              {/* Zero-Quiz Conversation Prompt */}
              <div className="p-3 rounded-xl bg-plum-50/80 dark:bg-plum-900/25 border border-plum-200 dark:border-plum-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-semibold text-plum-700 dark:text-brass-200">
                    Zero-Quiz Sensory Bridge Line
                  </span>
                  <button
                    type="button"
                    onClick={() => copyPrompt(br.bridge_id, br.zeroQuizBridgeQuestion)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-plum-700 dark:text-brass-200 hover:underline"
                  >
                    {copiedId === br.bridge_id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === br.bridge_id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-xs italic text-stone-800 dark:text-parchment-50">
                  {br.zeroQuizBridgeQuestion}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* PART 2: RECONSTRUCTED YOUTH UNIVERSE + SPARK JOURNAL + BLOCKED TRAPS  */}
      {/* ===================================================================== */}
      <section className="rounded-3xl border border-parchment-300 dark:border-vinyl-700 bg-parchment-50 dark:bg-vinyl-900 p-6 md:p-7 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-parchment-200 dark:border-vinyl-700">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-pine-600 dark:text-emerald-300">
              <Music className="w-4 h-4" />
              <span>
                Agent 02 · GET /v2/insights?filter.release_year={data.bumpWindow.bumpStartYear}..{data.bumpWindow.bumpEndYear}
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-semibold text-stone-900 dark:text-parchment-50 mt-1">
              {data.guardrailsApplied.elderName}’s Reconstructed Youth Universe
            </h3>
            <p className="text-xs md:text-sm text-stone-600 dark:text-stone-400">
              Every song, musical, and broadcast below is verified for dementia sensory comfort — paired with anti-quizzing caregiver prompts.
            </p>
          </div>
          {excludedCount > 0 && (
            <button
              type="button"
              onClick={onResetExcludes}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 text-xs font-medium shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restore {excludedCount} Excluded Cue{excludedCount > 1 ? 's' : ''}</span>
            </button>
          )}
        </div>

        {data.reconstructedYouthUniverse.length === 0 ? (
          <div className="rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 p-8 text-center space-y-3">
            <p className="text-sm text-stone-600 dark:text-stone-300">
              All cues in this youth window were marked restless/excluded during this session.
            </p>
            <button
              type="button"
              onClick={onResetExcludes}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-plum-600 text-white text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restore Excluded Youth Cues</span>
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {data.reconstructedYouthUniverse.slice(0, 4).map((cue) => (
            <div
              key={cue.entity_id}
              className="rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-brass-100 dark:bg-vinyl-700 text-brass-700 dark:text-brass-200 text-[11px] font-semibold">
                      {cue.releaseYear} · {data.guardrailsApplied.elderName} was Age {cue.elderAgeAtRelease}
                    </span>
                    {cue.source === 'live_qloo_api' && (
                      <span className="px-2 py-0.5 rounded-full bg-pine-600 text-white text-[10px] font-mono font-bold uppercase">
                        Live Qloo API
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs font-bold text-pine-700 dark:text-emerald-300">
                    {cue.mpfcSalienceScore}% mPFC Salience
                  </span>
                </div>

                <div>
                  <div className="text-[11px] font-mono uppercase text-plum-600 dark:text-brass-200">
                    {cue.categoryBadge} · {cue.tempoBpmLabel}
                  </div>
                  <h4 className="text-lg font-semibold text-stone-900 dark:text-parchment-50 mt-0.5">
                    {cue.name}
                  </h4>
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {cue.whyBrainRemembers}
                </p>

                {/* ❌ Never Quiz vs ✅ Sensory Invitation */}
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 flex items-start gap-2">
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Zero-Quiz Rule:</strong> {cue.dontQuizWarning}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-pine-50 dark:bg-vinyl-900 border border-pine-100 dark:border-vinyl-700 text-stone-800 dark:text-emerald-200 flex items-start gap-2">
                    <MessageCircleHeart className="w-3.5 h-3.5 text-pine-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Say Instead:</strong> {cue.sensoryInvitationPrompt}
                    </span>
                  </div>
                </div>

                {/* Qloo Explainability Bar */}
                <div className="pt-1">
                  <div className="text-[10px] font-mono text-stone-500 mb-1">
                    Qloo feature.explainability=true (Clue Attribution):
                  </div>
                  <div className="h-2 rounded-full overflow-hidden flex bg-parchment-200 dark:bg-vinyl-700">
                    {cue.explainability.map((ex, i) => (
                      <div
                        key={ex.seed_entity_id}
                        style={{ width: `${Math.round(ex.normalized_score * 100)}%` }}
                        className={i === 0 ? 'bg-plum-600' : i === 1 ? 'bg-brass-500' : 'bg-pine-600'}
                        title={`${ex.seed_name}: ${Math.round(ex.normalized_score * 100)}%`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1 text-[10px] font-mono text-stone-500">
                    {cue.explainability.map((ex) => (
                      <span key={ex.seed_entity_id}>
                        {ex.seed_name.split('(')[0].trim()}: {Math.round(ex.normalized_score * 100)}%
                      </span>
                    ))}
                  </div>
                </div>

                {/* 1-Tap Streaming Launchers + Presbycusis & Zero-Ad Cliff Guardrail */}
                <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <a
                      href={`https://open.spotify.com/search/${encodeURIComponent(cue.name.replace(/—/g, ' '))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-parchment-300 dark:border-vinyl-700 bg-parchment-50 dark:bg-vinyl-900 hover:border-pine-600 font-medium"
                    >
                      <ExternalLink className="w-3 h-3 text-pine-600" />
                      <span>Spotify</span>
                    </a>
                    <a
                      href={`https://music.apple.com/us/search?term=${encodeURIComponent(cue.name.replace(/—/g, ' '))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-parchment-300 dark:border-vinyl-700 bg-parchment-50 dark:bg-vinyl-900 hover:border-plum-600 font-medium"
                    >
                      <ExternalLink className="w-3 h-3 text-plum-600" />
                      <span>Apple Music</span>
                    </a>
                    {cue.presbycusisSafe && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-vinyl-900 text-pine-700 dark:text-emerald-300 text-[10px] font-mono">
                        <Ear className="w-3 h-3" />
                        Warm 150–800Hz
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-amber-800 dark:text-amber-300 font-medium">
                    ⚠ Use ad-free queue (loud ads startle)
                  </span>
                </div>
              </div>

              {/* Closed-Loop Spark Journal + Era Cadence Audio Preview */}
              <div className="pt-3 border-t border-parchment-200 dark:border-vinyl-700 space-y-2.5">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleAudio(`cue-${cue.entity_id}`, cue.name)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brass-100 hover:bg-brass-200 dark:bg-vinyl-700 text-brass-700 dark:text-brass-200 text-xs font-semibold"
                  >
                    {playingId === `cue-${cue.entity_id}` ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Stop Cadence</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{warmEq ? 'Hear Warm-EQ Cadence' : 'Hear Era Cadence'}</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onCueReaction(cue, 'lit_up_sang');
                      setQuoteCue(cue);
                      setQuoteDraft('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-plum-600 hover:bg-plum-700 text-white text-xs font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Lit Up / Sang (+Save Spark)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onCueReaction(cue, 'calm_soothed')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pine-50 dark:bg-vinyl-900 border border-pine-500/40 text-pine-700 dark:text-emerald-300 text-xs font-medium"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>Pin to 4:30 PM Calm</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onCueReaction(cue, 'restless_skip')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-parchment-100 dark:bg-vinyl-900 text-stone-600 dark:text-stone-300 text-xs font-medium"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Restless (Exclude)</span>
                  </button>
                </div>

                {/* Inline "Capture the Lucid Spark" Heirloom Quote Drawer */}
                {quoteCue?.entity_id === cue.entity_id && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!quoteDraft.trim()) return;
                      onCueReaction(cue, 'lit_up_sang', quoteDraft.trim());
                      setQuoteCue(null);
                      setQuoteDraft('');
                    }}
                    className="rounded-xl border border-plum-300 dark:border-plum-700 bg-plum-50/70 dark:bg-plum-900/30 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold text-plum-800 dark:text-brass-200">
                      <span className="flex items-center gap-1.5">
                        <PenLine className="w-3.5 h-3.5" />
                        Capture Lucid Memory Spark (Pinned to Printable Family Timeline · On-Device Only)
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuoteCue(null)}
                        className="text-stone-500 hover:underline"
                      >
                        Dismiss
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={quoteDraft}
                        onChange={(e) => setQuoteDraft(e.target.value)}
                        placeholder={`What did ${data.guardrailsApplied.elderName} say, hum, or smile about just now?`}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 text-xs"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-plum-600 text-white text-xs font-semibold"
                      >
                        Save Quote
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Spark Log + Blocked Sundowning Traps */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
          <div className="lg:col-span-7 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 dark:text-rose-300">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Intercepted Era Distress Traps (What Unguarded “Oldies” Autoplay Pushes)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {data.blockedDistressTraps.map((trap) => (
                <div
                  key={trap.entity_id}
                  className="p-3 rounded-xl bg-white dark:bg-vinyl-800 border border-rose-100 dark:border-vinyl-700 text-[11px] space-y-1"
                >
                  <div className="font-semibold line-through decoration-rose-500 text-stone-800 dark:text-parchment-50">
                    {trap.name}
                  </div>
                  <div className="font-mono text-[10px] text-rose-700 dark:text-rose-300">
                    {Math.round(trap.rawEraAffinity * 100)}% era match · BLOCKED
                  </div>
                  <p className="text-stone-600 dark:text-stone-400 leading-snug">
                    {trap.clinicalWhyBlocked}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 p-4 space-y-2">
            <div className="text-xs font-semibold text-stone-800 dark:text-parchment-50">
              Live Spark Journal (Closed-Loop Qloo Signal Memory):
            </div>
            {sparkLog.length === 0 ? (
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Click <strong>“Lit Up / Sang”</strong> or <strong>“Pin to 4:30 PM Calm”</strong> on any cue above to train {data.guardrailsApplied.elderName}’s Memory Care Passport.
              </p>
            ) : (
              <div className="space-y-1.5">
                {sparkLog.slice(0, 4).map((s) => (
                  <div key={s.id} className="text-[11px] space-y-0.5">
                    <div className="font-mono text-plum-700 dark:text-brass-200">
                      • {s.cueName.split('—')[0].trim()}: {s.qlooUpdateNote}
                    </div>
                    {s.lucidQuote && (
                      <div className="pl-3 italic text-stone-700 dark:text-parchment-100">
                        “{s.lucidQuote}”
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* PART 2B: CROSS-DOMAIN OLFACTORY, TEA & TACTILE KIT (urn:entity:brand) */}
      {/* ===================================================================== */}
      <section className="rounded-3xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-900 p-6 md:p-7 shadow-sm space-y-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-brass-700 dark:text-brass-200">
            <Coffee className="w-4 h-4" />
            <span>Cross-Domain Sensory Leap · GET /v2/insights?filter.type=urn:entity:brand</span>
          </div>
          <h3 className="text-xl font-semibold text-stone-900 dark:text-parchment-50 mt-1">
            Beyond Screens: $5 Smell, Tea &amp; Procedural Touch Anchors (Stage 5–6 Ready)
          </h3>
          <p className="text-xs md:text-sm text-stone-600 dark:text-stone-400">
            Olfaction is the only human sense that bypasses the thalamus and projects directly to the amygdala and entorhinal cortex — unlocking deep emotional calm even when vision or speech has faded.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.sensoryTactileKit.map((item) => (
            <div
              key={item.entity_id}
              className="rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-parchment-50 dark:bg-vinyl-800 p-4 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-brass-100 dark:bg-vinyl-700 text-brass-700 dark:text-brass-200 text-[10px] font-mono font-bold uppercase">
                    {item.modality}
                  </span>
                  <span className="font-mono text-xs font-bold text-pine-700 dark:text-emerald-300">
                    {item.affinityPct}% Era Match
                  </span>
                </div>
                <h4 className="font-semibold text-sm text-stone-900 dark:text-parchment-50">
                  {item.name}
                </h4>
                <div className="text-[11px] font-mono text-plum-700 dark:text-brass-200">
                  {item.neuralPathway}
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300">
                  <strong>$5 Visit Prep:</strong> {item.fiveDollarAction}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-vinyl-900 border border-parchment-200 dark:border-vinyl-700 text-xs italic text-stone-800 dark:text-parchment-100">
                {item.zeroQuizInvitation}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* PART 2C: DYSPHAGIA-SAFE NOSTALGIC SENIOR DINING & CALM CAFÉ (place)   */}
      {/* ===================================================================== */}
      {data.seniorDiningPlan && (
        <section className="rounded-3xl border border-parchment-300 dark:border-vinyl-700 bg-parchment-50 dark:bg-vinyl-900 p-6 md:p-7 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-parchment-200 dark:border-vinyl-700">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-pine-700 dark:text-emerald-300">
                <Utensils className="w-4 h-4" />
                <span>
                  Culinary &amp; Venue Care · GET /v2/insights?filter.type=urn:entity:place + {data.seniorDiningPlan.culinaryHeritageTag}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-stone-900 dark:text-parchment-50 mt-1">
                Dysphagia-Safe Nostalgic Senior Dining &amp; Quiet-Hours Outing
              </h3>
              <p className="text-xs md:text-sm text-stone-600 dark:text-stone-400">
                Matches {data.guardrailsApplied.elderName}’s youth culinary heritage with IDDSI easy-to-chew textures, low-scald (&lt;52°C) temperature safety, medication-aware ingredients, and low-decibel calm cafés.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-brass-100 dark:bg-vinyl-800 text-brass-700 dark:text-brass-200 text-xs font-mono font-bold self-start md:self-auto">
              {data.seniorDiningPlan.iddsiLevelLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 p-5 space-y-3">
              <div className="text-[11px] font-mono uppercase text-plum-600 dark:text-brass-200 font-semibold">
                Youth-Era Comfort Meal Prescription (Home or Care Kitchen)
              </div>
              <h4 className="text-lg font-semibold text-stone-900 dark:text-parchment-50">
                {data.seniorDiningPlan.dishName}
              </h4>
              <div className="p-3 rounded-xl bg-pine-50 dark:bg-vinyl-900 border border-pine-500/25 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                <strong className="text-pine-700 dark:text-emerald-300">Clinical Texture, Thermal &amp; Med Guardrails:</strong>{' '}
                {data.seniorDiningPlan.thermalAndMedSafety}
              </div>
              <div className="p-3 rounded-xl bg-parchment-100/80 dark:bg-vinyl-900/70 border border-parchment-200 dark:border-vinyl-700 text-xs italic text-stone-800 dark:text-parchment-100">
                {data.seniorDiningPlan.sensoryTableInvitation}
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 p-5 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono uppercase text-pine-700 dark:text-emerald-300 font-semibold">
                    urn:entity:place · Calm Outing Venue
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-pine-50 dark:bg-vinyl-900 text-pine-700 dark:text-emerald-300 font-mono text-[11px] font-bold">
                    {data.seniorDiningPlan.calmVenue.affinityPct}% Match
                    {data.seniorDiningPlan.calmVenue.source === 'live_qloo_api' ? ' · LIVE' : ''}
                  </span>
                </div>
                <h4 className="text-base font-semibold text-stone-900 dark:text-parchment-50">
                  {data.seniorDiningPlan.calmVenue.name}
                </h4>
                <div className="text-xs font-mono text-brass-700 dark:text-brass-200">
                  Quiet Window: {data.seniorDiningPlan.calmVenue.quietHoursWindow}
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {data.seniorDiningPlan.calmVenue.acousticComfortNote}
                </p>
              </div>
              <div className="text-[11px] font-mono text-stone-500 pt-2 border-t border-parchment-200 dark:border-vinyl-700">
                Entity ID: {data.seniorDiningPlan.calmVenue.entity_id}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* PART 3: AGENT 05 · QLOO DEMOGRAPHIC SILO BREAKER & HOMETOWN HEATMAP   */}
      {/* ===================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: GET /v2/insights?filter.type=urn:demographics */}
        <div className="lg:col-span-6 rounded-3xl border border-parchment-300 dark:border-vinyl-700 bg-parchment-50 dark:bg-vinyl-900 p-6 space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-plum-600 dark:text-brass-200">
            <BarChart3 className="w-4 h-4" />
            <span>Agent 05A · GET /v2/insights?filter.type=urn:demographics</span>
          </div>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-parchment-50">
            Why Streaming Algorithms Isolate Families — And How Qloo Bridges Them
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Standard recommender engines silo users by age cohort. Qloo’s demographic insights expose the exact generational split below, while <code className="font-mono">/v2/analysis/compare</code> leaps across the gap via shared underlying harmonic &amp; sensory tags.
          </p>

          <div className="space-y-2.5 pt-1">
            {data.demographicBridgeProof.map((band) => (
              <div key={band.ageBucket} className="space-y-1 text-xs">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="font-semibold text-stone-700 dark:text-parchment-100">{band.label}</span>
                  <span>
                    <span className="text-pine-700 dark:text-emerald-300">
                      Youth {band.grandchildSeedSkew > 0 ? '+' : ''}
                      {Math.round(band.grandchildSeedSkew * 100)}%
                    </span>
                    {' · '}
                    <span className="text-plum-700 dark:text-brass-200">
                      Elder {band.elderClueSkew > 0 ? '+' : ''}
                      {Math.round(band.elderClueSkew * 100)}%
                    </span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 h-2">
                  <div className="bg-parchment-200 dark:bg-vinyl-700 rounded-full overflow-hidden flex justify-end">
                    <div
                      style={{ width: `${Math.round(Math.abs(band.grandchildSeedSkew) * 100)}%` }}
                      className={band.grandchildSeedSkew >= 0 ? 'bg-pine-600' : 'bg-stone-400/50'}
                    />
                  </div>
                  <div className="bg-parchment-200 dark:bg-vinyl-700 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.round(Math.abs(band.elderClueSkew) * 100)}%` }}
                      className={band.elderClueSkew >= 0 ? 'bg-plum-600' : 'bg-stone-400/50'}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 6 Cols: GET /v2/insights?filter.type=urn:heatmap */}
        <div className="lg:col-span-6 rounded-3xl border border-parchment-300 dark:border-vinyl-700 bg-parchment-50 dark:bg-vinyl-900 p-6 space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-pine-600 dark:text-emerald-300">
            <MapPin className="w-4 h-4" />
            <span>Agent 05B · GET /v2/insights?filter.type=urn:heatmap (urn:geohash)</span>
          </div>
          <h3 className="text-lg font-semibold text-stone-900 dark:text-parchment-50">
            {data.geographyInfo.name}: Youth Place-Memory Hotspots
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            High-<code className="font-mono">affinity_rank</code> neighborhood pockets where {data.guardrailsApplied.elderName}’s youth music &amp; cinema culture lived — paired with zero-quiz sensory place prompts.
          </p>

          <div className="space-y-2.5">
            {data.hometownHotspots.map((spot) => (
              <div
                key={spot.geohash}
                className="rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-stone-900 dark:text-parchment-50">
                    {spot.districtName}
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-pine-50 dark:bg-vinyl-900 text-pine-700 dark:text-emerald-300">
                    geohash:{spot.geohash} · rank {(spot.affinityRank * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400">
                  {spot.culturalLandmarkNote}
                </div>
                <div className="text-xs italic text-plum-700 dark:text-brass-200">
                  {spot.sensoryPlacePrompt}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
