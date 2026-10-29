import React from 'react';
import { ArrowRight, Compass, FileHeart, Heart, Music, MoonStar, Users } from 'lucide-react';
import { ElderGuardrails, ReminiscenceBumpWindow } from '../../shared/types';

interface Props {
  guardrails: ElderGuardrails;
  bumpWindow: ReminiscenceBumpWindow | null;
  ready: boolean;
  /** True while the loaded family is still one of the bundled samples. */
  usingExampleFamily: boolean;
  onExplore: () => void;
  onOpenTogether: () => void;
  onOpenFamily: () => void;
  onOpenPassport: () => void;
  onOpenRescue: () => void;
}

/**
 * Home — a welcoming, uncluttered starting point.
 *
 * One obvious next action, then the rest of the app in the order a family
 * actually moves through it: look around, sit together, add what you know,
 * print something to hand over. Each destination appears exactly once. It used
 * to appear twice under two different labels — two buttons to Discover and two
 * to Share a moment — so the screen offered five controls pointing at four
 * places and no first step.
 *
 * No scores, timers or prompts that could turn memory into a test.
 */
export const HomeView: React.FC<Props> = ({
  guardrails,
  bumpWindow,
  ready,
  usingExampleFamily,
  onExplore,
  onOpenTogether,
  onOpenFamily,
  onOpenPassport,
  onOpenRescue,
}) => {
  const firstName = guardrails.elderName?.trim() || 'your loved one';
  const eraLabel = bumpWindow
    ? `${bumpWindow.bumpStartYear}–${bumpWindow.bumpEndYear}`
    : null;

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Hero ------------------------------------------------------------ */}
      <section className="pt-2 md:pt-6 max-w-readable">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-plum-600 dark:text-plum-300 mb-4">
          Welcome to Kinship
        </p>
        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold text-loam-ink dark:text-parchment-50 tracking-tight">
          Find a familiar feeling.
        </h2>
        <p className="mt-5 text-lg md:text-xl leading-relaxed text-loam-body dark:text-loam-body-dark">
          Explore music, films and cultural touchstones that may bring you closer.
        </p>

        {eraLabel && (
          <p className="mt-4 text-base text-loam-muted dark:text-loam-muted-dark">
            Right now Kinship is looking at roughly{' '}
            <span className="font-semibold text-loam-ink dark:text-parchment-100">{eraLabel}</span>{' '}
            — the years when {firstName} was growing up
            {guardrails.youthGeography ? ', and the places they knew' : ''}.
          </p>
        )}

        <p className="mt-4 text-meta text-loam-muted dark:text-loam-muted-dark">
          {usingExampleFamily
            ? `Nothing to set up first — ${firstName} is an example family, so you can look around before telling Kinship anything. Add what you know and these suggestions become theirs.`
            : 'Nothing to set up first, and nothing to get wrong. You can skip or stop at any point.'}
        </p>
      </section>

      {/* The journey, in order. One primary action, then the other three
          destinations once each — the same order the navigation uses, so the
          screen and the tab bar cannot disagree about what comes next. */}
      <section aria-labelledby="home-journey-heading" className="space-y-4">
        <h3
          id="home-journey-heading"
          className="text-base font-semibold text-loam-body dark:text-loam-body-dark"
        >
          Where to start
        </h3>

        <div className="loam-card p-6 md:p-8 shadow-card space-y-5">
          <div className="flex items-start gap-4 md:gap-5">
            <span
              aria-hidden="true"
              className="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-plum-100 dark:bg-vinyl-800 text-plum-600 dark:text-plum-300 flex items-center justify-center"
            >
              <Music className="w-6 h-6 md:w-7 md:h-7" />
            </span>
            <div className="min-w-0">
              <h4 className="font-serif text-xl md:text-2xl font-semibold text-loam-ink dark:text-parchment-50">
                Start with music
              </h4>
              <p className="mt-1.5 text-base md:text-lg text-loam-body dark:text-loam-body-dark leading-relaxed">
                Songs and films from the years they grew up in. Pick anything
                that looks nice — nothing needs to be recognised.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <button
              type="button"
              onClick={onExplore}
              className="loam-btn-primary text-base md:text-lg"
            >
              <Compass className="w-5 h-5" aria-hidden="true" />
              <span>Explore what’s familiar</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>
            <p className="text-base italic font-serif text-plum-700 dark:text-plum-300">
              No right answers. Just time together.
            </p>
          </div>
        </div>

        <p className="text-meta text-loam-muted dark:text-loam-muted-dark">
          Then, in whatever order suits you — none of these is required, and
          none of them locks the next one.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HomeLink
            label="Share a moment"
            hint="Sit side by side and enjoy something together. Large, easy type."
            icon={<Heart className="w-6 h-6" aria-hidden="true" />}
            onClick={onOpenTogether}
          />
          <HomeLink
            label="Add what you know"
            hint="A song, a town, what the grandchildren love — and everything here becomes theirs."
            icon={<Users className="w-6 h-6" aria-hidden="true" />}
            onClick={onOpenFamily}
          />
          <HomeLink
            label="Care passport"
            hint="A printable summary to hand to whoever is helping today."
            icon={<FileHeart className="w-6 h-6" aria-hidden="true" />}
            onClick={onOpenPassport}
          />
        </div>
      </section>

      {/* Gentle, non-alarming evening support ----------------------------- */}
      <section className="loam-card p-5 md:p-6 bg-parchment-50 dark:bg-vinyl-900">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-start gap-3.5 min-w-0">
            <MoonStar
              className="w-6 h-6 shrink-0 text-brass-600 dark:text-brass-300 mt-0.5"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h3 className="text-base md:text-lg font-semibold text-loam-ink dark:text-parchment-50">
                If late afternoon feels unsettled
              </h3>
              <p className="mt-1 text-sm md:text-base text-loam-body dark:text-loam-body-dark leading-relaxed">
                A short, slow-settling sound you can play together. Start it, or don’t — it will wait.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenRescue}
            className="loam-btn-secondary shrink-0 text-sm md:text-base"
          >
            <span>Open settling sounds</span>
          </button>
        </div>
      </section>

      {!ready && (
        <p role="status" className="text-sm text-loam-muted dark:text-loam-muted-dark">
          Getting things ready… Everything here can be skipped or changed at any time.
        </p>
      )}
    </div>
  );
};

interface HomeLinkProps {
  label: string;
  hint: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const HomeLink: React.FC<HomeLinkProps> = ({ label, hint, icon, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="loam-card p-5 text-left flex items-start gap-3.5 hover:border-plum-400 hover:bg-plum-50/60 dark:hover:bg-vinyl-800 transition-colors"
  >
    <span
      aria-hidden="true"
      className="shrink-0 w-11 h-11 rounded-xl bg-parchment-100 dark:bg-vinyl-800 text-plum-600 dark:text-plum-300 flex items-center justify-center"
    >
      {icon}
    </span>
    <span className="min-w-0">
      <span className="block font-semibold text-base md:text-lg text-loam-ink dark:text-parchment-50">
        {label}
      </span>
      <span className="block mt-1 text-sm text-loam-body dark:text-loam-body-dark leading-relaxed">
        {hint}
      </span>
    </span>
  </button>
);
