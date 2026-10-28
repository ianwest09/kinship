import { ElderGuardrails, McpToolSchema, YouthGeographyId } from '../shared/types.js';
import {
  computeReminiscenceBumpWindow,
  generateKinshipBridge,
  parseFamilyStoryToKinship,
} from './kinshipQlooEngine.js';

export const KINSHIP_MCP_TOOLS: McpToolSchema[] = [
  {
    name: 'reconstruct_reminiscence_bump',
    description:
      'Computes an elder’s neurological ages 10–30 mPFC Reminiscence Bump window and queries Qloo /v2/insights (artist, movie, tv_show) with bias.trends="off" and dementia distress-tag exclusions.',
    qlooEndpointsUsed: [
      'GET /search',
      'GET /v2/insights (filter.release_year, bias.trends=off, filter.exclude.tags)',
      'GET /v2/insights?filter.type=urn:heatmap',
    ],
    inputSchema: {
      type: 'object',
      properties: {
        elderName: { type: 'string', description: 'First name or nickname of elder (zero-PII)' },
        birthYear: { type: 'number', description: 'Birth year (1928–1966)' },
        youthGeography: {
          type: 'string',
          enum: [
            'cape_town',
            'chicago',
            'london',
            'nyc_brooklyn',
            'tokyo',
            'kingston',
            'mumbai',
            'buenos_aires',
          ],
        },
        elderClueName: { type: 'string', description: '1–2 surviving youth artist or film clues' },
      },
      required: ['birthYear', 'youthGeography', 'elderClueName'],
    },
  },
  {
    name: 'bridge_generations_compare',
    description:
      'Runs Qloo GET /v2/analysis/compare + urn:demographics between a grandchild’s modern favorite artist/film and the elder’s youth universe to generate a 15-minute zero-quiz visit playbook.',
    qlooEndpointsUsed: [
      'GET /search',
      'GET /v2/analysis/compare (a.signal vs b.signal)',
      'GET /v2/insights?filter.type=urn:demographics',
    ],
    inputSchema: {
      type: 'object',
      properties: {
        birthYear: { type: 'number' },
        youthGeography: { type: 'string' },
        elderClueName: { type: 'string' },
        grandchildName: { type: 'string' },
        grandchildSeedName: { type: 'string' },
      },
      required: ['birthYear', 'elderClueName', 'grandchildSeedName'],
    },
  },
  {
    name: 'prescribe_iso_sundowning_rescue',
    description:
      'Generates a 3-phase clinical Iso-Principle BPM step-down arc (96 → 76 → 62 BPM) + urn:entity:brand olfactory/tactile triggers and presbycusis warm EQ guardrails for 4:30 PM sundowning agitation.',
    qlooEndpointsUsed: [
      'GET /v2/insights (sundowning safety shield)',
      'GET /v2/insights?filter.type=urn:entity:brand',
    ],
    inputSchema: {
      type: 'object',
      properties: {
        elderName: { type: 'string' },
        birthYear: { type: 'number' },
        youthGeography: { type: 'string' },
        elderClueName: { type: 'string' },
        hearingLossWarmEq: { type: 'boolean' },
      },
      required: ['birthYear', 'youthGeography'],
    },
  },
  {
    name: 'curate_dysphagia_nostalgic_dining',
    description:
      'Pairs Qloo urn:entity:place calm heritage cafés and regional culinary taste tags with IDDSI Levels 4–6 easy-to-chew textures, <52°C scald-safe warmth, statin/donepezil medication safety, and high-contrast plating.',
    qlooEndpointsUsed: [
      'GET /v2/insights?filter.type=urn:entity:place',
      'GET /v2/tags (urn:tag:cuisine)',
    ],
    inputSchema: {
      type: 'object',
      properties: {
        birthYear: { type: 'number' },
        youthGeography: { type: 'string' },
        elderClueName: { type: 'string' },
      },
      required: ['youthGeography'],
    },
  },
  {
    name: 'parse_family_intake_story',
    description:
      'Zero-PII natural-language clinical intake parser converting messy family notes into structured Qloo Reminiscence Bump parameters, circadian shields, and seed entities.',
    qlooEndpointsUsed: ['Local Zero-PII Clinical NLP -> Qloo Parameter Compiler'],
    inputSchema: {
      type: 'object',
      properties: {
        storyText: { type: 'string', description: 'Free-text caregiver or family description' },
      },
      required: ['storyText'],
    },
  },
];

function buildDefaultGuardrails(args: Record<string, unknown>): ElderGuardrails {
  const validGeos: YouthGeographyId[] = [
    'cape_town',
    'chicago',
    'london',
    'nyc_brooklyn',
    'tokyo',
    'kingston',
    'mumbai',
    'buenos_aires',
  ];
  const rawGeo = String(args.youthGeography || 'cape_town') as YouthGeographyId;
  return {
    elderName: String(args.elderName || 'Naledi'),
    birthYear: Number(args.birthYear || 1945),
    youthGeography: validGeos.includes(rawGeo) ? rawGeo : 'cape_town',
    dementiaStage: 'moderate_mid',
    circadianWindow: 'sundowning_calm',
    sundowningSafeShield: true,
    plotFreeMusicalFocus: true,
    hearingLossWarmEq: args.hearingLossWarmEq !== false,
    grandchildName: String(args.grandchildName || 'Lindiwe'),
  };
}

export async function executeKinshipMcpTool(
  toolName: string,
  rawArgs: Record<string, unknown> = {}
) {
  const t0 = Date.now();
  const guardrails = buildDefaultGuardrails(rawArgs);
  const elderClueName = String(rawArgs.elderClueName || 'Miriam Makeba');
  const grandchildSeedName = String(rawArgs.grandchildSeedName || 'Laufey');

  switch (toolName) {
    case 'reconstruct_reminiscence_bump': {
      const bridge = await generateKinshipBridge({
        guardrails,
        elderClues: [{ name: elderClueName, subtype: 'urn:entity:artist', weight: 14 }],
        grandchildSeeds: [{ name: grandchildSeedName, subtype: 'urn:entity:artist' }],
      });
      return {
        protocol: 'mcp/1.0',
        tool: toolName,
        durationMs: Date.now() - t0,
        mode: bridge.mode,
        result: {
          bumpWindow: computeReminiscenceBumpWindow(guardrails.birthYear),
          reconstructedYouthUniverse: bridge.reconstructedYouthUniverse.slice(0, 4),
          hometownHotspots: bridge.hometownHotspots,
          agentReasoningLog: bridge.agentReasoningLog,
        },
      };
    }

    case 'bridge_generations_compare': {
      const bridge = await generateKinshipBridge({
        guardrails,
        elderClues: [{ name: elderClueName, subtype: 'urn:entity:artist', weight: 14 }],
        grandchildSeeds: [{ name: grandchildSeedName, subtype: 'urn:entity:artist' }],
      });
      return {
        protocol: 'mcp/1.0',
        tool: toolName,
        durationMs: Date.now() - t0,
        mode: bridge.mode,
        result: {
          intergenerationalBridge: bridge.intergenerationalBridges[0],
          demographicBridgeProof: bridge.demographicBridgeProof,
          blindLlmComparison: bridge.blindLlmComparison[3],
        },
      };
    }

    case 'prescribe_iso_sundowning_rescue': {
      const bridge = await generateKinshipBridge({
        guardrails,
        elderClues: [{ name: elderClueName, subtype: 'urn:entity:artist', weight: 14 }],
        grandchildSeeds: [{ name: grandchildSeedName, subtype: 'urn:entity:artist' }],
      });
      return {
        protocol: 'mcp/1.0',
        tool: toolName,
        durationMs: Date.now() - t0,
        mode: bridge.mode,
        result: {
          isoPrincipleArc: bridge.isoPrincipleArc,
          sensoryTactileKit: bridge.sensoryTactileKit,
          blockedDistressTraps: bridge.blockedDistressTraps,
        },
      };
    }

    case 'curate_dysphagia_nostalgic_dining': {
      const bridge = await generateKinshipBridge({
        guardrails,
        elderClues: [{ name: elderClueName, subtype: 'urn:entity:artist', weight: 14 }],
        grandchildSeeds: [{ name: grandchildSeedName, subtype: 'urn:entity:artist' }],
      });
      return {
        protocol: 'mcp/1.0',
        tool: toolName,
        durationMs: Date.now() - t0,
        mode: bridge.mode,
        result: {
          seniorDiningPlan: bridge.seniorDiningPlan,
        },
      };
    }

    case 'parse_family_intake_story': {
      const storyText = String(
        rawArgs.storyText ||
          'My 81-year-old grandma Naledi grew up in Cape Town loving Miriam Makeba and gets sundowning anxiety at 4:30 PM; her granddaughter loves Laufey.'
      );
      const parsed = parseFamilyStoryToKinship(storyText, guardrails);
      return {
        protocol: 'mcp/1.0',
        tool: toolName,
        durationMs: Date.now() - t0,
        mode: 'zero_pii_local_parser',
        result: parsed,
      };
    }

    default:
      throw new Error(`Unknown MCP tool: ${toolName}`);
  }
}
