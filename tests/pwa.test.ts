import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
const main = readFileSync('src/main.tsx', 'utf8');
const vite = readFileSync('vite.config.ts', 'utf8');

test('the installable app manifest has a standalone home entry and icon', () => {
  assert.equal(manifest.display, 'standalone');
  assert.match(manifest.start_url, /#home$/);
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0);
});

test('the browser registers an offline service worker', () => {
  assert.match(main, /serviceWorker\.register\('\/sw\.js'\)/);
});

test('the generated service worker precaches fingerprinted build files without caching API traffic', () => {
  assert.match(vite, /Object\.keys\(bundle\)/);
  assert.match(vite, /cache\.addAll\(APP_SHELL\)/);
  assert.match(vite, /url\.pathname\.startsWith\('\/api\/'\)/);
  assert.match(vite, /request\.method !== 'GET'/);
});
