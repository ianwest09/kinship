export type QlooEntitySubtype =
  | 'urn:entity:artist'
  | 'urn:entity:movie'
  | 'urn:entity:tv_show'
  | 'urn:entity:book'
  | 'urn:entity:brand'
  | 'urn:entity:place';

export interface ReminiscenceVector {
  melodicWarmth: number;
  orchestralLushness: number;
  brassRhythmGroove: number;
  storytellingLyricism: number;
  musicalTheaterJoy: number;
  gentleVisualHumor: number;
  hearthCraftDomestic: number;
  spiritualRootedness: number;
}

export type YouthGeographyId =
  | 'cape_town'
  | 'chicago'
  | 'london'
  | 'nyc_brooklyn'
  | 'tokyo'
  | 'kingston'
  | 'mumbai'
  | 'buenos_aires';

export type DementiaStageId = 'early_mild' | 'moderate_mid' | 'late_sensory';

export type CircadianWindowId = 'morning_spark' | 'afternoon_bridge' | 'sundowning_calm';

export interface ElderGuardrails {
  elderName: string;
  birthYear: number; // e.g. 1932..1966 -> Reminiscence Bump = [birthYear+10, birthYear+30]
  youthGeography: YouthGeographyId; // maps to signal.location.query
  dementiaStage: DementiaStageId;
  circadianWindow: CircadianWindowId;
  sundowningSafeShield: boolean; // maps to filter.content_rating=G,PG,TV-G & filter.exclude.tags=horror,war,peril
  plotFreeMusicalFocus: boolean; // shifts moderate/late stage away from complex dialogue plots toward song, visual rhythm & craft
  hearingLossWarmEq?: boolean; // Presbycusis filter: favors warm contralto/baritone/cello & rolls off >3.2 kHz harshness
  preferredLanguage?: string; // BCP-47 language used by browser-local spoken instructions
  /** Optional identity context used only to make invitations and handovers more personal. */
  elderGenderIdentity?: string;
  elderNationality?: string;
  caregiverName?: string;
  caregiverAge?: number;
  caregiverGenderIdentity?: string;
  caregiverRelationship?: string;
  caregiverNationality?: string;
  grandchildName: string;
}

export interface CulturalClueSeed {
  entity_id: string;
  name: string;
  subtype: QlooEntitySubtype;
  year: number;
  originLabel: string;
  generationRole: 'elder_clue' | 'grandchild_seed';
  tags: string[];
  tagLabels: string[];
  weight: number;
  vector: ReminiscenceVector;
}

export interface ExplainabilitySlice {
  seed_entity_id: string;
  seed_name: string;
  seed_subtype: QlooEntitySubtype;
  normalized_score: number;
}

export interface ReminiscenceBumpWindow {
  birthYear: number;
  currentAge: number;
  bumpStartYear: number; // age 10
  bumpEndYear: number; // age 30
  peakStartYear: number; // age 13
  peakEndYear: number; // age 24
  lifeDecades: Array<{
    ageRange: string;
    yearsLabel: string;
    mpfcRetentionPct: number; // Neurological medial prefrontal cortex retention curve
    isReminiscenceBump: boolean;
    isPeakBump: boolean;
  }>;
}

export interface ReminiscenceCue {
  entity_id: string;
  name: string;
  subtype: QlooEntitySubtype;
  categoryBadge: string;
  releaseYear: number;
  elderAgeAtRelease: number;
  contentRating: string;
  tempoBpmLabel: string;
  mpfcSalienceScore: number; // 0..100
  affinity: number; // 0..1
  sundowningSafe: boolean;
  presbycusisSafe?: boolean; // Rich 150-800 Hz fundamental, low high-frequency sibilance
  plotComplexity: 'zero_plot_musical' | 'gentle_episodic' | 'light_narrative';
  whyBrainRemembers: string;
  dontQuizWarning: string;
  sensoryInvitationPrompt: string;
  tagLabels: string[];
  explainability: ExplainabilitySlice[];
  source?: 'live_qloo_api' | 'verified_cultural_twin';
}

export interface IsoPrinciplePhase {
  phase: 1 | 2 | 3;
  minuteRange: string;
  phaseTitle: string;
  targetBpm: number;
  clinicalMechanism: string;
  cueName: string;
  cueYear: number;
  elderAgeThen: number;
  whisperPrompt: string;
}

export interface SensoryTactileTrigger {
  entity_id: string;
  name: string;
  subtype: 'urn:entity:brand';
  modality: 'Olfactory (Scent)' | 'Gustatory (Tea & Hearth)' | 'Procedural Touch';
  eraContext: string;
  neuralPathway: string; // e.g. "Olfactory Bulb → Amygdala / Entorhinal Cortex (Thalamus-Bypass)"
  fiveDollarAction: string;
  zeroQuizInvitation: string;
  affinityPct: number;
  source?: 'live_qloo_api' | 'verified_cultural_twin';
}

export interface SeniorDiningPrescription {
  dishName: string;
  culinaryHeritageTag: string;
  iddsiLevelLabel: string; // IDDSI Levels 4-6 Easy-to-Chew / Soft & Moist
  thermalAndMedSafety: string; // Low-scald (<52C), statin/AChEI safe, high-contrast plate (+28% intake)
  calmVenue: {
    entity_id: string;
    name: string;
    subtype: 'urn:entity:place';
    quietHoursWindow: string;
    acousticComfortNote: string;
    affinityPct: number;
    source: 'live_qloo_api' | 'verified_cultural_twin';
  };
  sensoryTableInvitation: string;
}

export interface BlindLlmComparisonRow {
  dimension: string;
  blindLlmGuess: string;
  whyBlindLlmFails: string;
  qlooTasteAiResult: string;
  qlooApiMechanism: string;
}

export interface AgentReasoningStep {
  iteration: number;
  phase: 'OBSERVE' | 'TOOL_CALL' | 'AUDIT_SELF_CORRECT' | 'SYNTHESIZE';
  thought: string;
  toolName: string;
  observation: string;
  selfCorrected?: boolean;
}

export interface McpToolSchema {
  name: string;
  description: string;
  qlooEndpointsUsed: string[];
  inputSchema: Record<string, unknown>;
}

export interface CareCircleRolePreset {
  id: string;
  visitorLabel: string;
  relationshipBadge: string;
  seedIds: string[];
  quickContext: string;
}

export interface BlockedDistressTrap {
  entity_id: string;
  name: string;
  releaseYear: number;
  categoryLabel: string;
  rawEraAffinity: number;
  distressTrigger: string;
  qlooFilterTriggered: string;
  clinicalWhyBlocked: string;
}

export interface IntergenerationalBridge {
  bridge_id: string;
  grandchildSeedName: string;
  grandchildSeedYear: number;
  grandchildSubtype: QlooEntitySubtype;
  elderAnchorName: string;
  elderAnchorYear: number;
  elderAgeThen: number;
  elderSubtype: QlooEntitySubtype;
  overlapPct: number; // from GET /v2/analysis/compare
  sharedTags: Array<{
    tag_id: string;
    label: string;
    elderAffinity: number;
    grandchildAffinity: number;
  }>;
  sharedDnaHeadline: string;
  harmonicExplanation: string;
  threeStepPlaybook: [string, string, string];
  zeroQuizBridgeQuestion: string;
}

export interface DemographicSkewBand {
  ageBucket: '24_and_younger' | '25_to_29' | '30_to_34' | '35_to_44' | '45_to_54' | '55_and_older';
  label: string;
  elderClueSkew: number; // -1.0 .. +1.0 from GET /v2/insights?filter.type=urn:demographics
  grandchildSeedSkew: number; // -1.0 .. +1.0
}

export interface HometownMemoryHotspot {
  geohash: string;
  districtName: string;
  culturalLandmarkNote: string;
  affinityRank: number; // 0..1 from GET /v2/insights?filter.type=urn:heatmap
  popularity: number; // 0..1
  sensoryPlacePrompt: string;
}

export interface AgentTraceItem {
  stepNumber: 1 | 2 | 3 | 4 | 5;
  agentName: string;
  purpose: string;
  method: 'GET' | 'POST';
  endpoint: string;
  params: Record<string, string>;
  durationMs: number;
  mode: 'live_qloo_api' | 'verified_cultural_twin';
  summary: string;
}

export interface KinshipPrescriptionResponse {
  generatedAt: string;
  mode: 'live_qloo_api' | 'verified_cultural_twin';
  qlooHost: string;
  geographyInfo: {
    id: YouthGeographyId;
    name: string;
    country: string;
    eraCulturalPortrait: string;
    radioMemoryNote: string;
  };
  bumpWindow: ReminiscenceBumpWindow;
  guardrailsApplied: ElderGuardrails;
  resolvedElderClues: CulturalClueSeed[];
  resolvedGrandchildSeeds: CulturalClueSeed[];
  inferredYouthTags: Array<{ tag_id: string; label: string; score: number }>;
  reconstructedYouthUniverse: ReminiscenceCue[];
  sundowningSafePlaylist: ReminiscenceCue[];
  isoPrincipleArc: [IsoPrinciplePhase, IsoPrinciplePhase, IsoPrinciplePhase];
  sensoryTactileKit: SensoryTactileTrigger[];
  seniorDiningPlan: SeniorDiningPrescription;
  blindLlmComparison: BlindLlmComparisonRow[];
  agentReasoningLog: AgentReasoningStep[];
  blockedDistressTraps: BlockedDistressTrap[];
  intergenerationalBridges: IntergenerationalBridge[];
  demographicBridgeProof: DemographicSkewBand[];
  hometownHotspots: HometownMemoryHotspot[];
  agentTrace: AgentTraceItem[];
}

export interface FamilyPreset {
  id: string;
  badge: string;
  elderTitle: string;
  grandchildTitle: string;
  storyQuote: string;
  guardrails: ElderGuardrails;
  elderClueIds: string[];
  grandchildSeedIds: string[];
}

export interface SparkJournalEntry {
  id: string;
  timestamp: string;
  cueId: string;
  cueName: string;
  eraYearPinned?: number;
  lucidQuote?: string;
  /** Caregiver-authored note saved with this specific connection moment. */
  personalNotes?: string;
  /** A local snapshot keeps this exact activity available when recommendations change or the device is offline. */
  cueSnapshot?: ReminiscenceCue;
  reaction: 'lit_up_sang' | 'calm_soothed' | 'restless_skip';
  qlooUpdateNote: string;
}

export interface SavedCareProfile {
  id: string;
  label: string;
  guardrails: ElderGuardrails;
  elderClues: Array<{ entity_id?: string; name: string; subtype: QlooEntitySubtype; weight: number }>;
  grandchildSeeds: Array<{ entity_id?: string; name: string; subtype: QlooEntitySubtype }>;
  boostedCueIds: string[];
  excludedCueIds: string[];
  sparkLog: SparkJournalEntry[];
  momentReflections: Array<{
    cueKey: string;
    cueName: string;
    releaseYear?: number;
    comfort: number;
    note: string;
    savedAt: string;
  }>;
  savedAt: string;
}

export interface FamilyNarrativeParseResult {
  rawText: string;
  summary: string;
  guardrailPatch: Partial<ElderGuardrails>;
  elderClues: Array<{ entity_id?: string; name: string; subtype: QlooEntitySubtype; year?: number }>;
  grandchildSeeds: Array<{ entity_id?: string; name: string; subtype: QlooEntitySubtype; year?: number }>;
  receipts: Array<{ parameter: string; value: string; reason: string }>;
}

export interface CareHomeCohortRecord {
  residentToken: string;
  stageLabel: string;
  birthYear: number;
  youthOrigin: string;
  sundowningEpisodesBeforeWk: number;
  sundowningEpisodesNowWk: number;
  familyVisitMinutesAvg: [number, number];
  primarySparkAnchor: string;
  grandkidBridgeUsed: string;
}
