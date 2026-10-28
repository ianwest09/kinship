import React, { useState } from 'react';
import { Activity, Building2, ShieldCheck, TrendingUp } from 'lucide-react';
import { CareHomeCohortRecord } from '../../shared/types';

interface Props {
  cohort: CareHomeCohortRecord[];
  onOpenTrace: () => void;
  onOpenPassport: () => void;
}

/**
 * Operator and pilot appendix.
 *
 * This content used to live inside the bedside care passport, printed on the
 * same sheet a family hands to a care aide. Two problems with that, both
 * serious:
 *
 * 1. It presented planning assumptions as measured results — "−86% agitation
 *    episodes", "2.9× longer relaxed visits", "84% spontaneous smile rate".
 *    Nothing in this codebase measures any of that. There is no study, no
 *    deployment and no instrumentation behind those numbers.
 * 2. The cohort cards render other people's records — diagnosis labels
 *    including MMSE scores, birth years and origins — on the same printable
 *    sheet as the person being cared for. Even as demo data, that is the wrong
 *    shape for a care document, and it is the opposite of the privacy posture
 *    the app claims.
 *
 * So the material is preserved, because it is legitimately useful to an
 * operator or a reviewer, but it now sits behind its own route, is labelled as
 * an illustrative model, and is never printed onto a care document.
 *
 * What is stated as fact below is stated only where the code supports it.
 */
export const OperatorAppendixView: React.FC<Props> = ({ cohort, onOpenTrace, onOpenPassport }) => {
  const [facilityBeds, setFacilityBeds] = useState<number>(80);

  return (
    <div className="space-y-7 md:space-y-8 max-w-readable">
      <header>
        <p className="text-xs font-mono uppercase tracking-wider break-words text-plum-600 dark:text-brass-200">
          For managers, operators and reviewers
        </p>
        <h2 className="mt-1.5 font-serif text-3xl md:text-4xl font-semibold text-loam-ink dark:text-parchment-50 tracking-tight">
          Operator and pilot appendix
        </h2>
        <p className="mt-3 text-base md:text-lg leading-relaxed text-loam-body dark:text-loam-body-dark">
          Background material about running Kinship in a facility. It is not part
          of anyone’s care record and it is never printed on a bedside sheet.
        </p>
      </header>

      {/* The single most important thing on this screen. */}
      <section
        aria-labelledby="appendix-honesty"
        className="loam-card p-5 md:p-7 border-l-4 border-l-brass-500 bg-brass-50 dark:bg-vinyl-900 space-y-3"
      >
        <h3
          id="appendix-honesty"
          className="text-lg md:text-xl font-semibold text-loam-ink dark:text-parchment-50"
        >
          Illustrative model — not measured results
        </h3>
        <p className="text-sm md:text-base leading-relaxed text-loam-body dark:text-loam-body-dark">
          Every outcome figure on this page is a planning assumption that ships
          with Kinship’s demo data. None of it comes from a clinical trial, a
          customer deployment or instrumentation inside this product. Kinship
          records no outcomes and cannot report any. Treat the numbers as a way
          of reasoning about a possible pilot, not as evidence, and never quote
          them as results.
        </p>
        <p className="text-sm md:text-base leading-relaxed text-loam-body dark:text-loam-body-dark">
          The people listed under “Demo cohort” are fictional records used to
          exercise the interface. They are not patients and must not be shown
          alongside a real person’s information.
        </p>
      </section>

      {/* What is actually true, because it can be checked in the code. */}
      <section aria-labelledby="appendix-data" className="loam-card p-5 md:p-7 space-y-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-plum-600 dark:text-plum-300" aria-hidden="true" />
          <h3
            id="appendix-data"
            className="text-lg md:text-xl font-semibold text-loam-ink dark:text-parchment-50"
          >
            How data is handled today
          </h3>
        </div>
        <ul className="space-y-2.5 text-sm md:text-base leading-relaxed text-loam-body dark:text-loam-body-dark">
          <li>
            <strong className="font-semibold text-loam-ink dark:text-parchment-100">
              No database and no accounts.
            </strong>{' '}
            Kinship has no persistence layer. Nothing is written to a server
            between requests, and there is no sign-in.
          </li>
          <li>
            <strong className="font-semibold text-loam-ink dark:text-parchment-100">
              Names are not forwarded to Qloo.
            </strong>{' '}
            Outbound Qloo requests carry only Qloo entity identifiers, release
            years, a city name and content filters. Person names, birth years
            and care details are used to build the request and then discarded.
          </li>
          <li>
            <strong className="font-semibold text-loam-ink dark:text-parchment-100">
              Request bodies are not logged.
            </strong>{' '}
            The API logs engine errors only, never the payloads that carry
            family details.
          </li>
          <li>
            <strong className="font-semibold text-loam-ink dark:text-parchment-100">
              The bedside QR keeps its payload in the URL fragment.
            </strong>{' '}
            A fragment is never sent to a server, but anyone who scans or
              receives the link can read the names in it, and it can land in
              browser history. Share it deliberately.
          </li>
        </ul>
        <p className="text-sm md:text-base leading-relaxed text-loam-body dark:text-loam-body-dark">
          Kinship makes no claim of HIPAA, POPIA or GDPR certification, and it is
          not a medical device. Compliance for a real deployment depends on the
          operator’s own assessment.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <button type="button" onClick={onOpenPassport} className="loam-btn-secondary text-sm md:text-base">
            <span>Bedside care passport</span>
          </button>
          <button type="button" onClick={onOpenTrace} className="loam-btn-secondary text-sm md:text-base">
            <span>Qloo request trace</span>
          </button>
        </div>
      </section>

      {/* Illustrative cohort, clearly marked as fictional. */}
      {cohort.length > 0 && (
        <section aria-labelledby="appendix-cohort" className="loam-card p-5 md:p-7 space-y-4">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-plum-600 dark:text-plum-300" aria-hidden="true" />
            <h3
              id="appendix-cohort"
              className="text-lg md:text-xl font-semibold text-loam-ink dark:text-parchment-50"
            >
              Demo cohort (fictional)
            </h3>
          </div>
          <p className="text-sm md:text-base leading-relaxed text-loam-body dark:text-loam-body-dark">
            Sample records used to show what a multi-resident view could look
            like. The before-and-after figures are invented for the demo.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {cohort.map((rec) => (
              <div
                key={rec.residentToken}
                className="rounded-2xl border border-parchment-200 dark:border-vinyl-700 bg-parchment-50 dark:bg-vinyl-800 p-4 space-y-1.5 text-sm"
              >
                <div className="font-mono text-xs font-semibold text-plum-700 dark:text-brass-200">
                  {rec.residentToken}
                </div>
                <div className="font-semibold text-loam-ink dark:text-parchment-50">
                  {rec.stageLabel}
                </div>
                <div className="text-loam-body dark:text-loam-body-dark">
                  Born {rec.birthYear} · {rec.youthOrigin}
                </div>
                <div className="text-loam-body dark:text-loam-body-dark">
                  <strong className="font-semibold">Spark anchor:</strong>{' '}
                  {rec.primarySparkAnchor}
                </div>
                <div className="text-loam-body dark:text-loam-body-dark">
                  <strong className="font-semibold">Family bridge:</strong>{' '}
                  {rec.grandkidBridgeUsed}
                </div>
                <div className="pt-1 text-xs text-loam-muted dark:text-loam-muted-dark">
                  Illustrative only: sundowning {rec.sundowningEpisodesBeforeWk}→
                  {rec.sundowningEpisodesNowWk}/wk · visits{' '}
                  {rec.familyVisitMinutesAvg[0]}m→{rec.familyVisitMinutesAvg[1]}m
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* A cost model the reader can see the arithmetic of. */}
      <section aria-labelledby="appendix-cost" className="loam-card p-5 md:p-7 space-y-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-plum-600 dark:text-plum-300" aria-hidden="true" />
          <h3
            id="appendix-cost"
            className="text-lg md:text-xl font-semibold text-loam-ink dark:text-parchment-50"
          >
            Illustrative cost model
          </h3>
        </div>
        <p className="text-sm md:text-base leading-relaxed text-loam-body dark:text-loam-body-dark">
          Simple arithmetic on an assumed price of $14 per resident per month.
          Move the slider to see how the assumption scales. No part of this is a
          quote, a forecast or a result.
        </p>
        <div className="rounded-2xl border border-parchment-200 dark:border-vinyl-700 bg-parchment-50 dark:bg-vinyl-800 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="beds-slider"
              className="text-sm md:text-base font-semibold text-loam-ink dark:text-parchment-50 flex items-center gap-1.5"
            >
              <TrendingUp className="w-4 h-4 text-plum-600 dark:text-plum-300" aria-hidden="true" />
              <span>
                Assumed community size: <strong>{facilityBeds}</strong> residents
              </span>
            </label>
            <span className="font-mono text-sm text-plum-700 dark:text-brass-200 font-semibold">
              {(facilityBeds * 14 * 12).toLocaleString()} USD per year at $14/resident/month
            </span>
          </div>
          <input
            id="beds-slider"
            type="range"
            min={20}
            max={240}
            step={10}
            value={facilityBeds}
            onChange={(e) => setFacilityBeds(Number(e.target.value))}
            className="kinship-slider w-full cursor-pointer"
            aria-describedby="beds-slider-note"
          />
          <p
            id="beds-slider-note"
            className="text-sm text-loam-muted dark:text-loam-muted-dark"
          >
            Assumption only. Real cost depends on staffing, licensing and the
            operator’s own services.
          </p>
        </div>
      </section>
    </div>
  );
};
