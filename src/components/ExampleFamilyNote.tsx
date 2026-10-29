import React from 'react';
import { ArrowRight, Users } from 'lucide-react';

interface Props {
  elderName: string;
  birthYear: number;
  /** Omitted on the screen the action leads to, where it would do nothing. */
  onAddYourOwn?: () => void;
}

/**
 * States whose suggestions these are.
 *
 * Kinship opens with a sample family already loaded so there is nothing to set
 * up before a tired carer can look around. That is a deliberate choice, but the
 * app used to present the result as though it were personal: Home said
 * "Right now Kinship is looking at … the years when Gogo Thandi was growing up"
 * to a visitor who had typed nothing, and every screen downstream repeated her
 * name. Output arrived before any input, with no point at which the person was
 * told it was an example.
 *
 * This is the missing step. It renders above the screen content wherever the
 * loaded family is still one of the samples, and carries the one action that
 * makes the data the reader's own.
 */
export const ExampleFamilyNote: React.FC<Props> = ({ elderName, birthYear, onAddYourOwn }) => {
  const name = elderName.trim() || 'the example family';
  return (
    <div
      role="note"
      className="loam-card p-4 md:p-5 mb-6 no-print flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
    >
      <p className="text-sm md:text-base leading-relaxed text-loam-body dark:text-loam-body-dark min-w-0">
        <span className="font-semibold text-loam-ink dark:text-parchment-100">
          Showing an example family.
        </span>{' '}
        These suggestions are about {name}, born {birthYear} — a sample, not
        anyone you know. Nothing here has been worked out from your own details
        yet.
      </p>
      {onAddYourOwn && (
        <button
          type="button"
          onClick={onAddYourOwn}
          className="loam-btn-secondary shrink-0 px-4 py-2.5 text-sm md:text-base"
        >
          <Users className="w-4 h-4 text-plum-600 dark:text-plum-300" aria-hidden="true" />
          <span>Add what you know</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
