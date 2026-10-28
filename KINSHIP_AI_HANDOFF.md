# Kinship — AI Handoff Brief

**Prepared:** 28 October 2026 (Africa/Johannesburg)  
**Purpose:** Transfer the complete Kinship app, project context, and current deployment state to another AI/agent.  
**Project:** Kinship v3 — Qloo-powered dementia reminiscence and intergenerational bridge agent.

## At a glance

Kinship helps families and memory-care teams use an older adult’s music and cultural memories from ages 10–30 (the reminiscence bump) to create safer, more meaningful visits with younger relatives. The app combines a React/Vite UI, a Qloo-backed server engine, an MCP-style five-tool API, sundowning/peril screening, sensory prompts, a dysphagia-aware nostalgic dining plan, and a printable, zero-cloud-PII care passport.

**Sanctuary is intentionally on ice.** Do not modify Sanctuary files or restart its former port 3000 server.

## Included in this transfer package

- `kinship/` — Kinship project source, npm lockfile, README, MIT license, Vercel config, API entrypoint, shared types, backend engine, MCP tools, React app/components, CSS, and the production `dist/` bundle.
- `kinship-prototype.html` — Standalone single-file Kinship UI bundle (about 412 KB; no external fonts or scripts required for the bundle itself).
- `KINSHIP_AI_HANDOFF.md` — This brief.

The archive omits `.env`, `.env.local`, node_modules, `.git`, and Vercel credentials. `kinship/.env.example` is included. **No raw Qloo key is included.**

## Current local project state

- Project source: `/home/user/kinship/`
- Standalone preview: `/home/user/kinship-prototype.html`
- Source includes `npm run typecheck`, `npm run build`, `npm run dev`, and `npm run start` scripts.
- Latest source build completed successfully after the live-Qloo fixes; TypeScript check and Vite build passed. The standalone bundle was regenerated at approximately 412 KB.
- Local website was previously verified on port 3001, including a live Qloo-backed bridge, real heatmap, comparison, place, brand, and demographics responses. The process may not persist after handoff; start it with `npm install` (if needed) then `PORT=3001 npm run start` from the project folder.
- Sanctuary remains untouched in the workspace, with its old port 3000 stopped.

## Vercel state — important: deployment is NOT complete

- Vercel team: `Ian's projects` (`team_c6FagfR7JAE7fv0sCi4dGiXc`).
- Project: `kinship` (`prj_CL3kmyF1JxJABeSkREeiTow4ST1r`).
- `QLOO_API_KEY` is configured encrypted for production, preview, and development. `QLOO_BASE_URL` is `https://hackathon.api.qloo.com`. Never retrieve, print, paste into source, or add it to a transfer archive. If a display hint is needed, use `hack_••••678b` only.
- The same encrypted key and base URL were also set on `atelier-iq`; those changes take effect when that project is redeployed.
- A direct deployment attempt failed. The production deployment `dpl_J3D3jvfn3hmmRyXg7xBwxxnu6A56` ended in `ERROR` (`ENOENT`, `npm install` exited 254); a second incomplete preview deployment also errored. **There is no successful public Kinship production URL yet. Do not tell anyone that it is deployed.**
- While attempting a file-based upload, project settings were changed: root directory is currently `src`, framework remains Vite, output directory `dist`, and build/install commands are `npm run build ` / `npm install ` (trailing spaces). The root directory was not cleared by a null update. Inspect the project settings before any new deployment.
- `/home/user/kinship-vercel-import.zip` is an additional GitHub-import archive arranged with a root MIT license and app files under `src/`, so it matches the current Vercel root-directory setting. It contains no raw key. This archive is separate from the main AI-handoff archive.
- Safest next path: create/upload a public GitHub repository with a root-level MIT `LICENSE`, connect that repo to the Vercel project, verify its root directory/build settings against the actual repository layout, then redeploy and test the resulting public URL and API routes. The direct GitHub connector was checked and is unsupported in this Arena session.

## Qloo API integration: verified live behaviors

Gateway: `https://hackathon.api.qloo.com`; authentication header is `X-Api-Key` (server-side only).

1. Use **GET `/v2/insights` with flat dot-notation query parameters**. In live testing, POST with nested `{ filter, signal }` JSON returned HTTP 200 but ignored the intended nested signals and produced generic results (e.g., “Coldplay”). GET with dot notation returned the culturally correlated results.
2. For `filter.type=urn:heatmap`, send **`filter.location.query=<city>`**, not `signal.location.query`. The latter produced HTTP 400 for heatmap. `urn:entity:place` does accept `signal.location.query`; the current implementation uses `filter.location.query` for place too, which returned HTTP 200 in live testing.
3. `/search` entity IDs are in `results[].entity_id`.
4. `/v2/analysis/compare` shared tags are in `results.tags[]` with `name` and `query.score`; the implementation reads `query.score` when a top-level score is absent.
5. Demographic age buckets are under `results.demographics[].query.age`.
6. Heatmap geohashes and scores can be under `results.heatmap[].location.geohash` and `.query.{affinity,affinity_rank,popularity}`.
7. Exclude unsafe content in the app’s own safety screen as well as passing Qloo exclusion filters: live Qloo can still return peril/conflict titles (a 1966 “Battle of Algiers” result was caught by the app’s live safety filter).

Verified API examples in the prior live probe included Miriam Makeba → `AFC7571E-5679-4362-8643-697BA0F60D0B`, Laufey → `6C2BE7A7-4154-4F0B-BE10-E751AC9061CF`, and Cape Town heatmap geohash `k3vnrg`. These are public entity/output identifiers, not secrets.

## App capabilities already implemented

- Eight cultural geographies: Cape Town, Chicago, London, Brooklyn/NYC, Tokyo, Kingston, Mumbai, and Buenos Aires.
- Live Qloo entity resolution, cross-domain recommendations, analysis/compare, demographics, place/brand taste, and heatmaps; offline “Verified Cultural Twin” fallback.
- Agentic multi-step orchestration, sparsity retry, distress/peril filter, MCP tool catalog/execution endpoints, and live response explainability.
- Blind generic-LLM vs Qloo comparison UI.
- Sundowning-aware Iso-Principle audio sequence and hearing-aid-conscious warm EQ controls.
- Regional nostalgic dining suggestions with IDDSI texture labels, temperature/medication notes, and calm venues. These are educational prompts, not individualized medical advice.
- Care passport/QR share flow designed to keep family details local and avoid cloud PII.
- MIT-licensed source; README, `.env.example`, `.gitignore`, Vercel config, and Devpost write-up included.

## Hackathon timing / submission needs

The Qloo Agentic Hackathon deadline captured in the research was **30 October 2026 at 11:45 PM EDT**. The submission requirements include a public working live demo, public Git repository with a detectable root open-source `LICENSE`, and an English write-up. A demo video was not required by the rules reviewed. Confirm deadline and current rules on Devpost before submission.

## Suggested first actions for the next AI

1. Extract this archive and inspect `kinship/README.md`, `kinship/DEVPOST_SUBMISSION.md`, `kinship/vercel.json`, `kinship/api/index.ts`, and `kinship/server/kinshipQlooEngine.ts`.
2. Run `npm install`, `npm run typecheck`, and `npm run build` from `kinship/`.
3. Inspect Vercel project `kinship` root directory/build settings before import/deploy. Do not assume a production deployment exists.
4. Keep the Qloo secret in Vercel encrypted env vars only; never put it in a commit, `.env` inside the transfer, logs, or chat.
5. Deploy only after repository layout and Vercel project root are aligned; then verify the public root, `/api/health`, `/api/kinship-bridge`, and `/api/mcp/tools`.

## Workspace reference

- Main source project: `/home/user/kinship/`
- Standalone app: `/home/user/kinship-prototype.html`
- GitHub import archive aligned to current Vercel `src` root: `/home/user/kinship-vercel-import.zip`
- Sanctuary (frozen; leave untouched): `/home/user/sanctuary-prototype.html`
