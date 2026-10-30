import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** Emit a small, dependency-free service worker with the exact fingerprinted
 * build files in its install list. This keeps the app shell, saved-moment UI,
 * timer, generated room sounds and browser narration available after the first
 * successful visit, without caching API responses or personal POST bodies. */
function offlineAppShell(): Plugin {
  return {
    name: 'kinship-offline-app-shell',
    apply: 'build',
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle).map((file) => `/${file}`);
      const precache = Array.from(
        new Set(['/', '/index.html', '/manifest.webmanifest', '/kinship-mark.png', ...files])
      );
      const source = `
const CACHE = 'kinship-app-${Date.now()}';
const APP_SHELL = ${JSON.stringify(precache)};
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('kinship-app-') && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put('/index.html', copy));
      return response;
    }).catch(() => caches.match('/index.html')));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy));
    }
    return response;
  })));
});`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  plugins: [react(), offlineAppShell()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    hmr: {
      // The preview is served over HTTPS through a reverse proxy, so the
      // browser must use the proxy's secure WebSocket port for HMR.
      clientPort: 443,
    },
  },
});
