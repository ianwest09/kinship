import React, { useState } from 'react';
import {
  ArrowRight,
  Brain,
  Check,
  Disc3,
  Heart,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
  Wand2,
  X,
} from 'lucide-react';
import {
  CareCircleRolePreset,
  CircadianWindowId,
  CulturalClueSeed,
  DementiaStageId,
  ElderGuardrails,
  FamilyNarrativeParseResult,
  FamilyPreset,
  QlooEntitySubtype,
  ReminiscenceBumpWindow,
  YouthGeographyId,
} from '../../shared/types';
import { CARE_CIRCLE_ROLES, FAMILY_STORY_EXAMPLES } from '../../server/reminiscenceGraph';

interface Props {
  presets: FamilyPreset[];
  activePresetId: string | null;
  elderCatalog: CulturalClueSeed[];
  grandchildCatalog: CulturalClueSeed[];
  geographies: Array<{ id: YouthGeographyId; name: string; country: string; eraCulturalPortrait: string }>;
  guardrails: ElderGuardrails;
  bumpWindow: ReminiscenceBumpWindow;
  elderClues: Array<{ entity_id?: string; name: string; subtype: QlooEntitySubtype; weight: number }>;
  grandchildSeeds: Array<{ entity_id?: string; name: string; subtype: QlooEntitySubtype }>;
  onSelectPreset: (p: FamilyPreset) => void;
  onUpdateGuardrails: (patch: Partial<ElderGuardrails>) => void;
  onToggleElderClue: (seed: CulturalClueSeed) => void;
  onAddCustomElderClue: (name: string, subtype: QlooEntitySubtype) => void;
  onRemoveElderClue: (name: string) => void;
  onToggleGrandchildSeed: (seed: CulturalClueSeed) => void;
  onAddCustomGrandchildSeed: (name: string, subtype: QlooEntitySubtype) => void;
  onRemoveGrandchildSeed: (name: string) => void;
  onSelectCareCircleRole: (role: CareCircleRolePreset) => void;
  onApplyNarrative: (text: string) => Promise<FamilyNarrativeParseResult>;
  onOpenBridgeView: () => void;
}

const thisYear = new Date().getFullYear();

/**
 * The retention curve used to be printed as a percentage — "96%", "33%" — which
 * reads as a measured medical figure. It is a fixed weighting that ships with
 * Kinship's own catalogue, so it is now described as what it is.
 */
function retentionLabel(weight: number): string {
  if (weight >= 85) return 'Strongest';
  if (weight >= 60) return 'Strong';
  if (weight >= 35) return 'Some';
  return 'Less';
}

export const FamilyIntakePanel: React.FC<Props> = ({
  presets,
  activePresetId,
  elderCatalog,
  grandchildCatalog,
  geographies,
  guardrails,
  bumpWindow,
  elderClues,
  grandchildSeeds,
  onSelectPreset,
  onUpdateGuardrails,
  onToggleElderClue,
  onAddCustomElderClue,
  onRemoveElderClue,
  onToggleGrandchildSeed,
  onAddCustomGrandchildSeed,
  onRemoveGrandchildSeed,
  onSelectCareCircleRole,
  onApplyNarrative,
  onOpenBridgeView,
}) => {
  const [storyInput, setStoryInput] = useState('');
  const [parseReceipt, setParseReceipt] = useState<FamilyNarrativeParseResult | null>(null);
  const [customElderText, setCustomElderText] = useState('');
  const [customGcText, setCustomGcText] = useState('');

  /**
   * Guards against a double tap while the parse is in flight. On a slow
   * connection the old button gave no feedback at all, so people tapped again
   * and fired a second request; the text they typed is kept either way.
   */
  const [isWorking, setIsWorking] = useState(false);
  const handleRunStory = async (override?: string) => {
    const t = (override ?? storyInput).trim();
    if (!t || isWorking) return;
    if (override) setStoryInput(override);
    setIsWorking(true);
    try {
      const res = await onApplyNarrative(t);
      setParseReceipt(res);
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero + 1-Click Family Stories + Zero-Form Narrative Intake */}
      <section className="rounded-3xl border border-parchment-300 dark:border-vinyl-700 bg-parchment-50 dark:bg-vinyl-900 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-parchment-200 dark:border-vinyl-700">
          <div className="max-w-2xl">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-loam-ink dark:text-parchment-50 leading-tight tracking-tight">
              Add what you know about them
            </h2>
            <p className="mt-3 text-base md:text-lg text-loam-body dark:text-loam-body-dark leading-relaxed">
              A couple of small details is plenty — a song, a film, the town they
              grew up in, what the grandchildren love. Kinship uses them to suggest
              things you might enjoy together. You can change or remove any of it
              later.
            </p>

            <details className="mt-4 group">
              <summary className="flex items-center gap-2 cursor-pointer list-none text-sm md:text-base font-semibold text-plum-700 dark:text-plum-300">
                <Brain className="w-4 h-4" aria-hidden="true" />
                <span>Why music from their youth still reaches them</span>
              </summary>
              <p className="mt-2.5 pl-6 text-sm md:text-base text-loam-body dark:text-loam-body-dark leading-relaxed">
                Dementia erodes recent small talk early, yet cultural and musical
                memories formed between roughly ages 10 and 30 are often preserved
                — a pattern often called the “Reminiscence
                Bump”. Kinship looks at that window, and at the places they grew
                up, to suggest things that may still feel familiar. These are
                general patterns, not facts about any one person.
              </p>
            </details>
          </div>

          <button
            type="button"
            onClick={onOpenBridgeView}
            className="loam-btn-primary shrink-0"
          >
            <span>See suggestions</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* 1-Click Cross-Generational Family Presets */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-loam-muted dark:text-loam-muted-dark mb-3">
            Start from a story like yours
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
            {presets.map((p) => {
              const active = activePresetId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPreset(p)}
                  className={`text-left rounded-2xl p-4 border transition-all ${
                    active
                      ? 'border-plum-600 dark:border-brass-200 bg-plum-50/70 dark:bg-plum-900/30 ring-1 ring-plum-600 dark:ring-brass-200'
                      : 'border-parchment-300 dark:border-vinyl-700 bg-white/80 dark:bg-vinyl-800 hover:border-plum-500/60'
                  }`}
                >
                  <div className="text-meta font-mono font-semibold text-plum-600 dark:text-brass-200">
                    {p.badge}
                  </div>
                  <div className="font-semibold text-sm text-loam-ink dark:text-parchment-50 mt-1">
                    {p.elderTitle}
                  </div>
                  <div className="text-xs font-medium text-pine-600 dark:text-pine-300 mt-0.5">
                    ↔ {p.grandchildTitle}
                  </div>
                  <p className="mt-2 text-xs text-loam-body dark:text-loam-muted-dark line-clamp-3 leading-relaxed">
                    {p.storyQuote}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversational "Tell Us One Clue" Family Parser */}
        <div className="pt-5 border-t border-parchment-200 dark:border-vinyl-700 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="family-story"
              className="text-sm md:text-base font-semibold text-loam-ink dark:text-parchment-50 flex items-center gap-1.5"
            >
              <Wand2 className="w-4 h-4 text-plum-600 dark:text-brass-200" aria-hidden="true" />
              Or describe them in your own words
            </label>
            <span className="text-meta text-loam-muted dark:text-loam-muted-dark">
              A sentence is plenty: where they grew up, one song or film they
              loved, and what the younger ones are into.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <textarea
              id="family-story"
              name="family-story"
              rows={3}
              value={storyInput}
              onChange={(e) => setStoryInput(e.target.value)}
              placeholder="e.g. “My grandmother grew up in Cape Town and hums Miriam Makeba. My daughter loves Tems.”"
              aria-describedby="family-story-note"
              className="flex-1 rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 px-3.5 py-3 text-base leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-loam-focus resize-none"
            />
            <button
              type="button"
              onClick={() => handleRunStory()}
              disabled={!storyInput.trim() || isWorking}
              aria-busy={isWorking}
              className="loam-btn-primary shrink-0 text-sm md:text-base"
            >
              <span>{isWorking ? 'Working…' : 'Find suggestions'}</span>
            </button>
          </div>

          <p id="family-story-note" className="text-meta text-loam-muted dark:text-loam-muted-dark">
            Nothing is uploaded to Qloo, and you can change or remove any of it
            afterwards.
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-meta text-loam-muted dark:text-loam-muted-dark mr-1">
              Or start from an example:
            </span>
            {FAMILY_STORY_EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => handleRunStory(ex.text)}
                disabled={isWorking}
                className="px-3 py-2 rounded-full border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 hover:border-plum-500 text-meta font-medium disabled:opacity-50"
              >
                “{ex.label}”
              </button>
            ))}
          </div>

          {parseReceipt && (
            <div className="rounded-2xl border border-plum-500/30 bg-plum-50/60 dark:bg-plum-900/20 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-plum-700 dark:text-brass-200">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {parseReceipt.summary}
                </span>
                <button type="button" onClick={onOpenBridgeView} className="underline">
                  View Youth Universe &amp; Playbook →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {parseReceipt.receipts.map((r, i) => (
                  <div key={i} className="rounded-xl bg-white dark:bg-vinyl-800 border border-parchment-200 dark:border-vinyl-700 px-3 py-1.5 text-meta">
                    <div className="flex justify-between font-mono">
                      <span className="font-semibold text-plum-700 dark:text-brass-200">{r.parameter}</span>
                      <span className="truncate max-w-[190px]">{r.value}</span>
                    </div>
                    <div className="text-xs text-loam-muted dark:text-loam-muted-dark">{r.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Interactive Neurological Reminiscence Bump Curve & Birth Year Scrubber */}
      <section className="rounded-3xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-900 p-6 md:p-7 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-meta uppercase tracking-wider break-words text-plum-600 dark:text-brass-200">
              Qloo filter.release_year.min={bumpWindow.bumpStartYear} &amp; max={bumpWindow.bumpEndYear}
            </span>
            <h3 className="text-xl font-semibold text-loam-ink dark:text-parchment-50 mt-0.5">
              The years to draw from ({bumpWindow.bumpStartYear}–{bumpWindow.bumpEndYear})
            </h3>
            <p className="text-sm md:text-base text-loam-body dark:text-loam-body-dark">
              Most people hold on to the music of their teens and twenties
              longest — a well-documented pattern called the reminiscence bump.
              Kinship looks there first. Slide the birth year to change the
              window.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-parchment-100 dark:bg-vinyl-800 border border-parchment-300 dark:border-vinyl-700 lg:w-80">
            <div className="flex justify-between text-sm font-semibold mb-1.5">
              <label htmlFor="birth-year">Birth year</label>
              <span className="font-mono text-plum-700 dark:text-brass-200">
                {bumpWindow.birthYear} (Age {bumpWindow.currentAge})
              </span>
            </div>
            <input
              id="birth-year"
              type="range"
              min={1930}
              max={1980}
              step={1}
              value={guardrails.birthYear}
              onChange={(e) => onUpdateGuardrails({ birthYear: Number(e.target.value) })}
              className="kinship-slider w-full"
              aria-valuetext={`Born ${bumpWindow.birthYear}, age ${bumpWindow.currentAge}`}
            />
            {/* Tick ages used to be hardcoded, so they would have drifted every
                year. The upper bound now reaches 1980: early-onset dementia in
                someone in their fifties could not be represented before. */}
            <div className="flex justify-between text-meta font-mono text-loam-muted dark:text-loam-muted-dark mt-1">
              {[1930, 1955, 1980].map((y) => (
                <span key={y}>
                  {y} (age {thisYear - y})
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Retention across the lifespan. A 7-column grid at 360px gives each
            column ~45px, which crushes the year labels, so phones get a
            vertical list instead of a clipped grid or a scroll region. */}
        <p className="text-meta text-loam-muted dark:text-loam-muted-dark">
          The bars show how much weight Kinship gives each stretch of years when
          it looks for suggestions. It is Kinship’s own ranking, not a
          measurement of anyone’s memory.
        </p>

        <ul className="md:hidden space-y-3 rounded-2xl bg-parchment-50 dark:bg-vinyl-800/70 border border-parchment-200 dark:border-vinyl-700 p-4">
          {bumpWindow.lifeDecades.map((dec) => (
            <li key={dec.ageRange} className="min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm md:text-base font-semibold text-loam-ink dark:text-parchment-100 truncate">
                  {dec.ageRange}
                  {dec.isPeakBump ? ' ★' : ''}
                </span>
                <span
                  className={`text-sm font-semibold shrink-0 ${
                    dec.isReminiscenceBump
                      ? 'text-plum-700 dark:text-plum-300'
                      : 'text-loam-muted dark:text-loam-muted-dark'
                  }`}
                >
                  {retentionLabel(dec.mpfcRetentionPct)}
                </span>
              </div>
              <div
                className="mt-1.5 h-3 rounded-full bg-parchment-200 dark:bg-vinyl-700 overflow-hidden"
                role="img"
                aria-label={`${dec.ageRange}, ${dec.yearsLabel}: ${retentionLabel(
                  dec.mpfcRetentionPct
                )} weight in Kinship’s suggestions`}
              >
                <div
                  style={{ width: `${dec.mpfcRetentionPct}%` }}
                  className={`h-full rounded-full ${
                    dec.isPeakBump
                      ? 'bg-plum-600 dark:bg-brass-500'
                      : dec.isReminiscenceBump
                        ? 'bg-plum-500/85 dark:bg-brass-600'
                        : 'bg-parchment-400 dark:bg-vinyl-600'
                  }`}
                />
              </div>
              <span className="block font-mono text-xs text-loam-muted dark:text-loam-muted-dark mt-1">
                {dec.yearsLabel}
              </span>
            </li>
          ))}
        </ul>

        <div className="hidden md:grid grid-cols-7 gap-2 pt-3 items-end h-44 px-2 rounded-2xl bg-parchment-50 dark:bg-vinyl-800/70 border border-parchment-200 dark:border-vinyl-700 p-4">
          {bumpWindow.lifeDecades.map((dec) => (
            <div key={dec.ageRange} className="flex flex-col items-center justify-end h-full gap-1 min-w-0">
              <span
                className={`text-meta font-semibold text-center ${
                  dec.isReminiscenceBump ? 'text-plum-700 dark:text-brass-200' : 'text-loam-muted dark:text-loam-muted-dark'
                }`}
              >
                {retentionLabel(dec.mpfcRetentionPct)}
              </span>
              <div
                style={{ height: `${dec.mpfcRetentionPct}%` }}
                className={`w-full rounded-t-xl transition-all ${
                  dec.isPeakBump
                    ? 'bg-plum-600 dark:bg-brass-500 ring-2 ring-brass-500/50'
                    : dec.isReminiscenceBump
                      ? 'bg-plum-500/85 dark:bg-brass-600'
                      : 'bg-parchment-300 dark:bg-vinyl-600'
                }`}
              />
              <span className="text-xs font-semibold text-loam-ink dark:text-parchment-100 text-center leading-tight mt-1">
                {dec.ageRange}
              </span>
              <span className="font-mono text-xs text-loam-muted dark:text-loam-muted-dark text-center">
                {dec.yearsLabel}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 3-Column Studio: Elder Clues (a.signal) + Grandchild Favorites (b.signal) + Dementia Guardrails */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Elder Clues (4 cols) */}
        <section className="lg:col-span-4 rounded-3xl border border-parchment-300 dark:border-vinyl-700 bg-parchment-50 dark:bg-vinyl-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-meta uppercase text-plum-600 dark:text-brass-200">
                a.signal · Elder Clues
              </span>
              <h4 className="text-lg font-semibold">1–2 Fragile Youth Clues</h4>
            </div>
            <Disc3 className="w-5 h-5 text-plum-600 dark:text-brass-200" />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {elderClues.map((c) => (
              <span
                key={c.name}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-plum-600 text-white text-xs font-medium"
              >
                <span>{c.name.split('(')[0].trim()}</span>
                <button
                  type="button"
                  disabled={elderClues.length <= 1}
                  onClick={() => onRemoveElderClue(c.name)}
                  aria-label={`Remove ${c.name.split('(')[0].trim()} from their familiar things`}
                  className="disabled:opacity-40"
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {elderCatalog.map((item) => {
              const sel = elderClues.some((e) => e.name === item.name);
              return (
                <button
                  key={item.entity_id}
                  type="button"
                  onClick={() => onToggleElderClue(item)}
                  className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-xl border text-left text-xs transition ${
                    sel
                      ? 'border-plum-600 bg-plum-50 dark:bg-plum-900/30'
                      : 'border-parchment-200 dark:border-vinyl-700 bg-white dark:bg-vinyl-800'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{item.name}</div>
                    <div className="text-xs text-loam-muted truncate">{item.originLabel}</div>
                  </div>
                  {sel && <Check className="w-4 h-4 text-plum-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!customElderText.trim()) return;
              onAddCustomElderClue(customElderText.trim(), 'urn:entity:artist');
              setCustomElderText('');
            }}
            className="flex gap-1.5 pt-2 border-t border-parchment-200 dark:border-vinyl-700"
          >
            <input
              type="text"
              value={customElderText}
              onChange={(e) => setCustomElderText(e.target.value)}
              placeholder="Or type any old song/film..."
              className="flex-1 px-3 py-1.5 rounded-xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 text-xs"
            />
            <button
              type="submit"
              aria-label="Add this to their familiar things"
              className="px-3 py-1.5 rounded-xl bg-plum-600 text-white text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </form>
        </section>

        {/* Grandchild / Care Circle Modern Favorites (4 cols) */}
        <section className="lg:col-span-4 rounded-3xl border border-parchment-300 dark:border-vinyl-700 bg-parchment-50 dark:bg-vinyl-900 p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-meta uppercase text-pine-600 dark:text-pine-300">
                b.signal · Care Circle Visitor
              </span>
              <h4 className="text-lg font-semibold">Visitor Bridge Perspective</h4>
            </div>
            <Users className="w-5 h-5 text-pine-600 dark:text-pine-300" />
          </div>

          {/* Care circle role switcher */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CARE_CIRCLE_ROLES.map((role) => {
              const active = guardrails.grandchildName === role.visitorLabel;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => onSelectCareCircleRole(role)}
                  className={`p-2 rounded-xl border text-left transition ${
                    active
                      ? 'border-pine-600 bg-pine-600 text-white'
                      : 'border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800'
                  }`}
                >
                  <div className="text-xs font-mono font-bold truncate">{role.relationshipBadge}</div>
                  <div className={`text-xs truncate ${active ? 'text-pine-100' : 'text-loam-muted'}`}>
                    {role.visitorLabel.split('(')[0].trim()}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {grandchildSeeds.map((g) => (
              <span
                key={g.name}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pine-600 text-white text-xs font-medium"
              >
                <span>{g.name.split('(')[0].trim()}</span>
                <button
                  type="button"
                  disabled={grandchildSeeds.length <= 1}
                  onClick={() => onRemoveGrandchildSeed(g.name)}
                  aria-label={`Remove ${g.name.split('(')[0].trim()} from what the younger ones love`}
                  className="disabled:opacity-40"
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {grandchildCatalog.map((item) => {
              const sel = grandchildSeeds.some((g) => g.name === item.name);
              return (
                <button
                  key={item.entity_id}
                  type="button"
                  onClick={() => onToggleGrandchildSeed(item)}
                  className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-xl border text-left text-xs transition ${
                    sel
                      ? 'border-pine-600 bg-pine-50 dark:bg-vinyl-800'
                      : 'border-parchment-200 dark:border-vinyl-700 bg-white dark:bg-vinyl-800'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{item.name}</div>
                    <div className="text-xs text-loam-muted truncate">{item.originLabel}</div>
                  </div>
                  {sel && <Check className="w-4 h-4 text-pine-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!customGcText.trim()) return;
              onAddCustomGrandchildSeed(customGcText.trim(), 'urn:entity:artist');
              setCustomGcText('');
            }}
            className="flex gap-1.5 pt-2 border-t border-parchment-200 dark:border-vinyl-700"
          >
            <input
              type="text"
              value={customGcText}
              onChange={(e) => setCustomGcText(e.target.value)}
              placeholder="Or type any 2020s artist/film..."
              className="flex-1 px-3 py-1.5 rounded-xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 text-xs"
            />
            <button
              type="submit"
              aria-label="Add this to what the younger ones love"
              className="px-3 py-1.5 rounded-xl bg-pine-600 text-white text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </form>
        </section>

        {/* Youth Geography & Dementia Safety Shield (4 cols) */}
        <section className="lg:col-span-4 rounded-3xl border border-parchment-300 dark:border-vinyl-700 bg-parchment-50 dark:bg-vinyl-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-meta uppercase text-brass-700 dark:text-brass-200">
                Youth Hometown &amp; Safety
              </span>
              <h4 className="text-lg font-semibold">Cultural Geography &amp; Shield</h4>
            </div>
            <Heart className="w-5 h-5 text-plum-600" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {geographies.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => onUpdateGuardrails({ youthGeography: g.id })}
                className={`p-2 rounded-xl border text-left text-xs transition ${
                  guardrails.youthGeography === g.id
                    ? 'border-plum-600 bg-plum-600 text-white'
                    : 'border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800'
                }`}
              >
                <div className="font-semibold truncate">{g.name.split('&')[0].trim()}</div>
                <div className={`text-xs ${guardrails.youthGeography === g.id ? 'text-plum-100' : 'text-loam-muted'}`}>
                  {g.country}
                </div>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Time-of-Day Circadian Window</label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {(
                [
                  { id: 'morning_spark', label: '10 AM Spark' },
                  { id: 'afternoon_bridge', label: '2 PM Visit' },
                  { id: 'sundowning_calm', label: '4:30 PM Calm' },
                ] as Array<{ id: CircadianWindowId; label: string }>
              ).map((cw) => (
                <button
                  key={cw.id}
                  type="button"
                  onClick={() => onUpdateGuardrails({ circadianWindow: cw.id })}
                  className={`py-2 px-2 rounded-xl border font-medium ${
                    guardrails.circadianWindow === cw.id
                      ? 'border-plum-600 bg-plum-50 dark:bg-plum-900/40 text-plum-800 dark:text-brass-200'
                      : 'border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800'
                  }`}
                >
                  {cw.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Cognitive Support Stage</label>
            <select
              value={guardrails.dementiaStage}
              onChange={(e) => onUpdateGuardrails({ dementiaStage: e.target.value as DementiaStageId })}
              className="w-full px-3 py-2 rounded-xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 text-xs"
            >
              <option value="early_mild">Early / Mild (Enjoys light stories + music)</option>
              <option value="moderate_mid">Moderate (Prefers songs, visuals &amp; zero plot quiz)</option>
              <option value="late_sensory">Late / Sensory (60–80 BPM melody, touch &amp; rhythm)</option>
            </select>
          </div>

          <div className="space-y-2 pt-1">
            {[
              {
                k: 'sundowningSafeShield' as const,
                title: 'Sundowning & Paranoia Shield (G/PG)',
                sub: 'Blocks suspense, shadows, war & distress themes',
              },
              {
                k: 'plotFreeMusicalFocus' as const,
                title: 'Zero-Plot Musical & Visual Focus',
                sub: 'Prioritizes song reels, baking & wordless slapstick',
              },
              {
                k: 'hearingLossWarmEq' as const,
                title: 'Warm the sound for hearing aids',
                sub: 'Boosts 150–800 Hz baritone/cello & rolls off shrill >3.2 kHz',
              },
            ].map((item) => {
              const active = Boolean(guardrails[item.k]);
              return (
                <button
                  key={item.k}
                  type="button"
                  onClick={() => onUpdateGuardrails({ [item.k]: !active })}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs ${
                    active
                      ? 'border-pine-600/70 bg-pine-50/70 dark:bg-vinyl-800'
                      : 'border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800'
                  }`}
                >
                  <div>
                    <div className="font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-pine-600" />
                      <span>{item.title}</span>
                    </div>
                    <div className="text-xs text-loam-muted pl-5">{item.sub}</div>
                  </div>
                  <span className="font-mono text-xs font-bold text-pine-700 dark:text-pine-300">
                    {active ? 'ON' : 'OFF'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
