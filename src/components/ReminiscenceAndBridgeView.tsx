import React, { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
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

const RESPONSE_VALUES: Record<SparkJournalEntry['reaction'], number> = {
  restless_skip: 1,
  calm_soothed: 2,
  lit_up_sang: 3,
};

function responseLabel(value: number): string {
  if (value === 3) return 'We liked this';
  if (value === 2) return 'Felt settling';
  return 'Set aside';
}

type SentimentPoint = {
  sequence: number;
  time: string;
  response: number;
  responseLabel: string;
  cueName: string;
  note: string;
};

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
  /** Hand off to the promoted large-type "Share a moment" screen. */
  onOpenSharedMoment: (cue: ReminiscenceCue | null) => void;
}

export const ReminiscenceAndBridgeView: React.FC<Props> = ({
  data,
  sparkLog,
  excludedCount,
  onResetExcludes,
  onCueReaction,
  onOpenSharedMoment,
}) => {
  const [showBlindLlmCompare, setShowBlindLlmCompare] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [quoteCue, setQuoteCue] = useState<ReminiscenceCue | null>(null);
  const [quoteDraft, setQuoteDraft] = useState('');

  useEffect(() => {
    return () => stopHarmonicPreview();
  }, []);

  const warmEq = Boolean(data.guardrailsApplied.hearingLossWarmEq);
  const reflectionInsights = useMemo(() => {
    const saved = sparkLog.filter((entry) => entry.reaction !== 'restless_skip');
    const liked = saved.filter((entry) => entry.reaction === 'lit_up_sang').length;
    const settling = saved.filter((entry) => entry.reaction === 'calm_soothed').length;
    const momentsByName = new Map<string, number>();
    const categories = new Map<string, number>();
    const timesOfDay = new Map<string, number>();
    const sensoryMentions = new Map<string, number>();
    const allCues = [...data.reconstructedYouthUniverse, ...data.sundowningSafePlaylist];
    const sensoryWords: Array<[string, RegExp]> = [
      ['Music or sound', /music|song|sound|chord|sing/i],
      ['Tea or a warm drink', /tea|coffee|warm drink/i],
      ['Garden or flowers', /garden|flower|blossom|breeze/i],
      ['Scent', /scent|smell|fragrance/i],
      ['Something to hold', /touch|hold|fabric|object|wood/i],
    ];
    saved.forEach((entry) => {
      momentsByName.set(entry.cueName, (momentsByName.get(entry.cueName) ?? 0) + 1);
      const cue = allCues.find((candidate) => candidate.entity_id === entry.cueId || candidate.name === entry.cueName);
      if (cue?.categoryBadge) categories.set(cue.categoryBadge, (categories.get(cue.categoryBadge) ?? 0) + 1);

      const timeMatch = entry.timestamp.match(/(\d{1,2})(?::\d{2})?\s*(am|pm)?/i);
      if (timeMatch) {
        let hour = Number(timeMatch[1]);
        const suffix = timeMatch[2]?.toLowerCase();
        if (suffix === 'pm' && hour < 12) hour += 12;
        if (suffix === 'am' && hour === 12) hour = 0;
        const period = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
        timesOfDay.set(period, (timesOfDay.get(period) ?? 0) + 1);
      }

      const words = `${entry.cueName} ${entry.personalNotes ?? ''} ${entry.lucidQuote ?? ''}`;
      sensoryWords.forEach(([label, pattern]) => {
        if (pattern.test(words)) sensoryMentions.set(label, (sensoryMentions.get(label) ?? 0) + 1);
      });
    });
    const top = (values: Map<string, number>) =>
      [...values.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return {
      total: saved.length,
      liked,
      settling,
      repeated: top(momentsByName),
      category: top(categories),
      timeOfDay: top(timesOfDay),
      sensory: top(sensoryMentions),
    };
  }, [data.reconstructedYouthUniverse, data.sundowningSafePlaylist, sparkLog]);

  const sentimentTimeline = useMemo(
    () =>
      sparkLog
        .slice(0, 12)
        .reverse()
        .map((entry, index) => ({
          sequence: index + 1,
          time: entry.timestamp,
          response: RESPONSE_VALUES[entry.reaction],
          responseLabel: responseLabel(RESPONSE_VALUES[entry.reaction]),
          cueName: entry.cueName.split('—')[0].trim(),
          note: entry.personalNotes || entry.lucidQuote || 'No note added',
        })),
    [sparkLog]
  );

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
          <p className="text-sm text-loam-body dark:text-loam-body-dark">
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
            onClick={() =>
              onOpenSharedMoment(
                data.reconstructedYouthUniverse?.[0] ?? data.sundowningSafePlaylist?.[0]
              )
            }
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-plum-600 hover:bg-plum-700 text-white text-sm font-semibold shadow-soft transition-colors"
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
            <span>Open large-type “Share a moment”</span>
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
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider break-words text-plum-600 dark:text-brass-200">
                <GitCompare className="w-4 h-4" />
                <span>Why “Agents With Taste” matter here · Live request-by-request diff</span>
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-loam-ink dark:text-parchment-50 mt-0.5">
                Without Qloo (Generic Prompted LLM) vs. With Qloo Taste AI™ for {data.guardrailsApplied.elderName}
              </h3>
            </div>
            <span className="text-meta font-mono px-2.5 py-1 rounded-full bg-pine-50 dark:bg-vinyl-800 text-pine-700 dark:text-pine-300 self-start sm:self-auto">
              Zero PII · 6 Cross-Domain Entity Types
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {data.blindLlmComparison.map((row) => (
              <div
                key={row.dimension}
                className="rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-parchment-50/70 dark:bg-vinyl-800 p-4 space-y-2.5 text-xs"
              >
                <div className="font-semibold text-loam-ink dark:text-parchment-50 text-sm">
                  {row.dimension}
                </div>
                <div className="p-2.5 rounded-xl bg-clay-50/80 dark:bg-clay-950/30 border border-clay-200/80 dark:border-clay-900/50 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-clay-800 dark:text-clay-300">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Blind LLM Guess:</span>
                  </div>
                  <p className="text-loam-body dark:text-loam-body-dark">{row.blindLlmGuess}</p>
                  <p className="text-meta text-clay-700 dark:text-clay-300 italic">
                    Why it fails: {row.whyBlindLlmFails}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-pine-50 dark:bg-vinyl-900 border border-pine-500/30 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-pine-700 dark:text-pine-300">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Kinship + Qloo Taste AI™:</span>
                  </div>
                  <p className="text-loam-ink dark:text-parchment-100 font-medium">{row.qlooTasteAiResult}</p>
                  <div className="text-xs font-mono text-plum-700 dark:text-brass-200 pt-0.5">
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
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider break-words text-plum-600 dark:text-brass-200">
              <Users className="w-4 h-4" />
              <span>Agent 04 · GET /v2/analysis/compare · Intergenerational Bridge</span>
            </div>
            <h3 className="text-xl md:text-2xl font-semibold text-loam-ink dark:text-parchment-50 mt-1">
              {data.guardrailsApplied.grandchildName} ↔ {data.guardrailsApplied.elderName}: Shared Cultural DNA Across 60 Years
            </h3>
            <p className="text-xs md:text-sm text-loam-body dark:text-loam-muted-dark">
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
                    <div className="text-xs font-mono uppercase text-pine-700 dark:text-pine-300 font-semibold">
                      {data.guardrailsApplied.grandchildName} ({br.grandchildSeedYear})
                    </div>
                    <div className="font-semibold text-sm text-loam-ink dark:text-parchment-50 truncate">
                      {br.grandchildSeedName.split('(')[0].trim()}
                    </div>
                  </div>

                  <div className="px-2.5 py-1 rounded-full bg-plum-600 text-white font-mono text-xs font-bold shrink-0">
                    {br.overlapPct}% DNA
                  </div>

                  <div className="min-w-0 text-right">
                    <div className="text-xs font-mono uppercase text-plum-700 dark:text-brass-200 font-semibold">
                      {data.guardrailsApplied.elderName} ({br.elderAnchorYear} · Age {br.elderAgeThen})
                    </div>
                    <div className="font-semibold text-sm text-loam-ink dark:text-parchment-50 truncate">
                      {br.elderAnchorName.split('(')[0].trim()}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-loam-body dark:text-loam-body-dark leading-relaxed">
                  {br.harmonicExplanation}
                </p>

                {/* Shared Tag Bars */}
                <div className="p-3 rounded-xl bg-parchment-50 dark:bg-vinyl-900 space-y-1.5 text-xs">
                  <div className="font-mono text-xs text-loam-muted">
                    Qloo Shared Tag Co-Occurrence (a.signal ∩ b.signal):
                  </div>
                  {br.sharedTags.map((st) => (
                    <div key={st.tag_id} className="flex items-center justify-between">
                      <span className="font-medium">{st.label}</span>
                      <span className="font-mono text-meta text-plum-700 dark:text-brass-200">
                        Elder {Math.round(st.elderAffinity * 100)}% · Youth {Math.round(st.grandchildAffinity * 100)}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* 3-Step 15-Minute Visit Playbook */}
                <div className="space-y-1.5 text-xs">
                  <div className="font-semibold text-loam-ink dark:text-parchment-100 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-plum-600 dark:text-brass-200" />
                    Side-by-Side 15-Minute Visit Playbook:
                  </div>
                  {br.threeStepPlaybook.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-parchment-100/70 dark:bg-vinyl-900/60 border border-parchment-200 dark:border-vinyl-700 text-meta text-loam-body dark:text-loam-body-dark"
                    >
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              {/* Zero-Quiz Conversation Prompt */}
              <div className="p-3 rounded-xl bg-plum-50/80 dark:bg-plum-900/25 border border-plum-200 dark:border-plum-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase font-semibold text-plum-700 dark:text-brass-200">
                    Zero-Quiz Sensory Bridge Line
                  </span>
                  <button
                    type="button"
                    onClick={() => copyPrompt(br.bridge_id, br.zeroQuizBridgeQuestion)}
                    className="inline-flex items-center gap-1 text-meta font-medium text-plum-700 dark:text-brass-200 hover:underline"
                  >
                    {copiedId === br.bridge_id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === br.bridge_id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-xs italic text-loam-ink dark:text-parchment-50">
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
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider break-words text-pine-600 dark:text-pine-300">
              <Music className="w-4 h-4" />
              <span>
                Agent 02 · GET /v2/insights?filter.release_year={data.bumpWindow.bumpStartYear}..{data.bumpWindow.bumpEndYear}
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-semibold text-loam-ink dark:text-parchment-50 mt-1">
              Songs and films from {data.guardrailsApplied.elderName}’s growing-up years
            </h3>
            <p className="text-xs md:text-sm text-loam-body dark:text-loam-muted-dark">
              Every item below has been through Kinship’s own safety filters —
              no horror, war or suspense, and rated suitable for all ages — and
              comes with a prompt that avoids quizzing.
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
            <p className="text-sm text-loam-body dark:text-loam-body-dark">
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
                    <span className="px-2.5 py-0.5 rounded-full bg-brass-100 dark:bg-vinyl-700 text-brass-700 dark:text-brass-200 text-meta font-semibold">
                      {cue.releaseYear} · {data.guardrailsApplied.elderName} was Age {cue.elderAgeAtRelease}
                    </span>
                    {cue.source === 'live_qloo_api' && (
                      <span className="px-2 py-0.5 rounded-full bg-pine-600 text-white text-xs font-mono font-bold uppercase">
                        Live Qloo API
                      </span>
                    )}
                  </div>
                  <span
                    className="font-mono text-xs font-bold text-pine-700 dark:text-pine-300"
                    title="Qloo's normalised affinity for this request, shown as a percentage"
                  >
                    {cue.mpfcSalienceScore}% Qloo affinity
                  </span>
                </div>

                <div>
                  <div className="text-meta font-mono uppercase text-plum-600 dark:text-brass-200">
                    {cue.categoryBadge} · {cue.tempoBpmLabel}
                  </div>
                  <h4 className="text-lg font-semibold text-loam-ink dark:text-parchment-50 mt-0.5">
                    {cue.name}
                  </h4>
                </div>

                <p className="text-xs text-loam-body dark:text-loam-body-dark leading-relaxed">
                  {cue.whyBrainRemembers}
                </p>

                {/* ❌ Never Quiz vs ✅ Sensory Invitation */}
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-clay-50/70 dark:bg-clay-950/30 border border-clay-200/80 dark:border-clay-900/60 text-clay-900 dark:text-clay-200 flex items-start gap-2">
                    <AlertOctagon className="w-3.5 h-3.5 text-clay-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Zero-Quiz Rule:</strong> {cue.dontQuizWarning}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-pine-50 dark:bg-vinyl-900 border border-pine-100 dark:border-vinyl-700 text-loam-ink dark:text-pine-200 flex items-start gap-2">
                    <MessageCircleHeart className="w-3.5 h-3.5 text-pine-600 dark:text-pine-300 shrink-0 mt-0.5" />
                    <span>
                      <strong>Say Instead:</strong> {cue.sensoryInvitationPrompt}
                    </span>
                  </div>
                </div>

                {/* Qloo Explainability Bar */}
                <div className="pt-1">
                  <div className="text-xs font-mono text-loam-muted mb-1">
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
                  <div className="flex flex-wrap gap-2 mt-1 text-xs font-mono text-loam-muted">
                    {cue.explainability.map((ex) => (
                      <span key={ex.seed_entity_id}>
                        {ex.seed_name.split('(')[0].trim()}: {Math.round(ex.normalized_score * 100)}%
                      </span>
                    ))}
                  </div>
                </div>

                {/* 1-Tap Streaming Launchers + hearing-comfort & loud-ad guardrail */}
                <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-meta">
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
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-pine-50 dark:bg-vinyl-900 text-pine-700 dark:text-pine-300 text-xs font-mono">
                        <Ear className="w-3 h-3" />
                        Warm 150–800Hz
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-brass-800 dark:text-brass-300 font-medium">
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-plum-600 hover:bg-plum-700 text-white text-sm font-semibold"
                  >
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                    <span>They lit up — save this</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onCueReaction(cue, 'calm_soothed')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-pine-50 dark:bg-vinyl-900 border border-pine-500/40 text-pine-700 dark:text-pine-300 text-sm font-semibold"
                  >
                    <Heart className="w-4 h-4" aria-hidden="true" />
                    <span>Helps the late afternoon</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onCueReaction(cue, 'restless_skip')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-parchment-100 dark:bg-vinyl-900 text-loam-body dark:text-loam-body-dark text-sm font-medium"
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    <span>Not for them — set aside</span>
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
                    <div className="flex items-center justify-between text-meta font-semibold text-plum-800 dark:text-brass-200">
                      <span className="flex items-center gap-1.5">
                        <PenLine className="w-3.5 h-3.5" />
                        Capture Lucid Memory Spark (Pinned to Printable Family Timeline · On-Device Only)
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuoteCue(null)}
                        className="text-loam-muted hover:underline"
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

        {/* Caregiver observations are summarized descriptively, never scored or treated as health outcomes. */}
        <section className="rounded-2xl border border-plum-200 bg-plum-50/50 p-4 dark:border-vinyl-700 dark:bg-vinyl-800" aria-labelledby="reflection-insights-heading">
          <div className="flex items-start gap-2.5">
            <BarChart3 className="mt-0.5 h-5 w-5 shrink-0 text-plum-600 dark:text-plum-300" aria-hidden="true" />
            <div>
              <h4 id="reflection-insights-heading" className="font-semibold text-loam-ink dark:text-parchment-50">What resonated</h4>
              <p className="mt-1 text-xs leading-relaxed text-loam-body dark:text-loam-body-dark">
                A simple summary of your saved observations. It describes what you recorded; it is not an assessment or prediction.
              </p>
            </div>
          </div>

          {sentimentTimeline.length > 0 && (
            <div className="mt-5 rounded-2xl border border-parchment-300 bg-white p-3 dark:border-vinyl-700 dark:bg-vinyl-900 md:p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h5 className="font-semibold text-loam-ink dark:text-parchment-50">Caregiver sentiment over time</h5>
                  <p className="mt-1 text-xs leading-relaxed text-loam-muted dark:text-loam-muted-dark">
                    Up to 12 recent activities, in the order they were recorded. These are caregiver labels, not a wellbeing score.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs" aria-hidden="true">
                  <span className="rounded-full bg-clay-50 px-2 py-1 text-clay-800 dark:bg-vinyl-800 dark:text-clay-300">1 · Set aside</span>
                  <span className="rounded-full bg-brass-50 px-2 py-1 text-brass-900 dark:bg-vinyl-800 dark:text-brass-200">2 · Settling</span>
                  <span className="rounded-full bg-plum-50 px-2 py-1 text-plum-800 dark:bg-vinyl-800 dark:text-plum-300">3 · Liked</span>
                </div>
              </div>
              <div
                className="mt-4 h-64 w-full text-loam-body dark:text-loam-body-dark"
                role="img"
                aria-label="Line chart of caregiver responses to saved activities over time, from set aside through settling to liked"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sentimentTimeline} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#D8D0C2" vertical={false} />
                    <XAxis
                      dataKey="sequence"
                      tickFormatter={(value) => `#${value}`}
                      tick={{ fill: 'currentColor', fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: '#AFA69A' }}
                    />
                    <YAxis
                      domain={[1, 3]}
                      ticks={[1, 2, 3]}
                      width={72}
                      tickFormatter={(value) => (value === 3 ? 'Liked' : value === 2 ? 'Settling' : 'Set aside')}
                      tick={{ fill: 'currentColor', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<MomentChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="response"
                      stroke="#765078"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#765078', stroke: '#FFFFFF', strokeWidth: 2 }}
                      activeDot={{ r: 7 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <ol className="sr-only">
                {sentimentTimeline.map((point) => (
                  <li key={`${point.sequence}-${point.cueName}`}>
                    Activity {point.sequence}, {point.time}: {point.cueName}. {point.responseLabel}. {point.note}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {reflectionInsights.total === 0 ? (
            <p className="mt-4 text-sm text-loam-muted dark:text-loam-muted-dark">Save a moment to begin noticing gentle patterns over time.</p>
          ) : (
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InsightItem label="Moments saved" value={String(reflectionInsights.total)} />
              <InsightItem label="Marked ‘we liked this’" value={String(reflectionInsights.liked)} />
              <InsightItem label="Marked as settling" value={String(reflectionInsights.settling)} />
              <InsightItem label="Most-saved atmosphere" value={reflectionInsights.category ?? 'Keep observing'} />
              <InsightItem label="Most-saved time of day" value={reflectionInsights.timeOfDay ?? 'Not enough times yet'} />
              <InsightItem
                label="Most-mentioned sensory cue"
                value={reflectionInsights.sensory ?? reflectionInsights.repeated ?? 'Keep observing'}
              />
            </dl>
          )}
        </section>

        {/* Spark Log + Blocked Sundowning Traps */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
          <div className="lg:col-span-7 rounded-2xl border border-clay-200 dark:border-clay-900/60 bg-clay-50/50 dark:bg-clay-950/20 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-clay-800 dark:text-clay-300">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Intercepted Era Distress Traps (What Unguarded “Oldies” Autoplay Pushes)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {data.blockedDistressTraps.map((trap) => (
                <div
                  key={trap.entity_id}
                  className="p-3 rounded-xl bg-white dark:bg-vinyl-800 border border-clay-100 dark:border-vinyl-700 text-meta space-y-1"
                >
                  <div className="font-semibold line-through decoration-clay-500 text-loam-ink dark:text-parchment-50">
                    {trap.name}
                  </div>
                  <div className="font-mono text-xs text-clay-700 dark:text-clay-300">
                    {Math.round(trap.rawEraAffinity * 100)}% era match · BLOCKED
                  </div>
                  <p className="text-loam-body dark:text-loam-muted-dark leading-snug">
                    {trap.clinicalWhyBlocked}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 p-4 space-y-2">
            <div className="text-xs font-semibold text-loam-ink dark:text-parchment-50">
              Saved moments and personal notes:
            </div>
            {sparkLog.length === 0 ? (
              <p className="text-xs text-loam-muted dark:text-loam-muted-dark">
                Tap <strong>“They lit up — save this”</strong> or{' '}
                <strong>“Helps the late afternoon”</strong> on any item above and
                it will be added to {data.guardrailsApplied.elderName}’s care
                sheet.
              </p>
            ) : (
              <div className="space-y-1.5">
                {sparkLog.slice(0, 4).map((s) => (
                  <div key={s.id} className="text-meta space-y-0.5">
                    <div className="font-mono text-plum-700 dark:text-brass-200">
                      • {s.cueName.split('—')[0].trim()}: {s.qlooUpdateNote}
                    </div>
                    {s.lucidQuote && (
                      <div className="pl-3 italic text-loam-body dark:text-parchment-100">
                        “{s.lucidQuote}”
                      </div>
                    )}
                    {s.personalNotes && (
                      <div className="pl-3 text-loam-body dark:text-parchment-100">
                        Personal note: {s.personalNotes}
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
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider break-words text-brass-700 dark:text-brass-200">
            <Coffee className="w-4 h-4" />
            <span>Cross-Domain Sensory Leap · GET /v2/insights?filter.type=urn:entity:brand</span>
          </div>
          <h3 className="text-xl font-semibold text-loam-ink dark:text-parchment-50 mt-1">
            Beyond the screen: smell, tea and things to hold
          </h3>
          <p className="text-xs md:text-sm text-loam-body dark:text-loam-muted-dark">
            Smell is often the last sense to prompt a memory, and it can still reach someone when vision or speech has faded. These are suggestions, not a treatment, and they will not work every time.
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
                  <span className="px-2.5 py-0.5 rounded-full bg-brass-100 dark:bg-vinyl-700 text-brass-700 dark:text-brass-200 text-xs font-mono font-bold uppercase">
                    {item.modality}
                  </span>
                  <span className="font-mono text-xs font-bold text-pine-700 dark:text-pine-300">
                    {item.affinityPct}% era match (Qloo)
                  </span>
                </div>
                <h4 className="font-semibold text-sm text-loam-ink dark:text-parchment-50">
                  {item.name}
                </h4>
                {/* General reasoning, not a claim about this person. */}
                <div className="text-meta text-plum-700 dark:text-brass-200">
                  Why it can help: {item.neuralPathway}
                </div>
                <p className="text-sm text-loam-body dark:text-loam-body-dark">
                  <strong className="font-semibold">Something simple to try:</strong>{' '}
                  {item.fiveDollarAction}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-vinyl-900 border border-parchment-200 dark:border-vinyl-700 text-xs italic text-loam-ink dark:text-parchment-100">
                {item.zeroQuizInvitation}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* PART 2C: FAMILIAR MEAL, EASY TO EAT & CALM CAFÉ (place) */}
      {/* ===================================================================== */}
      {data.seniorDiningPlan && (
        <section className="rounded-3xl border border-parchment-300 dark:border-vinyl-700 bg-parchment-50 dark:bg-vinyl-900 p-6 md:p-7 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-parchment-200 dark:border-vinyl-700">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider break-words text-pine-700 dark:text-pine-300">
                <Utensils className="w-4 h-4" />
                <span>
                  Culinary &amp; Venue Care · GET /v2/insights?filter.type=urn:entity:place + {data.seniorDiningPlan.culinaryHeritageTag}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-loam-ink dark:text-parchment-50 mt-1">
                A Familiar Meal, Easy to Eat &amp; a Quiet-Hours Outing
              </h3>
              <p className="text-xs md:text-sm text-loam-body dark:text-loam-muted-dark">
                Matches {data.guardrailsApplied.elderName}’s youth culinary heritage with easy-to-chew textures, warm-not-hot serving temperatures and quiet cafés. General comfort ideas — check texture, swallowing and medication questions with the person’s care team.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-brass-100 dark:bg-vinyl-800 text-brass-700 dark:text-brass-200 text-xs font-mono font-bold self-start md:self-auto">
              {data.seniorDiningPlan.iddsiLevelLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 p-5 space-y-3">
              <div className="text-meta font-mono uppercase text-plum-600 dark:text-brass-200 font-semibold">
                A Comfort Meal From Their Era (Home or Care Kitchen)
              </div>
              <h4 className="text-lg font-semibold text-loam-ink dark:text-parchment-50">
                {data.seniorDiningPlan.dishName}
              </h4>
              <div className="p-3 rounded-xl bg-pine-50 dark:bg-vinyl-900 border border-pine-500/25 text-xs text-loam-body dark:text-loam-body-dark leading-relaxed">
                <strong className="text-pine-700 dark:text-pine-300">Texture, temperature and comfort:</strong>{' '}
                {data.seniorDiningPlan.thermalAndMedSafety}
              </div>
              <div className="p-3 rounded-xl bg-parchment-100/80 dark:bg-vinyl-900/70 border border-parchment-200 dark:border-vinyl-700 text-xs italic text-loam-ink dark:text-parchment-100">
                {data.seniorDiningPlan.sensoryTableInvitation}
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 p-5 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-meta font-mono uppercase text-pine-700 dark:text-pine-300 font-semibold">
                    urn:entity:place · Calm Outing Venue
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-pine-50 dark:bg-vinyl-900 text-pine-700 dark:text-pine-300 font-mono text-meta font-bold">
                    {data.seniorDiningPlan.calmVenue.affinityPct}% Match
                    {data.seniorDiningPlan.calmVenue.source === 'live_qloo_api' ? ' · LIVE' : ''}
                  </span>
                </div>
                <h4 className="text-base font-semibold text-loam-ink dark:text-parchment-50">
                  {data.seniorDiningPlan.calmVenue.name}
                </h4>
                <div className="text-xs font-mono text-brass-700 dark:text-brass-200">
                  Quiet Window: {data.seniorDiningPlan.calmVenue.quietHoursWindow}
                </div>
                <p className="text-xs text-loam-body dark:text-loam-body-dark leading-relaxed">
                  {data.seniorDiningPlan.calmVenue.acousticComfortNote}
                </p>
              </div>
              <div className="text-meta font-mono text-loam-muted pt-2 border-t border-parchment-200 dark:border-vinyl-700">
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
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider break-words text-plum-600 dark:text-brass-200">
            <BarChart3 className="w-4 h-4" />
            <span>Agent 05A · GET /v2/insights?filter.type=urn:demographics</span>
          </div>
          <h3 className="text-lg font-semibold text-loam-ink dark:text-parchment-50">
            Why Streaming Algorithms Isolate Families — And How Qloo Bridges Them
          </h3>
          <p className="text-xs text-loam-body dark:text-loam-muted-dark">
            Standard recommender engines silo users by age cohort. Qloo’s demographic insights expose the exact generational split below, while <code className="font-mono">/v2/analysis/compare</code> leaps across the gap via shared underlying harmonic &amp; sensory tags.
          </p>

          <div className="space-y-2.5 pt-1">
            {data.demographicBridgeProof.map((band) => (
              <div key={band.ageBucket} className="space-y-1 text-xs">
                <div className="flex items-center justify-between font-mono text-meta">
                  <span className="font-semibold text-loam-body dark:text-parchment-100">{band.label}</span>
                  <span>
                    <span className="text-pine-700 dark:text-pine-300">
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
                      className={band.grandchildSeedSkew >= 0
                        ? 'bg-pine-600 dark:bg-pine-300'
                        : 'bg-clay-500 dark:bg-clay-300'}
                    />
                  </div>
                  <div className="bg-parchment-200 dark:bg-vinyl-700 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.round(Math.abs(band.elderClueSkew) * 100)}%` }}
                      className={band.elderClueSkew >= 0
                        ? 'bg-plum-600 dark:bg-brass-300'
                        : 'bg-clay-500 dark:bg-clay-300'}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 6 Cols: GET /v2/insights?filter.type=urn:heatmap */}
        <div className="lg:col-span-6 rounded-3xl border border-parchment-300 dark:border-vinyl-700 bg-parchment-50 dark:bg-vinyl-900 p-6 space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider break-words text-pine-600 dark:text-pine-300">
            <MapPin className="w-4 h-4" />
            <span>Agent 05B · GET /v2/insights?filter.type=urn:heatmap (urn:geohash)</span>
          </div>
          <h3 className="text-lg font-semibold text-loam-ink dark:text-parchment-50">
            {data.geographyInfo.name}: Youth Place-Memory Hotspots
          </h3>
          <p className="text-xs text-loam-body dark:text-loam-muted-dark">
            High-<code className="font-mono">affinity_rank</code> neighborhood pockets where {data.guardrailsApplied.elderName}’s youth music &amp; cinema culture lived — paired with zero-quiz sensory place prompts.
          </p>

          <div className="space-y-2.5">
            {data.hometownHotspots.map((spot) => (
              <div
                key={spot.geohash}
                className="rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 p-3.5 space-y-1.5"
              >
                {/* A geohash is one unbreakable token; without wrap and min-w-0
                    it pushes the row wider than a 320px phone. */}
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <span className="font-semibold text-sm text-loam-ink dark:text-parchment-50 min-w-0 break-words">
                    {spot.districtName}
                  </span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-pine-50 dark:bg-vinyl-900 text-pine-700 dark:text-pine-300 break-all">
                    geohash:{spot.geohash} · rank {(spot.affinityRank * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-meta text-loam-muted dark:text-loam-muted-dark">
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

const MomentChartTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ payload: SentimentPoint }>;
}> = ({ active, payload }) => {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="max-w-64 rounded-xl border border-parchment-300 bg-white p-3 text-xs shadow-card dark:border-vinyl-600 dark:bg-vinyl-800">
      <p className="font-semibold text-loam-ink dark:text-parchment-50">{point.cueName}</p>
      <p className="mt-1 text-plum-700 dark:text-plum-300">{point.responseLabel} · {point.time}</p>
      <p className="mt-2 leading-relaxed text-loam-body dark:text-loam-body-dark">{point.note}</p>
    </div>
  );
};

const InsightItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-parchment-200 bg-white p-3 dark:border-vinyl-700 dark:bg-vinyl-900">
    <dt className="text-xs text-loam-muted dark:text-loam-muted-dark">{label}</dt>
    <dd className="mt-1 font-semibold text-loam-ink dark:text-parchment-50">{value}</dd>
  </div>
);
