import React, { useId, useState } from 'react';
import {
  ArrowRight,
  Brain,
  Camera,
  Check,
  Disc3,
  Heart,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
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
  careRecipientAvatar: string;
  caregiverAvatar: string;
  onCareRecipientAvatarChange: (avatar: string) => void;
  onCaregiverAvatarChange: (avatar: string) => void;
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

async function makeAvatarThumbnail(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  if (file.size > 8 * 1024 * 1024) throw new Error('Choose an image smaller than 8 MB.');
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('That photo could not be read.'));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const next = new Image();
    next.onload = () => resolve(next);
    next.onerror = () => reject(new Error('That photo could not be opened.'));
    next.src = source;
  });
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Photo editing is not available in this browser.');
  const crop = Math.min(image.naturalWidth, image.naturalHeight);
  context.drawImage(
    image,
    (image.naturalWidth - crop) / 2,
    (image.naturalHeight - crop) / 2,
    crop,
    crop,
    0,
    0,
    size,
    size
  );
  return canvas.toDataURL('image/jpeg', 0.78);
}

export const FamilyIntakePanel: React.FC<Props> = ({
  presets,
  activePresetId,
  elderCatalog,
  grandchildCatalog,
  geographies,
  guardrails,
  bumpWindow,
  careRecipientAvatar,
  caregiverAvatar,
  onCareRecipientAvatarChange,
  onCaregiverAvatarChange,
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
  const [avatarError, setAvatarError] = useState('');

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

      <section className="rounded-3xl border border-parchment-300 bg-white p-6 shadow-sm dark:border-vinyl-700 dark:bg-vinyl-900 md:p-7" aria-labelledby="people-details-heading">
        <div className="max-w-3xl">
          <span className="font-mono text-meta uppercase tracking-wider text-plum-600 dark:text-brass-200">
            Optional relationship context
          </span>
          <h3 id="people-details-heading" className="mt-1 font-serif text-2xl font-semibold text-loam-ink dark:text-parchment-50">
            About the two of you
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-loam-body dark:text-loam-body-dark">
            Current age describes the person today. Birth year separately sets the youth-era window below. Relationship, pronouns and cultural context help Kinship word shared activities naturally; sex is optional and never used to assume taste.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-loam-muted dark:text-loam-muted-dark">
            Names, sex, nationality, pronouns and photos are not sent to Qloo. Optional photos are reduced to small thumbnails in this browser and are saved only when device storage is turned on.
          </p>
        </div>

        {avatarError && (
          <p className="mt-4 rounded-xl border border-clay-200 bg-clay-50 px-4 py-3 text-sm text-clay-800 dark:border-clay-900 dark:bg-clay-950/30 dark:text-clay-300" role="alert">
            {avatarError}
          </p>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <fieldset className="rounded-2xl border border-parchment-200 bg-parchment-50 p-4 dark:border-vinyl-700 dark:bg-vinyl-800 md:p-5">
            <legend className="px-1 font-semibold text-loam-ink dark:text-parchment-50">Person receiving care</legend>
            <AvatarPicker
              label="Optional photo for the person receiving care"
              name={guardrails.elderName}
              avatar={careRecipientAvatar}
              onChange={onCareRecipientAvatarChange}
              onError={setAvatarError}
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-loam-ink dark:text-parchment-50 sm:col-span-2">
                Preferred name
                <input
                  type="text"
                  value={guardrails.elderName}
                  onChange={(event) => onUpdateGuardrails({ elderName: event.target.value })}
                  autoComplete="off"
                  className="mt-1.5 w-full rounded-xl border border-parchment-300 bg-white px-3 py-2.5 text-base font-normal text-loam-ink dark:border-vinyl-600 dark:bg-vinyl-900 dark:text-parchment-50"
                />
              </label>
              <label className="text-sm font-semibold text-loam-ink dark:text-parchment-50">
                Current age
                <input
                  type="number"
                  min={18}
                  max={120}
                  value={guardrails.careRecipientAge ?? ''}
                  onChange={(event) => onUpdateGuardrails({ careRecipientAge: event.target.value ? Number(event.target.value) : undefined })}
                  placeholder={`About ${thisYear - guardrails.birthYear}`}
                  className="mt-1.5 w-full rounded-xl border border-parchment-300 bg-white px-3 py-2.5 text-base font-normal text-loam-ink placeholder:text-loam-muted dark:border-vinyl-600 dark:bg-vinyl-900 dark:text-parchment-50"
                />
                <span className="mt-1 block text-xs font-normal text-loam-muted dark:text-loam-muted-dark">Does not change their cultural era.</span>
              </label>
              <label className="text-sm font-semibold text-loam-ink dark:text-parchment-50">
                Sex (optional)
                <select
                  value={guardrails.careRecipientSex ?? ''}
                  onChange={(event) => onUpdateGuardrails({ careRecipientSex: (event.target.value || undefined) as ElderGuardrails['careRecipientSex'] })}
                  className="mt-1.5 w-full rounded-xl border border-parchment-300 bg-white px-3 py-2.5 text-base font-normal text-loam-ink dark:border-vinyl-600 dark:bg-vinyl-900 dark:text-parchment-50"
                >
                  <option value="">Not specified</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="intersex">Intersex</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-loam-ink dark:text-parchment-50">
                Pronouns (optional)
                <select
                  value={guardrails.careRecipientPronouns ?? ''}
                  onChange={(event) => onUpdateGuardrails({ careRecipientPronouns: (event.target.value || undefined) as ElderGuardrails['careRecipientPronouns'] })}
                  className="mt-1.5 w-full rounded-xl border border-parchment-300 bg-white px-3 py-2.5 text-base font-normal text-loam-ink dark:border-vinyl-600 dark:bg-vinyl-900 dark:text-parchment-50"
                >
                  <option value="">Not specified</option>
                  <option value="she-her">She / her</option>
                  <option value="he-him">He / him</option>
                  <option value="they-them">They / them</option>
                  <option value="name-only">Use their name</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-loam-ink dark:text-parchment-50">
                Nationality
                <input
                  type="text"
                  value={guardrails.careRecipientNationality ?? ''}
                  onChange={(event) => onUpdateGuardrails({ careRecipientNationality: event.target.value })}
                  placeholder="For example: South African"
                  autoComplete="off"
                  className="mt-1.5 w-full rounded-xl border border-parchment-300 bg-white px-3 py-2.5 text-base font-normal text-loam-ink placeholder:text-loam-muted dark:border-vinyl-600 dark:bg-vinyl-900 dark:text-parchment-50"
                />
              </label>
              <label className="text-sm font-semibold text-loam-ink dark:text-parchment-50">
                Cultural background
                <input
                  type="text"
                  value={guardrails.careRecipientCulturalBackground ?? ''}
                  onChange={(event) => onUpdateGuardrails({ careRecipientCulturalBackground: event.target.value })}
                  placeholder="Languages, communities or traditions"
                  autoComplete="off"
                  className="mt-1.5 w-full rounded-xl border border-parchment-300 bg-white px-3 py-2.5 text-base font-normal text-loam-ink placeholder:text-loam-muted dark:border-vinyl-600 dark:bg-vinyl-900 dark:text-parchment-50"
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="rounded-2xl border border-parchment-200 bg-parchment-50 p-4 dark:border-vinyl-700 dark:bg-vinyl-800 md:p-5">
            <legend className="px-1 font-semibold text-loam-ink dark:text-parchment-50">Caregiver or visiting family member</legend>
            <AvatarPicker
              label="Optional photo for the caregiver"
              name={guardrails.caregiverName || guardrails.grandchildName}
              avatar={caregiverAvatar}
              onChange={onCaregiverAvatarChange}
              onError={setAvatarError}
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-loam-ink dark:text-parchment-50 sm:col-span-2">
                Preferred name
                <input
                  type="text"
                  value={guardrails.caregiverName ?? ''}
                  onChange={(event) => onUpdateGuardrails({ caregiverName: event.target.value, grandchildName: event.target.value || guardrails.grandchildName })}
                  placeholder="Who will share this time?"
                  autoComplete="off"
                  className="mt-1.5 w-full rounded-xl border border-parchment-300 bg-white px-3 py-2.5 text-base font-normal text-loam-ink placeholder:text-loam-muted dark:border-vinyl-600 dark:bg-vinyl-900 dark:text-parchment-50"
                />
              </label>
              <label className="text-sm font-semibold text-loam-ink dark:text-parchment-50">
                Current age
                <input
                  type="number"
                  min={12}
                  max={120}
                  value={guardrails.caregiverAge ?? ''}
                  onChange={(event) => onUpdateGuardrails({ caregiverAge: event.target.value ? Number(event.target.value) : undefined })}
                  placeholder="Optional"
                  className="mt-1.5 w-full rounded-xl border border-parchment-300 bg-white px-3 py-2.5 text-base font-normal text-loam-ink placeholder:text-loam-muted dark:border-vinyl-600 dark:bg-vinyl-900 dark:text-parchment-50"
                />
              </label>
              <label className="text-sm font-semibold text-loam-ink dark:text-parchment-50">
                Relationship
                <select
                  value={guardrails.caregiverRelationship ?? ''}
                  onChange={(event) => onUpdateGuardrails({ caregiverRelationship: event.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-parchment-300 bg-white px-3 py-2.5 text-base font-normal text-loam-ink dark:border-vinyl-600 dark:bg-vinyl-900 dark:text-parchment-50"
                >
                  <option value="">Not specified</option>
                  <option value="spouse or partner">Spouse or partner</option>
                  <option value="daughter">Daughter</option>
                  <option value="son">Son</option>
                  <option value="grandchild">Grandchild</option>
                  <option value="sibling">Sibling</option>
                  <option value="friend">Friend</option>
                  <option value="professional caregiver">Professional caregiver</option>
                  <option value="other family member">Other family member</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-loam-ink dark:text-parchment-50">
                Sex (optional)
                <select
                  value={guardrails.caregiverSex ?? ''}
                  onChange={(event) => onUpdateGuardrails({ caregiverSex: (event.target.value || undefined) as ElderGuardrails['caregiverSex'] })}
                  className="mt-1.5 w-full rounded-xl border border-parchment-300 bg-white px-3 py-2.5 text-base font-normal text-loam-ink dark:border-vinyl-600 dark:bg-vinyl-900 dark:text-parchment-50"
                >
                  <option value="">Not specified</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="intersex">Intersex</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-loam-ink dark:text-parchment-50">
                Pronouns (optional)
                <select
                  value={guardrails.caregiverPronouns ?? ''}
                  onChange={(event) => onUpdateGuardrails({ caregiverPronouns: (event.target.value || undefined) as ElderGuardrails['caregiverPronouns'] })}
                  className="mt-1.5 w-full rounded-xl border border-parchment-300 bg-white px-3 py-2.5 text-base font-normal text-loam-ink dark:border-vinyl-600 dark:bg-vinyl-900 dark:text-parchment-50"
                >
                  <option value="">Not specified</option>
                  <option value="she-her">She / her</option>
                  <option value="he-him">He / him</option>
                  <option value="they-them">They / them</option>
                  <option value="name-only">Use their name</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-loam-ink dark:text-parchment-50">
                Nationality
                <input
                  type="text"
                  value={guardrails.caregiverNationality ?? ''}
                  onChange={(event) => onUpdateGuardrails({ caregiverNationality: event.target.value })}
                  placeholder="For example: Kenyan-British"
                  autoComplete="off"
                  className="mt-1.5 w-full rounded-xl border border-parchment-300 bg-white px-3 py-2.5 text-base font-normal text-loam-ink placeholder:text-loam-muted dark:border-vinyl-600 dark:bg-vinyl-900 dark:text-parchment-50"
                />
              </label>
              <label className="text-sm font-semibold text-loam-ink dark:text-parchment-50">
                Cultural background
                <input
                  type="text"
                  value={guardrails.caregiverCulturalBackground ?? ''}
                  onChange={(event) => onUpdateGuardrails({ caregiverCulturalBackground: event.target.value })}
                  placeholder="Languages, communities or traditions"
                  autoComplete="off"
                  className="mt-1.5 w-full rounded-xl border border-parchment-300 bg-white px-3 py-2.5 text-base font-normal text-loam-ink placeholder:text-loam-muted dark:border-vinyl-600 dark:bg-vinyl-900 dark:text-parchment-50"
                />
              </label>
            </div>
          </fieldset>
        </div>

        <div className="mt-5 rounded-2xl border border-pine-200 bg-pine-50/70 p-4 text-sm text-loam-body dark:border-vinyl-700 dark:bg-vinyl-800 dark:text-loam-body-dark">
          <p className="font-semibold text-loam-ink dark:text-parchment-50">How this changes the shared plan</p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            <li>• Current ages and relationship change the visit wording, pacing and whether a bridge is framed as cross-generational.</li>
            <li>• Nationality and cultural background help explain shared or cross-cultural starting points without treating identity as taste.</li>
            <li>• The youth place, birth year and chosen favourites below are what shape Qloo discovery and cultural-era matching.</li>
            <li>• Saved reactions and exclusions keep future suggestions grounded in what the caregiver actually observed.</li>
          </ul>
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
            <label htmlFor="preferred-language" className="mt-4 block text-sm font-semibold text-loam-ink dark:text-parchment-50">
              Read-aloud language
            </label>
            <select
              id="preferred-language"
              value={guardrails.preferredLanguage ?? 'en'}
              onChange={(event) => onUpdateGuardrails({ preferredLanguage: event.target.value })}
              className="mt-1.5 w-full rounded-xl border border-parchment-300 bg-white px-3 py-2 text-sm text-loam-ink dark:border-vinyl-600 dark:bg-vinyl-900 dark:text-parchment-50"
            >
              <option value="en">English</option>
              <option value="af-ZA">Afrikaans</option>
              <option value="xh-ZA">isiXhosa</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
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

interface AvatarPickerProps {
  label: string;
  name: string;
  avatar: string;
  onChange: (avatar: string) => void;
  onError: (message: string) => void;
}

const AvatarPicker: React.FC<AvatarPickerProps> = ({ label, name, avatar, onChange, onError }) => {
  const inputId = useId();
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'K';

  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-parchment-200 bg-white p-3 dark:border-vinyl-700 dark:bg-vinyl-900">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-plum-100 text-lg font-semibold text-plum-700 dark:bg-vinyl-700 dark:text-plum-300">
        {avatar ? (
          <img src={avatar} alt={`${name || 'Profile'} avatar`} className="h-full w-full object-cover" />
        ) : (
          <span aria-hidden="true">{initials}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-loam-ink dark:text-parchment-50">{name || 'Name not added yet'}</p>
        <p className="mt-0.5 text-xs text-loam-muted dark:text-loam-muted-dark">{label} · local thumbnail only</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <label htmlFor={inputId} className="loam-btn-quiet cursor-pointer text-xs">
            <Camera className="h-4 w-4" aria-hidden="true" />
            {avatar ? 'Change photo' : 'Add photo'}
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              onError('');
              try {
                onChange(await makeAvatarThumbnail(file));
              } catch (error) {
                onError(error instanceof Error ? error.message : 'That photo could not be added.');
              } finally {
                event.target.value = '';
              }
            }}
          />
          {avatar && (
            <button type="button" onClick={() => onChange('')} className="loam-btn-quiet text-xs" aria-label={`Remove photo for ${name || 'this profile'}`}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
