/**
 * Honesty and hygiene guards.
 *
 * These tests exist because the product shipped claims that the code cannot
 * support: fabricated clinical outcome percentages, a compliance certification,
 * a per-resident price and an ARR model — all inside the printable bedside care
 * sheet — plus pseudo-neuroscience labels ("mPFC salience", "proven sedative")
 * in caregiver-facing copy.
 *
 * They are deliberately blunt source scans. Their job is to make those specific
 * mistakes fail CI rather than to review prose.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const CAREGIVER_SURFACES = [
  'src/components/HomeView.tsx',
  'src/components/ExampleFamilyNote.tsx',
  'src/components/DiscoverView.tsx',
  'src/components/SharedMomentView.tsx',
  'src/components/PreferencesView.tsx',
  'src/components/FamilyIntakePanel.tsx',
  'src/components/MemoryCarePassportView.tsx',
  'src/components/SplashScreen.tsx',
];

const ALL_SOURCE = [
  ...CAREGIVER_SURFACES,
  'src/App.tsx',
  'src/components/ReminiscenceAndBridgeView.tsx',
  'src/components/SundowningRescueModal.tsx',
  'src/components/KinshipQlooDrawer.tsx',
  'src/components/OperatorAppendixView.tsx',
  'server/kinshipQlooEngine.ts',
  'server/reminiscenceGraph.ts',
  'server/mcpTools.ts',
  'server/apiRouter.ts',
];

async function readAll(paths: string[]): Promise<Array<[string, string]>> {
  return Promise.all(paths.map(async (p) => [p, await readFile(p, 'utf8')] as [string, string]));
}

test('no fabricated outcome statistics, pricing or compliance claims on care screens', async () => {
  const banned = [
    'agitation episodes',
    'spontaneous smile',
    'ROI',
    'ARR',
    '$14',
    'SaaS',
    'Medicare',
    'HIPAA',
    'POPIA',
    'GDPR',
    'MMSE',
    'Zero Cloud PII',
    'zero-PII',
    'Zero-PII',
    'MC-204-ANON',
  ];
  for (const [file, src] of await readAll(CAREGIVER_SURFACES)) {
    for (const phrase of banned) {
      assert.ok(!src.includes(phrase), `${file} contains "${phrase}"`);
    }
  }
});

test('pseudo-clinical vocabulary is gone from the whole codebase', async () => {
  const banned = ['mPFC', 'dorsal medial', 'Proven Sedative', 'Thalamus-Bypass', '250M+'];
  for (const [file, src] of await readAll(ALL_SOURCE)) {
    for (const phrase of banned) {
      assert.ok(!src.includes(phrase), `${file} contains "${phrase}"`);
    }
  }
});

test('no screen promises an emotional or medical outcome', async () => {
  const banned = [
    'clinically proven',
    'guarantee',
    'cures dementia',
    'prevents dementia',
    'keeps them calm',
    'calm and smiling',
  ];
  for (const [file, src] of await readAll(ALL_SOURCE)) {
    for (const phrase of banned) {
      assert.ok(
        !src.toLowerCase().includes(phrase.toLowerCase()),
        `${file} contains "${phrase}"`
      );
    }
  }
});

test('operator material is labelled as a model wherever it lives', async () => {
  const src = await readFile('src/components/OperatorAppendixView.tsx', 'utf8');
  assert.match(src, /Illustrative model — not measured results/);
  assert.match(src, /Demo cohort \(fictional\)/);
  assert.match(src, /no claim of HIPAA, POPIA or GDPR certification/);
});

test('nothing autoplays and no commercial playback is claimed as built in', async () => {
  for (const [file, src] of await readAll(ALL_SOURCE)) {
    assert.ok(!/<audio/i.test(src), `${file} embeds an <audio> element`);
    // The attribute, not the word: copy in the detailed view legitimately warns
    // that unguarded "oldies" playlists autoplay loud ads.
    assert.ok(!/autoPlay=|autoplay=/i.test(src), `${file} sets an autoplay attribute`);
  }

  // Streaming services may only appear as outbound links. Kinship holds no
  // licence and streams nothing itself, so an in-app player claiming otherwise
  // would be a false capability.
  const detail = await readFile('src/components/ReminiscenceAndBridgeView.tsx', 'utf8');
  const launchers = detail.match(/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*?<\/a>/g) ?? [];
  const named = launchers.filter((a) => /Spotify|Apple Music/.test(a));
  assert.ok(named.length >= 2, 'expected the outbound search links to still be present');
  for (const link of named) {
    assert.match(link, /target="_blank"/, 'a streaming link must leave the app');
    assert.match(link, /rel="noopener noreferrer"/);
    assert.match(link, /https:\/\/(open\.spotify\.com|music\.apple\.com)/);
  }
  // Sound is generated locally and always starts from an explicit tap.
  const player = await readFile('src/utils/harmonicPlayer.ts', 'utf8');
  assert.match(player, /new AudioCtx\(\)/);
  assert.match(player, /export function stopHarmonicPreview/);
});

test('the API never exposes the credential it uses', async () => {
  const router = await readFile('server/apiRouter.ts', 'utf8');
  const engine = await readFile('server/kinshipQlooEngine.ts', 'utf8');
  assert.match(engine, /maskedKey/);
  assert.ok(!/apiKey:\s*runtimeConfig\.apiKey/.test(router), 'raw key returned by an endpoint');
  // Runtime configuration stays an operator-only action.
  assert.match(router, /KINSHIP_ADMIN_TOKEN/);
  assert.match(router, /x-kinship-admin/);
});

test('no credential-shaped string is committed anywhere in the source', async () => {
  const dirs = ['src', 'server', 'shared', 'api', 'tests'];
  const files: string[] = [];
  for (const dir of dirs) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) files.push(`${dir}/${entry.name}`);
    }
  }
  for (const [file, src] of await readAll(files)) {
    assert.ok(
      !/hack_[A-Za-z0-9]{8,}/.test(src),
      `${file} contains something that looks like a Qloo credential`
    );
    assert.ok(!/sk-[A-Za-z0-9]{20,}/.test(src), `${file} contains a secret-shaped string`);
  }
  const example = await readFile('.env.example', 'utf8');
  assert.match(example, /QLOO_API_KEY=\s*$/m, '.env.example must ship an empty key');
});

test('personal data is not written to logs', async () => {
  const router = await readFile('server/apiRouter.ts', 'utf8');
  const server = await readFile('server/index.ts', 'utf8');
  for (const [file, src] of [
    ['server/apiRouter.ts', router],
    ['server/index.ts', server],
  ] as Array<[string, string]>) {
    assert.ok(
      !/console\.(log|info|warn|error)\([^)]*req\.body/.test(src),
      `${file} logs a request body, which carries family details`
    );
  }
});

/**
 * Claim-language scan over *user-visible copy only*.
 *
 * The first scan in this file bans a fixed vocabulary repo-wide. That was too
 * narrow: it passed while "clinical Iso-Principle", "statin/donepezil medication
 * safety", "Reduces Sundowning Cortisol" and an invented "+26% dementia visual
 * meal intake" were still being rendered to caregivers and served from the
 * public MCP surface. This one extracts prose instead of scanning raw source.
 */
const PUBLIC_MCP_TOOL_NAMES = [
  'reconstruct_reminiscence_bump',
  'bridge_generations_compare',
  'prescribe_iso_sundowning_rescue',
  'curate_dysphagia_nostalgic_dining',
  'parse_family_intake_story',
];

/**
 * OperatorAppendixView is excluded on purpose: it is labelled in its own
 * heading as an illustrative model over a fictional cohort, and render.test.tsx
 * asserts those labels are present. shared/types.ts is excluded because it
 * holds only identifiers. Neither renders claims to a family.
 */
const COPY_SURFACES = [
  ...CAREGIVER_SURFACES,
  'src/App.tsx',
  'src/components/ReminiscenceAndBridgeView.tsx',
  'src/components/SundowningRescueModal.tsx',
  'src/components/KinshipQlooDrawer.tsx',
  'src/utils/harmonicPlayer.ts',
  'server/kinshipQlooEngine.ts',
  'server/reminiscenceGraph.ts',
  'server/mcpTools.ts',
];

/**
 * CARE_HOME_COHORT is fictional operator-demo data (names, MMSE scores and
 * stage labels for invented residents). It renders only inside
 * OperatorAppendixView, which is labelled "Illustrative model — not measured
 * results" / "Demo cohort (fictional)" and asserted as such in render.test.tsx.
 * It is sliced out here so the scan covers the copy families actually read.
 */
function withoutFictionalCohort(source: string): string {
  const start = source.indexOf('export const CARE_HOME_COHORT');
  if (start === -1) return source;
  const end = source.indexOf('export const CARE_CIRCLE_ROLES', start);
  return end === -1 ? source.slice(0, start) : source.slice(0, start) + source.slice(end);
}

function visibleCopy(source: string): string {
  // Template interpolations reference identifiers, not prose.
  const flat = source.replace(/\$\{[^}]*\}/g, ' ');
  const parts: string[] = [];
  for (const m of flat.matchAll(/'[^'\\\n]*'|"[^"\\\n]*"|`[^`\\]*`/g)) parts.push(m[0]);
  for (const m of flat.matchAll(/>([^<>{}]+)</g)) parts.push(m[1]);
  return (
    parts
      .join('\n')
      // Public MCP tool names are an API contract, not prose. Renaming them
      // would break every existing integration, so they are allowed through.
      .replace(new RegExp(PUBLIC_MCP_TOOL_NAMES.join('|'), 'g'), ' ')
      // camelCase field names (presbycusisSafe, iddsiLevelLabel) are data-model
      // identifiers; only their values are ever rendered.
      .replace(/\b[a-z]+[A-Z][A-Za-z0-9]*\b/g, ' ')
      .toLowerCase()
  );
}

const BANNED_CLAIMS = [
  // clinical classifications Kinship has no basis to assign
  'iddsi', 'iso-principle', 'presbycusis', 'dysphagia', 'mmse',
  // medication and drug-interaction claims
  'statin', 'amlodipine', 'donepezil', 'ace-inhibitor', 'medication-aware',
  'medication safety', 'medication-interaction',
  // physiology presented as mechanism
  'cortisol', 'supplementary motor', 'basal ganglia', 'olfactory bulb',
  'amygdala', 'cranial nerve', 'limbic', 'somatosensory', 'retronasal',
  'olfactory pathway', 'olfaction', 'thalamus',
  // guaranteed or absolute effects
  'aspiration', 'choking hazard', 'cough-reflex', 'instant calm',
  'instantly feels', 'effortlessly', 'triggers instant', 'eliminates',
  'prevents molten', 'reduces sundowning', 'clinically lowers',
  // clinical framing of a non-clinical product
  'clinical care', 'clinical reasoning', 'clinical tools', 'clinical coaches',
  'clinical texture', 'clinically proven', 'patient-personalized',
  'dementia patients', 'therapeutic', 'agitation',
  // invented statistics and prescription framing
  'visual meal intake', 'meal prescription', 'care prescription',
  'verified sundowning-safe', 'sundowning-safe', 'sundowning_clinical_auditor',
  // spelled-out neuroscience, which the earlier "mPFC" ban did not catch
  'prefrontal', 'hippocamp', 'entorhinal', 'parasympathetic', 'cortex',
  // invented statistics and borrowed authority
  'visit dread', 'clinicians worldwide', 'stage 5', 'stage 6',
];

test('no clinical, medication or guaranteed-effect claims reach user-visible copy', async () => {
  for (const [file, src] of await readAll(COPY_SURFACES)) {
    const copy = visibleCopy(withoutFictionalCohort(src));
    for (const phrase of BANNED_CLAIMS) {
      assert.ok(
        !copy.includes(phrase),
        `${file} still renders the claim "${phrase}" in user-visible copy`
      );
    }
  }
});

test('the request trace names only tools that actually exist', async () => {
  const engine = await readFile('server/kinshipQlooEngine.ts', 'utf8');
  const traced = [...engine.matchAll(/toolName:\s*'([^']+)'/g)].map((m) => m[1]);
  assert.ok(traced.length >= 4, 'expected the reasoning log to name its tools');
  for (const raw of traced) {
    for (const part of raw.split('&').map((t) => t.trim()).filter(Boolean)) {
      if (part === '/search') continue;
      assert.ok(
        PUBLIC_MCP_TOOL_NAMES.includes(part),
        `the trace names a tool that does not exist: "${part}"`
      );
    }
  }
});

test('invented parameters are labelled as local filters, not Qloo query params', async () => {
  const engine = await readFile('server/kinshipQlooEngine.ts', 'utf8');
  // These were previously presented inside a params block attached to
  // GET /v2/insights, implying the Qloo API accepts them. It does not.
  for (const invented of [
    'presbycusis_warm_eq',
    'iddsi_dysphagia_level',
    'plot_complexity_guardrail',
    'circadian_mode',
  ]) {
    assert.ok(!engine.includes(invented), `${invented} is still presented as an API parameter`);
  }
  assert.ok(
    engine.includes('local filter, not a Qloo param'),
    'locally applied filters must say they are not Qloo parameters'
  );
});
