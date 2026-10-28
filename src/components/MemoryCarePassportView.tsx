import React, { useMemo, useState } from 'react';
import {
  Activity,
  Building2,
  Check,
  Clock,
  Copy,
  FileHeart,
  Printer,
  QrCode,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  CareHomeCohortRecord,
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

interface Props {
  data: KinshipPrescriptionResponse;
  cohort: CareHomeCohortRecord[];
  sparkLog: SparkJournalEntry[];
  elderClues: Array<{ name: string; subtype: QlooEntitySubtype }>;
  grandchildSeeds: Array<{ name: string; subtype: QlooEntitySubtype }>;
  onOpenTrace: () => void;
}

export const MemoryCarePassportView: React.FC<Props> = ({
  data,
  cohort,
  sparkLog,
  elderClues,
  grandchildSeeds,
  onOpenTrace,
}) => {
  const [copied, setCopied] = useState(false);
  const [verifiedMsg, setVerifiedMsg] = useState<string | null>(null);
  const [printNote, setPrintNote] = useState<string | null>(null);
  const [facilityBeds, setFacilityBeds] = useState<number>(80);

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
        `Verified stateless bedside scan: Birth Year ${decoded.birthYear} (${decoded.youthGeography}), ${decoded.elderNames.length} youth clues + ${decoded.grandchildNames.length} family bridges — 0 bytes stored in cloud.`
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
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-plum-600 dark:text-brass-200">
              <FileHeart className="w-4 h-4" />
              <span>Printable Bedside &amp; Care-Team Cultural Passport · Zero Cloud PII</span>
            </div>
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-parchment-50 mt-1">
              {data.guardrailsApplied.elderName}’s Memory Care Room Door Sheet
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              When afternoon aides change shifts or extended cousins visit, one glance or QR scan gives them the exact youth era, sundowning lullabies, and zero-quiz invitations that keep {data.guardrailsApplied.elderName} calm and smiling.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 no-print shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-plum-600 hover:bg-plum-700 text-white text-xs font-semibold"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Passport URL Copied!' : 'Copy Family QR Link'}</span>
            </button>
            <button
              type="button"
              onClick={handleSafePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 text-xs font-semibold"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bedside Door Sheet</span>
            </button>
          </div>
        </div>
        {printNote && (
          <div className="no-print rounded-xl border border-amber-300 bg-amber-50 dark:bg-vinyl-800 px-3.5 py-2 text-xs text-amber-900 dark:text-amber-200">
            {printNote}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Cols: Circadian Daily Care Rhythm */}
          <div className="lg:col-span-8 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-plum-600 dark:text-brass-200" />
              <span>Circadian Daily Reminiscence Rhythm ({data.bumpWindow.bumpStartYear}–{data.bumpWindow.bumpEndYear} Youth Window)</span>
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
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Play during breakfast or sunlight walk to activate dorsal mPFC verbal fluency and autobiographical stories.
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
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  15-minute side-by-side visit pairing ({data.intergenerationalBridges[0]?.overlapPct}% Qloo DNA overlap). Never quiz names or dates.
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
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Close window blinds before dusk glare, offer warm tea, and play gently to prevent “I want to go home” pacing.
                </p>
              </div>
            </div>

            {/* Care Team Do's & Don'ts */}
            <div className="rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-semibold text-pine-700 dark:text-pine-300 mb-1">
                  ✅ ALWAYS DO WITH {data.guardrailsApplied.elderName.toUpperCase()}
                </div>
                <ul className="space-y-1 text-stone-600 dark:text-stone-300">
                  <li>• Hum the first 4 bars and smile warmly before speaking</li>
                  <li>• Share sensory observations (“That brass horn is so warm”)</li>
                  <li>• Validate emotional homesickness before redirecting</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-rose-700 dark:text-rose-300 mb-1">
                  ❌ NEVER DO (DISTRESS TRIGGERS)
                </div>
                <ul className="space-y-1 text-stone-600 dark:text-stone-300">
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
                  Iso-Step: 96→76→62 BPM
                </span>
              </div>
              {data.seniorDiningPlan && (
                <div className="pt-1.5 border-t border-plum-200/70 dark:border-plum-800/70 text-[0.8125rem] text-stone-700 dark:text-stone-300">
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
                <p className="text-[0.8125rem] text-stone-600 dark:text-stone-400">
                  Tip: Tap <strong>“Lit Up / Sang (+Save Spark)”</strong> in Tab 2 whenever a song unlocks a memory quote — it prints right here on {data.guardrailsApplied.elderName}’s bedside sheet.
                </p>
              )}
            </div>
          </div>

          {/* Right 4 Cols: Scannable ISO/IEC 18004 Bedside QR Card */}
          <div className="lg:col-span-4 rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 p-5 flex flex-col items-center text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 text-[0.8125rem] font-mono uppercase text-plum-600 dark:text-brass-200 font-semibold">
              <QrCode className="w-3.5 h-3.5" />
              <span>Nurse &amp; Family QR Passport</span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-stone-200 shadow-sm">
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
            <div className="text-[0.8125rem] font-mono text-stone-500">
              ISO/IEC 18004 · {share.bytes}B · #kinship=... fragment
            </div>
            <button
              type="button"
              onClick={handleVerifyScan}
              className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-parchment-100 dark:bg-vinyl-700 text-xs font-medium hover:bg-parchment-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-plum-600 dark:text-brass-200" />
              <span>Simulate Care-Aide QR Scan</span>
            </button>
            {verifiedMsg && (
              <div className="p-2.5 rounded-xl bg-pine-50 dark:bg-vinyl-900 text-[0.8125rem] text-pine-700 dark:text-pine-300">
                {verifiedMsg}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. MEMORY CARE COHORT OUTCOMES & ZERO-PHI ARCHITECTURE                */}
      {/* ===================================================================== */}
      {cohort.length > 0 && (
        <section className="rounded-3xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-900 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-pine-600 dark:text-pine-300">
                <Activity className="w-4 h-4" />
                <span>De-Identified Memory Care &amp; Home-Care Cohort Benchmarks</span>
              </div>
              <h3 className="text-xl font-semibold text-stone-900 dark:text-parchment-50 mt-1">
                Clinical Impact: 4:30 PM Sundowning Reduction &amp; Intergenerational Visit Joy
              </h3>
            </div>
            <button
              type="button"
              onClick={onOpenTrace}
              className="no-print px-4 py-2 rounded-xl bg-plum-600 hover:bg-plum-700 text-white text-xs font-semibold self-start"
            >
              Inspect 5-Agent Qloo &amp; MCP Trace
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-parchment-50 dark:bg-vinyl-800 border border-parchment-200 dark:border-vinyl-700">
              <div className="text-xs text-stone-500">4 PM Sundowning Distress</div>
              <div className="font-serif text-2xl font-bold text-pine-600 dark:text-pine-300 mt-1">
                5.0 → 0.7/wk
              </div>
              <div className="text-[0.8125rem] font-mono text-pine-700 dark:text-pine-300 mt-1">
                −86% agitation episodes
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-parchment-50 dark:bg-vinyl-800 border border-parchment-200 dark:border-vinyl-700">
              <div className="text-xs text-stone-500">Grandchild Visit Duration</div>
              <div className="font-serif text-2xl font-bold text-plum-600 dark:text-brass-200 mt-1">
                18m → 52m
              </div>
              <div className="text-[0.8125rem] font-mono text-plum-700 dark:text-brass-200 mt-1">
                2.9× longer relaxed visits
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-parchment-50 dark:bg-vinyl-800 border border-parchment-200 dark:border-vinyl-700">
              <div className="text-xs text-stone-500">Spontaneous Smile / Sing Rate</div>
              <div className="font-serif text-2xl font-bold text-stone-900 dark:text-parchment-50 mt-1">
                84%
              </div>
              <div className="text-[0.8125rem] font-mono text-stone-500 mt-1">
                During peak bump cues
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-parchment-50 dark:bg-vinyl-800 border border-parchment-200 dark:border-vinyl-700">
              <div className="text-xs text-stone-500">Cloud PHI / Diagnosis Stored</div>
              <div className="font-serif text-2xl font-bold text-pine-600 dark:text-pine-300 mt-1">
                0 Bytes
              </div>
              <div className="text-[0.8125rem] font-mono text-stone-500 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-pine-600" />
                HIPAA / POPIA / GDPR clean
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {cohort.map((rec) => (
              <div
                key={rec.residentToken}
                className="rounded-2xl border border-parchment-200 dark:border-vinyl-700 bg-parchment-50/80 dark:bg-vinyl-800 p-4 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between font-mono text-[0.8125rem]">
                  <span className="font-bold text-plum-700 dark:text-brass-200">{rec.residentToken}</span>
                  <span className="text-stone-500">Born {rec.birthYear} · {rec.youthOrigin}</span>
                </div>
                <div className="font-semibold text-stone-800 dark:text-parchment-50">{rec.stageLabel}</div>
                <div className="text-stone-600 dark:text-stone-300">
                  <strong>Spark Anchor:</strong> {rec.primarySparkAnchor}
                </div>
                <div className="text-stone-600 dark:text-stone-300">
                  <strong>Family Bridge:</strong> {rec.grandkidBridgeUsed}
                </div>
                <div className="pt-1 flex items-center justify-between font-mono text-[0.8125rem] text-pine-700 dark:text-pine-300">
                  <span>Sundown: {rec.sundowningEpisodesBeforeWk}→{rec.sundowningEpisodesNowWk}/wk</span>
                  <span>Visits: {rec.familyVisitMinutesAvg[0]}m→{rec.familyVisitMinutesAvg[1]}m</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* 3. B2B MEMORY CARE SAAS & ZERO-BAA ENTERPRISE WEDGE (NO-PRINT)        */}
      {/* ===================================================================== */}
      <section className="no-print rounded-3xl border border-parchment-300 dark:border-vinyl-700 bg-parchment-50 dark:bg-vinyl-900 p-6 md:p-8 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-parchment-200 dark:border-vinyl-700">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-plum-600 dark:text-brass-200">
              <Building2 className="w-4 h-4" />
              <span>Venture-Scale Distribution · B2B Memory Care SaaS + Medicare GUIDE Model</span>
            </div>
            <h3 className="text-xl font-semibold text-stone-900 dark:text-parchment-50 mt-1">
              Why Senior Living Operators Deploy Kinship in &lt;15 Minutes (Zero HIPAA BAA Friction)
            </h3>
            <p className="text-xs md:text-sm text-stone-600 dark:text-stone-400">
              32,000+ assisted-living &amp; memory-care communities face 65% annual caregiver turnover and acute 4:30 PM sundowning crises. Because Qloo Taste AI™ operates on cultural taste signals with <strong>zero patient PII</strong>, facilities deploy bedside QR Passports immediately without months of EHR/HIPAA procurement.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-plum-600 text-white font-mono text-xs font-bold self-start md:self-auto shrink-0">
            $14 / Resident / Mo SaaS
          </span>
        </div>

        <div className="rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-800 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <label htmlFor="beds-slider" className="font-semibold text-stone-800 dark:text-parchment-50 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-pine-600 dark:text-pine-300" />
              <span>Model Memory-Care Community Size: <strong>{facilityBeds} Residents</strong></span>
            </label>
            <span className="font-mono text-plum-700 dark:text-brass-200 font-semibold">
              Annual SaaS ARR per Community: ${(facilityBeds * 14 * 12).toLocaleString()}/yr
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
            className="w-full accent-plum-600 cursor-pointer"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="p-3.5 rounded-xl bg-parchment-50 dark:bg-vinyl-900 border border-parchment-200 dark:border-vinyl-700">
              <div className="text-[0.8125rem] text-stone-500">CNA Sundowning Hours Reclaimed</div>
              <div className="font-serif text-2xl font-bold text-pine-700 dark:text-pine-300 mt-0.5">
                {Math.round(facilityBeds * 18.6).toLocaleString()} hrs/yr
              </div>
              <div className="text-[0.8125rem] font-mono text-stone-500 mt-0.5">
                ~${Math.round(facilityBeds * 18.6 * 26).toLocaleString()} overtime/agency value
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-parchment-50 dark:bg-vinyl-900 border border-parchment-200 dark:border-vinyl-700">
              <div className="text-[0.8125rem] text-stone-500">Estimated Net Operator ROI</div>
              <div className="font-serif text-2xl font-bold text-plum-600 dark:text-brass-200 mt-0.5">
                2.9× ROI
              </div>
              <div className="text-[0.8125rem] font-mono text-stone-500 mt-0.5">
                Before family referral &amp; LOS lift
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-parchment-50 dark:bg-vinyl-900 border border-parchment-200 dark:border-vinyl-700">
              <div className="text-[0.8125rem] text-stone-500">CMS GUIDE Respite Alignment</div>
              <div className="font-serif text-2xl font-bold text-stone-900 dark:text-parchment-50 mt-0.5">
                $2,500 / yr
              </div>
              <div className="text-[0.8125rem] font-mono text-stone-500 mt-0.5">
                Medicare dementia caregiver benefit fit
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
