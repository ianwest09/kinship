import { useEffect, type RefObject } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableWithin(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  );
}

interface Options {
  open: boolean;
  onClose: () => void;
  dialogRef: RefObject<HTMLElement>;
  /**
   * Initial focus target. Defaults to the first focusable control inside the
   * dialog, falling back to the dialog container itself so Escape always works
   * even when a dialog has no buttons.
   */
  initialFocusRef?: RefObject<HTMLElement>;
}

/**
 * Shared dialog behaviour: Escape closes, focus is moved in and trapped, focus
 * is restored to whatever had it before, and the page behind stops scrolling.
 *
 * Both overlay surfaces in Kinship (the settling-sounds dialog and the Qloo
 * trace drawer) were missing all four of these. That is a WCAG 2.1.2 / 2.4.3
 * failure for keyboard and screen-reader users, and on Android it means the
 * only way out of a full-screen overlay is to find a small Close button.
 *
 * One hook rather than two copies, so the behaviour cannot drift.
 */
export function useDialogBehaviour({ open, onClose, dialogRef, initialFocusRef }: Options): void {
  useEffect(() => {
    if (!open || typeof document === 'undefined') return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;

    // Stop the page behind the dialog scrolling. Compensate for the scrollbar
    // so the layout does not jump sideways when it disappears.
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    const dialog = dialogRef.current;
    const target = initialFocusRef?.current ?? focusableWithin(dialog ?? document.createElement('div'))[0];
    if (target) {
      // Defer one frame: the dialog may still be mounting its contents.
      window.requestAnimationFrame(() => {
        try {
          target.focus();
        } catch {
          /* focus is best-effort; never break the dialog over it */
        }
      });
    } else if (dialog) {
      dialog.setAttribute('tabindex', '-1');
      window.requestAnimationFrame(() => dialog.focus());
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;

      const items = focusableWithin(dialog);
      if (items.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      // Give focus back, so closing an overlay does not drop a keyboard user at
      // the top of the document.
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        try {
          previouslyFocused.focus();
        } catch {
          /* the trigger may have unmounted; nothing to restore */
        }
      }
    };
  }, [open, onClose, dialogRef, initialFocusRef]);
}
