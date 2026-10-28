# Kinship — Test Report

**Date:** 2026-10-28
**Branch:** `arena/b5dcb30a-kinship` (PR #6, open — not merged, not deployed)
**Environment:** Node **v22.22.3**, Debian bookworm sandbox, `npm ci` from a clean install
**Test framework:** Node 22 built-in `node:test` runner with `tsx` for TypeScript/JSX. **Zero new dependencies.**

---

## 1. Headline result

```
$ npm test
# tests 49
# pass  49
# fail  0
# duration ~1.3 s
```

```
$ npx tsc --noEmit        → exit 0 (strict mode, no errors)
$ npm run build           → SUCCESS
  dist/assets/index-Nc7oUqn6.js   276.43 kB │ gzip: 85.10 kB
  dist/assets/index-DSLsrVtH.css   47.05 kB │ gzip:  8.31 kB
  + 8 lazy chunks (largest: kinshipQlooEngine 42.29 kB / 15.36 gz)
```

```
$ npm run start   (local production-mode server, port 3000)
  GET  /                        → 200, serves index-Nc7oUqn6.js (the fresh build)
  GET  /assets/ReminiscenceAndBridgeView-*.js → 200
  GET  /assets/OperatorAppendixView-*.js      → 200
  GET  /api/health              → 200 { ok:true, mcpToolsCount:5, qloo.connected:false,
                                        timestamp:"2026-10-28T15:16:08.336Z" }
  POST /api/kinship-bridge      → 200 mode:"verified_cultural_twin",
                                        youth universe 6, sundowning playlist 3,
                                        bridges 1 (97% overlap), agentTrace 5,
                                        reasoningLog 4
```

`connected: false` locally is **correct and expected**: `QLOO_API_KEY` is not present in this sandbox, so the offline Verified Cultural Twin path runs. That path is deterministic and makes no network call. Production's live path (`connected: true`) was verified separately — see §5.

**No test result in this report is fabricated, and no test that was not run is claimed as passing.**

---

## 2. Suite composition

`npm test` = `node --import tsx --test "tests/*.test.ts" "tests/*.test.tsx"`

### 2.1 `tests/designTokens.test.ts` — 6/6 pass

Contrast is recomputed from the real hex values in `tailwind.config.js` (not from remembered numbers), validated first against known reference pairs (black-on-white = 21, a mid grey = 4.48, white-on-white = 1) so a broken formula cannot produce a false pass.

| # | Assertion |
|---|---|
| 1 | WCAG formula reproduces three known reference ratios |
| 2 | Body and secondary text meet AA (≥4.5:1) in **day** mode on paper and card |
| 3 | Body and secondary text meet AA in **evening** mode on vinyl-900/800/700 |
| 4 | Filled-button labels (clay-600, plum-600, pine-600 backgrounds) are legible at AA |
| 5 | Focus ring and chart fills meet the **non-text 3:1** minimum against their own track, in both themes |
| 6 | No `stone-*` class remains anywhere in `src` (the failing cool greys are gone) |

Measured values underpinning tests 2–5: `loam.body #57554F` = 6.56 / 7.45; `loam.muted #6E6B63` = 4.68 / 5.32; `loam.body-dark #C9C4B9` = 9.03 / 7.81 / 6.25; `loam.muted-dark #B5B0A6` = 7.27 / 6.29 / 5.04; `clay-600` = 6.29 with white at 7.15; `plum-600` = 5.63 with white at 6.40; `pine-600` = 6.23; focus `#6A7DAD` = 3.59 / 4.08 / 3.85.
**Failures these tests replaced:** `stone-400` 2.22, `stone-500` 4.22 (day) and **3.27** (evening), `stone-600` 2.06 (evening); chart fills `pine-600` **1.53** and `plum-600` **1.70** against the dark track.

### 2.2 `tests/routing.test.ts` — 6/6 pass

| # | Assertion |
|---|---|
| 1 | `#/discover`, `/discover`, `#/discover?x=1`, `#/discover/` all resolve to `discover` |
| 2 | `parseRouteFromHash` returns `null` for `''`, `null`, `'#'`, `'#nonsense'`, `'#/not-a-screen'` |
| 3 | A legacy printed `#kinship=<payload>` link still decodes to the family data |
| 4 | …and yields **no route**, so an old QR code lands on Home rather than breaking |
| 5 | `combineRouteAndPayload('passport', '#kinship=eyJ2IjoxfQ')` → `'#/passport&kinship=eyJ2IjoxfQ'` |
| 6 | Route + payload round-trip through encode/decode without loss |

### 2.3 `tests/render.test.tsx` — 34/34 pass

Every screen is server-rendered against a **real offline-engine fixture** (`await generateKinshipBridge(...)` at module level — actual engine output, not a hand-written mock), then the HTML is normalised (`html.replace(/<!--[\s\S]*?-->/g,'')`, because React SSR inserts comment markers between adjacent text nodes) and asserted.

Coverage includes: App first paint (skip link → `id="kinship-main"` → splash → "Enter Kinship"); bottom-nav text labels alongside `aria-hidden` icons; the disclaimer visible at all widths; **no provenance claim rendered before data exists**; exactly **one** `loam-btn-primary` on Home; every Discover card carrying both "Enjoy together" and "Not for us today" plus per-item provenance; Together having play/stop/skip with `aria-pressed` and **no `<audio>` element**; Preferences having ≥5 switches asserted **per-tag** (`/<button[^>]*role="switch"[^>]*>/` matched individually for `aria-checked`, plus `id="pref-…"`) and a 3-radio group and the opt-in storage control; the passport free of `agitation episodes, ROI, $14, ARR, HIPAA, POPIA, GDPR, MMSE, Medicare, MC-*-ANON, calm and smiling, Zero Cloud PII, SaaS`; the operator appendix self-labelled illustrative / fictional / no-certification / not-a-medical-device; the intake panel using real `<label>`s with `aria-valuetext` and `max="1980"`; the drawer being a labelled dialog with `aria-label="Close the request trace"`.

### 2.4 `tests/honesty.test.ts` — 8/8 pass

| # | Assertion |
|---|---|
| 1 | Banned-claim scan over the 7 caregiver surfaces finds no diagnosis, treatment, prevention or guaranteed-response wording |
| 2 | Pseudo-clinical vocabulary (`mPFC`, `dorsal medial`, `Proven Sedative`, `Thalamus-Bypass`, `250M+`) appears in **0 of 16** source files |
| 3 | No outcome or medical promise strings anywhere in `src`/`server` |
| 4 | Operator material is self-labelled illustrative and fictional in the file that contains it |
| 5 | No `<audio>` element and no `autoplay=`/`autoPlay=` attribute; streaming brand names appear **only** as `target="_blank"` + `rel="noopener noreferrer"` links to `open.spotify.com` / `music.apple.com` |
| 6 | No `/api` route returns the key: only `maskedKey`; `KINSHIP_ADMIN_TOKEN` and the `x-kinship-admin` header gate `qloo-config` |
| 7 | No credential-shaped string (`hack_[A-Za-z0-9]{8,}`, `sk-…`) in `src`, `server`, `shared`, `api`, `tests`; `.env.example` ships `QLOO_API_KEY=` **empty** |
| 8 | No `console.*` call logs `req.body` in `server/apiRouter.ts` or `server/index.ts` |

---

## 3. Regressions the suite caught (this is the useful part)

1. **The splash screen was silently dropped from first paint.** After code-splitting, the splash ended up *inside* the same `<Suspense>` boundary as the two lazily mounted overlays. `renderToString` does not support Suspense: it emits `<!--$!-->` plus `<template data-msg="The server did not finish this Suspense boundary…">` and drops the content. Test 16 (splash present in App first paint) failed, which exposed that **in a browser the first thing a visitor sees would have waited on two overlay chunks**. Fixed by rendering the splash before and outside every boundary, and by mounting overlays only when open. Two throwaway diagnostic scripts were created, run and deleted to confirm the exact React output.
2. **Two test assertions were themselves wrong** and were fixed rather than the code being bent to suit them: the raw-HTML literal matching (React's `<!-- -->` markers) and a global `aria-checked=` count that was inflated by `role="radio"` elements. Per-tag matching is now used.
3. **A case-insensitive scan produced a false failure:** `/autoPlay/i` matched the prose word "Autoplay" inside a legitimate sentence about not autoplaying distressing media. The test now scans for the attribute only.
4. **A dead domain in the copy-link fallback** (`kinship.qloo-memory.org`) was found while reading `qrAndPassport.ts` for the routing tests and corrected to the real deployment URL.

---

## 4. What was **not** tested, and why

This section exists because the alternative would be claiming coverage that does not exist.

| Not tested | Reason | What was done instead |
|---|---|---|
| **Any browser rendering** | No Chromium/Chrome/Firefox binary in the sandbox; browser CDNs and apt repos are outside permitted egress. Puppeteer/Playwright caches absent. **Attempted and abandoned — not retried.** | SSR assertions + static reasoning over CSS and DOM structure |
| **Screenshots / visual review** | Same | None. No visual claim is made anywhere |
| **Responsive layout at 320 / 360 / 393 / 430 px** | No layout engine | Overflow risks identified statically (F17) and hardened defensively: `flex-wrap`, `min-w-0`, `break-all`, `break-words`. **Presence of a horizontal scrollbar is unverified.** |
| **Physical device (Redmi Note 10 Pro class)** | No device, no emulator | None |
| **Browser console errors** | No browser | Typecheck + build only |
| **Live Qloo API responses in this environment** | `QLOO_API_KEY` absent from the sandbox by design | Offline twin exercised end-to-end; production live path verified separately (§5) |
| **Real keyboard/screen-reader interaction** (TalkBack, NVDA) | No browser, no AT | Structural attributes asserted in rendered HTML; `useDialogBehaviour` logic reviewed in source |
| **Lazy-chunk network behaviour / Suspense fallbacks in a browser** | No browser | Chunks confirmed built and served 200 by the local server; import placement verified in source |
| **`localStorage` persistence across a real reload** | No browser | Loader validated by shape-checking code review; toggle-off deletion path reviewed |
| **Rate limiting (F21)** | Not implemented | Documented as an open limitation, not tested |
| **Print output of the care sheet** | No layout engine | `@media print` rules reviewed; fabricated sections confirmed absent from the passport render |

**Consequence:** routing, focus management, dialog Escape behaviour, lazy loading, hover/focus states, safe-area spacing and text-size scaling are **verified only as rendered structure and source logic**, never as observed interaction.

---

## 5. Verification against the deployed production app

Performed with `fetch_page` against `https://kinship-app-phi.vercel.app/` (the fetcher executes JavaScript, so this is the real client-rendered DOM, not the HTML shell):

- `/api/health?v=loam` earlier the same day → `connected: true`, `maskedKey: "hack••••678b"` — **live Qloo confirmed on production**, key never exposed.
- Rendered DOM order confirmed: skip link → header → `sr-only` `h1 "Home"` → **green "Live Qloo Taste AI™…" banner** → hero "Welcome to Kinship / Find a familiar feeling." → era line (1954–1974, Gogo Thandi) → CTAs → featured music card → three Home links → settling-sounds card → splash text. This is the direct evidence for finding **F9** (provenance outranked the value proposition).
- Production runs `056f304`, i.e. **the fixes in this branch are not deployed.** Nothing in this report should be read as describing the live site's post-fix state.

**Could not be used:** `fetch_page` against the sandbox preview returns **403 "Missing traffic access token"** — the preview is reachable from the user's browser only. Local `curl` on port 3000 was used instead for the build/serve checks in §1.

---

## 6. Manual verification performed

- Read all 23 TypeScript/TSX source modules plus `tailwind.config.js`, `src/index.css`, `index.html`, `vercel.json`, `.github/workflows/ci.yml`, `.env.example`, `.gitignore`.
- Computed every text/background contrast pair with the WCAG relative-luminance formula (script written for the purpose; results in §2.1).
- Traced every outbound Qloo request parameter to confirm **no personal data** (name, birth year, health condition, location finer than city) is sent — custom-typed names receive an `ELD-` prefix and are filtered out of the request.
- Grepped for residual banned vocabulary (`stone-`, `mPFC`, `dorsal`, `autoplay`, `console.*req.body`, credential shapes) and confirmed zero hits after the fixes.
- Confirmed `git log --all -S<hex> -i` shows the brief's example palette hexes were **never** present in the tree or its history — the Loam palette was authored, not copied from the brief.
- Verified `dist/` sizes before and after code splitting (414,388 B → 276,430 B raw; 118,713 B → 85,100 B gzipped).

---

## 7. CI

`.github/workflows/ci.yml` previously ran typecheck and build only — which is how the Suspense regression in §3.1 reached a successfully built bundle. A **`npm test` step was added**. CI on the current PR head was green for typecheck + build before this change; the test step will run on the next push.

---

## 8. Recommendation before merge

1. Open the preview on a real Android phone at 393 px and with system font scale at maximum. Check: no horizontal scrolling, back button returns through screens, splash timing feels calm, all four nav labels readable.
2. Run a TalkBack pass on Home → Discover → Together and on the settling-sounds dialog (Escape-equivalent, focus order, unnamed controls).
3. Have a dementia-care practitioner read the settling-sounds dialog and the bedside care sheet aloud.

None of these can be done in this environment; all three are low-effort and would close the largest remaining verification gap.
