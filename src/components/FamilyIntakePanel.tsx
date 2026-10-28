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

  const handleRunStory = async (override?: string) => {
    const t = (override ?? storyInput).trim();
    if (!t) return;
    if (override) setStoryInput(override);
    const res = await onApplyNarrative(t);
    setParseReceipt(res);
  };

  return (
    <div className="space-y-8">
      {/* Hero + 1-Click Family Stories + Zero-Form Narrative Intake */}
      <section className="rounded-3xl border border-parchment-300 dark:border-vinyl-700 bg-parchment-50 dark:bg-vinyl-900 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-parchment-200 dark:border-vinyl-700">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-plum-50 dark:bg-plum-900/50 border border-plum-200 dark:border-plum-700 text-plum-700 dark:text-brass-200 text-xs font-semibold mb-3">
              <Brain className="w-3.5 h-3.5" />
              <span>Medial Prefrontal Cortex (mPFC) Reminiscence Bump · Ages 10–30 Spared Island</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold text-stone-900 dark:text-parchment-50 leading-tight">
              Reconstruct the youth universe their brain still remembers — and bridge it to <em className="italic text-plum-600 dark:text-brass-200">yours</em>.
            </h2>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              Alzheimer’s erodes recent small talk early, yet spares cultural and musical memories encoded between ages 10 and 30. Give Qloo 1–2 fragile family clues and a grandchild’s favorites to build a sundowning-safe bridge across decades.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenBridgeView}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-plum-600 hover:bg-plum-700 text-white font-semibold text-sm shadow-sm transition shrink-0"
          >
            <span>Open Reconstructed Youth &amp; Bridge</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 1-Click Cross-Generational Family Presets */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">
            1-Click Real-World Intergenerational Family Stories
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
                  <div className="text-[11px] font-mono font-semibold text-plum-600 dark:text-brass-200">
                    {p.badge}
                  </div>
                  <div className="font-semibold text-sm text-stone-900 dark:text-parchment-50 mt-1">
                    {p.elderTitle}
                  </div>
                  <div className="text-xs font-medium text-pine-600 dark:text-emerald-300 mt-0.5">
                    ↔ {p.grandchildTitle}
                  </div>
                  <p className="mt-2 text-xs text-stone-600 dark:text-stone-400 line-clamp-3 leading-relaxed">
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
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-800 dark:text-parchment-50 flex items-center gap-1.5">
              <Wand2 className="w-4 h-4 text-plum-600 dark:text-brass-200" />
              Zero-Form Family Clue Parser
            </span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">
              Describe your loved one’s age, hometown, one song/film clue, and what the grandkids love:
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <textarea
              rows={2}
              value={storyInput}
              onChange={(e) => setStoryInput(e.target.value)}
              placeholder="e.g., “My 82yo grandmother Thandi grew up in Cape Town, hums Miriam Makeba, gets anxious at 4:30 PM, and my 21yo daughter Zuri loves Tems...”"
              className="flex-1 rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-plum-500 resize-none"
            />
            <button
              type="button"
              onClick={() => handleRunStory()}
              disabled={!storyInput.trim()}
              className="px-4 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-brass-500 dark:text-vinyl-950 text-white text-xs font-semibold shrink-0 disabled:opacity-40"
            >
              Reconstruct Era &amp; Bridge
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-stone-500 mr-1">1-click family note:</span>
            {FAMILY_STORY_EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => handleRunStory(ex.text)}
                className="px-2.5 py-1 rounded-full border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 hover:border-plum-500 text-[11px] font-medium"
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
                  <div key={i} className="rounded-xl bg-white dark:bg-vinyl-800 border border-parchment-200 dark:border-vinyl-700 px-3 py-1.5 text-[11px]">
                    <div className="flex justify-between font-mono">
                      <span className="font-semibold text-plum-700 dark:text-brass-200">{r.parameter}</span>
                      <span className="truncate max-w-[190px]">{r.value}</span>
                    </div>
                    <div className="text-[10px] text-stone-500 dark:text-stone-400">{r.reason}</div>
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
            <span className="font-mono text-xs uppercase tracking-wider text-plum-600 dark:text-brass-200">
              Neurological Time-Machine · Qloo filter.release_year.min={bumpWindow.bumpStartYear} &amp; max={bumpWindow.bumpEndYear}
            </span>
            <h3 className="text-xl font-semibold text-stone-900 dark:text-parchment-50 mt-0.5">
              {guardrails.elderName}’s Spared Reminiscence Bump ({bumpWindow.bumpStartYear}–{bumpWindow.bumpEndYear})
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Slide birth year to watch how Alzheimer’s spares autobiographical &amp; musical encoding from ages 10–30 (peaking ages 15–23 in the dorsal medial prefrontal cortex).
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-parchment-100 dark:bg-vinyl-800 border border-parchment-300 dark:border-vinyl-700 lg:w-80">
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span>Loved One’s Birth Year:</span>
              <span className="font-mono text-plum-700 dark:text-brass-200">
                {bumpWindow.birthYear} (Age {bumpWindow.currentAge})
              </span>
            </div>
            <input
              type="range"
              min={1930}
              max={1964}
              step={1}
              value={guardrails.birthYear}
              onChange={(e) => onUpdateGuardrails({ birthYear: Number(e.target.value) })}
              className="kinship-slider w-full"
            />
            <div className="flex justify-between text-[10px] font-mono text-stone-500 mt-1">
              <span>1930 (Age 96)</span>
              <span>1946 (Age 80)</span>
              <span>1964 (Age 62)</span>
            </div>
          </div>
        </div>

        {/* 7-Decade mPFC Cortical Preservation Bar Chart */}
        <div className="grid grid-cols-7 gap-2 pt-3 items-end h-44 px-2 rounded-2xl bg-parchment-50 dark:bg-vinyl-800/70 border border-parchment-200 dark:border-vinyl-700 p-4">
          {bumpWindow.lifeDecades.map((dec) => (
            <div key={dec.ageRange} className="flex flex-col items-center justify-end h-full gap-1">
              <span
                className={`font-mono text-[10px] font-bold ${
                  dec.isReminiscenceBump ? 'text-plum-700 dark:text-brass-200' : 'text-stone-400'
                }`}
              >
                {dec.mpfcRetentionPct}%
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
              <span className="text-[10px] font-semibold text-stone-800 dark:text-parchment-100 text-center leading-tight mt-1">
                {dec.ageRange}
              </span>
              <span className="font-mono text-[9px] text-stone-500 dark:text-stone-400 text-center">
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
              <span className="font-mono text-[11px] uppercase text-plum-600 dark:text-brass-200">
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
                  className="disabled:opacity-40"
                >
                  <X className="w-3 h-3" />
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
                    <div className="text-[10px] text-stone-500 truncate">{item.originLabel}</div>
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
            <button type="submit" className="px-3 py-1.5 rounded-xl bg-plum-600 text-white text-xs font-medium">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>
        </section>

        {/* Grandchild / Care Circle Modern Favorites (4 cols) */}
        <section className="lg:col-span-4 rounded-3xl border border-parchment-300 dark:border-vinyl-700 bg-parchment-50 dark:bg-vinyl-900 p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-[11px] uppercase text-pine-600 dark:text-emerald-300">
                b.signal · Care Circle Visitor
              </span>
              <h4 className="text-lg font-semibold">Visitor Bridge Perspective</h4>
            </div>
            <Users className="w-5 h-5 text-pine-600 dark:text-emerald-300" />
          </div>

          {/* 1-Click Care Circle Role Switcher */}
          <div className="grid grid-cols-3 gap-1.5">
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
                  <div className="text-[10px] font-mono font-bold truncate">{role.relationshipBadge}</div>
                  <div className={`text-[10px] truncate ${active ? 'text-emerald-100' : 'text-stone-500'}`}>
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
                  className="disabled:opacity-40"
                >
                  <X className="w-3 h-3" />
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
                    <div className="text-[10px] text-stone-500 truncate">{item.originLabel}</div>
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
            <button type="submit" className="px-3 py-1.5 rounded-xl bg-pine-600 text-white text-xs font-medium">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>
        </section>

        {/* Youth Geography & Dementia Safety Shield (4 cols) */}
        <section className="lg:col-span-4 rounded-3xl border border-parchment-300 dark:border-vinyl-700 bg-parchment-50 dark:bg-vinyl-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-[11px] uppercase text-brass-700 dark:text-brass-200">
                Youth Hometown &amp; Safety
              </span>
              <h4 className="text-lg font-semibold">Cultural Geography &amp; Shield</h4>
            </div>
            <Heart className="w-5 h-5 text-plum-600" />
          </div>

          <div className="grid grid-cols-2 gap-1.5">
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
                <div className={`text-[10px] ${guardrails.youthGeography === g.id ? 'text-plum-100' : 'text-stone-400'}`}>
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
                title: 'Presbycusis Hearing-Aid Warmth EQ',
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
                    <div className="text-[10px] text-stone-500 pl-5">{item.sub}</div>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-pine-700 dark:text-emerald-300">
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
