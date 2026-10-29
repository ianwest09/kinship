/**
 * Response-header guards.
 *
 * #10 hardened the deployment by adding a set of response headers. Most of them
 * are unambiguously good and are asserted here so they survive future edits.
 * One of them, `X-Frame-Options: SAMEORIGIN`, replaced a line that had
 * explicitly *removed* that header, and it stops Kinship rendering inside any
 * cross-origin frame — which is how the sandbox preview and an embedded demo
 * are viewed. Kinship has no accounts, no cookies and no authenticated
 * state-changing action, so there is no clickjacking surface for it to protect.
 *
 * These tests boot the real Express app on an ephemeral port and read the
 * headers it actually sends, then check `vercel.json` — which is what
 * production serves — says the same thing.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createKinshipApiApp } from '../server/apiRouter';

type Headers = Record<string, string>;

/** Boot the API on a random port, read one response's headers, shut it down. */
async function sentHeaders(path = '/api/health'): Promise<Headers> {
  const app = createKinshipApiApp();
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}${path}`);
    const out: Headers = {};
    res.headers.forEach((value, key) => {
      out[key.toLowerCase()] = value;
    });
    return out;
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const vercelConfig = JSON.parse(await readFile('vercel.json', 'utf8')) as {
  headers?: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
};

/** Every header rule that matches a normal page request. */
function vercelHeadersFor(source: string): Headers {
  const out: Headers = {};
  for (const rule of vercelConfig.headers ?? []) {
    // These sources are regex-flavoured Vercel patterns; match the plain ones.
    const pattern = new RegExp(`^${rule.source.replace(/\(\.\*\)/g, '.*')}$`);
    if (pattern.test(source)) {
      for (const h of rule.headers) out[h.key.toLowerCase()] = h.value;
    }
  }
  return out;
}

const HARDENING_HEADERS = [
  'x-content-type-options',
  'referrer-policy',
  'strict-transport-security',
  'permissions-policy',
];

test('the API sends every hardening header #10 added', async () => {
  const headers = await sentHeaders();
  for (const name of HARDENING_HEADERS) {
    assert.ok(headers[name], `the API stopped sending ${name}`);
  }
  assert.equal(headers['x-content-type-options'], 'nosniff');
  assert.match(headers['permissions-policy'], /camera=\(\)/);
});

test('no API response forbids framing', async () => {
  const headers = await sentHeaders();
  assert.equal(
    headers['x-frame-options'],
    undefined,
    'X-Frame-Options blocks the sandbox preview and any embedded demo; Kinship has no authenticated action for it to protect'
  );
});

test('the CSP is report-only, so it observes without breaking the app', async () => {
  const headers = await sentHeaders();
  assert.ok(
    headers['content-security-policy-report-only'],
    'the report-only policy went missing'
  );
  assert.equal(
    headers['content-security-policy'],
    undefined,
    'an enforcing CSP was added; it must stay report-only until its directives are verified against the real bundle'
  );
});

test('vercel.json sends the same headers as the API', () => {
  const headers = vercelHeadersFor('/');
  for (const name of HARDENING_HEADERS) {
    assert.ok(headers[name], `vercel.json does not set ${name} for /`);
  }
});

test('vercel.json does not forbid framing either', () => {
  const headers = vercelHeadersFor('/');
  assert.equal(
    headers['x-frame-options'],
    undefined,
    'production would refuse to render in a frame; see the note in server/apiRouter.ts'
  );
});

test('only fingerprinted assets are cached forever', () => {
  const assets = vercelHeadersFor('/assets/index-abc123.js');
  assert.match(assets['cache-control'] ?? '', /immutable/, 'hashed assets should be immutable');

  // index.html and the unhashed files copied from public/ change identity
  // without changing name, so a year-long immutable cache would pin them.
  const root = vercelHeadersFor('/');
  assert.ok(
    !/immutable/.test(root['cache-control'] ?? ''),
    'a blanket rule caches unhashed files as immutable'
  );
  const logo = vercelHeadersFor('/kinship-mark.png');
  assert.ok(
    !/immutable/.test(logo['cache-control'] ?? ''),
    '/kinship-mark.png is not fingerprinted, so it must not be immutable'
  );
});
