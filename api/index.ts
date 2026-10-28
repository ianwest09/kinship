import '../server/loadEnv.js';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createKinshipApiApp } from '../server/apiRouter.js';

const app = createKinshipApiApp();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.url && (req.url === '/api/index' || req.url.startsWith('/api/index?'))) {
    const parsed = new URL(req.url, 'http://localhost');
    const subPath = parsed.searchParams.get('__path') || '';
    parsed.searchParams.delete('__path');
    const qs = parsed.searchParams.toString();
    req.url = `/api/${subPath}${qs ? `?${qs}` : ''}`;
  } else if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }
  return app(req as never, res as never);
}
