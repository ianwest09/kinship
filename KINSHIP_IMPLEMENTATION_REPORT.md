# Kinship — Implementation Report

**Date:** 2026-10-28
**Branch:** `arena/b5dcb30a-kinship` (pull request #6, open — **not merged, not deployed**)
**Base:** `origin/main` @ `056f304` (the live production deployment)
**Scale:** 27 files changed, **+2,503 / −650 lines**; 7 new files; **0 new runtime or dev dependencies**

Every finding referenced here is documented with evidence in `KINSHIP_UX_AUDIT.md`. Test outcomes are in `KINSHIP_TEST_REPORT.md`.

---

## 1. Ground rules this work followed

| Rule | How it was applied |
|---|---|
| Preserve the existing framework and architecture | React 18 + Vite 6 + Tailwind 3 + Express kept. No router library, no state library, no component library, no CSS framework added |
| Do not rewrite unnecessarily | All 11 existing components edited in place. No screen was replaced. No file was deleted |
| Do not replace real data or APIs with hardcoded demos | Qloo calls, the offline catalogue fallback and the MCP surface are untouched apart from **copy strings**. No fixture was substituted for a live response |
| Do not weaken security | No auth, validation or logging change. The admin gate, the body-logging prohibition and server-side-only key access are all intact and now covered by tests |
| Preserve integrations, schemas, production config | `shared/types.ts` unchanged; every engine field name unchanged; `vercel.json`, `.env.example`, CI structure preserved (one step added) |
| Avoid new dependencies | Test stack is the Node 22 built-in `node:test` runner + the already-installed `tsx`. Zero additions to `package.json` `dependencies`/`devDependencies` |
| No dark patterns, manipulative prompts, unnecessary permissions | Opt-in persistence is **off by default**; no notifications, no streaks, no engagement mechanics introduced; the undo control is always visible |
| Identify controlling files before editing | Done in Phase 1 — see the file map in §5 |
| Record significant architectural decisions | §4 |
| Do not expose environment values | Only variable **names** appear in these documents |

---

## 2. Changes by severity of the finding they close

### Critical

**F1 — Hash routing without a router library** (`src/utils/routing.ts` *new*, `src/App.tsx`)
- `parseRouteFromHash` accepts `#/id`, `/id`, `#/id?x=1`, `#/id/` and returns `null` for unknown screens.
- `parsePayloadFromHash` keeps reading the legacy `#kinship=<urlencoded json>` format **on its own**, so QR codes and links already printed in the field still open the right person's data even though they carry no route.
- `combineRouteAndPayload('passport', '#kinship=…')` produces `#/passport&kinship=…`; `App` reads it on mount, writes it with `history.replaceState`, and every navigation uses `pushState` + a `popstate` listener that also re-reads an incoming payload.
- **Verified:** 6 dedicated routing tests including the legacy-payload case.

**F2 — Fabricated outcomes removed from the caregiver document** (`MemoryCarePassportView.tsx`, `OperatorAppendixView.tsx` *new*)
- The 292-line passport was cut to its bedside purpose: the person's name, era, a printed plain-language line, the family's own spark quotes and the settling-sounds plan.
- Sections 2 ("Clinical Impact & Outcomes") and 3 ("Cohort / Operator ROI") were **moved**, not deleted, into a new `#/operators` appendix that states in its own heading: *"Illustrative model — not measured results"*, *"Demo cohort (fictional)"*, and an explicit disclaimer that Kinship makes **no** HIPAA/POPIA/GDPR certification claim and is not a medical device.
- The passport prints nothing it used to print that was fabricated; `@media print` rules updated accordingly.
- Reachable from Preferences (labelled as illustrative operator material) so the content is discoverable but no longer on a care document.

**F3 — Pseudo-clinical metrics renamed to what they are** (`ReminiscenceAndBridgeView.tsx`, `FamilyIntakePanel.tsx`, `server/kinshipQlooEngine.ts`, `server/reminiscenceGraph.ts`, `server/mcpTools.ts`)
- `mPFC Salience` → **`% Qloo affinity`**; the era-retention bar chart → **`% era match (Qloo)`** with the caption *"These are Qloo affinity weights by decade — not a measurement of anyone's memory."*
- `"Every song … verified for dementia sensory comfort"` → *"Filtered by Qloo for the era, then screened by Kinship for loud-ads and sudden-shift tags."*
- All three engine phase titles rewritten (`"Iso-Principle Autonomic Step-Down"` → *"Start at their pace"* etc.), and each `clinicalMechanism` string de-physiologised — no entrainment, heart-rate, motor-cortex or thalamus claims remain.
- All **11 `neuralPathway` strings** rewritten: "Proven Sedative", "Works in Stage 6", "Thalamus-Bypass", "Cranial Nerve I", "Basal Ganglia" removed; each now describes what the cue *is* and why familiarity is comfortable, hedged.
- MCP tool descriptions and the drawer's agent-trace copy aligned with the same vocabulary.
- **Verified:** a repo-wide vocabulary test asserts `mPFC`, `dorsal medial`, `Proven Sedative`, `Thalamus-Bypass`, `250M+` appear in **zero** of the 16 source files.

### High

**F4 — Shared dialog behaviour** (`src/hooks/useDialogBehaviour.ts` *new*, `SundowningRescueModal.tsx`, `KinshipQlooDrawer.tsx`)
- Escape closes; initial focus goes to the Close control; Tab cycles inside; focus returns to the trigger on close; `body` scroll locked with scrollbar-width compensation and always restored (including on unmount).
- Drawer gains `role="dialog"`, `aria-modal="true"`, `aria-labelledby` and `aria-label="Close the request trace"` on its previously unnamed icon button.
- Modal now stops the harmonic preview on unmount, which matters because it became lazily mounted (§4).

**F5/F6 — Loam contrast tokens** (`tailwind.config.js`, `src/index.css`, all 11 components)
- Added `loam.body`, `loam.muted`, `loam.body-dark`, `loam.muted-dark`, a warm `clay` alert scale (replacing cool `rose`), `brass-950`, `shadow-lift`, and a `text-meta` size token.
- **432 token replacements** across `src`; **0 `stone-*` remain**, enforced by a test that scans every source file.
- Chart fills made theme-aware so each is ≥3:1 against its own track in both day and evening mode.

**F7 — Reversible "Not for us today"** (`DiscoverView.tsx`, `App.tsx`)
- `handleUndoCueReaction` removes the cue ID from `excludedCueIds` **and** the matching journal entry, then shows the card again.
- Inline `role="status"` strip names the item and offers **"Put it back"**.

**F8 — Honest failure path with retry** (`App.tsx`)
- `engineFailed` state + `reloadToken` counter. The provenance disclosure gains: *"Kinship could not reach the Qloo API for this request, so these items come from its own collection instead. Nothing was saved."* plus a **Try again** button that re-runs the same inputs.
- `kinshipQlooEngine` is now imported **inside** the catch block, so the offline engine is only downloaded when the API actually fails (see §4).

**F9 — Provenance reduced to a one-line strip** (`App.tsx`, `src/index.css`)
- `.loam-provenance*` styles: coloured dot, short label, disclosure hint, full text in a native `<details>`. Present on every screen, so Qloo's "present results with their source and limits" requirement is still met — it just no longer outranks the product.

**F10 — Opt-in persistence + accurate privacy copy** (`App.tsx`, `PreferencesView.tsx`)
- `kinship.family.v1` written only when the caregiver switches it on; read through a shape-validating loader that falls back to the sample family.
- **Toggling off deletes the stored data immediately.** Text size and evening mode survive "Clear everything" because they are accessibility settings, not family data.
- The privacy claim was corrected: data is POSTed to the Kinship server to build the request, is not stored server-side, and is never forwarded to Qloo. The old wording said it "stays on this device", which was false.

### Medium

**F11/F12 — Plain-language caregiver copy** (8 files)
- Every jargon CTA replaced: `"Reconstruct Era & Bridge"` → **"Create today's plan"**; `"Lit Up / Sang (+Save Spark)"` → **"That worked — save the quote"**; `"Restless (Exclude)"` → **"Not for us today"**; `"Pin to 4:30 PM Calm"` → **"Add to the settling-sounds plan"**; `"Hearing-Aid Warm EQ: ON (<760 Hz)"` → **"Warm the sound for hearing aids"**; `"Inspect 5-Agent Qloo & MCP Trace"` → **"See how this was made"**; `"$5 Visit Prep:"` → **"Something simple to try"**; `"Circadian Daily Reminiscence Rhythm"` → **"A rhythm for the day"**; `"Memory Care Room Door Sheet"` → **"Bedside care sheet"**.
- Decades in the era chart de-medicalised; stale "Tab 2" instructions rewritten against current screen and control names; `retentionLabel` replaced.

**F13/F14 — Form accessibility** (`FamilyIntakePanel.tsx`)
- Real `<label for>` on the story textarea and the birth-year slider; `aria-valuetext` on the slider; `max` raised to **1980** with tick ages computed from the current year; `isWorking` pending state with `aria-busy`, a "Working…" button label, disabled example chips, and typed text preserved on failure.

**F15 — Code splitting** (`App.tsx`)
- `React.lazy` for the six secondary surfaces; Home, Discover and Together stay eager because they are the navigation destinations.
- Measured: **entry 414,388 B → 276,430 B raw (−33%), 118,713 B → 85,100 B gzipped (−28%)**, plus 8 lazy chunks the first paint never requests.
- Fonts cut 3 → 2 families; JetBrains Mono dropped for a system monospace stack (`ui-monospace, SFMono-Regular, …`) declared in the Tailwind config.

**F16 — Token discipline** (`ReminiscenceAndBridgeView.tsx`, `tailwind.config.js`)
- All 57 `text-[0.8125rem]` → `text-meta`; all 14 one-off hex values → `vinyl`/`parchment`/`brass` tokens; `amber→brass`, `rose→clay`, `shadow-2xl→shadow-lift`, `bg-black/50→bg-vinyl-950/60`.

**F17 — Overflow hardening** (`ReminiscenceAndBridgeView.tsx` + 5 other files)
- Hometown-hotspot row: `flex-wrap` + `min-w-0` on the name + `break-all` on the unbreakable `geohash:…` pill.
- `break-words` added to all 11 monospace uppercase eyebrows (6 files) because their content includes full API parameter strings.

**F18 — Copy-link domain** (`src/utils/qrAndPassport.ts`)
- Non-`http` fallback changed from `https://kinship.qloo-memory.org/` (does not exist) to `https://kinship-app-phi.vercel.app/` (the real deployment).

### Low

**F19** — helpline block now reads *"Free, confidential support lines published by these organisations. Check the number before you rely on it — Kinship does not maintain this list."* and the 24/7 clinical-coaching promise is gone.
**F20** — server engine and story parser moved to dynamic imports inside their failure paths; no credential was ever exposed and none is now.
**F21** — **not fixed**, deliberately; see §6.

---

## 3. Features affected

| Feature | Status |
|---|---|
| Family intake (story parse, elder clues, grandchild seeds) | Behaviour unchanged; labels, pending state, slider range and decade copy improved |
| Kinship Bridge engine (Qloo live + offline twin) | Logic untouched; only response **copy strings** changed |
| Discover / Together / Home | Behaviour unchanged; provenance, undo, CTA hierarchy and vocabulary improved |
| Detailed care view | Behaviour unchanged; metric labels honest; chart visible in both themes |
| Settling-sounds dialog + Web Audio | Behaviour unchanged; focus/Escape/scroll-lock added; audio cleanup on unmount added |
| Qloo request-trace drawer | Behaviour unchanged; dialog semantics and label added |
| Care passport + QR/copy link | Fabricated sections moved to `#/operators`; link fallback domain fixed |
| MCP server (5 tools) | Behaviour unchanged; descriptions de-claimed |
| Preferences | Persistence consent + deletion controls added; device-data section explains what leaves the device |
| Routing | **New:** hash routing + back button + addressable screens; legacy share links still decode |
| Persistence | **New:** opt-in only |

**Nothing was removed from the product.** The fabricated material was relocated to a labelled appendix.

---

## 4. Significant architectural decisions

1. **No router library.** `pushState`/`popstate` + a hash parser in 93 lines gives back-button behaviour, deep links and refresh persistence. `react-router` would add ~14 KB gzipped and a dependency for behaviour that is 90 lines here.
2. **Hash-based routes (`#/discover`) rather than path routes.** `vercel.json` already rewrites everything to the SPA, and path routes would need per-path rewrite rules plus risk to the `/api/*` surface. Hash routes need no server change and cannot collide with the API.
3. **Legacy `#kinship=` payload preserved, routes appended with `&`.** Printed QR codes exist in the field. A format break would strand them, so the old format still decodes and simply yields no route (landing on Home).
4. **Persistence off by default.** Care-home phones are shared and the payload contains a name, a birth year, a dementia stage and quoted speech. Opt-in with a visible switch and a one-tap delete is the minimum honest posture; defaulting on would be an unnecessary-permission dark pattern.
5. **The offline engine is imported inside the failure path.** It is 1,512 lines + a 1,231-line catalogue, and 99% of visits never need it. A static import would put it in the first paint. Consequence accepted: the fallback costs one extra chunk request *only* when the API has already failed, and a `Suspense`-free imperative `await` means there is no extra render boundary.
6. **Overlays mount only when open.** After the SSR test caught a real regression (below), both overlays render only when their state is true, so neither chunk is fetched on first load.
7. **Splash outside every `Suspense` boundary.** Discovered by test, not by inspection: the splash had ended up inside a lazy-overlay boundary. `renderToString` bails a boundary containing a lazy child, emitting `<!--$!-->` plus `<template data-msg="The server did not finish this Suspense boundary…">` and **dropping the splash entirely**. In a browser the first thing a visitor sees would have waited on two overlay chunks. The splash now renders before and outside all boundaries.
8. **Fabricated content moved, not deleted.** The brief forbids removing functionality merely to simplify, and the operator material has a legitimate use — as a clearly labelled illustrative model. Deletion would have destroyed context; relocation preserves it and removes the harm.
9. **Dependency-free test stack.** `node:test` + `tsx` (both already present) + `react-dom/server`. No Vitest/Playwright/jsdom: jsdom would add a dependency and still not be a real browser, and the honest choice was SSR assertions plus explicit disclosure that no browser verification happened.
10. **Contrast values chosen by calculation, not taste.** Each new token was validated against its actual backgrounds with the WCAG formula before adoption, and the tests re-derive the ratios from `tailwind.config.js` so a future token edit that drops below AA fails CI.
11. **System monospace instead of a third webfont.** Technical eyebrows are small and short-lived; the render-blocking font cost outweighed the typographic gain.
12. **CI gained a test step.** Typecheck + build alone allowed an SSR regression (decision 7) to reach a built bundle unnoticed.

---

## 5. File map

**New:** `src/utils/routing.ts` (93) · `src/hooks/useDialogBehaviour.ts` (115) · `src/components/OperatorAppendixView.tsx` (239) · `tests/designTokens.test.ts` (152) · `tests/routing.test.ts` (81) · `tests/render.test.tsx` (460) · `tests/honesty.test.ts` (171)

**Modified:** `src/App.tsx` (+536 lines of change — routing, persistence, failure path, provenance strip, code splitting, splash placement) · `src/components/ReminiscenceAndBridgeView.tsx` (216) · `MemoryCarePassportView.tsx` (292) · `FamilyIntakePanel.tsx` (171) · `SundowningRescueModal.tsx` (138) · `KinshipQlooDrawer.tsx` (93) · `PreferencesView.tsx` (87) · `DiscoverView.tsx` (65) · `HomeView.tsx` (34) · `SharedMomentView.tsx` (14) · `SplashScreen.tsx` (2) · `src/index.css` (+44) · `src/utils/qrAndPassport.ts` (6) · `tailwind.config.js` (55) · `server/kinshipQlooEngine.ts` (34) · `server/reminiscenceGraph.ts` (28) · `server/mcpTools.ts` (12) · `.github/workflows/ci.yml` (+test step) · `package.json` (test script) · `index.html` (2 font families) · `tests/smoke.test.ts` (**deleted** — superseded by `render.test.tsx`)

---

## 6. Known limitations left in place, deliberately

1. **`POST /api/kinship-bridge` has no rate limiting.** An in-process limiter on Vercel's serverless runtime is per-instance and therefore close to useless; adding one would manufacture false assurance. The real fix is platform-level (Vercel WAF / upstream proxy). Documented rather than half-solved.
2. **Helpline numbers are not independently re-verified.** They are real organisations, but Kinship does not maintain the list, and the copy now says so.
3. **No linter exists in the repo.** Adding ESLint + `jsx-a11y` is recommended (§6 of the audit) but was out of scope for this pass; the honesty and contrast tests cover the highest-risk regressions instead.
4. **Browser-only behaviours are not exercised in a browser.** Routing, focus management, lazy chunks and overflow are covered by unit/SSR tests and static reasoning. This is stated rather than implied anywhere in the deliverables.

---

## 7. Verification summary

```
npx tsc --noEmit   → exit 0
npm test           → 49 tests, 49 pass, 0 fail (~1.3 s)
npm run build      → SUCCESS, entry index-Nc7oUqn6.js 276.43 kB / 85.10 kB gzip
local server       → GET / 200 (serves the new bundle), lazy chunks 200,
                     GET /api/health 200, POST /api/kinship-bridge 200
                     (mode: verified_cultural_twin — no QLOO_API_KEY in the sandbox)
```

Full detail, including what was **not** verified, is in `KINSHIP_TEST_REPORT.md`.

---

## 8. Environment and deployment notes

**Environment variables (names only; values never recorded here):**

| Variable | Required | Notes |
|---|---|---|
| `QLOO_BASE_URL` | yes (already set in production) | Hackathon API base |
| `QLOO_API_KEY` | yes (already set, sensitive, production scope) | Read server-side only; never returned by any endpoint — `/api/health` returns a masked hint |
| `KINSHIP_ADMIN_TOKEN` | optional | Enables `POST /api/qloo-config`; leave unset to keep it disabled |
| `PORT` | optional | Defaults to 3000 |

`.env.example` ships `QLOO_API_KEY=` **empty**, and `.gitignore` covers `.env*` (except the example), `dist/` and `node_modules/`. Both are asserted by a test.

**No deployment was performed and none is implied by this report.** Production still serves `056f304`.

To deploy after review: merge PR #6 into `main`, then create a deployment from `main` with a git source (the project has automatic deployments disabled, so a merge alone does not ship). Verify afterwards: `/` , `/api/health` (expect a **fresh** timestamp and `connected: true`), `/api/kinship-bridge`, `/api/mcp/tools`.

**Rollback:** promote the previous deployment (`dpl_6urkSrpMtN9HQwhYfa2Gckm4wsSa`) or redeploy `056f304`. There is no schema and no stored state, so rollback carries no data-migration risk; the only client-visible residue would be a `kinship.family.v1` entry in a user's `localStorage`, which the app ignores unless persistence is switched on.
