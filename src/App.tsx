import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Cpu,
  Disc3,
  FileHeart,
  Moon,
  MoonStar,
  Sparkles,
  Sun,
  Users,
} from 'lucide-react';
import {
  CareHomeCohortRecord,
  CulturalClueSeed,
  ElderGuardrails,
  FamilyNarrativeParseResult,
  FamilyPreset,
  KinshipPrescriptionResponse,
  QlooEntitySubtype,
  ReminiscenceCue,
  SparkJournalEntry,
  YouthGeographyId,
} from '../shared/types';
import {
  CARE_HOME_COHORT,
  ELDER_CLUE_CATALOG,
  FAMILY_PRESETS,
  GRANDCHILD_SEED_CATALOG,
  YOUTH_GEOGRAPHIES,
} from '../server/reminiscenceGraph';
import {
  generateKinshipBridge,
  parseFamilyStoryToKinship,
} from '../server/kinshipQlooEngine';
import { FamilyIntakePanel } from './components/FamilyIntakePanel';
import { ReminiscenceAndBridgeView } from './components/ReminiscenceAndBridgeView';
import { MemoryCarePassportView } from './components/MemoryCarePassportView';
import { SundowningRescueModal } from './components/SundowningRescueModal';
import { KinshipQlooDrawer } from './components/KinshipQlooDrawer';
import { decodeKinshipPassportHash } from './utils/qrAndPassport';

type ActiveTab = 'intake' | 'bridge' | 'passport';

type ElderClueState = {
  entity_id?: string;
  name: string;
  subtype: QlooEntitySubtype;
  weight: number;
};

type GrandchildSeedState = {
  entity_id?: string;
  name: string;
  subtype: QlooEntitySubtype;
};

function resolvePresetElderClues(preset: FamilyPreset): ElderClueState[] {
  return preset.elderClueIds
    .map((id) => ELDER_CLUE_CATALOG.find((c) => c.entity_id === id))
    .filter((c): c is CulturalClueSeed => Boolean(c))
    .map((c) => ({ entity_id: c.entity_id, name: c.name, subtype: c.subtype, weight: c.weight }));
}

function resolvePresetGrandchildSeeds(preset: FamilyPreset): GrandchildSeedState[] {
  return preset.grandchildSeedIds
    .map((id) => GRANDCHILD_SEED_CATALOG.find((c) => c.entity_id === id))
    .filter((c): c is CulturalClueSeed => Boolean(c))
    .map((c) => ({ entity_id: c.entity_id, name: c.name, subtype: c.subtype }));
}

const INITIAL_PRESET = FAMILY_PRESETS[0];

export const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('intake');
  const [sundowningModalOpen, setSundowningModalOpen] = useState(false);
  const [traceDrawerOpen, setTraceDrawerOpen] = useState(false);

  const [presets] = useState<FamilyPreset[]>(FAMILY_PRESETS);
  const [elderCatalog] = useState<CulturalClueSeed[]>(ELDER_CLUE_CATALOG);
  const [grandchildCatalog] = useState<CulturalClueSeed[]>(GRANDCHILD_SEED_CATALOG);
  const [geographies] = useState<
    Array<{ id: YouthGeographyId; name: string; country: string; eraCulturalPortrait: string }>
  >(
    Object.values(YOUTH_GEOGRAPHIES).map((g) => ({
      id: g.id,
      name: g.name,
      country: g.country,
      eraCulturalPortrait: g.eraCulturalPortrait,
    }))
  );
  const [cohort] = useState<CareHomeCohortRecord[]>(CARE_HOME_COHORT);

  const [activePresetId, setActivePresetId] = useState<string | null>(INITIAL_PRESET.id);
  const [guardrails, setGuardrails] = useState<ElderGuardrails>(INITIAL_PRESET.guardrails);
  const [elderClues, setElderClues] = useState<ElderClueState[]>(() =>
    resolvePresetElderClues(INITIAL_PRESET)
  );
  const [grandchildSeeds, setGrandchildSeeds] = useState<GrandchildSeedState[]>(() =>
    resolvePresetGrandchildSeeds(INITIAL_PRESET)
  );
  const [boostedCueIds, setBoostedCueIds] = useState<string[]>([]);
  const [excludedCueIds, setExcludedCueIds] = useState<string[]>([]);
  const [sparkLog, setSparkLog] = useState<SparkJournalEntry[]>([]);

  const [qlooStatus, setQlooStatus] = useState({
    connected: false,
    baseUrl: 'https://hackathon.api.qloo.com',
    maskedKey: '',
  });
  const [prescription, setPrescription] = useState<KinshipPrescriptionResponse | null>(null);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.qloo) setQlooStatus(j.qloo);
      })
      .catch(() => {
        // Offline / sandboxed viewer fallback
      });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const decoded = decodeKinshipPassportHash(window.location.hash);
    if (decoded) {
      setActivePresetId(null);
      setGuardrails((prev) => ({
        ...prev,
        birthYear: decoded.birthYear,
        youthGeography: decoded.youthGeography,
        dementiaStage: decoded.dementiaStage,
      }));
      if (decoded.elderNames.length > 0) {
        setElderClues(
          decoded.elderNames.map((n) => ({ name: n, subtype: 'urn:entity:artist', weight: 10 }))
        );
      }
      if (decoded.grandchildNames.length > 0) {
        setGrandchildSeeds(
          decoded.grandchildNames.map((n) => ({ name: n, subtype: 'urn:entity:artist' }))
        );
      }
      setActiveTab('bridge');
    }
  }, []);

  const runKinshipEngine = useCallback(
    async (
      nextGuardrails: ElderGuardrails,
      nextElder: ElderClueState[],
      nextGrandchild: GrandchildSeedState[],
      nextBoosts: string[],
      nextExcludes: string[]
    ) => {
      const seq = ++requestSeqRef.current;
      const payload = {
        guardrails: nextGuardrails,
        elderClues: nextElder,
        grandchildSeeds: nextGrandchild,
        boostedCueIds: nextBoosts,
        excludedCueIds: nextExcludes,
      };
      try {
        const res = await fetch('/api/kinship-bridge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: KinshipPrescriptionResponse = await res.json();
        if (seq === requestSeqRef.current) setPrescription(json);
      } catch {
        const fallback = await generateKinshipBridge(payload);
        if (seq === requestSeqRef.current) setPrescription(fallback);
      }
    },
    []
  );

  useEffect(() => {
    runKinshipEngine(guardrails, elderClues, grandchildSeeds, boostedCueIds, excludedCueIds);
  }, [guardrails, elderClues, grandchildSeeds, boostedCueIds, excludedCueIds, runKinshipEngine]);

  const handleSelectPreset = (p: FamilyPreset) => {
    setActivePresetId(p.id);
    setGuardrails(p.guardrails);
    setElderClues(resolvePresetElderClues(p));
    setGrandchildSeeds(resolvePresetGrandchildSeeds(p));
    setBoostedCueIds([]);
    setExcludedCueIds([]);
    setSparkLog([]);
  };

  const handleUpdateGuardrails = (patch: Partial<ElderGuardrails>) => {
    setActivePresetId(null);
    setGuardrails((prev) => ({ ...prev, ...patch }));
  };

  const handleToggleElderClue = (seed: CulturalClueSeed) => {
    setActivePresetId(null);
    setElderClues((prev) => {
      const exists = prev.some((c) => c.name === seed.name);
      if (exists) return prev.length > 1 ? prev.filter((c) => c.name !== seed.name) : prev;
      return [...prev, { entity_id: seed.entity_id, name: seed.name, subtype: seed.subtype, weight: 10 }];
    });
  };

  const handleToggleGrandchildSeed = (seed: CulturalClueSeed) => {
    setActivePresetId(null);
    setGrandchildSeeds((prev) => {
      const exists = prev.some((c) => c.name === seed.name);
      if (exists) return prev.length > 1 ? prev.filter((c) => c.name !== seed.name) : prev;
      return [...prev, { entity_id: seed.entity_id, name: seed.name, subtype: seed.subtype }];
    });
  };

  const handleApplyNarrative = async (text: string): Promise<FamilyNarrativeParseResult> => {
    let parsed: FamilyNarrativeParseResult;
    try {
      const r = await fetch('/api/parse-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, currentGuardrails: guardrails }),
      });
      if (!r.ok) throw new Error('offline');
      parsed = await r.json();
    } catch {
      parsed = parseFamilyStoryToKinship(text, guardrails);
    }

    setActivePresetId(null);
    setGuardrails((prev) => ({ ...prev, ...parsed.guardrailPatch }));
    if (parsed.elderClues.length > 0) {
      setElderClues(
        parsed.elderClues.map((c) => ({
          entity_id: c.entity_id,
          name: c.name,
          subtype: c.subtype,
          weight: 10,
        }))
      );
    }
    if (parsed.grandchildSeeds.length > 0) {
      setGrandchildSeeds(
        parsed.grandchildSeeds.map((c) => ({
          entity_id: c.entity_id,
          name: c.name,
          subtype: c.subtype,
        }))
      );
    }
    setBoostedCueIds([]);
    setExcludedCueIds([]);
    return parsed;
  };

  const handleCueReaction = (
    cue: ReminiscenceCue,
    reaction: 'lit_up_sang' | 'calm_soothed' | 'restless_skip',
    lucidQuote?: string
  ) => {
    if (reaction === 'restless_skip') {
      setExcludedCueIds((prev) => Array.from(new Set([...prev, cue.entity_id])));
      setSparkLog((prev) => [
        {
          id: `${Date.now()}`,
          cueId: cue.entity_id,
          cueName: cue.name,
          eraYearPinned: cue.releaseYear,
          reaction,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          qlooUpdateNote: 'Added to filter.exclude.entities to prevent restlessness',
        },
        ...prev,
      ]);
      return;
    }

    // If attaching a lucid quote to the just-logged cue, update or prepend cleanly
    if (lucidQuote) {
      setSparkLog((prev) => {
        const idx = prev.findIndex((p) => p.cueId === cue.entity_id && !p.lucidQuote);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], lucidQuote };
          return copy;
        }
        return [
          {
            id: `${Date.now()}`,
            cueId: cue.entity_id,
            cueName: cue.name,
            eraYearPinned: cue.releaseYear,
            lucidQuote,
            reaction: 'lit_up_sang',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            qlooUpdateNote: 'Saved lucid family memory spark + boosted weight=25',
          },
          ...prev,
        ];
      });
      return;
    }

    const boostWeight = reaction === 'lit_up_sang' ? 25 : 18;
    setBoostedCueIds((prev) => Array.from(new Set([...prev, cue.entity_id])));
    setElderClues((prev) => {
      const filtered = prev.filter((p) => p.entity_id !== cue.entity_id && p.name !== cue.name);
      return [
        { entity_id: cue.entity_id, name: cue.name, subtype: cue.subtype, weight: boostWeight },
        ...filtered,
      ];
    });
    setSparkLog((prev) => [
      {
        id: `${Date.now()}`,
        cueId: cue.entity_id,
        cueName: cue.name,
        eraYearPinned: cue.releaseYear,
        reaction,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        qlooUpdateNote:
          reaction === 'lit_up_sang'
            ? 'Boosted signal.interests.entities weight=25 (Strong MEAM Spark!)'
            : 'Pinned to 4:30 PM Sundowning Calm Anchor (weight=18)',
      },
      ...prev,
    ]);
  };

  const handleSaveKey = async (apiKey: string, baseUrl: string) => {
    try {
      const r = await fetch('/api/qloo-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, baseUrl }),
      });
      if (r.ok) {
        const j = await r.json();
        setQlooStatus(j.qlooStatus);
        runKinshipEngine(guardrails, elderClues, grandchildSeeds, boostedCueIds, excludedCueIds);
      }
    } catch {
      // ignore in standalone viewer
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Heirloom Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-parchment-300 dark:border-vinyl-700 bg-parchment-100/95 dark:bg-vinyl-950/95 backdrop-blur-md no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-plum-600 text-white flex items-center justify-center shadow-sm">
              <Disc3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-xl font-semibold tracking-tight text-stone-900 dark:text-parchment-50">
                  Kinship
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-plum-50 text-plum-700 dark:bg-plum-900/50 dark:text-brass-200 border border-plum-200 dark:border-plum-700">
                  Reminiscence Bump &amp; Family Bridge
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Powered by Qloo Cross-Era Taste Intelligence · Zero Cloud PHI
              </p>
            </div>
          </div>

          {/* 3 Main Tabs */}
          <nav className="flex items-center gap-1 p-1 rounded-2xl bg-parchment-200/80 dark:bg-vinyl-900 border border-parchment-300 dark:border-vinyl-700">
            <button
              type="button"
              onClick={() => setActiveTab('intake')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'intake'
                  ? 'bg-white dark:bg-vinyl-800 text-plum-700 dark:text-brass-200 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>1. Youth Time-Machine</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bridge')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'bridge'
                  ? 'bg-white dark:bg-vinyl-800 text-plum-700 dark:text-brass-200 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>2. Era &amp; Grandkid Bridge</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('passport')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'passport'
                  ? 'bg-white dark:bg-vinyl-800 text-plum-700 dark:text-brass-200 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              <FileHeart className="w-3.5 h-3.5" />
              <span>3. Bedside Care Passport</span>
            </button>
          </nav>

          {/* Right Quick Actions: 4:30 PM Sundowning Rescue + Qloo Trace + Dusk Mode */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSundowningModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-900 hover:bg-amber-950 text-amber-100 text-xs font-semibold shadow-sm"
            >
              <MoonStar className="w-3.5 h-3.5 text-amber-300" />
              <span>4:30 PM Sundowning Rescue</span>
            </button>

            <button
              type="button"
              onClick={() => setTraceDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-900 text-xs font-mono"
              title="Inspect 4-Agent Qloo v2 API Calls"
            >
              <Cpu className="w-3.5 h-3.5 text-plum-600 dark:text-brass-200" />
              <span className="hidden md:inline">Qloo Trace</span>
            </button>

            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              className="p-2 rounded-xl border border-parchment-300 dark:border-vinyl-700 bg-white dark:bg-vinyl-900"
              aria-label="Toggle Evening Low-Glare Mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-stone-700" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-7">
        {prescription && activeTab === 'intake' && (
          <FamilyIntakePanel
            presets={presets}
            activePresetId={activePresetId}
            elderCatalog={elderCatalog}
            grandchildCatalog={grandchildCatalog}
            geographies={geographies}
            guardrails={guardrails}
            bumpWindow={prescription.bumpWindow}
            elderClues={elderClues}
            grandchildSeeds={grandchildSeeds}
            onSelectPreset={handleSelectPreset}
            onUpdateGuardrails={handleUpdateGuardrails}
            onToggleElderClue={handleToggleElderClue}
            onAddCustomElderClue={(name, subtype) => {
              setActivePresetId(null);
              setElderClues((prev) => [...prev, { name, subtype, weight: 10 }]);
            }}
            onRemoveElderClue={(name) =>
              setElderClues((prev) => (prev.length > 1 ? prev.filter((c) => c.name !== name) : prev))
            }
            onToggleGrandchildSeed={handleToggleGrandchildSeed}
            onAddCustomGrandchildSeed={(name, subtype) => {
              setActivePresetId(null);
              setGrandchildSeeds((prev) => [...prev, { name, subtype }]);
            }}
            onRemoveGrandchildSeed={(name) =>
              setGrandchildSeeds((prev) => (prev.length > 1 ? prev.filter((c) => c.name !== name) : prev))
            }
            onSelectCareCircleRole={(role) => {
              setActivePresetId(null);
              setGuardrails((prev) => ({ ...prev, grandchildName: role.visitorLabel }));
              const mapped = role.seedIds
                .map((id) => grandchildCatalog.find((g) => g.entity_id === id))
                .filter((g): g is CulturalClueSeed => Boolean(g))
                .map((g) => ({ entity_id: g.entity_id, name: g.name, subtype: g.subtype }));
              if (mapped.length > 0) setGrandchildSeeds(mapped);
            }}
            onApplyNarrative={handleApplyNarrative}
            onOpenBridgeView={() => setActiveTab('bridge')}
          />
        )}

        {prescription && activeTab === 'bridge' && (
          <ReminiscenceAndBridgeView
            data={prescription}
            sparkLog={sparkLog}
            excludedCount={excludedCueIds.length}
            onResetExcludes={() => setExcludedCueIds([])}
            onCueReaction={handleCueReaction}
          />
        )}

        {prescription && activeTab === 'passport' && (
          <MemoryCarePassportView
            data={prescription}
            cohort={cohort}
            sparkLog={sparkLog}
            elderClues={elderClues}
            grandchildSeeds={grandchildSeeds}
            onOpenTrace={() => setTraceDrawerOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-parchment-300 dark:border-vinyl-700 py-5 px-4 sm:px-6 text-center text-xs text-stone-500 no-print">
        Kinship v3 · Qloo Taste AI™ Agentic Hackathon · Ages 10–30 mPFC Reminiscence Bump, Iso-Principle Entrainment, IDDSI Senior Dining &amp; MCP Server.
      </footer>

      <SundowningRescueModal
        open={sundowningModalOpen}
        onClose={() => setSundowningModalOpen(false)}
        data={prescription}
        onToggleWarmEq={() =>
          setGuardrails((prev) => ({ ...prev, hearingLossWarmEq: !prev.hearingLossWarmEq }))
        }
      />

      <KinshipQlooDrawer
        open={traceDrawerOpen}
        onClose={() => setTraceDrawerOpen(false)}
        trace={prescription?.agentTrace || []}
        reasoningLog={prescription?.agentReasoningLog || []}
        currentGuardrails={guardrails}
        primaryElderClue={elderClues[0]?.name || 'Miriam Makeba'}
        primaryGrandchildSeed={grandchildSeeds[0]?.name || 'Laufey'}
        qlooStatus={qlooStatus}
        onSaveKey={handleSaveKey}
      />
    </div>
  );
};
