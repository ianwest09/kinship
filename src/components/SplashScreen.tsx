import React, { useEffect, useRef, useState } from 'react';

interface Props {
  darkMode: boolean;
  onDone: () => void;
}

/**
 * Splash screen — the first thing seen when Kinship opens.
 *
 * Deliberately calm and brief: a brand moment, not an advert. It dismisses
 * itself as soon as the first painted frame is ready (bounded between a
 * minimum and a maximum hold), can always be skipped immediately by button or
 * by any tap or key, holds for less time when the visitor prefers reduced
 * motion, and locks page scroll while visible so nothing moves underneath it.
 *
 * Light mode shows the approved full lockup on warm paper. Dark mode shows
 * the mark plus a set wordmark instead, because the lockup's navy wordmark
 * would fall below contrast on a charcoal ground.
 */
export const SplashScreen: React.FC<Props> = ({ darkMode, onDone }) => {
  const [leaving, setLeaving] = useState(false);
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const reduce =
      typeof window !== 'undefined' &&
      Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    if (reduce) {
      onDone();
      return;
    }
    setLeaving(true);
    window.setTimeout(onDone, 420);
  };

  useEffect(() => {
    const reduce = Boolean(
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    );
    const minHoldMs = reduce ? 700 : 1200;
    const maxHoldMs = reduce ? 1200 : 2600;
    const startedAt = Date.now();
    let contentReady = false;

    const dismissIfReady = () => {
      if (contentReady && Date.now() - startedAt >= minHoldMs) finish();
    };

    // Dismiss as soon as the first real frame is on screen (webfonts loaded and
    // painted), but never before minHold and never after maxHold. A fixed timer
    // has two failure modes — flashing away before first paint, or holding the
    // visitor at a door while the app behind is already ready — and neither can
    // be judged correctly without seeing it, so both are designed out instead.
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } })
      .fonts;
    (fonts?.ready ?? Promise.resolve())
      .then(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          )
      )
      .then(() => {
        contentReady = true;
        dismissIfReady();
      })
      .catch(() => {
        contentReady = true;
        dismissIfReady();
      });

    const poll = window.setInterval(dismissIfReady, 120);
    const cap = window.setTimeout(finish, maxHoldMs);

    // Any interaction dismisses immediately: the splash can never be a door.
    const interact = () => finish();
    window.addEventListener('pointerdown', interact, { once: true });
    window.addEventListener('keydown', interact, { once: true });

    return () => {
      window.clearInterval(poll);
      window.clearTimeout(cap);
      window.removeEventListener('pointerdown', interact);
      window.removeEventListener('keydown', interact);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[60] flex flex-col items-center justify-center gap-7 px-6 text-center ${
        darkMode ? 'bg-vinyl-950' : 'bg-parchment-100'
      } ${leaving ? 'loam-splash-leave' : 'loam-splash-enter'}`}
    >
      <span className="sr-only">Kinship is opening.</span>

      {darkMode ? (
        <div className="flex flex-col items-center gap-5">
          <img
            src="/kinship-mark.png"
            alt=""
            draggable={false}
            className="w-[min(42vw,10rem)] h-auto select-none"
          />
          <span className="loam-wordmark text-4xl md:text-5xl text-parchment-50">
            kinship
          </span>
        </div>
      ) : (
        <img
          src="/kinship-logo.png"
          alt=""
          draggable={false}
          className="w-[min(60vw,15rem)] h-auto select-none"
        />
      )}

      <p
        className={`font-serif text-lg md:text-xl italic ${
          darkMode ? 'text-stone-300' : 'text-stone-600'
        }`}
      >
        No right answers. Just time together.
      </p>

      <button type="button" onClick={finish} className="loam-btn-quiet text-base">
        Enter Kinship
      </button>
    </div>
  );
};
