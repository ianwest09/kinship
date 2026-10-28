import React, { useMemo, useState } from 'react';
import { ChevronDown, Compass, Music, Sparkles } from 'lucide-react';
import { KinshipPrescriptionResponse, ReminiscenceCue } from '../../shared/types';

interface Props {
  data: KinshipPrescriptionResponse;
  onListenTogether: (cue: ReminiscenceCue) => void;
  onNotForUs: (cue: ReminiscenceCue) => void;
  onOpenDetail: () => void;
}

type FilterId = 'all' | 'music' | 'film' | 'tv' | 'everyday';

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: 'all', label: 'Everything' },
  { id: 'music', label: 'Music' },
  { id: 'film', label: 'Films' },
  { id: 'tv', label: 'Television' },
  { id: 'everyday', label: 'Everyday things' },
];

function filterFor(cue: ReminiscenceCue): FilterId {
  switch (cue.subtype) {
    case 'urn:entity:artist':
      return 'music';
    case 'urn:entity:movie':
      return 'film';
    case 'urn:entity:tv_show':
      return 'tv';
    default:
      return 'everyday';
  }
}

/**
 * The stored categoryBadge is written for clinicians and judges
 * ("Primary Musical Spark (mPFC Anchor)"). Families get plain language.
 */
function plainCategory(cue: ReminiscenceCue): string {
  const badge = `${cue.categoryBadge || ''} ${cue.subtype}`.toLowerCase();
  if (badge.includes('sundowning')) return 'Calming · late afternoon';
  if (badge.includes('morning')) return 'Bright · morning';
  if (badge.includes('slapstick')) return 'Light and funny';
  if (badge.includes('hearth') || badge.includes('kitchen')) return 'Around the home';
  if (badge.includes('cinema') || badge.includes('movie')) return 'Film with music';
  if (badge.includes('tv_show')) return 'Television';
  if (badge.includes('place')) return 'A place';
  if (badge.includes('brand')) return 'Something familiar';
  return 'Music';
}

/**
 * Discover — explore music, artists, films and cultural touchstones that may
 * feel familiar.
 *
 * Deliberately omits affinity percentages and salience scores. Nothing here is
 * a test: every card can be opened, skipped or set aside without consequence.
 */
export const DiscoverView: React.FC<Props> = ({
  data,
  onListenTogether,
  onNotForUs,
  onOpenDetail,
}) => {
  const [filter, setFilter] = useState<FilterId>('all');

  const cues = useMemo(() => {
    const primary = data.reconstructedYouthUniverse?.length
      ? data.reconstructedYouthUniverse
      : data.sundowningSafePlaylist || [];
    const seen = new Set<string>();
    return primary.filter((c) => {
      const key = c.entity_id || c.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [data]);

  const visible = filter === 'all' ? cues : cues.filter((c) => filterFor(c) === filter);
  const eraLabel = `${data.bumpWindow.bumpStartYear}–${data.bumpWindow.bumpEndYear}`;

  return (
    <div className="space-y-7 md:space-y-8">
      <header className="max-w-readable">
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-loam-ink dark:text-parchment-50 tracking-tight">
          Discover
        </h2>
        <p className="mt-3 text-base md:text-lg leading-relaxed text-stone-600 dark:text-stone-300">
          Songs, films and small familiar things from around {eraLabel}, near{' '}
          {data.geographyInfo.name}. Pick anything that looks nice. Nothing needs
          to be recognised, and nothing needs to be right.
        </p>
      </header>

      {/* Filters — horizontal scroll is avoided by wrapping, never clipping. */}
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filter by kind of thing"
      >
        {FILTERS.map((f) => {
          const active = filter === f.id;
          const count = f.id === 'all' ? cues.length : cues.filter((c) => filterFor(c) === f.id).length;
          if (count === 0 && f.id !== 'all') return null;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={active}
              className={`px-4 py-2.5 rounded-full border text-sm md:text-base font-semibold transition-colors ${
                active
                  ? 'bg-plum-600 border-plum-700 text-white'
                  : 'bg-loam-card dark:bg-vinyl-800 border-parchment-300 dark:border-vinyl-700 text-loam-ink dark:text-parchment-100 hover:border-plum-400'
              }`}
            >
              {f.label}
              <span className={active ? 'text-plum-100' : 'text-stone-500 dark:text-stone-400'}>
                {' '}
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="loam-card p-8 text-center">
          <Sparkles className="w-8 h-8 mx-auto text-plum-400" aria-hidden="true" />
          <p className="mt-3 text-lg font-serif text-loam-ink dark:text-parchment-50">
            Nothing here just yet
          </p>
          <p className="mt-2 text-base text-stone-600 dark:text-stone-300">
            Try a different filter, or add a song or film they liked in{' '}
            <span className="font-semibold">Add what you know</span>.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {visible.map((cue) => (
            <li key={cue.entity_id || cue.name} className="loam-card p-5 md:p-6 flex flex-col">
              <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
                <span className="px-2.5 py-1 rounded-full bg-parchment-100 dark:bg-vinyl-800 text-stone-600 dark:text-stone-300 font-semibold">
                  {plainCategory(cue)}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-brass-100 dark:bg-vinyl-800 text-brass-700 dark:text-brass-300 font-semibold">
                  {cue.releaseYear}
                </span>
                {cue.sundowningSafe && (
                  <span className="px-2.5 py-1 rounded-full bg-pine-50 dark:bg-vinyl-800 text-pine-700 dark:text-pine-300 font-semibold">
                    Gentle
                  </span>
                )}
              </div>

              <h3 className="mt-3.5 font-serif text-xl md:text-2xl font-semibold leading-snug text-loam-ink dark:text-parchment-50">
                {cue.name}
              </h3>

              <p className="mt-1.5 text-sm md:text-base text-stone-500 dark:text-stone-400">
                {plainCategory(cue) === 'Music' || cue.subtype === 'urn:entity:artist'
                  ? 'They would have been '
                  : 'Showing when they were '}
                {cue.elderAgeAtRelease}
              </p>

              {cue.sensoryInvitationPrompt && (
                <p className="mt-4 font-serif text-base md:text-lg italic leading-relaxed text-plum-700 dark:text-plum-300">
                  {cue.sensoryInvitationPrompt}
                </p>
              )}

              {/* Plain-language explanation, collapsed by default. */}
              <details className="mt-4 group">
                <summary className="flex items-center gap-2 cursor-pointer list-none text-sm md:text-base font-semibold text-stone-600 dark:text-stone-300 hover:text-plum-700 dark:hover:text-plum-300">
                  <ChevronDown
                    className="w-4 h-4 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                  <span>Why this might feel familiar</span>
                </summary>
                <div className="mt-3 pl-6 space-y-2.5 text-sm md:text-base leading-relaxed text-stone-600 dark:text-stone-300">
                  {cue.whyBrainRemembers && <p>{cue.whyBrainRemembers}</p>}
                  {cue.dontQuizWarning && (
                    <p className="text-stone-500 dark:text-stone-400">
                      <span className="font-semibold">A gentle note:</span> {cue.dontQuizWarning}{' '}
                      An invitation works better than a question.
                    </p>
                  )}
                  {cue.tagLabels?.length > 0 && (
                    <p className="flex flex-wrap gap-1.5 pt-1">
                      {cue.tagLabels.slice(0, 5).map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-parchment-100 dark:bg-vinyl-800 text-xs md:text-sm text-stone-600 dark:text-stone-300"
                        >
                          {t}
                        </span>
                      ))}
                    </p>
                  )}
                </div>
              </details>

              <div className="mt-auto pt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onListenTogether(cue)}
                  className="loam-btn-primary flex-1 sm:flex-none text-sm md:text-base"
                >
                  <Music className="w-5 h-5" aria-hidden="true" />
                  <span>Enjoy together</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNotForUs(cue)}
                  className="loam-btn-quiet text-sm md:text-base"
                >
                  Not for us today
                </button>
              </div>

              <p className="mt-3 text-xs md:text-sm text-stone-500 dark:text-stone-400">
                {cue.source === 'live_qloo_api'
                  ? 'Suggested by Qloo, live.'
                  : 'From Kinship’s own collection — not a Qloo result.'}{' '}
                A suggestion, not a fact about anyone.
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="loam-card p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-parchment-50 dark:bg-vinyl-900">
        <div className="min-w-0">
          <h3 className="text-base md:text-lg font-semibold text-loam-ink dark:text-parchment-50">
            Looking for the fuller picture?
          </h3>
          <p className="mt-1 text-sm md:text-base text-stone-600 dark:text-stone-300">
            Era timeline, shared-taste comparisons, blocked distress triggers, meal
            and outing ideas, and the Qloo request trace.
          </p>
        </div>
        <button type="button" onClick={onOpenDetail} className="loam-btn-secondary shrink-0 text-sm md:text-base">
          <Compass className="w-5 h-5 text-plum-600 dark:text-plum-300" aria-hidden="true" />
          <span>Detailed care view</span>
        </button>
      </div>
    </div>
  );
};
