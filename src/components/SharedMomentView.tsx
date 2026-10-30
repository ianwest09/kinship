import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  AudioLines as SpeechIcon,
  Heart,
  MoonStar,
  Music,
  Play,
  Printer,
  Save,
  Sparkles,
  Square,
  Trash2,
  Users,
  VolumeX,
} from 'lucide-react';
import { KinshipPrescriptionResponse, ReminiscenceCue } from '../../shared/types';
import {
  inferHarmonicPreset,
  stopHarmonicPreview,
  toggleHarmonicPreview,
} from '../utils/harmonicPlayer';
import { TogetherCompanionTools } from './TogetherCompanionTools';

export interface MomentReflection {
  cueKey: string;
  cueName: string;
  releaseYear?: number;
  comfort: number;
  note: string;
  savedAt: string;
  cueSnapshot?: ReminiscenceCue;
}

interface Props {
  data: KinshipPrescriptionResponse;
  focusCue: ReminiscenceCue | null;
  warmEq: boolean;
  reflections?: MomentReflection[];
  rememberOnDevice?: boolean;
  onSaveReflection?: (reflection: MomentReflection) => void;
  onRemoveReflection?: (cueKey: string) => void;
  onCueReaction: (
    cue: ReminiscenceCue,
    reaction: 'lit_up_sang' | 'calm_soothed' | 'restless_skip',
    lucidQuote?: string
  ) => void;
  onOpenRescue: () => void;
  onBackToDiscover: () => void;
}

const EMPTY_REFLECTIONS: MomentReflection[] = [];
const ignoreReflection = () => undefined;

function cueKey(cue: ReminiscenceCue): string {
  return cue.entity_id || cue.name;
}

/**
 * Shared Moment — sit side by side and enjoy something together.
 *
 * This is the former "Elder Co-Viewing Album Mode", promoted to a first-class
 * destination: extra-large type, no clinical vocabulary, no scores, and an
 * explicit way to stop or move on at any point.
 *
 * Audio is generated locally by the Web Audio engine in harmonicPlayer.ts. It
 * makes no network request and needs no media files, so it also works offline.
 */
export const SharedMomentView: React.FC<Props> = ({
  data,
  focusCue,
  warmEq,
  reflections = EMPTY_REFLECTIONS,
  rememberOnDevice = false,
  onSaveReflection = ignoreReflection,
  onRemoveReflection = ignoreReflection,
  onCueReaction,
  onOpenRescue,
  onBackToDiscover,
}) => {
  const queue = useMemo(() => {
    const sources = [
      ...(focusCue ? [focusCue] : []),
      ...(data.reconstructedYouthUniverse || []),
      ...(data.sundowningSafePlaylist || []),
    ];
    const seen = new Set<string>();
    const out: ReminiscenceCue[] = [];
    for (const cue of sources) {
      if (!cue) continue;
      const key = cueKey(cue);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(cue);
      if (out.length >= 8) break;
    }
    return out;
  }, [data, focusCue]);

  const [index, setIndex] = useState(0);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState<Record<string, string>>({});
  const [speakingInstructions, setSpeakingInstructions] = useState(false);
  const [reflectionNote, setReflectionNote] = useState('');
  const [comfort, setComfort] = useState(3);
  const [reflectionSaved, setReflectionSaved] = useState(false);

  // Follow the cue the family chose in Discover.
  useEffect(() => {
    if (!focusCue) return;
    const at = queue.findIndex((c) => cueKey(c) === cueKey(focusCue));
    if (at >= 0) setIndex(at);
  }, [focusCue, queue]);

  // Always stop generated sound and browser narration when leaving the screen.
  useEffect(
    () => () => {
      stopHarmonicPreview();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    },
    []
  );

  const cue = queue[Math.min(index, Math.max(queue.length - 1, 0))];
  const currentKey = cue ? cueKey(cue) : null;
  const isPlaying = Boolean(cue && playingKey === `together-${currentKey}`);
  const speechAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!currentKey) return;
    const saved = reflections.find((reflection) => reflection.cueKey === currentKey);
    setReflectionNote(saved?.note ?? '');
    setComfort(saved?.comfort ?? 3);
    setReflectionSaved(Boolean(saved));
  }, [currentKey, reflections]);

  const stopSound = () => {
    stopHarmonicPreview();
    setPlayingKey(null);
  };

  const stopSpeaking = () => {
    if (speechAvailable) window.speechSynthesis.cancel();
    setSpeakingInstructions(false);
  };

  const toggleSound = () => {
    if (!cue) return;
    if (speakingInstructions) stopSpeaking();
    const started = toggleHarmonicPreview(
      `together-${currentKey}`,
      inferHarmonicPreset(cue.name),
      () => setPlayingKey(null),
      warmEq
    );
    setPlayingKey(started ? `together-${currentKey}` : null);
  };

  const toggleInstructions = () => {
    if (!cue || !speechAvailable) return;
    if (speakingInstructions) {
      stopSpeaking();
      return;
    }

    stopSound();
    const instructions = [
      `Connection moment: ${cue.name}.`,
      cue.sensoryInvitationPrompt,
      'If it feels right, play the gentle chords and listen together.',
      'You can try something else or stop and sit quietly at any time.',
      'There is no need to finish anything.',
    ].join(' ');
    const utterance = new SpeechSynthesisUtterance(instructions);
    utterance.lang = data.guardrailsApplied.preferredLanguage || document.documentElement.lang || 'en';
    utterance.rate = 0.84;
    utterance.pitch = 0.95;
    utterance.onend = () => setSpeakingInstructions(false);
    utterance.onerror = () => setSpeakingInstructions(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeakingInstructions(true);
  };

  const moveBy = (delta: number) => {
    if (queue.length === 0) return;
    stopSound();
    stopSpeaking();
    setIndex((prev) => (prev + delta + queue.length) % queue.length);
  };

  const bridge = data.intergenerationalBridges?.[0];
  const sensoryPairing = data.sensoryTactileKit?.[0];

  const printActivityGuide = () => {
    if (typeof window === 'undefined') return;
    document.body.classList.add('printing-activity-guide');
    const cleanUp = () => document.body.classList.remove('printing-activity-guide');
    window.addEventListener('afterprint', cleanUp, { once: true });
    window.print();
    window.setTimeout(cleanUp, 1000);
  };

  if (!cue) {
    return (
      <div className="space-y-6">
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-loam-ink dark:text-parchment-50">
          Share a moment
        </h2>
        <div className="loam-card p-8 text-center">
          <Sparkles className="w-8 h-8 mx-auto text-plum-400" aria-hidden="true" />
          <p className="mt-3 text-lg md:text-xl font-serif text-loam-ink dark:text-parchment-50">
            Nothing queued to enjoy yet
          </p>
          <p className="mt-2 text-base text-loam-body dark:text-loam-body-dark">
            Choose something in Discover and it will appear here.
          </p>
          <button type="button" onClick={onBackToDiscover} className="loam-btn-primary mt-6">
            <span>Go to Discover</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-loam-ink dark:text-parchment-50 tracking-tight">
          Share a moment
        </h2>
        <button type="button" onClick={onBackToDiscover} className="loam-btn-quiet text-sm md:text-base">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Discover
        </button>
      </div>

      {/* The current moment — one thing at a time, in very large type. */}
      <section
        aria-live="polite"
        className="loam-card p-6 md:p-10 shadow-card border-2 border-plum-200 dark:border-vinyl-700"
      >
        <p className="text-sm md:text-base font-semibold uppercase tracking-[0.14em] text-plum-600 dark:text-plum-300">
          {cue.releaseYear} · {data.geographyInfo.name}
        </p>

        <h3 className="mt-3 font-serif text-3xl md:text-5xl font-semibold leading-tight text-loam-ink dark:text-parchment-50">
          {cue.name}
        </h3>

        <p className="mt-5 font-serif text-xl md:text-3xl italic leading-relaxed text-plum-700 dark:text-plum-300">
          {cue.sensoryInvitationPrompt}
        </p>

        <p className="mt-6 text-lg md:text-2xl font-serif text-loam-ink dark:text-parchment-100">
          Would you like to listen together?
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={isPlaying}
            className="loam-btn-primary text-base md:text-lg"
          >
            {isPlaying ? (
              <>
                <Square className="w-5 h-5 fill-current" aria-hidden="true" />
                <span>Stop the sound</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" aria-hidden="true" />
                <span>Play gentle chords</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={toggleInstructions}
            disabled={!speechAvailable}
            aria-pressed={speakingInstructions}
            className="loam-btn-secondary text-base disabled:cursor-not-allowed disabled:opacity-50"
          >
            {speakingInstructions ? (
              <VolumeX className="w-5 h-5" aria-hidden="true" />
            ) : (
              <SpeechIcon className="w-5 h-5" aria-hidden="true" />
            )}
            <span>{speakingInstructions ? 'Stop reading' : 'Read instructions aloud'}</span>
          </button>

          <button
            type="button"
            onClick={printActivityGuide}
            className="loam-btn-secondary text-base no-print"
          >
            <Printer className="w-5 h-5" aria-hidden="true" />
            <span>Print Activity Guide</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onCueReaction(cue, 'lit_up_sang');
              setAcknowledged((prev) => ({ ...prev, [cueKey(cue)]: 'loved' }));
            }}
            className="loam-btn-secondary text-base"
          >
            <Heart className="w-5 h-5 text-plum-600 dark:text-plum-300" aria-hidden="true" />
            <span>
              {acknowledged[cueKey(cue)] === 'loved' ? 'Noted with love' : 'We liked this'}
            </span>
          </button>
        </div>

        {!speechAvailable && (
          <p className="mt-3 text-sm text-loam-muted dark:text-loam-muted-dark">
            Read-aloud is not available in this browser. The instructions remain visible above.
          </p>
        )}

        {/* Leaving is always available and always neutral. */}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
          <button
            type="button"
            onClick={() => {
              onCueReaction(cue, 'restless_skip');
              moveBy(1);
            }}
            className="loam-btn-quiet text-sm md:text-base"
          >
            Try something else
          </button>
          <button
            type="button"
            onClick={() => {
              stopSound();
              stopSpeaking();
            }}
            className="loam-btn-quiet text-sm md:text-base"
          >
            Stop and sit quietly
          </button>
          <span className="text-sm md:text-base text-loam-muted dark:text-loam-muted-dark">
            No need to finish anything.
          </span>
        </div>

        {warmEq && (
          <p className="mt-5 text-sm md:text-base text-loam-body dark:text-loam-body-dark">
            Warmer, softer sound is on — higher harshness is rolled off. Change this
            any time in Preferences.
          </p>
        )}

        <details className="mt-6 border-t border-parchment-200 pt-5 dark:border-vinyl-700">
          <summary className="cursor-pointer text-sm font-semibold text-plum-700 marker:text-plum-500 dark:text-plum-300">
            See the cultural bridge
          </summary>
          <div className="mt-4" aria-label="Cultural bridge from a family clue to this moment and a sensory pairing">
            <div className="grid items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:gap-3">
              <BridgeNode
                eyebrow="Starting interest"
                title={cue.explainability?.[0]?.seed_name ?? 'A family clue'}
                detail="Something the family shared"
              />
              <BridgeArrow />
              <BridgeNode
                eyebrow="Taste connection"
                title={cue.name}
                detail="A related cultural suggestion"
              />
              <BridgeArrow />
              <BridgeNode
                eyebrow="Sensory pairing"
                title={sensoryPairing?.name ?? 'A familiar room texture'}
                detail={sensoryPairing?.fiveDollarAction ?? cue.sensoryInvitationPrompt}
              />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-loam-muted dark:text-loam-muted-dark">
              This path explains how the invitation was assembled. It is a possibility to try, not proof of a memory or preference.
            </p>
          </div>
        </details>

        <details className="mt-5 border-t border-parchment-200 pt-5 dark:border-vinyl-700">
          <summary className="cursor-pointer text-sm font-semibold text-plum-700 marker:text-plum-500 dark:text-plum-300">
            Why this suggestion?
          </summary>
          <div className="mt-4 grid gap-3 text-sm leading-relaxed text-loam-body dark:text-loam-body-dark sm:grid-cols-2">
            <div className="rounded-xl bg-parchment-50 p-4 dark:bg-vinyl-900">
              <p className="font-semibold text-loam-ink dark:text-parchment-50">Where it came from</p>
              <p className="mt-1">
                {cue.source === 'live_qloo_api'
                  ? 'Live Qloo Taste AI returned this cultural entity.'
                  : 'This comes from Kinship’s labelled offline collection, not a live Qloo result.'}
              </p>
            </div>
            <div className="rounded-xl bg-parchment-50 p-4 dark:bg-vinyl-900">
              <p className="font-semibold text-loam-ink dark:text-parchment-50">What the match means</p>
              <p className="mt-1">
                A taste relationship is a place to start. It does not prove a memory, preference, identity, or likely response.
              </p>
            </div>
            {cue.explainability?.[0] && (
              <div className="rounded-xl bg-parchment-50 p-4 dark:bg-vinyl-900 sm:col-span-2">
                <p className="font-semibold text-loam-ink dark:text-parchment-50">Approved starting clue</p>
                <p className="mt-1">
                  Suggested from {cue.explainability[0].seed_name}. Kinship wrote the invitation and screened it against the family’s exclusions.
                </p>
              </div>
            )}
          </div>
        </details>
      </section>

      <article className="print-activity-guide" aria-hidden="true">
        <header>
          <p className="print-kicker">Kinship · Care-Partner Activity Guide</p>
          <h1>{cue.name}</h1>
          <p>{cue.releaseYear} · {data.geographyInfo.name}</p>
        </header>
        <section>
          <h2>Opening words</h2>
          <blockquote>“{cue.sensoryInvitationPrompt}”</blockquote>
        </section>
        <section>
          <h2>Try this together</h2>
          <ol>
            <li>Sit side by side and read the opening words slowly.</li>
            <li>If it feels welcome, play the gentle chords or add a quiet room sound.</li>
            <li>{sensoryPairing?.fiveDollarAction ?? 'Offer one familiar object, scent, or warm drink without asking for a name or date.'}</li>
            <li>Leave space for quiet. A smile, a pause, or no response at all is okay.</li>
          </ol>
        </section>
        <section>
          <h2>Comfort boundaries</h2>
          <ul>
            <li>Do not quiz, correct, or ask them to prove a memory.</li>
            <li>Stop or switch activities if anything feels unwelcome.</li>
            <li>There is no need to finish. Sitting quietly together is enough.</li>
          </ul>
        </section>
        <section>
          <h2>Caregiver note</h2>
          <p>{reflectionNote.trim() || 'No note has been added for this moment yet.'}</p>
        </section>
        <footer>Prepared in Kinship · Keep this guide somewhere easy for the next care partner to find.</footer>
      </article>

      <TogetherCompanionTools key={currentKey} durationMinutes={5} />

      <section className="loam-card p-5 md:p-7" aria-labelledby="moment-reflection-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 id="moment-reflection-heading" className="text-lg font-semibold text-loam-ink dark:text-parchment-50">
              Quick personal note
            </h3>
            <p className="mt-1 text-sm text-loam-body dark:text-loam-body-dark">
              What felt comfortable? What would you change? This is your private reflection, not a health measure or assessment.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-parchment-100 px-3 py-1 text-xs font-semibold text-loam-body dark:bg-vinyl-800 dark:text-loam-body-dark">
            {rememberOnDevice ? 'Saved on this device' : 'This tab only'}
          </span>
        </div>

        <label htmlFor="moment-reflection" className="mt-5 block text-sm font-semibold text-loam-ink dark:text-parchment-50">
          Your note
        </label>
        <textarea
          id="moment-reflection"
          rows={3}
          value={reflectionNote}
          onChange={(event) => {
            setReflectionNote(event.target.value);
            setReflectionSaved(false);
          }}
          placeholder="For example: the quieter sound felt better, or we preferred looking at the cover."
          className="mt-2 w-full rounded-2xl border border-parchment-300 bg-white px-4 py-3 text-base text-loam-ink placeholder:text-loam-muted focus:border-plum-500 focus:outline-none focus:ring-2 focus:ring-loam-focus/40 dark:border-vinyl-600 dark:bg-vinyl-900 dark:text-parchment-50"
        />

        <fieldset className="mt-4">
          <legend className="text-sm font-semibold text-loam-ink dark:text-parchment-50">How comfortable did the moment feel?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setComfort(value);
                  setReflectionSaved(false);
                }}
                aria-pressed={comfort === value}
                className={`min-h-11 min-w-11 rounded-xl border px-3 text-sm font-semibold ${
                  comfort === value
                    ? 'border-plum-700 bg-plum-600 text-white'
                    : 'border-parchment-300 bg-white text-loam-body dark:border-vinyl-600 dark:bg-vinyl-900 dark:text-loam-body-dark'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-loam-muted dark:text-loam-muted-dark">1 = not comfortable today · 3 = neutral · 5 = felt comfortable</p>
        </fieldset>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              onSaveReflection({
                cueKey: currentKey ?? cue.name,
                cueName: cue.name,
                releaseYear: cue.releaseYear,
                comfort,
                note: reflectionNote.trim(),
                savedAt: new Date().toISOString(),
                cueSnapshot: cue,
              });
              setReflectionSaved(true);
            }}
            className="loam-btn-primary text-sm"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {reflectionSaved ? 'Saved with this moment' : 'Save note with moment'}
          </button>
          {reflectionSaved && (
            <button
              type="button"
              onClick={() => {
                onRemoveReflection(currentKey ?? cue.name);
                setReflectionNote('');
                setComfort(3);
                setReflectionSaved(false);
              }}
              className="loam-btn-quiet text-sm"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove note
            </button>
          )}
        </div>
      </section>

      {/* Other things to try — quiet, optional, no pressure. */}
      {queue.length > 1 && (
        <section aria-labelledby="together-more">
          <h3
            id="together-more"
            className="text-base md:text-lg font-semibold text-loam-body dark:text-loam-body-dark mb-3"
          >
            Or try one of these
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {queue.map((q, i) => {
              const active = i === index;
              return (
                <button
                  key={cueKey(q)}
                  type="button"
                  onClick={() => {
                    stopSound();
                    stopSpeaking();
                    setIndex(i);
                  }}
                  aria-current={active}
                  className={`px-4 py-3 rounded-2xl border text-sm md:text-base font-semibold transition-colors ${
                    active
                      ? 'bg-plum-600 border-plum-700 text-white'
                      : 'bg-loam-card dark:bg-vinyl-800 border-parchment-300 dark:border-vinyl-700 text-loam-ink dark:text-parchment-100 hover:border-plum-400'
                  }`}
                >
                  <Music className="inline w-4 h-4 mr-2 -mt-0.5" aria-hidden="true" />
                  {q.name}
                  <span className={active ? 'text-plum-100' : 'text-loam-muted dark:text-loam-muted-dark'}>
                    {' '}
                    · {q.releaseYear}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* A way in for younger family, using the real compare result. */}
      {bridge && (
        <section className="loam-card p-5 md:p-7 bg-parchment-50 dark:bg-vinyl-900">
          <div className="flex items-start gap-3.5">
            <Users className="w-6 h-6 shrink-0 text-plum-600 dark:text-plum-300 mt-0.5" aria-hidden="true" />
            <div className="min-w-0">
              <h3 className="text-base md:text-lg font-semibold text-loam-ink dark:text-parchment-50">
                If a grandchild or younger relative is visiting
              </h3>
              <p className="mt-2 text-base md:text-lg font-serif italic leading-relaxed text-plum-700 dark:text-plum-300">
                {bridge.zeroQuizBridgeQuestion}
              </p>
              <p className="mt-3 text-sm md:text-base text-loam-body dark:text-loam-body-dark leading-relaxed">
                {bridge.grandchildSeedName} and {bridge.elderAnchorName} share more
                than you might expect. Start there — no questions about names or
                dates needed.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="loam-card p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-start gap-3.5 min-w-0">
          <MoonStar className="w-6 h-6 shrink-0 text-brass-600 dark:text-brass-300 mt-0.5" aria-hidden="true" />
          <p className="text-sm md:text-base text-loam-body dark:text-loam-body-dark leading-relaxed">
            If the late afternoon is getting hard, there is a slow-settling sound
            that eases down in three short phases.
          </p>
        </div>
        <button type="button" onClick={onOpenRescue} className="loam-btn-secondary shrink-0 text-sm md:text-base">
          <span>Open settling sounds</span>
        </button>
      </section>
    </div>
  );
};

const BridgeNode: React.FC<{ eyebrow: string; title: string; detail: string }> = ({ eyebrow, title, detail }) => (
  <div className="rounded-2xl border border-parchment-300 bg-parchment-50 p-4 dark:border-vinyl-700 dark:bg-vinyl-900">
    <p className="text-xs font-semibold uppercase tracking-wider text-plum-600 dark:text-plum-300">{eyebrow}</p>
    <p className="mt-1.5 font-semibold text-loam-ink dark:text-parchment-50">{title}</p>
    <p className="mt-1 text-xs leading-relaxed text-loam-body dark:text-loam-body-dark">{detail}</p>
  </div>
);

const BridgeArrow: React.FC = () => (
  <span className="self-center text-center text-xl text-plum-500" aria-hidden="true">→</span>
);
