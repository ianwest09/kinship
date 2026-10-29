import express from 'express';
import {
  CARE_HOME_COHORT,
  ELDER_CLUE_CATALOG,
  FAMILY_PRESETS,
  GRANDCHILD_SEED_CATALOG,
  YOUTH_GEOGRAPHIES,
} from './reminiscenceGraph.js';
import {
  generateKinshipBridge,
  getKinshipQlooStatus,
  KinshipRequestInput,
  parseFamilyStoryToKinship,
  setKinshipQlooConfig,
} from './kinshipQlooEngine.js';
import { executeKinshipMcpTool, KINSHIP_MCP_TOOLS } from './mcpTools.js';

export function createKinshipApiApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=63072000');
    // X-Frame-Options is deliberately NOT set, and was explicitly removed here
    // before #10 reintroduced it. Kinship has no accounts, no cookies and no
    // authenticated state-changing action, so there is no clickjacking surface
    // for the header to protect — while the header itself stops the app
    // rendering in any cross-origin frame, which is how the sandbox preview and
    // an embedded hackathon demo are viewed. tests/securityHeaders.test.ts fails
    // if it comes back. If framing ever needs restricting, do it with a CSP
    // `frame-ancestors` allowlist naming the real hosts, not with SAMEORIGIN.
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader(
      'Content-Security-Policy-Report-Only',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'"
    );
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'Kinship — Qloo Reminiscence Bump & Intergenerational Bridge Agent',
      mcpToolsCount: KINSHIP_MCP_TOOLS.length,
      qloo: getKinshipQlooStatus(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/bootstrap', (_req, res) => {
    res.json({
      elderCatalog: ELDER_CLUE_CATALOG,
      grandchildCatalog: GRANDCHILD_SEED_CATALOG,
      presets: FAMILY_PRESETS,
      geographies: Object.values(YOUTH_GEOGRAPHIES),
      cohort: CARE_HOME_COHORT,
      mcpTools: KINSHIP_MCP_TOOLS,
      qlooStatus: getKinshipQlooStatus(),
    });
  });

  // Runtime Qloo configuration is an operator-only action: it mutates global
  // server state, so on a public deployment it must not be callable by
  // anonymous visitors. It is disabled entirely unless KINSHIP_ADMIN_TOKEN is
  // set, and even then requires that token in the `x-kinship-admin` header.
  // Normal deployments should configure QLOO_API_KEY via the environment.
  app.post('/api/qloo-config', (req, res) => {
    const adminToken = (process.env.KINSHIP_ADMIN_TOKEN || '').trim();
    if (!adminToken) {
      res.status(403).json({
        error:
          'Runtime Qloo configuration is disabled on this deployment. Set QLOO_API_KEY as an environment variable instead.',
      });
      return;
    }
    const provided = String(req.header('x-kinship-admin') || '');
    if (provided !== adminToken) {
      res.status(403).json({ error: 'Invalid or missing x-kinship-admin credential.' });
      return;
    }
    const { apiKey = '', baseUrl = 'https://hackathon.api.qloo.com' } = req.body || {};
    setKinshipQlooConfig(String(apiKey), String(baseUrl));
    res.json({ ok: true, qlooStatus: getKinshipQlooStatus() });
  });

  app.post('/api/parse-story', (req, res) => {
    const { text = '', currentGuardrails } = req.body || {};
    if (!text || !currentGuardrails) {
      res.status(400).json({ error: 'Missing text or currentGuardrails.' });
      return;
    }
    res.json(parseFamilyStoryToKinship(String(text), currentGuardrails));
  });

  app.post('/api/kinship-bridge', async (req, res) => {
    try {
      const payload = req.body as Partial<KinshipRequestInput> | undefined;
      if (!payload || !payload.guardrails || typeof payload.guardrails !== 'object') {
        res.status(400).json({ error: 'Missing required guardrails object in request body.' });
        return;
      }
      const result = await generateKinshipBridge({
        guardrails: payload.guardrails,
        elderClues: Array.isArray(payload.elderClues) ? payload.elderClues : [],
        grandchildSeeds: Array.isArray(payload.grandchildSeeds) ? payload.grandchildSeeds : [],
        boostedCueIds: Array.isArray(payload.boostedCueIds) ? payload.boostedCueIds : [],
        excludedCueIds: Array.isArray(payload.excludedCueIds) ? payload.excludedCueIds : [],
      });
      res.json(result);
    } catch (err) {
      console.error('Kinship engine error:', err);
      res.status(500).json({ error: 'Failed to generate Kinship bridge.' });
    }
  });

  // Model Context Protocol (MCP) & Agent Function-Calling Endpoints
  app.get('/api/mcp/tools', (_req, res) => {
    res.json({
      protocol: 'mcp/1.0',
      serverName: 'kinship-qloo-reminiscence-agent',
      version: '3.0.0',
      tools: KINSHIP_MCP_TOOLS,
    });
  });

  app.post('/api/mcp/call', async (req, res) => {
    try {
      const { name, arguments: toolArgs = {} } = req.body || {};
      if (!name || typeof name !== 'string') {
        res.status(400).json({ error: 'Missing required MCP tool "name".' });
        return;
      }
      const output = await executeKinshipMcpTool(
        name,
        typeof toolArgs === 'object' && toolArgs !== null ? toolArgs : {}
      );
      res.json(output);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'MCP execution error';
      res.status(msg.startsWith('Unknown MCP tool') ? 404 : 500).json({ error: msg });
    }
  });

  return app;
}
