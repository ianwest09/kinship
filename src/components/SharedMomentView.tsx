import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Heart, MoonStar, Music, Play, Sparkles, Square, Users } from 'lucide-react';
import { KinshipPrescriptionResponse, ReminiscenceCue } from '../../shared/types';
import {
  inferHarmonicPreset,
  stopHarmonicPreview,
  toggleHarmonicPreview,
} from '../utils/harmonicPlayer';

interface Props {
  data: KinshipPrescriptionResponse;
  focusCue: ReminiscenceCue | null;
  warmEq: boolean;
  onCueReaction: (
    cue: ReminiscenceCue,
    reaction: 'lit_up_sang' | 'calm_soothed' | 'restless_skip',
    lucidQuote?: string
  ) => void;
  onOpenRescue: () => void;
  onBackToDiscover: () => void;
}

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

  // Follow the cue the family chose in Discover.
  useEffect(() => {
    if (!focusCue) return;
    const at = queue.findIndex((c) => cueKey(c) === cueKey(focusCue));
    if (at >= 0) setIndex(at);
  }, [focusCue, queue]);

  // Always stop sound when leaving the screen.
  useEffect(() => () => stopHarmonicPreview(), []);

  const cue = queue[Math.min(index, Math.max(queue.length - 1, 0))];
  const currentKey = cue ? cueKey(cue) : null;
  const isPlaying = Boolean(cue && playingKey === `together-${currentKey}`);

  const stopSound = () => {
    stopHarmonicPreview();
    setPlayingKey(null);
  };

  const toggleSound = () => {
    if (!cue) return;
    const started = toggleHarmonicPreview(
      `together-${currentKey}`,
      inferHarmonicPreset(cue.name),
      () => setPlayingKey(null),
      warmEq
    );
    setPlayingKey(started ? `together-${currentKey}` : null);
  };

  const moveBy = (delta: number) => {
    if (queue.length === 0) return;
    stopSound();
    setIndex((prev) => (prev + delta + queue.length) % queue.length);
  };

  const bridge = data.intergenerationalBridges?.[0];

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
          <button type="button" onClick={stopSound} className="loam-btn-quiet text-sm md:text-base">
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
