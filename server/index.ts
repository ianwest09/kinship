import './loadEnv.js';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createKinshipApiApp } from './apiRouter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  const app = createKinshipApiApp();

  const distPath = path.resolve(__dirname, '../dist');
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(distPath, 'index.html'))) {
    app.use(
      express.static(distPath, {
        // Caching is decided per path rather than by a blanket `immutable: true`.
        // Only /assets is fingerprinted by Vite, so only /assets can be cached
        // forever; index.html and the unhashed files copied from public/ (the
        // logo, the splash mark, the icons) would otherwise be pinned for a year
        // and a changed logo would never reach a returning visitor. This matches
        // the /assets rule in vercel.json, which is what production actually uses.
        setHeaders: (res, filePath) => {
          const rel = path.relative(distPath, filePath).split(path.sep).join('/');
          res.setHeader(
            'Cache-Control',
            rel.startsWith('assets/') ? 'public, max-age=31536000, immutable' : 'no-cache'
          );
        },
      })
    );
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kinship: Moments of Connection listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
