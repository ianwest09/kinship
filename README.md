# Kinship — The Dementia “Reminiscence Bump” & Intergenerational Bridge Agent

> **Qloo Agentic Hackathon (“Agents, but with taste.”)** · Built on **Qloo Taste AI™ v2** (`artist`, `movie`, `tv_show`, `brand`, `place`, `demographics`, `heatmap`, `/v2/analysis/compare`) + **Model Context Protocol (`mcp/1.0`)** · **MIT Licensed** · **Zero Cloud PHI / Zero PII**

## Live Demo

**https://kinship-app-phi.vercel.app** — publicly reachable, no login, no deployment protection, hosted on Vercel. `QLOO_API_KEY` is only ever held server-side as an encrypted Vercel environment variable; the browser can neither read it nor set it.

```bash
curl https://kinship-app-phi.vercel.app/api/health
```

`qloo.connected` must be `true`, with `maskedKey` showing the key's first and last four characters. If it reads `false`, the deployment is serving the offline Verified Cultural Twin instead of live Qloo: add `QLOO_API_KEY` under **Project Settings → Environment Variables** for the target environments and redeploy. The key cannot be supplied from the browser, so an environment variable is the only supported path.

Because the UI states which source produced what it is showing, an unconnected deployment is never mistaken for live Qloo output — the provenance notice says so explicitly.

> **Provenance is stated in the UI.** Until a reconstruction runs, Kinship shows only its own curated material, so it carries a provenance notice reading *“Offline collection — Qloo is not connected”* — that content is **not** Qloo output and is labelled as such. Running a reconstruction issues a real request; when Qloo answers it, the notice reads *“Live Qloo Taste AI™”*. Items actually returned by Qloo additionally carry a `Live Qloo API` badge, and the agent-trace drawer labels every step `LIVE` or `TWIN`, so a Qloo result is never visually confused with Kinship’s own interpretation.

Source repository: **https://github.com/ianwest09/kinship** (public, MIT licence detected at repository root).

---

## Design & accessibility (Loam)

The interface follows the **Loam** design system: warm paper `#F4F0E8`, white card surfaces, soft charcoal `#353432`, muted sage `#64745D` and a soft blue focus indicator. Contrast was computed for every pairing rather than assumed; where a supplied reference value failed WCAG it was darkened (sage text on paper uses `#55634E` at 5.63:1, focus rings use `#6A7DAD` at 3.59:1).

- **Reading preference** — Normal / Large / Largest, persisted per device. The root font is 17px and all type is rem-based, so the preference scales type *and* spacing together without breaking layout.
- **Touch** — 44px minimum targets on coarse pointers; four-item bottom navigation on phones with safe-area padding for the gesture bar.
- **Motion** — minimal by default, fully removed under `prefers-reduced-motion`.
- **Dementia-inclusive copy** — no quizzes, scores or countdowns; every screen offers a neutral way out; suggestions are labelled as suggestions, never as facts about a person.
- **Brand** — the approved logo ships as `public/kinship-logo.png` (full lockup) and `public/kinship-mark.png` (tile mark, also the favicon); the app opens with a brief, always-skippable splash.

Five destinations — **Home, Discover, Together, Family, Preferences** — sit in front of the same engine. The full clinical detail (era timeline, compare diffs, blocked distress triggers, dining plan, Qloo request trace) remains one tap away under **Detailed care view**.

---

## Why Kinship Exists

Over **57 million families worldwide** navigate Alzheimer’s and related dementias. Two heartbreaks strike almost every household and memory-care community every single day:

1. **4:30 PM “Sundowning” Agitation**: As daylight fades, circadian confusion triggers acute homesickness (*“I want to go home”*), pacing, and distress. Caregivers or smart-TV autoplay routinely put on generic “oldies” or 1960s films — accidentally playing suspense/war triggers (*Psycho*, *The Birds*, loud streaming ad breaks) that dementia brains perceive as real-room danger.
2. **Intergenerational Visit Dread**: Over **60% of teens and Gen-Z grandchildren** dread visiting a grandparent with dementia because standard conversation (*“Do you remember my school? What did you have for lunch?”*) inadvertently quizzes damaged short-term hippocampal memory — causing shame and silence.

### The Neurological Breakthrough + Why Only Qloo Taste AI™ Can Solve It

Neuroscience proves that while Alzheimer’s erodes recent hippocampal memory, **autobiographical, musical, olfactory, and culinary memories formed between ages 10 and 30 — the “Reminiscence Bump” — survive into late-stage disease inside the medial prefrontal cortex (mPFC)** (Petr Janata, UC Davis).

A generic prompted LLM **cannot** solve this safely:
- Generic LLMs guess US/UK Top-40 stereotypes, suffer recency bias, hallucinate release years, recommend peril-heavy era classics, and tell grandchildren to ask memory-testing questions.
- **Kinship** uses **Qloo Taste AI™’s 250M+ entity cultural graph** with **zero patient PII** to reconstruct an elder’s exact ages 10–30 cultural universe in their youth hometown, filter out distress triggers, compose a 15-minute clinical **Iso-Principle BPM step-down (`96 → 76 → 62 BPM`)**, pair **IDDSI Levels 4–6 dysphagia-safe youth comfort meals & quiet cafés**, and run **`GET /v2/analysis/compare`** to reveal the hidden musical/story DNA connecting a 19-year-old grandchild’s favorites (*Laufey*, *Olivia Dean*, *Studio Ghibli*, *Tems*) with their grandparent’s 1950s–1970s youth touchstones.

---

## Full-Surface Qloo v2 API Architecture

Kinship orchestrates **6 entity/insight domains** and **all core Qloo v2 endpoints** inside a 4-iteration autonomous ReAct agent loop (`OBSERVE → TOOL_CALL → AUDIT_SELF_CORRECT → SYNTHESIZE`):

| Agent / Tool | Qloo v2 Endpoint & Parameters | Clinical Care Role |
|---|---|---|
| **01. Clue & Bump Resolver** | `GET /search` · `GET /v2/tags` | Resolves 1–2 surviving family clues + grandchild favorites into Qloo UUIDs and locks the `[birthYear+10, birthYear+30]` mPFC window. |
| **02. Youth-Universe Reconstructor** | `GET /v2/insights` (`urn:entity:artist`, `movie`, `tv_show`, `filter.release_year`, `signal.location.query`, `bias.trends="off"`, `feature.explainability=true`) | Reconstructs high-salience youth cues across **8 global & diaspora regions** (Cape Town, Chicago, London, Brooklyn, Tokyo, Kingston, Mumbai, Buenos Aires) with clue attribution. |
| **03. Sundowning, Brand & Dining Shield** | `GET /v2/insights` (`filter.exclude.tags=horror,thriller,war`, `urn:entity:brand`, `urn:entity:place`) | Blocks era peril traps, sequences `96→76→62 BPM` Iso-Principle entrainment, prescribes $5 olfactory/tea anchors, and curates **IDDSI Levels 4–6 easy-to-chew (<52°C, medication-safe) nostalgic dining & quiet hours**. |
| **04. Intergenerational Soul Bridge** | `GET /v2/analysis/compare` (`a.signal.interests.entities` vs `b.signal.interests.entities`) | Computes shared harmonic & narrative tag co-occurrence across 60 years to generate a 3-step, zero-quiz 15-minute grandchild visit playbook. |
| **05. Silo Breaker & Hometown Mapper** | `GET /v2/insights?filter.type=urn:demographics` + `filter.type=urn:heatmap` (`output.heatmap.boundary=urn:geohash`) | Proves generational recommender siloing across 6 age bands and maps neighborhood youth geohashes with sensory place prompts. |

### Autonomous Agent Self-Correction & Model Context Protocol (`mcp/1.0`)
- **Sparsity & Safety Self-Correction**: If a live Qloo query returns distress-tagged entities or `<2` results for a diaspora cue, Kinship’s auditor drops peril tags and autonomously retries with a widened `±5 year` diaspora window while maintaining `bias.trends="off"`.
- **Callable MCP Tool Server**: Exposes `GET /api/mcp/tools` and `POST /api/mcp/call` for 5 clinical tools (`reconstruct_reminiscence_bump`, `bridge_generations_compare`, `prescribe_iso_sundowning_rescue`, `curate_dysphagia_nostalgic_dining`, `parse_family_intake_story`) so any Claude, OpenAI, or LangGraph care workflow can call Kinship directly.

---

## Quick Start (Local Development)

Requires **Node.js 20.12 or newer** (Node 22 recommended; `process.loadEnvFile` is used to read `.env`).

```bash
npm install
npm run typecheck      # tsc --noEmit
npm run build          # vite build -> dist/

cp .env.example .env   # optional; see note below
npm run dev            # Express + Vite middleware + MCP server
```

`npm run dev` (and `npm run start`) bind **`process.env.PORT`, defaulting to `3000`**. To use another port, set it explicitly:

```bash
PORT=3001 npm run dev
```

### About `.env`

`.env` is loaded by [`server/loadEnv.ts`](./server/loadEnv.ts), which is imported first by both server entrypoints. Two behaviours worth knowing:

- Variables **already present in the real environment take precedence** over `.env`, so platform-injected values (e.g. Vercel encrypted env vars) always win.
- If `.env` is absent the server starts normally — this is the normal case in production.

For production-style serving of the built bundle:

```bash
npm run build
PORT=3001 QLOO_API_KEY=<your-key> npm run start
```

`npm run start` serves `dist/` only when `NODE_ENV=production` **and** `dist/index.html` exists; otherwise it falls back to Vite middleware mode. Always run `npm run build` first.

### Data source modes

- **With `QLOO_API_KEY`**: live Qloo v2 responses hydrate Youth Universe cards, `/v2/analysis/compare` overlap scores, `urn:entity:place` calm venues, `urn:entity:brand` anchors, `urn:demographics`, and `urn:heatmap` geohashes. Responses report `mode: "live_qloo_api"`.
- **Without `QLOO_API_KEY`**: Kinship runs on its offline **8-Region Verified Cultural Twin** dataset so every workflow can be exercised with zero setup. Responses report `mode: "verified_cultural_twin"`, and the UI labels this state explicitly.

Check which mode you are in at any time via `GET /api/health` (`qloo.connected`) or the `mode` field on any bridge response. **The offline dataset is curated by us, not returned by Qloo** — the two are not interchangeable as evidence.

> `QLOO_API_KEY` must be supplied as a real environment variable or via `.env`. It is never committed, never sent to the browser, and there is no in-app field for pasting it.


---

## One-Click Deploy to Vercel

Kinship includes native Vercel Serverless configuration (`vercel.json` + `api/index.ts`):

1. Push this directory to a public GitHub repository (root `LICENSE` is standard MIT so GitHub automatically displays **MIT license** in the **About** sidebar).
2. Import the repository in **Vercel**. Build Command `npm run build` and Output Directory `dist` are read from `vercel.json`.
3. **Leave Root Directory empty (repository root).** This is the single most common misconfiguration: `package.json` lives at the repository root, so setting Root Directory to `src` makes Vercel run `npm install` in a folder with no manifest and the build fails with `ENOENT` (exit 254). `src/` holds only the Vite frontend.
4. Add environment variables in Vercel Project Settings:
   - `QLOO_API_KEY` = your Qloo API key (encrypted; production, preview, development)
   - `QLOO_BASE_URL` = `https://hackathon.api.qloo.com` (or `https://api.qloo.com`)
5. If the deployment must be reachable by the public, turn **off** Deployment Protection (Settings → Deployment Protection → Vercel Authentication). With protection enabled, every `*.vercel.app` URL redirects to a Vercel login.
6. Deploy. All `/api/*` and `/api/mcp/*` routes execute serverlessly while `QLOO_API_KEY` stays strictly server-side.

### Verifying a deployment

```bash
curl https://<your-deployment>/api/health
```

Confirm `qloo.connected` is `true` and `maskedKey` shows your key's first and last four characters. If it is `false`, the deployment is serving the offline Verified Cultural Twin rather than live Qloo — check that `QLOO_API_KEY` is set for the target environment, then redeploy.

Also worth checking after deploy:

```bash
curl https://<your-deployment>/api/mcp/tools          # 5 tools
curl -X POST https://<your-deployment>/api/kinship-bridge \
  -H 'Content-Type: application/json' \
  -d '{"guardrails":{"elderName":"Test","birthYear":1944,"youthGeography":"cape_town","dementiaStage":"moderate_mid","circadianWindow":"afternoon_bridge","sundowningSafeShield":true,"plotFreeMusicalFocus":true,"grandchildName":"Test"}}'
```

The response's `mode` field must read `live_qloo_api`, not `verified_cultural_twin`.


---

## License

Released under the **MIT License** — see [`LICENSE`](./LICENSE).
