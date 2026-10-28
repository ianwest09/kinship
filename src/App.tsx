import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import {
  Compass,
  Cpu,
  Disc3,
  FileHeart,
  Heart,
  Home as HomeIcon,
  Moon,
  MoonStar,
  Settings,
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
import { HomeView } from './components/HomeView';
import { SplashScreen } from './components/SplashScreen';
import { DiscoverView } from './components/DiscoverView';
import { SharedMomentView } from './components/SharedMomentView';
import { PreferencesView, TextSize } from './components/PreferencesView';
// Home, Discover and Share a moment stay in the entry chunk: they are the first
// journey. Everything below is one tap deeper, so it loads on demand. The entry
// bundle previously carried every screen, both overlays and the offline engine,
// so a first-time visitor on a mid-range phone downloaded all of it before the
// welcome message could appear.
const FamilyIntakePanel = lazy(() =>
  import('./components/FamilyIntakePanel').then((m) => ({ default: m.FamilyIntakePanel }))
);
const ReminiscenceAndBridgeView = lazy(() =>
  import('./components/ReminiscenceAndBridgeView').then((m) => ({
    default: m.ReminiscenceAndBridgeView,
  }))
);
const MemoryCarePassportView = lazy(() =>
  import('./components/MemoryCarePassportView').then((m) => ({ default: m.MemoryCarePassportView }))
);
const OperatorAppendixView = lazy(() =>
  import('./components/OperatorAppendixView').then((m) => ({ default: m.OperatorAppendixView }))
);
const SundowningRescueModal = lazy(() =>
  import('./components/SundowningRescueModal').then((m) => ({ default: m.SundowningRescueModal }))
);
const KinshipQlooDrawer = lazy(() =>
  import('./components/KinshipQlooDrawer').then((m) => ({ default: m.KinshipQlooDrawer }))
);
import { decodeKinshipPassportHash } from './utils/qrAndPassport';
import {
  buildRouteHash,
  combineRouteAndPayload,
  DEFAULT_ROUTE,
  hashHasPassportPayload,
  parseRouteFromHash,
  type RouteId,
} from './utils/routing';

/** Screens double as URL routes, so the type is shared with the router. */
type ActiveTab = RouteId;

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

const TEXT_SIZE_KEY = 'kinship.textSize';
const EVENING_KEY = 'kinship.eveningMode';
const REMEMBER_KEY = 'kinship.remember';
const FAMILY_KEY = 'kinship.family.v1';

/**
 * What a family has typed, kept on their own device.
 *
 * Names, birth years, dementia stage and the quotes people save are sensitive,
 * and a phone in a care home is often shared — so this is opt-in, off by
 * default, and turning it off deletes the record rather than merely hiding it.
 * Without it a refresh, a closed tab or a flat battery threw away everything a
 * tired carer had just typed.
 */
type StoredFamily = {
  guardrails: ElderGuardrails;
  elderClues: ElderClueState[];
  grandchildSeeds: GrandchildSeedState[];
  boostedCueIds: string[];
  excludedCueIds: string[];
  sparkLog: SparkJournalEntry[];
  savedAt: string;
};

function readStoredFamily(): StoredFamily | null {
  if (typeof window === 'undefined') return null;
  try {
    if (window.localStorage.getItem(REMEMBER_KEY) !== 'on') return null;
    const raw = window.localStorage.getItem(FAMILY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredFamily>;
    // Never trust stored JSON to have the shape we wrote: a malformed record
    // must fall back to the sample family, not crash the app on load.
    if (!parsed || typeof parsed !== 'object' || !parsed.guardrails) return null;
    if (typeof parsed.guardrails.elderName !== 'string') return null;
    return {
      guardrails: { ...INITIAL_PRESET.guardrails, ...parsed.guardrails },
      elderClues: Array.isArray(parsed.elderClues) ? parsed.elderClues : [],
      grandchildSeeds: Array.isArray(parsed.grandchildSeeds) ? parsed.grandchildSeeds : [],
      boostedCueIds: Array.isArray(parsed.boostedCueIds) ? parsed.boostedCueIds : [],
      excludedCueIds: Array.isArray(parsed.excludedCueIds) ? parsed.excludedCueIds : [],
      sparkLog: Array.isArray(parsed.sparkLog) ? parsed.sparkLog : [],
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : '',
    };
  } catch {
    return null;
  }
}

function dropStoredFamily() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(FAMILY_KEY);
  } catch {
    /* private mode or a full quota — nothing to delete */
  }
}

/**
 * Primary bottom navigation on phones: four roomy destinations.
 *
 * Five items would give each ~72px at 360px wide, which clips "Preferences".
 * Preferences, Passport and the detailed view stay one tap away from the header
 * and from the Home and Preferences screens, so nothing is orphaned.
 */
const MOBILE_NAV: Array<{ id: ActiveTab; label: string; icon: React.ReactNode }> = [
  { id: 'home', label: 'Home', icon: <HomeIcon className="w-5 h-5" aria-hidden="true" /> },
  { id: 'discover', label: 'Discover', icon: <Compass className="w-5 h-5" aria-hidden="true" /> },
  { id: 'together', label: 'Together', icon: <Heart className="w-5 h-5" aria-hidden="true" /> },
  { id: 'family', label: 'Family', icon: <Users className="w-5 h-5" aria-hidden="true" /> },
];

const DESKTOP_NAV: Array<{ id: ActiveTab; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'discover', label: 'Discover' },
  { id: 'together', label: 'Together' },
  { id: 'family', label: 'Family' },
  { id: 'passport', label: 'Passport' },
  { id: 'settings', label: 'Preferences' },
];

const TAB_TITLES: Record<ActiveTab, string> = {
  home: 'Home',
  discover: 'Discover',
  together: 'Share a moment',
  family: 'Add what you know',
  passport: 'Bedside care passport',
  detail: 'Detailed care view',
  operators: 'Operator and pilot appendix',
  settings: 'Preferences',
};

function readStored<T extends string>(key: string, allowed: readonly T[]): T | null {
  try {
    const value = window.localStorage.getItem(key) as T | null;
    return value && allowed.includes(value) ? value : null;
  } catch {
    return null;
  }
}

export const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = window.localStorage.getItem(EVENING_KEY);
      if (stored === 'on') return true;
      if (stored === 'off') return false;
    } catch {
      /* storage unavailable — fall through to the default */
    }
    return false;
  });
  const [textSize, setTextSize] = useState<TextSize>(
    () => readStored<TextSize>(TEXT_SIZE_KEY, ['normal', 'large', 'largest']) ?? 'normal'
  );
  const [splashOpen, setSplashOpen] = useState(true);
  const [sundowningModalOpen, setSundowningModalOpen] = useState(false);
  const [traceDrawerOpen, setTraceDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window === 'undefined') return DEFAULT_ROUTE;
    const fromHash = parseRouteFromHash(window.location.hash);
    if (fromHash) return fromHash;
    // A printed bedside QR still points at `#kinship=<payload>`; that legacy
    // link keeps landing on the full results view, exactly as before.
    return hashHasPassportPayload(window.location.hash) ? 'detail' : DEFAULT_ROUTE;
  });

  /**
   * Move to a screen and record it in the history stack, so the phone's back
   * button returns to the previous screen instead of leaving Kinship, and a
   * refresh comes back to where the person was.
   */
  const routeRef = useRef<ActiveTab>(activeTab);
  const navigate = useCallback((next: ActiveTab, options?: { replace?: boolean }) => {
    if (routeRef.current === next) return;
    routeRef.current = next;
    setActiveTab(next);
    if (typeof window === 'undefined') return;
    // Keep a copied passport payload in the address bar on the passport screen
    // only, so that URL stays shareable by hand without cluttering every route.
    const url =
      next === 'passport'
        ? combineRouteAndPayload(next, window.location.hash)
        : buildRouteHash(next);
    if (window.location.hash === url) return;
    if (options?.replace) window.history.replaceState(null, '', url);
    else window.history.pushState(null, '', url);
  }, []);

  // Back / forward: follow the URL, and close any overlay so a person who
  // presses back is never left looking at a dialog they cannot get behind.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncFromUrl = () => {
      const fromHash = parseRouteFromHash(window.location.hash);
      const next =
        fromHash ?? (hashHasPassportPayload(window.location.hash) ? 'detail' : DEFAULT_ROUTE);
      routeRef.current = next;
      setActiveTab(next);
      setSundowningModalOpen(false);
      setTraceDrawerOpen(false);
    };
    window.addEventListener('popstate', syncFromUrl);
    window.addEventListener('hashchange', syncFromUrl);
    return () => {
      window.removeEventListener('popstate', syncFromUrl);
      window.removeEventListener('hashchange', syncFromUrl);
    };
  }, []);
  const [focusCue, setFocusCue] = useState<ReminiscenceCue | null>(null);

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

  // Read once, before the first render, so a returning family never sees the
  // sample data flash past before their own appears.
  const [restored] = useState<StoredFamily | null>(() => readStoredFamily());
  const [rememberOnDevice, setRememberOnDevice] = useState<boolean>(
    () => restored !== null
  );
  const [clearedNote, setClearedNote] = useState<string | null>(null);

  const [activePresetId, setActivePresetId] = useState<string | null>(
    restored ? null : INITIAL_PRESET.id
  );
  const [guardrails, setGuardrails] = useState<ElderGuardrails>(
    restored?.guardrails ?? INITIAL_PRESET.guardrails
  );
  const [elderClues, setElderClues] = useState<ElderClueState[]>(() =>
    restored?.elderClues?.length ? restored.elderClues : resolvePresetElderClues(INITIAL_PRESET)
  );
  const [grandchildSeeds, setGrandchildSeeds] = useState<GrandchildSeedState[]>(() =>
    restored?.grandchildSeeds?.length
      ? restored.grandchildSeeds
      : resolvePresetGrandchildSeeds(INITIAL_PRESET)
  );
  const [boostedCueIds, setBoostedCueIds] = useState<string[]>(restored?.boostedCueIds ?? []);
  const [excludedCueIds, setExcludedCueIds] = useState<string[]>(restored?.excludedCueIds ?? []);
  const [sparkLog, setSparkLog] = useState<SparkJournalEntry[]>(restored?.sparkLog ?? []);

  const [qlooStatus, setQlooStatus] = useState({
    connected: false,
    baseUrl: 'https://hackathon.api.qloo.com',
    maskedKey: '',
  });
  const [prescription, setPrescription] = useState<KinshipPrescriptionResponse | null>(null);
  // Set when a request to the Kinship API failed and the offline collection was
  // used instead. Silently swapping in fallback data leaves a family wondering
  // why the suggestions changed, and gives them no way to try again.
  const [engineFailed, setEngineFailed] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try {
      window.localStorage.setItem(EVENING_KEY, darkMode ? 'on' : 'off');
    } catch {
      /* ignore */
    }
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-textsize', textSize);
    try {
      window.localStorage.setItem(TEXT_SIZE_KEY, textSize);
    } catch {
      /* ignore */
    }
  }, [textSize]);

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
      // Preserve the pre-Loam behaviour: a scanned passport lands on the full
      // results view rather than the calm family surfaces. `replace` keeps the
      // scanned link as the first history entry, so one back press still leaves
      // the page instead of bouncing between two identical states.
      navigate('detail', { replace: true });
    }
  }, []);

  // Return to the top when changing screen, so a new destination never opens
  // half-scrolled.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);

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
        if (seq === requestSeqRef.current) {
          setPrescription(json);
          setEngineFailed(false);
        }
      } catch {
        // Deliberate fallback, not a hidden one: the notice below tells the
        // family which collection they are looking at and offers a retry.
        // Imported here rather than at module scope so the engine only reaches
        // the browser when the API is genuinely unavailable.
        const { generateKinshipBridge: generateOffline } = await import(
          '../server/kinshipQlooEngine'
        );
        const fallback = await generateOffline(payload);
        if (seq === requestSeqRef.current) {
          setPrescription(fallback);
          setEngineFailed(true);
        }
      }
    },
    []
  );

  useEffect(() => {
    runKinshipEngine(guardrails, elderClues, grandchildSeeds, boostedCueIds, excludedCueIds);
    // reloadToken lets the retry button re-run without any other input changing.
  }, [
    guardrails,
    elderClues,
    grandchildSeeds,
    boostedCueIds,
    excludedCueIds,
    reloadToken,
    runKinshipEngine,
  ]);

  // Save as the family types, so an interrupted session is not a lost one.
  // Writing is skipped entirely when the switch is off, and switching off
  // deletes what is already there.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(REMEMBER_KEY, rememberOnDevice ? 'on' : 'off');
    } catch {
      /* ignore */
    }
    if (!rememberOnDevice) {
      dropStoredFamily();
      return;
    }
    try {
      const record: StoredFamily = {
        guardrails,
        elderClues,
        grandchildSeeds,
        boostedCueIds,
        excludedCueIds,
        sparkLog,
        savedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(FAMILY_KEY, JSON.stringify(record));
    } catch {
      /* quota or private mode — the session still works, it just will not persist */
    }
  }, [
    rememberOnDevice,
    guardrails,
    elderClues,
    grandchildSeeds,
    boostedCueIds,
    excludedCueIds,
    sparkLog,
  ]);

  /** Delete everything Kinship has written on this device, and say so. */
  const handleClearDeviceData = useCallback(() => {
    dropStoredFamily();
    try {
      window.localStorage.removeItem(REMEMBER_KEY);
    } catch {
      /* ignore */
    }
    setRememberOnDevice(false);
    setActivePresetId(INITIAL_PRESET.id);
    setGuardrails(INITIAL_PRESET.guardrails);
    setElderClues(resolvePresetElderClues(INITIAL_PRESET));
    setGrandchildSeeds(resolvePresetGrandchildSeeds(INITIAL_PRESET));
    setBoostedCueIds([]);
    setExcludedCueIds([]);
    setSparkLog([]);
    setClearedNote('Cleared. Nothing is stored on this device now.');
  }, []);

  const handleToggleRemember = useCallback(() => {
    setRememberOnDevice((on) => {
      if (on) dropStoredFamily();
      setClearedNote(null);
      return !on;
    });
  }, []);

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
      const { parseFamilyStoryToKinship: parseOffline } = await import(
        '../server/kinshipQlooEngine'
      );
      parsed = parseOffline(text, guardrails);
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

  /**
   * Put a set-aside suggestion back. Setting something aside is meant to be
   * consequence-free, and a mis-tap on a phone is easy; without this the only
   * way back was a reset buried in the detailed care view.
   */
  const handleUndoCueReaction = (cue: ReminiscenceCue) => {
    setExcludedCueIds((prev) => prev.filter((id) => id !== cue.entity_id));
    setSparkLog((prev) => prev.filter((entry) => entry.cueId !== cue.entity_id));
  };

  const openTogetherWith = (cue: ReminiscenceCue | null) => {
    setFocusCue(cue);
    navigate('together');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#kinship-main" className="loam-skip-link">
        Skip to content
      </a>

      {/* Header — approved Kinship identity preserved: Disc3 mark + Fraunces
          wordmark, retuned from plum to Loam sage. */}
      <header className="sticky top-0 z-30 border-b border-parchment-300 dark:border-vinyl-700 bg-parchment-100/95 dark:bg-vinyl-950/95 backdrop-blur-md no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="flex items-center gap-3 rounded-2xl -ml-1 pl-1 pr-2 py-1 text-left hover:bg-parchment-200/70 dark:hover:bg-vinyl-900 transition-colors"
            aria-label="Kinship — go to home"
          >
            <img
              src="/kinship-mark.png"
              alt=""
              aria-hidden="true"
              draggable={false}
              className="w-10 h-10 md:w-11 md:h-11 shrink-0 select-none"
            />
            <span className="min-w-0">
              <span className="loam-wordmark block text-[1.6rem] md:text-[1.8rem] text-loam-ink dark:text-parchment-50">
                kinship
              </span>
              <span className="hidden sm:block text-xs md:text-sm text-loam-muted dark:text-loam-muted-dark leading-tight">
                Familiar music &amp; films to share
              </span>
            </span>
          </button>

          {/* Desktop navigation */}
          <nav
            aria-label="Main"
            className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-parchment-200/70 dark:bg-vinyl-900 border border-parchment-300 dark:border-vinyl-700"
          >
            {DESKTOP_NAV.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-loam-card dark:bg-vinyl-800 text-plum-700 dark:text-plum-300 shadow-soft'
                      : 'text-loam-body dark:text-loam-muted-dark hover:text-loam-ink dark:hover:text-parchment-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSundowningModalOpen(true)}
              className="hidden lg:inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brass-600 hover:bg-brass-700 text-white text-sm font-semibold shadow-soft transition-colors"
            >
              <MoonStar className="w-4 h-4" aria-hidden="true" />
              <span>Settling sounds</span>
            </button>

            <button
              type="button"
              onClick={() => setTraceDrawerOpen(true)}
              className="hidden md:inline-flex items-center gap-2 px-3 py-2.5 rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-loam-card dark:bg-vinyl-900 text-sm font-medium text-loam-body dark:text-loam-body-dark hover:border-plum-400 transition-colors"
              title="Inspect the Qloo API calls behind these suggestions"
            >
              <Cpu className="w-4 h-4 text-plum-600 dark:text-plum-300" aria-hidden="true" />
              <span className="hidden lg:inline">Qloo trace</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('settings')}
              className="md:hidden p-2.5 rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-loam-card dark:bg-vinyl-900 hover:border-plum-400 transition-colors"
              aria-label="Preferences and accessibility"
              aria-current={activeTab === 'settings' ? 'page' : undefined}
            >
              <Settings
                className={`w-5 h-5 ${
                  activeTab === 'settings'
                    ? 'text-plum-600 dark:text-plum-300'
                    : 'text-loam-body dark:text-loam-body-dark'
                }`}
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              className="p-2.5 rounded-2xl border border-parchment-300 dark:border-vinyl-700 bg-loam-card dark:bg-vinyl-900 hover:border-plum-400 transition-colors"
              aria-label={darkMode ? 'Switch to day mode' : 'Switch to evening mode'}
              aria-pressed={darkMode}
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-brass-500" aria-hidden="true" />
              ) : (
                <Moon className="w-5 h-5 text-loam-body" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main
        id="kinship-main"
        className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-8 md:pb-12"
      >
        <Suspense fallback={<ScreenLoading label="Opening…" />}>
        <h1 className="sr-only">{TAB_TITLES[activeTab]}</h1>

        {/* Data provenance. Qloo's SAFE_USE guidance requires a result to be
            visibly distinguished from Kinship's own interpretation, so this
            stays on every screen — but as one line with the detail behind a
            disclosure. Four lines of API language above the welcome message
            meant a first-time reader met the plumbing before the purpose. */}
        {prescription && (
          <details
            className={`loam-provenance mb-6 no-print ${
              prescription.mode === 'live_qloo_api' ? 'is-live' : 'is-offline'
            }`}
          >
            <summary className="loam-provenance-summary">
              <span
                aria-hidden="true"
                className={`loam-provenance-dot ${
                  prescription.mode === 'live_qloo_api' ? 'bg-pine-500' : 'bg-brass-500'
                }`}
              />
              <span className="font-semibold">
                {prescription.mode === 'live_qloo_api'
                  ? 'Live Qloo Taste AI™'
                  : 'Kinship’s own collection — Qloo is not connected'}
              </span>
              <span className="loam-provenance-hint">
                {prescription.mode === 'live_qloo_api'
                  ? 'Where these suggestions came from'
                  : 'Why these suggestions are not Qloo results'}
              </span>
            </summary>
            <div className="loam-provenance-body text-sm md:text-base leading-relaxed">
              {prescription.mode === 'live_qloo_api' ? (
                <p>
                  These suggestions were returned by the Qloo API for this
                  request. They describe what people of a similar age and place
                  tended to enjoy — not predictions about any individual.
                </p>
              ) : (
                <p>
                  These suggestions come from Kinship’s own curated collection,{' '}
                  <em>not</em> from the Qloo API. They exist so every workflow can
                  be explored without a credential, and must not be read as Qloo
                  output. Set{' '}
                  <code className="font-mono text-[0.9em]">QLOO_API_KEY</code>{' '}
                  server-side for live results.
                </p>
              )}
              {engineFailed && (
                <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="font-semibold text-clay-700 dark:text-clay-300">
                    The request to Kinship did not complete, so this is the
                    offline collection.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEngineFailed(false);
                      setReloadToken((t) => t + 1);
                    }}
                    className="loam-btn-secondary px-4 py-2 text-sm md:text-base"
                  >
                    <span>Try again</span>
                  </button>
                </p>
              )}
            </div>
          </details>
        )}

        {activeTab === 'home' && (
          <HomeView
            guardrails={guardrails}
            bumpWindow={prescription?.bumpWindow ?? null}
            ready={Boolean(prescription)}
            onExplore={() => navigate('discover')}
            onOpenTogether={() => navigate('together')}
            onOpenFamily={() => navigate('family')}
            onOpenPassport={() => navigate('passport')}
            onOpenRescue={() => setSundowningModalOpen(true)}
          />
        )}

        {prescription && activeTab === 'discover' && (
          <DiscoverView
            data={prescription}
            onListenTogether={openTogetherWith}
            onNotForUs={(cue) => handleCueReaction(cue, 'restless_skip')}
            onUndoNotForUs={handleUndoCueReaction}
            onOpenDetail={() => navigate('detail')}
          />
        )}

        {prescription && activeTab === 'together' && (
          <SharedMomentView
            data={prescription}
            focusCue={focusCue}
            warmEq={Boolean(guardrails.hearingLossWarmEq)}
            onCueReaction={handleCueReaction}
            onOpenRescue={() => setSundowningModalOpen(true)}
            onBackToDiscover={() => navigate('discover')}
          />
        )}

        {prescription && activeTab === 'family' && (
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
            onOpenBridgeView={() => navigate('discover')}
          />
        )}

        {prescription && activeTab === 'detail' && (
          <ReminiscenceAndBridgeView
            data={prescription}
            sparkLog={sparkLog}
            excludedCount={excludedCueIds.length}
            onResetExcludes={() => setExcludedCueIds([])}
            onCueReaction={handleCueReaction}
            onOpenSharedMoment={openTogetherWith}
          />
        )}

        {prescription && activeTab === 'passport' && (
          <MemoryCarePassportView
            data={prescription}
            sparkLog={sparkLog}
            elderClues={elderClues}
            grandchildSeeds={grandchildSeeds}
            onOpenTrace={() => setTraceDrawerOpen(true)}
            onOpenOperators={() => navigate('operators')}
          />
        )}

        {/* Operator and reviewer material. Needs no engine result, so it is
            available even while suggestions are still loading. */}
        {activeTab === 'operators' && (
          <OperatorAppendixView
            cohort={cohort}
            onOpenTrace={() => setTraceDrawerOpen(true)}
            onOpenPassport={() => navigate('passport')}
          />
        )}

        {activeTab === 'settings' && (
          <PreferencesView
            onOpenOperators={() => navigate('operators')}
            rememberOnDevice={rememberOnDevice}
            onToggleRemember={handleToggleRemember}
            onClearDeviceData={handleClearDeviceData}
            clearedNote={clearedNote}
            textSize={textSize}
            onTextSizeChange={setTextSize}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode((d) => !d)}
            guardrails={guardrails}
            onUpdateGuardrails={handleUpdateGuardrails}
            qlooStatus={qlooStatus}
            onOpenTrace={() => setTraceDrawerOpen(true)}
            onOpenDetail={() => navigate('detail')}
            onOpenPassport={() => navigate('passport')}
          />
        )}

        {/* Loading state — calm, no spinner urgency, no countdown. */}
        {!prescription &&
          activeTab !== 'home' &&
          activeTab !== 'settings' &&
          activeTab !== 'operators' && (
          <div className="loam-card p-8 md:p-10 text-center" role="status">
            <Disc3 className="w-8 h-8 mx-auto text-plum-400 animate-pulse" aria-hidden="true" />
            <p className="mt-4 text-lg md:text-xl font-serif text-loam-ink dark:text-parchment-50">
              Getting things ready…
            </p>
            <p className="mt-2 text-base text-loam-body dark:text-loam-body-dark">
              This usually takes a moment. You can go to{' '}
              <button
                type="button"
                onClick={() => navigate('home')}
                className="font-semibold underline decoration-plum-400 underline-offset-4 hover:decoration-plum-600"
              >
                Home
              </button>{' '}
              while it works.
            </p>
          </div>
        )}
        </Suspense>
      </main>

      {/* Footer. Visible at every width — the clinical and provenance
          disclaimer must not be hidden on the phone people actually use. The
          extra bottom padding clears the fixed mobile navigation. */}
      <footer className="border-t border-parchment-300 dark:border-vinyl-700 py-6 pb-28 md:pb-6 px-4 sm:px-6 text-center text-sm text-loam-body dark:text-loam-muted-dark space-y-4 no-print">
        <div className="flex items-center justify-center gap-2.5">
          <img
            src="/kinship-mark.png"
            alt=""
            aria-hidden="true"
            draggable={false}
            className="w-8 h-8 select-none"
          />
          <span className="loam-wordmark text-xl text-loam-ink dark:text-parchment-100">
            kinship
          </span>
        </div>
        <p className="max-w-3xl mx-auto leading-relaxed">
          <strong className="font-semibold text-loam-ink dark:text-parchment-100">
            Educational prompts only — not medical advice.
          </strong>{' '}
          Sundowning, Iso-Principle, IDDSI texture, serving-temperature and
          medication-interaction suggestions are general educational prompts. They are
          not individualised clinical guidance and must not replace assessment by a
          clinician, dietitian or speech-and-language therapist. Qloo results describe
          aggregate cultural affinities; they are not evidence about any individual’s
          identity, health or behaviour. Kinship persists no personal data and sends no
          names, birth years or health information to Qloo.
        </p>
        <p className="text-xs md:text-sm text-loam-muted dark:text-loam-muted-dark">
          Kinship v3 · Qloo Taste AI™ Agentic Hackathon · MIT licensed
        </p>
      </footer>

      {/* Mobile bottom navigation — thumb-reachable, above the gesture bar. */}
      <nav
        aria-label="Main"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-parchment-300 dark:border-vinyl-700 bg-parchment-50/98 dark:bg-vinyl-900/98 backdrop-blur-md pb-safe no-print"
      >
        <ul className="grid grid-cols-4">
          {MOBILE_NAV.map((item) => {
            const active = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => navigate(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`w-full flex flex-col items-center justify-center gap-1 pt-2.5 pb-2 text-xs leading-tight font-semibold transition-colors ${
                    active
                      ? 'text-plum-700 dark:text-plum-300'
                      : 'text-loam-muted dark:text-loam-muted-dark'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex items-center justify-center w-9 h-7 rounded-full transition-colors ${
                      active ? 'bg-plum-100 dark:bg-vinyl-700' : ''
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* The splash sits outside every Suspense boundary on purpose. Both
          overlays are lazy, and a boundary around them would make the very
          first thing a visitor sees wait on a chunk it has no use for — on a
          mid-range phone over mobile data that is a visible delay before the
          app can even introduce itself. */}
      {splashOpen && (
        <SplashScreen darkMode={darkMode} onDone={() => setSplashOpen(false)} />
      )}

      {/* Each overlay mounts only when it is opened, so neither chunk is
          fetched on first load. Both stop their own sound on unmount. */}
      {sundowningModalOpen && (
        <Suspense fallback={null}>
          <SundowningRescueModal
            open
            onClose={() => setSundowningModalOpen(false)}
            data={prescription}
            onToggleWarmEq={() =>
              setGuardrails((prev) => ({ ...prev, hearingLossWarmEq: !prev.hearingLossWarmEq }))
            }
          />
        </Suspense>
      )}

      {traceDrawerOpen && (
        <Suspense fallback={null}>
          <KinshipQlooDrawer
            open
            onClose={() => setTraceDrawerOpen(false)}
            trace={prescription?.agentTrace || []}
            reasoningLog={prescription?.agentReasoningLog || []}
            currentGuardrails={guardrails}
            primaryElderClue={elderClues[0]?.name || 'Miriam Makeba'}
            primaryGrandchildSeed={grandchildSeeds[0]?.name || 'Laufey'}
            qlooStatus={qlooStatus}
          />
        </Suspense>
      )}
    </div>
  );
};

/**
 * Fallback while a screen chunk arrives. Plain text on purpose: no spinner, no
 * progress bar, nothing that implies a countdown.
 */
const ScreenLoading: React.FC<{ label: string }> = ({ label }) => (
  <div className="loam-card p-8 md:p-10 text-center" role="status">
    <p className="text-lg md:text-xl font-serif text-loam-ink dark:text-parchment-50">{label}</p>
  </div>
);
