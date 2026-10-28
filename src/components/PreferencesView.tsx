import React from 'react';
import { Building2, Cpu, Eye, FileHeart, Moon, Sun, Trash2, Type } from 'lucide-react';
import { ElderGuardrails } from '../../shared/types';

export type TextSize = 'normal' | 'large' | 'largest';

export const TEXT_SIZES: Array<{ id: TextSize; label: string; hint: string }> = [
  { id: 'normal', label: 'Normal', hint: 'Default' },
  { id: 'large', label: 'Large', hint: 'Easier reading' },
  { id: 'largest', label: 'Largest', hint: 'Shared reading aloud' },
];

interface Props {
  textSize: TextSize;
  onTextSizeChange: (size: TextSize) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  guardrails: ElderGuardrails;
  onUpdateGuardrails: (patch: Partial<ElderGuardrails>) => void;
  qlooStatus: { connected: boolean; baseUrl: string; maskedKey: string };
  onOpenTrace: () => void;
  onOpenDetail: () => void;
  onOpenPassport: () => void;
  onOpenOperators: () => void;
  onClearDeviceData: () => void;
  clearedNote: string | null;
  rememberOnDevice: boolean;
  onToggleRemember: () => void;
}

/**
 * Preferences and Accessibility.
 *
 * Every control here is reversible and none of them can put the user into a
 * state they cannot leave. Text size is persisted and applied to the document
 * root, so it scales the whole interface rather than one component.
 */
export const PreferencesView: React.FC<Props> = ({
  textSize,
  onTextSizeChange,
  darkMode,
  onToggleDarkMode,
  guardrails,
  onUpdateGuardrails,
  qlooStatus,
  onOpenTrace,
  onOpenDetail,
  onOpenPassport,
  onOpenOperators,
  onClearDeviceData,
  clearedNote,
  rememberOnDevice,
  onToggleRemember,
}) => {
  return (
    <div className="space-y-7 md:space-y-8 max-w-readable">
      <header>
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-loam-ink dark:text-parchment-50 tracking-tight">
          Preferences
        </h2>
        <p className="mt-3 text-base md:text-lg leading-relaxed text-loam-body dark:text-loam-body-dark">
          Make Kinship comfortable for whoever is using it. Change anything at any
          time — nothing here is permanent and nothing is a test.
        </p>
      </header>

      {/* Reading -------------------------------------------------------- */}
      <section className="loam-card p-5 md:p-7 space-y-5" aria-labelledby="pref-reading">
        <div className="flex items-center gap-3">
          <Type className="w-5 h-5 text-plum-600 dark:text-plum-300" aria-hidden="true" />
          <h3
            id="pref-reading"
            className="text-lg md:text-xl font-semibold text-loam-ink dark:text-parchment-50"
          >
            Reading
          </h3>
        </div>

        <fieldset>
          <legend className="text-base md:text-lg font-semibold text-loam-ink dark:text-parchment-100">
            Text size
          </legend>
          <p className="mt-1 text-sm md:text-base text-loam-body dark:text-loam-body-dark">
            This changes the whole screen, including spacing, so nothing gets cramped.
          </p>
          <div className="mt-3.5 grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="Text size">
            {TEXT_SIZES.map((size) => {
              const active = textSize === size.id;
              return (
                <button
                  key={size.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onTextSizeChange(size.id)}
                  className={`px-3 py-3.5 rounded-2xl border text-center transition-colors ${
                    active
                      ? 'bg-plum-600 border-plum-700 text-white'
                      : 'bg-loam-card dark:bg-vinyl-800 border-parchment-300 dark:border-vinyl-700 text-loam-ink dark:text-parchment-100 hover:border-plum-400'
                  }`}
                >
                  <span className="block font-semibold text-sm md:text-base">{size.label}</span>
                  <span
                    className={`block mt-0.5 text-xs md:text-sm ${
                      active ? 'text-plum-100' : 'text-loam-muted dark:text-loam-muted-dark'
                    }`}
                  >
                    {size.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <ToggleRow
          label="Evening mode"
          hint="A warm, low-glare dark theme. Helpful in dim rooms and late afternoons."
          checked={darkMode}
          onChange={onToggleDarkMode}
          icon={darkMode ? <Sun className="w-5 h-5" aria-hidden="true" /> : <Moon className="w-5 h-5" aria-hidden="true" />}
        />
      </section>

      {/* Sound ---------------------------------------------------------- */}
      <section className="loam-card p-5 md:p-7 space-y-5" aria-labelledby="pref-sound">
        <h3
          id="pref-sound"
          className="text-lg md:text-xl font-semibold text-loam-ink dark:text-parchment-50"
        >
          Sound
        </h3>
        <ToggleRow
          label="Warmer, softer sound"
          hint="Boosts lower, warmer tones and rolls off harsh high frequencies. Often easier with hearing aids or age-related hearing change."
          checked={Boolean(guardrails.hearingLossWarmEq)}
          onChange={() =>
            onUpdateGuardrails({ hearingLossWarmEq: !guardrails.hearingLossWarmEq })
          }
        />
      </section>

      {/* Keeping it comfortable ----------------------------------------- */}
      <section className="loam-card p-5 md:p-7 space-y-5" aria-labelledby="pref-comfort">
        <div>
          <h3
            id="pref-comfort"
            className="text-lg md:text-xl font-semibold text-loam-ink dark:text-parchment-50"
          >
            Keeping it comfortable
          </h3>
          <p className="mt-1.5 text-sm md:text-base text-loam-body dark:text-loam-body-dark">
            These shape what Kinship suggests. They are on by default because they
            are safer, and you can turn either off.
          </p>
        </div>

        <ToggleRow
          label="Gentle content only"
          hint="Leaves out suspense, war, shadows and loud or startling material. Keeps suggestions broadly suitable for all ages."
          checked={guardrails.sundowningSafeShield}
          onChange={() =>
            onUpdateGuardrails({ sundowningSafeShield: !guardrails.sundowningSafeShield })
          }
        />

        <ToggleRow
          label="Songs and pictures over plot"
          hint="Favours music, visuals and simple moments rather than stories that need following. Helpful when conversation has become tiring."
          checked={guardrails.plotFreeMusicalFocus}
          onChange={() =>
            onUpdateGuardrails({ plotFreeMusicalFocus: !guardrails.plotFreeMusicalFocus })
          }
        />
      </section>

      {/* Honesty about suggestions -------------------------------------- */}
      <section className="loam-card p-5 md:p-7 bg-parchment-50 dark:bg-vinyl-900 space-y-4" aria-labelledby="pref-about">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-plum-600 dark:text-plum-300" aria-hidden="true" />
          <h3
            id="pref-about"
            className="text-lg md:text-xl font-semibold text-loam-ink dark:text-parchment-50"
          >
            About these suggestions
          </h3>
        </div>

        <p className="text-sm md:text-base leading-relaxed text-loam-body dark:text-loam-body-dark">
          Kinship describes what people of a similar age and place tended to enjoy.
          It is a starting point for time together —{' '}
          <strong className="font-semibold text-loam-ink dark:text-parchment-100">
            it is not proof of anyone’s personal history, identity or preferences
          </strong>
          . The person you are with is always the expert on what they like. If a
          suggestion does not land, set it aside and try another.
        </p>

        <p className="text-sm md:text-base leading-relaxed text-loam-body dark:text-loam-body-dark">
          Suggestions are general and educational. They are not medical advice and
          do not replace a clinician, dietitian or speech-and-language therapist.
        </p>

        <dl className="pt-1 text-sm md:text-base">
          <div className="flex flex-wrap gap-x-2 py-1.5 border-t border-parchment-200 dark:border-vinyl-700">
            <dt className="font-semibold text-loam-ink dark:text-parchment-100">
              Where suggestions come from:
            </dt>
            <dd className="text-loam-body dark:text-loam-body-dark">
              {qlooStatus.connected
                ? `Live Qloo Taste AI (${qlooStatus.maskedKey || 'connected'})`
                : 'Kinship’s own collection — Qloo is not connected'}
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-2 py-1.5 border-t border-parchment-200 dark:border-vinyl-700">
            <dt className="font-semibold text-loam-ink dark:text-parchment-100">Privacy:</dt>
            <dd className="text-loam-body dark:text-loam-body-dark">
              There is no account and no database. What you type is sent to the
              Kinship server to build a request and is not stored there. Names,
              birth years and care details are never passed on to Qloo — only
              era, place and content filters are.
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-2 py-1.5 border-t border-parchment-200 dark:border-vinyl-700">
            <dt className="font-semibold text-loam-ink dark:text-parchment-100">Motion:</dt>
            <dd className="text-loam-body dark:text-loam-body-dark">
              Animation is minimal, and stops entirely if your device asks for
              reduced motion.
            </dd>
          </div>
        </dl>
      </section>

      {/* Your details on this device -------------------------------------- */}
      <section className="loam-card p-5 md:p-7 space-y-5" aria-labelledby="pref-device">
        <div>
          <h3
            id="pref-device"
            className="text-lg md:text-xl font-semibold text-loam-ink dark:text-parchment-50"
          >
            Your details on this device
          </h3>
          <p className="mt-1.5 text-sm md:text-base leading-relaxed text-loam-body dark:text-loam-body-dark">
            Off by default. Phones in a care home are often shared, so Kinship
            does not keep names, birth years or care notes unless you ask it to.
          </p>
        </div>

        <ToggleRow
          label="Remember my details in this browser"
          hint="Saves the name, year and the songs you have added on this device only, so a closed tab or a flat battery does not lose them. Nothing is uploaded, and it never reaches Qloo."
          checked={rememberOnDevice}
          onChange={onToggleRemember}
        />

        <div className="pt-4 border-t border-parchment-200 dark:border-vinyl-700 flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="button"
            onClick={onClearDeviceData}
            className="loam-btn-secondary text-sm md:text-base"
          >
            <Trash2 className="w-5 h-5 text-clay-600 dark:text-clay-300" aria-hidden="true" />
            <span>Clear everything on this device</span>
          </button>
          <p className="text-sm md:text-base text-loam-muted dark:text-loam-muted-dark">
            Removes saved details and returns Kinship to the sample family.
            Reading size and evening mode are kept.
          </p>
        </div>
        {clearedNote ? (
          <p role="status" className="text-sm md:text-base font-semibold text-pine-700 dark:text-pine-300">
            {clearedNote}
          </p>
        ) : null}
      </section>

      {/* Care-team tools ------------------------------------------------- */}
      <section className="loam-card p-5 md:p-7 space-y-4" aria-labelledby="pref-team">
        <div>
          <h3
            id="pref-team"
            className="text-lg md:text-xl font-semibold text-loam-ink dark:text-parchment-50"
          >
            For care teams
          </h3>
          <p className="mt-1.5 text-sm md:text-base text-loam-body dark:text-loam-body-dark">
            Deeper detail, including the reasoning and the exact Qloo
            requests behind each suggestion.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={onOpenDetail} className="loam-btn-secondary text-sm md:text-base">
            <FileHeart className="w-5 h-5 text-plum-600 dark:text-plum-300" aria-hidden="true" />
            <span>Detailed care view</span>
          </button>
          <button type="button" onClick={onOpenPassport} className="loam-btn-secondary text-sm md:text-base">
            <FileHeart className="w-5 h-5 text-plum-600 dark:text-plum-300" aria-hidden="true" />
            <span>Bedside care passport</span>
          </button>
          <button type="button" onClick={onOpenTrace} className="loam-btn-secondary text-sm md:text-base">
            <Cpu className="w-5 h-5 text-plum-600 dark:text-plum-300" aria-hidden="true" />
            <span>Qloo request trace</span>
          </button>
          <button type="button" onClick={onOpenOperators} className="loam-btn-secondary text-sm md:text-base">
            <Building2 className="w-5 h-5 text-plum-600 dark:text-plum-300" aria-hidden="true" />
            <span>Operator and pilot appendix</span>
          </button>
        </div>
      </section>
    </div>
  );
};

interface ToggleRowProps {
  label: string;
  hint: string;
  checked: boolean;
  onChange: () => void;
  icon?: React.ReactNode;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, hint, checked, onChange, icon }) => (
  <div className="flex items-start gap-4 pt-4 border-t border-parchment-200 dark:border-vinyl-700">
    <div className="min-w-0 flex-1">
      <label
        className="flex items-center gap-2 text-base md:text-lg font-semibold text-loam-ink dark:text-parchment-100 cursor-pointer"
        htmlFor={`pref-${label.replace(/\W+/g, '-').toLowerCase()}`}
      >
        {icon && <span className="text-plum-600 dark:text-plum-300">{icon}</span>}
        {label}
      </label>
      <p className="mt-1 text-sm md:text-base leading-relaxed text-loam-body dark:text-loam-body-dark">
        {hint}
      </p>
    </div>
    <button
      id={`pref-${label.replace(/\W+/g, '-').toLowerCase()}`}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`shrink-0 relative w-16 h-9 md:w-[4.25rem] md:h-10 rounded-full border transition-colors ${
        checked
          ? 'bg-plum-600 border-plum-700'
          : 'bg-parchment-200 dark:bg-vinyl-700 border-parchment-300 dark:border-vinyl-600'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-1/2 -translate-y-1/2 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white shadow-soft transition-all ${
          checked ? 'left-[calc(100%-2.125rem)] md:left-[calc(100%-2.375rem)]' : 'left-1'
        }`}
      />
      <span className="sr-only">{checked ? 'On' : 'Off'}</span>
    </button>
  </div>
);
