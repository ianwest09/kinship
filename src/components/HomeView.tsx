import React from 'react';
import { ArrowRight, Compass, FileHeart, Heart, Music, MoonStar, Users } from 'lucide-react';
import { ElderGuardrails, ReminiscenceBumpWindow } from '../../shared/types';

interface Props {
  guardrails: ElderGuardrails;
  bumpWindow: ReminiscenceBumpWindow | null;
  ready: boolean;
  onExplore: () => void;
  onOpenTogether: () => void;
  onOpenFamily: () => void;
  onOpenPassport: () => void;
  onOpenRescue: () => void;
}

/**
 * Home — a welcoming, uncluttered starting point.
 *
 * One obvious next action ("Explore familiar music"), three quiet ways onward,
 * and no scores, timers or prompts that could turn memory into a test.
 */
export const HomeView: React.FC<Props> = ({
  guardrails,
  bumpWindow,
  ready,
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
        <p className="mt-5 text-lg md:text-xl leading-relaxed text-stone-600 dark:text-stone-300">
          Explore music, films and cultural touchstones that may bring you closer.
        </p>

        {eraLabel && (
          <p className="mt-4 text-base text-stone-500 dark:text-stone-400">
            Right now Kinship is looking at roughly{' '}
            <span className="font-semibold text-loam-ink dark:text-parchment-100">{eraLabel}</span>{' '}
            — the years when {firstName} was growing up
            {guardrails.youthGeography ? ', and the places they knew' : ''}.
          </p>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
          <button type="button" onClick={onExplore} className="loam-btn-primary text-base md:text-lg">
            <Compass className="w-5 h-5" aria-hidden="true" />
            <span>Start exploring</span>
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </button>
          <button type="button" onClick={onOpenTogether} className="loam-btn-secondary text-base">
            <Music className="w-5 h-5 text-plum-600 dark:text-plum-300" aria-hidden="true" />
            <span>Listen together</span>
          </button>
        </div>
      </section>

      {/* Featured card --------------------------------------------------- */}
      <section
        aria-labelledby="home-featured-heading"
        className="loam-card p-6 md:p-9 shadow-card"
      >
        <div className="flex items-start gap-4 md:gap-5">
          <span
            aria-hidden="true"
            className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-plum-100 dark:bg-vinyl-800 text-plum-600 dark:text-plum-300 flex items-center justify-center"
          >
            <Music className="w-7 h-7 md:w-8 md:h-8" />
          </span>
          <div className="min-w-0">
            <h3
              id="home-featured-heading"
              className="font-serif text-2xl md:text-3xl font-semibold text-loam-ink dark:text-parchment-50"
            >
              Start with music
            </h3>
            <p className="mt-2 text-base md:text-lg text-stone-600 dark:text-stone-300 leading-relaxed">
              Explore songs and artists from a meaningful era.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <button type="button" onClick={onExplore} className="loam-btn-primary">
            <span>Explore familiar music</span>
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </button>
          <p className="text-base italic font-serif text-plum-700 dark:text-plum-300">
            No right answers. Just time together.
          </p>
        </div>
      </section>

      {/* Quiet ways onward ------------------------------------------------ */}
      <section aria-labelledby="home-more-heading" className="space-y-4">
        <h3
          id="home-more-heading"
          className="text-base font-semibold text-stone-600 dark:text-stone-300"
        >
          Or take a different route
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HomeLink
            label="Share a moment"
            hint="Sit side by side and enjoy something together. Large, easy type."
            icon={<Heart className="w-6 h-6" aria-hidden="true" />}
            onClick={onOpenTogether}
          />
          <HomeLink
            label="Add what you know"
            hint="Family and carers can add songs, places and small details that help."
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
              <p className="mt-1 text-sm md:text-base text-stone-600 dark:text-stone-300 leading-relaxed">
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
        <p role="status" className="text-sm text-stone-500 dark:text-stone-400">
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
      <span className="block mt-1 text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
        {hint}
      </span>
    </span>
  </button>
);
