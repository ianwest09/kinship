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
