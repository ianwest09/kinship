import React, { useMemo, useState } from 'react';
import { Check, Clock, Copy, FileHeart, Printer, QrCode, Sparkles } from 'lucide-react';
import {
  KinshipPrescriptionResponse,
  QlooEntitySubtype,
  SparkJournalEntry,
} from '../../shared/types';
import {
  decodeKinshipPassportHash,
  encodeKinshipPassportLink,
  generatePassportQrMatrix,
  safeCopyText,
} from '../utils/qrAndPassport';

/**
 * The bedside care sheet: the printable, scannable one-pager a family hands to
 * whoever is helping today.
 *
 * Deliberately contains no outcome statistics, no pricing and no records of
 * other people. That material used to live here and printed onto the same
 * sheet; it now lives in OperatorAppendixView, behind its own route.
 */
interface Props {
  data: KinshipPrescriptionResponse;
  sparkLog: SparkJournalEntry[];
  elderClues: Array<{ name: string; subtype: QlooEntitySubtype }>;
  grandchildSeeds: Array<{ name: string; subtype: QlooEntitySubtype }>;
  onOpenTrace: () => void;
  onOpenOperators: () => void;
}

export const MemoryCarePassportView: React.FC<Props> = ({
  data,
  sparkLog,
  elderClues,
  grandchildSeeds,
  onOpenTrace,
  onOpenOperators,
}) => {
  const [copied, setCopied] = useState(false);
  const [verifiedMsg, setVerifiedMsg] = useState<string | null>(null);
  const [printNote, setPrintNote] = useState<string | null>(null);

  const share = useMemo(
    () =>
      encodeKinshipPassportLink({
        guardrails: data.guardrailsApplied,
        elderClues,
        grandchildSeeds,
      }),
    [data.guardrailsApplied, elderClues, grandchildSeeds]
  );

  const qrMatrix = useMemo(() => generatePassportQrMatrix(share.url), [share.url]);
  const qrSize = qrMatrix.length;

  const qrPath = useMemo(() => {
    const parts: string[] = [];
    for (let y = 0; y < qrSize; y++) {
      for (let x = 0; x < qrSize; x++) {
        if (qrMatrix[y][x]) parts.push(`M${x + 2} ${y + 2}h1v1h-1z`);
      }
    }
    return parts.join('');
  }, [qrMatrix, qrSize]);

  const handleCopy = () => {
    try {
      if (
        typeof window !== 'undefined' &&
        window.location.protocol.startsWith('http') &&
        window.location.origin &&
        window.location.origin !== 'null'
      ) {
        window.history.replaceState(null, '', share.hash);
      }
    } catch {
      // Ignore SecurityError in sandboxed opaque-origin iframes
    }
    safeCopyText(share.url).finally(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const handleSafePrint = () => {
    const isOpaqueSandbox =
      typeof window !== 'undefined' && (!window.location.origin || window.location.origin === 'null');
    if (isOpaqueSandbox) {
      setPrintNote(
        'Print dialogs are restricted inside sandboxed file previews — open the live Kinship website tab or download kinship-prototype.html to print cleanly.'
      );
      return;
    }
    try {
      window.print();
    } catch {
      setPrintNote('Open the live Kinship website tab in a full browser window to print.');
    }
  };

  const handleVerifyScan = () => {
    const decoded = decodeKinshipPassportHash(share.hash);
    if (decoded) {
      setVerifiedMsg(
        `This code reads back correctly: born ${decoded.birthYear} (${decoded.youthGeography}), ${decoded.elderNames.length} familiar things and ${decoded.grandchildNames.length} family bridges. Nothing is stored on a server — the details live in the link itself.`
      );
    }
  };

  return (
    <div className="space-y-8">
      {/* ===================================================================== */}
      {/* 1. PRINTABLE BEDSIDE / MEMORY CARE ROOM DOOR PASSPORT + SCANNABLE QR  */}
      {/* ===================================================================== */}
      <section className="rounded-3xl border-2 border-plum-600/40 bg-parchment-50 dark:bg-vinyl-900 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-parchment-200 dark:border-vinyl-700">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider break-words text-plum-600 dark:text-brass-200">
              <FileHeart className="w-4 h-4" />
              <span>Printable bedside sheet · nothing is uploaded</span>
            </div>
            <h2 className="text-2xl font-semibold text-loam-ink dark:text-parchment-50 mt-1">
              {data.guardrailsApplied.elderName}’s care sheet
            </h2>
            <p className="text-sm md:text-base text-loam-body dark:text-loam-body-dark">
              For whoever is helping today. One page they can read at a glance:
              the years to draw from, a settling sound for late afternoon, and
              invitations that do not turn memory into a test. A starting point
              for time together — not a promise of any particular response.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 no-print shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-plum-600 hover:bg-plum-700 text-white text-xs font-semibold"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Link copied' : 'Copy link'}</span>
            </button>
            <button
              type="button"
              onClick={handleSafePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 text-xs font-semibold"
            >
              <Printer className="w-4 h-4" />
              <span>Print this sheet</span>
            </button>
          </div>
        </div>
        {printNote && (
          <div className="no-print rounded-xl border border-brass-300 bg-brass-50 dark:bg-vinyl-800 px-3.5 py-2 text-xs text-brass-900 dark:text-brass-200">
            {printNote}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Cols: Circadian Daily Care Rhythm */}
          <div className="lg:col-span-8 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-loam-muted flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-plum-600 dark:text-brass-200" />
              <span>A rhythm for the day · drawing on {data.bumpWindow.bumpStartYear}–{data.bumpWindow.bumpEndYear}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* 10 AM Morning Spark */}
              <div className="rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 p-4 space-y-2">
                <span className="inline-block px-2 py-0.5 rounded-md bg-brass-100 text-brass-700 text-xs font-mono font-bold">
                  10:00 AM · MORNING SPARK
                </span>
                <div className="font-semibold text-sm">
                  {data.reconstructedYouthUniverse[0]?.name || 'Upbeat Youth Era Anchor'}
                </div>
                <p className="text-xs text-loam-body dark:text-loam-muted-dark">
                  Good with breakfast or a walk in the light — an easy way into
                  talking, if they feel like it.
                </p>
              </div>

              {/* 2 PM Family / Grandchild Bridge */}
              <div className="rounded-2xl border border-plum-300 dark:border-plum-800 bg-plum-50/50 dark:bg-plum-900/20 p-4 space-y-2">
                <span className="inline-block px-2 py-0.5 rounded-md bg-plum-600 text-white text-xs font-mono font-bold">
                  2:00 PM · GRANDKID BRIDGE
                </span>
                <div className="font-semibold text-sm">
                  {data.intergenerationalBridges[0]?.grandchildSeedName.split('(')[0].trim()} ↔{' '}
                  {data.intergenerationalBridges[0]?.elderAnchorName.split('—')[0].trim()}
                </div>
                <p className="text-xs text-loam-body dark:text-loam-muted-dark">
                  A short visit, side by side. Qloo rates these two tastes{' '}
                  {data.intergenerationalBridges[0]?.overlapPct}% alike — a
                  prompt to start from, not a prediction. No questions about
                  names or dates.
                </p>
              </div>

              {/* 4:30 PM Sundowning Calm */}
              <div className="rounded-2xl border border-pine-500/40 bg-pine-50/60 dark:bg-vinyl-800 p-4 space-y-2">
                <span className="inline-block px-2 py-0.5 rounded-md bg-pine-600 text-white text-xs font-mono font-bold">
                  4:30 PM · SUNDOWNING CALM
                </span>
                <div className="font-semibold text-sm">
                  {data.sundowningSafePlaylist[0]?.name || '60–72 BPM Youth Lullaby'}
                </div>
                <p className="text-xs text-loam-body dark:text-loam-muted-dark">
                  Close the blinds before the light goes, offer something warm
                  to drink, and play this slowly. Families often find it helps
                  when the late afternoon gets restless.
                </p>
              </div>
            </div>

            {/* Care Team Do's & Don'ts */}
            <div className="rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-semibold text-pine-700 dark:text-pine-300 mb-1">
                  ✅ HELPFUL WITH {data.guardrailsApplied.elderName.toUpperCase()}
                </div>
                <ul className="space-y-1 text-loam-body dark:text-loam-body-dark">
                  <li>• Hum the first 4 bars and smile warmly before speaking</li>
                  <li>• Share sensory observations (“That brass horn is so warm”)</li>
                  <li>• Validate emotional homesickness before redirecting</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-clay-700 dark:text-clay-300 mb-1">
                  ❌ BEST AVOIDED
                </div>
                <ul className="space-y-1 text-loam-body dark:text-loam-body-dark">
                  <li>• Never ask “Do you remember who sang this?”</li>
                  <li>• Avoid evening TV news, crime dramas, or dark suspense</li>
                  <li>• Avoid sudden channel jumps or loud commercial breaks</li>
                </ul>
              </div>
            </div>

            {/* Pocket Scent Anchor + Heirloom Lucid Spark Quotes Timeline */}
            <div className="rounded-2xl border border-plum-300 dark:border-plum-800 bg-plum-50/50 dark:bg-plum-900/20 p-4 space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-plum-800 dark:text-brass-200">
                  🌿 Pocket Scent &amp; Touch Anchor: {data.sensoryTactileKit[0]?.name}
                </span>
                <span className="font-mono text-xs text-pine-700 dark:text-pine-300">
                  Sound slows 96 → 76 → 62 beats/min
                </span>
              </div>
              {data.seniorDiningPlan && (
                <div className="pt-1.5 border-t border-plum-200/70 dark:border-plum-800/70 text-meta text-loam-body dark:text-loam-body-dark">
                  <strong className="text-pine-700 dark:text-pine-300">
                    🍽 {data.seniorDiningPlan.iddsiLevelLabel}:
                  </strong>{' '}
                  {data.seniorDiningPlan.dishName} · Calm Outing: {data.seniorDiningPlan.calmVenue.name} ({data.seniorDiningPlan.calmVenue.quietHoursWindow})
                </div>
              )}
              {sparkLog.some((s) => s.lucidQuote) ? (
                <div className="space-y-1.5 pt-1 border-t border-plum-200 dark:border-plum-800">
                  <div className="font-mono text-xs uppercase text-plum-700 dark:text-brass-200 font-bold">
                    Heirloom Lucid Moments Captured by Family:
                  </div>
                  {sparkLog
                    .filter((s) => s.lucidQuote)
                    .map((s) => (
                      <div key={s.id} className="p-2 rounded-xl bg-white dark:bg-vinyl-800">
                        <span className="font-semibold">{s.eraYearPinned || ''} · {s.cueName.split('—')[0].trim()}:</span>{' '}
                        <em className="text-plum-800 dark:text-brass-200">“{s.lucidQuote}”</em>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-meta text-loam-body dark:text-loam-muted-dark">
                  Tip: in the <strong>detailed care view</strong>, tap{' '}
                  <strong>“They lit up”</strong> after a song and write down
                  anything they said. It prints here, on{' '}
                  {data.guardrailsApplied.elderName}’s sheet.
                </p>
              )}
            </div>
          </div>

          {/* Right 4 Cols: Scannable ISO/IEC 18004 Bedside QR Card */}
          <div className="lg:col-span-4 rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 p-5 flex flex-col items-center text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 text-meta font-mono uppercase text-plum-600 dark:text-brass-200 font-semibold">
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan for this sheet</span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-parchment-200 shadow-sm">
              <svg
                viewBox={`0 0 ${qrSize + 4} ${qrSize + 4}`}
                className="w-40 h-40"
                shapeRendering="crispEdges"
                role="img"
                aria-label="Scannable Kinship Memory Care Room Passport QR Code"
              >
                <rect width={qrSize + 4} height={qrSize + 4} fill="#FFFFFF" />
                <path d={qrPath} fill="#1C1B1A" />
              </svg>
            </div>
            <div className="text-meta text-loam-muted dark:text-loam-muted-dark">
              Standard QR · {share.bytes} bytes · the details travel in the link
              itself, not on a server
            </div>
            <button
              type="button"
              onClick={handleVerifyScan}
              className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-parchment-100 dark:bg-vinyl-700 text-xs font-medium hover:bg-parchment-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-plum-600 dark:text-brass-200" />
              <span>Test this QR code</span>
            </button>
            {verifiedMsg && (
              <div className="p-2.5 rounded-xl bg-pine-50 dark:bg-vinyl-900 text-meta text-pine-700 dark:text-pine-300">
                {verifiedMsg}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* A quiet way onward for whoever is running the service. Kept off the
          printed sheet: it is background material, not care information. */}
      <section className="no-print loam-card p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-parchment-50 dark:bg-vinyl-900">
        <div className="min-w-0">
          <h3 className="text-base md:text-lg font-semibold text-loam-ink dark:text-parchment-50">
            Running Kinship in a care setting?
          </h3>
          <p className="mt-1 text-sm md:text-base text-loam-body dark:text-loam-body-dark">
            How the data is handled, and what is model rather than measured
            result. Not part of this sheet, and never printed on it.
          </p>
        </div>
        <button type="button" onClick={onOpenOperators} className="loam-btn-secondary shrink-0 text-sm md:text-base">
          <span>Operator appendix</span>
        </button>
      </section>

    </div>
  );
};
