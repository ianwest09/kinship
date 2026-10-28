# Kinship — Mobile UX Audit

**Date:** 2026-10-28
**Auditor scope:** principal mobile product design, accessibility (WCAG 2.2 AA), frontend engineering, QA
**Live deployment inspected:** <https://kinship-app-phi.vercel.app/> (production, commit `056f304`)
**Repository inspected:** `ianwest09/kinship`, branch `arena/b5dcb30a-kinship`
**Reference device profile:** Android, Redmi Note 10 Pro class (1080×2400, ~393 CSS px wide, mid-range 2021 SoC, Chrome)

---

## 1. What was actually inspected, and how

| Method | What it gave | Status |
|---|---|---|
| `fetch_page` against production | The **live rendered DOM text** of the deployed app (the fetcher executes JavaScript, so this is the real client-rendered output, not the HTML shell) | ✅ Done |
| `curl` against a local production-mode server | Live API responses (`/api/health`, `POST /api/kinship-bridge`) and static asset serving of the new build | ✅ Done |
| Full source read | All 23 TypeScript/TSX modules, Tailwind config, CSS, `index.html`, `vercel.json`, CI workflow | ✅ Done |
| Computed contrast | WCAG ratios for every text/background pair in the palette, calculated from hex values | ✅ Done |
| Server-side render tests | Real rendered HTML per screen via `react-dom/server`, asserted in `npm test` | ✅ Done |
| Browser automation / screenshots | **Not available** — no browser binary exists in this environment and the download hosts are outside the permitted network egress | ❌ Blocked |
| Physical device testing | **Not performed** | ❌ Blocked |
| Viewport measurement (320/360/393/430) | **Not measurable** — no layout engine available. Overflow risk was assessed statically instead | ⚠️ Partial |

**This report contains no invented test results.** Anything that could not be observed is marked as unverified in §5 and in `KINSHIP_TEST_REPORT.md`.

### Deployed app vs. source

Production currently serves commit `056f304`. The live DOM confirmed: Loam palette, four-item phone navigation, splash screen, the green "Live Qloo Taste AI™" provenance banner with `connected: true`. **The findings below were verified against that deployed build and against source; the fixes in this branch are not deployed** (no deploy was authorised).

---

## 2. Architecture baseline (established facts)

- **Framework:** React 18.3 + TypeScript 5.7 + Vite 6, single-page app. No router library.
- **Styling:** Tailwind CSS 3.4 with a custom "Loam" token set; no component library. Icons: `lucide-react`.
- **Backend:** Express app (`server/`) exposed on Vercel through `api/index.ts` with rewrites in `vercel.json`. Five MCP tools.
- **Data:** Qloo Taste AI v2 (`/v2/insights`, `/v2/analysis/compare`) called **server-side only**; a curated offline collection ("Verified Cultural Twin") is the fallback.
- **Auth:** none for users. `POST /api/qloo-config` is admin-token gated and disabled unless `KINSHIP_ADMIN_TOKEN` is set.
- **Persistence:** none server-side. Client `localStorage` for text size and evening mode only (at audit time).
- **Audio:** Web Audio API synthesis in `src/utils/harmonicPlayer.ts`. **No media files, no streaming, no network.**
- **Dependencies:** 4 runtime (`express`, `lucide-react`, `react`, `react-dom`), 9 dev. No test framework existed.
- **Tests at audit time:** none. CI ran typecheck + build only.

### Route/screen map (as found)

Screens are React state (`activeTab`), not URLs: `home`, `discover`, `together`, `family`, `passport`, `detail`, `settings`. Phone navigation exposes four (`home`, `discover`, `together`, `family`) plus a header gear for `settings`; `passport` and `detail` are reachable from Home cards, Discover and Preferences.

### Strengths worth preserving (verified)

1. **Names never reach Qloo.** Every outbound request parameter was traced: `filter.type`, `filter.release_year.*`, `filter.exclude.tags`, `signal.location.query` (city), `signal.interests.entities` (Qloo entity IDs only). Custom-typed names get an `ELD-` prefix and are explicitly filtered out of the request.
2. **Request bodies are not logged.** `server/apiRouter.ts` logs only `console.error('Kinship engine error:', err)`.
3. **No dark patterns.** No streaks, no notifications, no engagement mechanics, no scoring of the person with dementia, and explicit "no right answers" framing.
4. **Real accessibility groundwork.** Skip link, `:focus-visible` ring at 3.59:1, `prefers-reduced-motion` collapse, 44 px coarse-pointer minimum, rem-based text-size preference, safe-area padding, per-item provenance labels.
5. **Audio is honest.** Locally synthesised chords, no autoplay, always stops on screen exit, and the button says "Play gentle chords" rather than implying a commercial track.
6. **Offline fallback is genuine**, not a fake API: it is clearly labelled as Kinship's own collection on every item.

---

## 3. Findings

Severity: **critical** (blocks the core task / serious accessibility or privacy risk / makes the product misleading), **high** (materially harms usability, accessibility or trust), **medium**, **low**.

---

### F1 — critical — The phone's back button leaves Kinship entirely

- **Screen:** every screen (`src/App.tsx`)
- **Evidence:** navigation is React state only. `useState<ActiveTab>('home')`; `window.history` is never touched except by the passport copy action. Verified in source and by the absence of any router.
- **Reproduction:** open the app on Android → tap **Discover** → press the system back button. Chrome leaves the site instead of returning to Home.
- **Impact:** The most-used navigation control on Android is broken. A caregiver who goes two screens deep must restart from the splash screen; a person with dementia who taps back is ejected from the app with no way to recover. Also breaks refresh (always returns to Home) and link sharing (no screen is addressable).
- **Correction:** hash routing (`#/discover`) with `pushState`/`popstate`, no new dependency. Legacy `#kinship=<payload>` share links must keep decoding.
- **Dependencies / regression risk:** touches every `setActiveTab` call site (16). Risk: printed QR links already in the field. Mitigated by preserving the `kinship=` format and testing both forms.

---

### F2 — critical — Fabricated clinical outcomes, a compliance certification and a price list printed on a caregiver's bedside sheet

- **Screen:** `MemoryCarePassportView.tsx` (Home → "Care passport"), sections 2 and 3
- **Evidence (verbatim from source):**
  - `5.0 → 0.7/wk` with `−86% agitation episodes`
  - `18m → 52m`, `2.9× longer relaxed visits`
  - `84%` "Spontaneous Smile / Sing Rate"
  - `HIPAA / POPIA / GDPR clean`
  - `$14 / Resident / Mo SaaS`, an ARR calculator, `2.9× ROI`, `CMS GUIDE Respite Alignment $2,500 / yr`, "Medicare GUIDE Model"
  - Cohort cards rendering **other residents**: `MC-204-ANON`, `stageLabel: 'Moderate Alzheimer's (MMSE 16)'`, birth years, origins, before/after episode counts (`CARE_HOME_COHORT`, hardcoded constants in `server/reminiscenceGraph.ts`)
- **Reproduction:** Home → Care passport → scroll. Section 2 is **not** marked `no-print`, so those statistics and the other residents' records print onto the door sheet.
- **Impact:** Three distinct harms. (a) A family or care aide reads invented agitation-reduction figures as measured results — an unsupported medical claim on a document about a real person. (b) A legal compliance claim is asserted with no assessment behind it. (c) One person's care sheet prints records for three other "residents", including diagnoses and MMSE scores — the exact cross-family exposure the product promises it does not do.
- **Correction:** remove both sections from the care document; preserve the material in a new, clearly labelled `#/operators` appendix ("Illustrative model — not measured results", "Demo cohort (fictional)", explicit disclaimer of any HIPAA/POPIA/GDPR certification); restate only what the code supports.
- **Dependencies / regression risk:** the `cohort` prop moves to the new view; nothing else consumes it. Content is preserved, not deleted.

---

### F3 — critical — Pseudo-clinical metrics presented as measurements

- **Screen:** `ReminiscenceAndBridgeView.tsx` (Detailed care view), `FamilyIntakePanel.tsx`, plus the strings that feed them
- **Evidence:**
  - `{cue.mpfcSalienceScore}% mPFC Salience` — source shows this is literally `Math.min(99, Math.round(affinity * 100))`, i.e. Qloo's normalised affinity renamed as a medial-prefrontal-cortex measurement.
  - `{dec.mpfcRetentionPct}%` rendered as a bar chart with the aria-label *"N percent typically retained"*; the values are hardcoded constants (`44, 82, 96, 89, 52, 33, 16`) typed as *"Neurological medial prefrontal cortex retention curve"*.
  - `"Every song, musical, and broadcast below is verified for dementia sensory comfort"` — nothing verifies anything; the code applies a peril-tag regex and content-rating filter.
  - `neuralPathway` strings: `'Santalol Olfactory Pathway (Proven Sedative & Parasympathetic Calm)'`, `'Cranial Nerve I → Limbic Autobiographical Hub (Works in Stage 6)'`, `'Olfactory Bulb → Amygdala & Entorhinal Cortex (Direct Thalamus-Bypass)'`
  - Settling-sounds dialog: `"Entrains respiratory sinus arrhythmia (~62 BPM)"`, `"transitions motor cortex from pacing into seated hand-swaying"`, `"lower[s] heart rate safely"`, `"15-Minute Iso-Principle Autonomic Step-Down"`, `"Parasympathetic Dusk Settle"`
- **Reproduction:** Discover → "Detailed care view"; Family → scroll to the era chart; Home → "Open settling sounds".
- **Impact:** Percentages imply precision that does not exist and read as clinical findings to a lay caregiver. "Proven sedative" and "lowers heart rate safely" are physiological claims. This is the single largest trust risk in the product after F2, and it appears on the screens a family uses most.
- **Correction:** rename to what each number is (`% Qloo affinity`, `% era match (Qloo)`); convert the retention chart to qualitative weights with an explicit "not a measurement of anyone's memory" caption; restate mechanism claims as hedged, plain descriptions of intent.
- **Dependencies / regression risk:** copy-only plus presentation; the underlying fields keep their names so no type or API change is required.

---

### F4 — high — Overlays trap keyboard and screen-reader users, and have no Escape

- **Screen:** `SundowningRescueModal.tsx`, `KinshipQlooDrawer.tsx`
- **Evidence:** the modal had `role="dialog" aria-modal="true"` but **no** keydown handling, no focus trap, no focus restore and no scroll lock. The drawer had **no dialog role at all** and its close button was an icon with **no accessible name** (`<button><X/></button>`).
- **Impact:** WCAG 2.1.2 (No Keyboard Trap) and 2.4.3 (Focus Order) failures. On Android the only exit was finding a small Close button; a screen-reader user heard an unnamed "button"; focus stayed behind the overlay. For a dialog opened during a distress episode, an unreliable exit is a safety issue, not a nicety.
- **Correction:** one shared `useDialogBehaviour` hook — Escape closes, focus moves in (to Close, so stopping is the first thing reachable), Tab cycles inside, focus returns to the trigger, background scroll locks with scrollbar compensation. Drawer gains `role="dialog"`, `aria-modal`, `aria-labelledby` and `aria-label="Close the request trace"`.
- **Dependencies / regression risk:** the modal must stop audio on unmount once it is lazily mounted (added).

---

### F5 — high — Body text fails WCAG AA contrast in both themes

- **Screen:** all 11 components (284 `stone-*` occurrences)
- **Evidence (computed, not estimated):**
  - `stone-500` `#78716c` on warm paper `#F4F0E8` = **4.22:1** (AA needs 4.5)
  - `stone-500` on `vinyl-900` `#242321` = **3.27:1**
  - `stone-400` on paper = **2.22:1**
  - **20 instances of `text-stone-500` had no `dark:` counterpart at all**, rendering at 3.27:1 or worse in evening mode
  - Cool grey on warm paper is also a visible identity inconsistency (Phase 3 concern)
- **Reproduction:** any screen → inspect secondary copy; toggle evening mode.
- **Impact:** WCAG 1.4.3 failure on the exact text an older adult needs most: hints, labels, provenance lines, footnotes. Presbyopia + low contrast is the combination this product exists to respect.
- **Correction:** new warm text tokens chosen by calculation — `loam.body #57554F` (6.56:1 paper / 7.45:1 card), `loam.muted #6E6B63` (4.68 / 5.32), `loam.body-dark #C9C4B9` (9.03 / 7.81 / 6.25 across vinyl 900/800/700), `loam.muted-dark #B5B0A6` (7.27 / 6.29 / 5.04) — plus a warm `clay` alert scale replacing cool `rose`, and `brass` extended to 950 to absorb 14 one-off hex values in the settling-sounds dialog. 432 replacements; **zero `stone-*` remain** (enforced by test).
- **Dependencies / regression risk:** purely presentational; guarded by contrast tests that read the real config values.

---

### F6 — high — Chart fills and focus states fail the non-text 3:1 minimum in evening mode

- **Screen:** `ReminiscenceAndBridgeView.tsx` demographic chart
- **Evidence:** positive bars `pine-600` on the dark track `vinyl-700` = **1.53:1**; `plum-600` on `vinyl-700` = **1.70:1**; the negative fill was `bg-stone-400/50` (≈1.1:1 effective).
- **Impact:** WCAG 1.4.11. In evening mode the bars were effectively invisible, so the chart communicated nothing.
- **Correction:** theme-aware fills — `pine-600 / dark:pine-300`, `plum-600 / dark:brass-300`, `clay-500 / dark:clay-300`; all ≥3:1 against their own track in both themes (asserted in tests).

---

### F7 — high — Setting a suggestion aside was silent, permanent and irreversible

- **Screen:** `DiscoverView.tsx` → `handleCueReaction(cue, 'restless_skip')`
- **Evidence:** the card was removed and the ID pushed to `excludedCueIds` with no confirmation, no feedback and no undo. The only reset (`onResetExcludes`) lived in the detailed care view and cleared **all** exclusions.
- **Impact:** One mis-tap on a phone permanently narrowed every subsequent suggestion, invisibly. For a tired caregiver this is exactly the kind of unnoticed state change that erodes trust; the product's own promise is that skipping carries no penalty.
- **Correction:** an inline `role="status"` strip naming the item and offering **"Put it back"**, wired to a per-item undo that also removes the journal entry.

---

### F8 — high — A failed request silently swapped in different data with no retry

- **Screen:** `App.tsx` → `runKinshipEngine`
- **Evidence:** `catch { const fallback = await generateKinshipBridge(payload); setPrescription(fallback); }` — no state recorded, nothing shown. The provenance banner did change to amber, but there was no explanation of *why* and no way to retry.
- **Impact:** On a mobile connection a timeout is routine. Suggestions changed character with no reason given, and the only recovery was to alter an input to re-trigger the effect.
- **Correction:** an `engineFailed` flag that adds a plain-language line and a **"Try again"** button (driven by a `reloadToken`) inside the provenance disclosure.

---

### F9 — high — Provenance notice outranked the value proposition

- **Screen:** `App.tsx`, rendered above every view
- **Evidence:** the live DOM from production reads, in order: *"Live Qloo Taste AI™. These suggestions were returned by the Qloo API for this request. They describe what people of a similar age and place tended to enjoy — not predictions about any individual."* — four lines of API language **before** "Find a familiar feeling."
- **Impact:** Fails the five-second test. A first-time user meets compliance prose before purpose. On a 393 px phone that is roughly a third of the first viewport.
- **Correction:** collapse to a one-line status strip (coloured dot + short label + disclosure hint) with the full text behind a native `<details>`, still present on every screen so Qloo's SAFE_USE requirement is still met.

---

### F10 — high — Everything a family typed was lost on refresh

- **Screen:** `App.tsx` state
- **Evidence:** guardrails, elder clues, grandchild seeds, boosts, exclusions and the spark journal existed only in React state. Only text size and evening mode were persisted.
- **Impact:** A refresh, a closed tab, an OS task-kill or a flat battery discarded the whole session — the primary failure mode on a phone, and worst for the interrupted, distracted caregiver the brief describes.
- **Correction:** opt-in device persistence (`kinship.family.v1`) with a **visible consent switch, off by default**, plus a "Clear everything on this device" control and a shape-validating reader that falls back to the sample family rather than crashing. Off by default is deliberate: care-home phones are shared, and this data includes a name, a birth year, a dementia stage and quoted speech.
- **Privacy note:** the privacy copy claiming details "stay on this device" was **inaccurate** — they are POSTed to the Kinship server to build the request. Rewritten to say exactly what happens: no account, no database, not stored server-side, never forwarded to Qloo.

---

### F11 — medium — Clinical vocabulary on the screens families use

- **Evidence:** `"Reconstruct Era & Bridge"` (submit button), `"1-click family note:"`, `"Neurological Time-Machine"`, `"{name}'s Spared Reminiscence Bump"`, `"4:30 PM Sundowning Iso-Principle Step-Down & De-Escalation Protocol"` (title of the distress dialog), `"Lit Up / Sang (+Save Spark)"`, `"Pin to 4:30 PM Calm"`, `"Restless (Exclude)"`, `"Hearing-Aid Warm EQ: ON (<760 Hz)"`, `"Simulate Care-Aide QR Scan"`, `"Inspect 5-Agent Qloo & MCP Trace"`, `"$5 Visit Prep:"`, `"Circadian Daily Reminiscence Rhythm"`, `"Memory Care Room Door Sheet"`, `"% Qloo DNA overlap"` (reads as genetics)
- **Impact:** The distress dialog is opened at the worst moment of the day and greeted the user with protocol jargon. "DNA overlap" is actively misleading. Submit buttons that name an algorithm do not tell a tired person what will happen.
- **Correction:** plain-language relabels on every caregiver surface; technical identifiers kept where they are legitimately useful (the Qloo parameter eyebrow in the trace/detailed views).

---

### F12 — medium — Stale instructions pointing at UI that no longer exists

- **Screen:** `MemoryCarePassportView.tsx`, `ReminiscenceAndBridgeView.tsx`
- **Evidence:** *"Tap **"Lit Up / Sang (+Save Spark)"** in Tab 2"* — there is no "Tab 2" after the information-architecture change; the control is on the detailed care view. The spark journal's empty state pointed at the same retired labels.
- **Impact:** Instructions that cannot be followed read as a broken product, and the saved-quote feature (which prints onto the care sheet) becomes undiscoverable.
- **Correction:** instructions rewritten against the current screen and control names.

---

### F13 — medium — No accessible name on the story textarea; no pending state on submit

- **Screen:** `FamilyIntakePanel.tsx`
- **Evidence:** the `<textarea>` had a sibling `<span>` instead of a `<label for>`; the birth-year range input had a `<span>` label and no `aria-valuetext`. The submit handler was `async` with `disabled={!storyInput.trim()}` only — no in-flight state.
- **Impact:** WCAG 1.3.1 / 4.1.2 for screen-reader users; a double tap fired two parses on a slow connection with no feedback either way.
- **Correction:** real `<label for>` on both controls, `aria-valuetext` on the slider, `isWorking` state with `aria-busy`, a "Working…" label, example chips disabled while in flight. Typed text is preserved on failure.

---

### F14 — medium — Birth-year range could not represent early-onset dementia

- **Evidence:** `min={1930} max={1964}`, with hardcoded tick labels `1930 (Age 96)`, `1946 (Age 80)`, `1964 (Age 62)`.
- **Impact:** A person diagnosed in their fifties (born 1970s) could not be described at all. The hardcoded ages would also drift every year.
- **Correction:** `max` extended to 1980; tick ages computed from the current year.

---

### F15 — medium — 414 KB single JavaScript bundle, no code splitting

- **Evidence:** `dist/assets/index-*.js` = **414,388 B raw / 118,713 B gzipped**, one chunk containing every screen, both overlays, the offline engine (1,512 lines) and the full catalogue (1,231 lines). Three render-blocking Google Font families, including JetBrains Mono used only for small technical labels.
- **Impact:** On a Redmi Note 10 Pro class device over mobile data this is the difference between a usable first paint and a multi-second wait — and the splash waits on `document.fonts.ready`, so the third font family delayed the first usable frame directly.
- **Correction:** `React.lazy` for the six secondary surfaces; the offline engine imported **only** inside the API-failure path; JetBrains Mono dropped in favour of the system monospace stack. **Result measured: entry 276,430 B raw / 85,100 B gzipped (−33% raw, −28% gzipped)**, with overlays additionally deferred until first open.

---

### F16 — medium — 57 arbitrary type sizes and 14 one-off hex values

- **Evidence:** `text-[0.8125rem]` appeared **57 times**; the settling-sounds dialog carried 14 hardcoded hex values (`#111010`, `#191817`, `#131211`, `#21201E`, `#2D2B29`, `#363431`, `#2B2927`, `#1E1D1B`, `#2E2C2A`, `#2F2D2B`, `#272624`, `#201F1D`, `#151413`, `#393734`) plus `amber-*`, `rose-*`, `stone-*` and `shadow-2xl` — none of them Loam tokens.
- **Impact:** Phase 3's "avoid arbitrary one-off values" concern exactly: an off-palette dialog that cannot be re-themed, and a type size that cannot be reasoned about.
- **Correction:** one `text-meta` fontSize token; every hex mapped to a `vinyl`/`parchment`/`brass` token; `amber→brass`, `rose→clay`, `shadow-2xl→shadow-lift`, `bg-black/50→bg-vinyl-950/60`.

---

### F17 — medium — Unbreakable monospace strings can exceed a 320 px column

- **Evidence:** `geohash:{spot.geohash} · rank {n}%` in a `flex justify-between` row with no wrap and no `min-w-0`; 11 uppercase monospace eyebrows containing full API parameter strings such as `Qloo filter.release_year.min=1954 & max=1974`.
- **Impact:** Likely horizontal overflow at the narrowest tested width. **Statically assessed, not measured** — see §5.
- **Correction:** `flex-wrap` + `min-w-0` + `break-all` on the geohash pill; `break-words` on all monospace eyebrows.

---

### F18 — medium — A copied bedside link pointed at a domain that does not exist

- **Screen:** `src/utils/qrAndPassport.ts`
- **Evidence:** outside a real `http` origin (a `file://` preview or an opaque sandbox iframe) `encodeKinshipPassportLink` fell back to `https://kinship.qloo-memory.org/`.
- **Impact:** "Copy link" produced an unopenable URL in exactly the embedded-preview contexts the hackathon judges use.
- **Correction:** fallback now points at the real public deployment.

---

### F19 — low — Helpline numbers presented as verified, always-on clinical coaching

- **Evidence:** `"24/7 confidential clinical dementia coaching — never carry evening distress alone."` above eight hardcoded organisation/number pairs.
- **Impact:** Numbers Kinship does not maintain, presented with a service-level promise. Low severity because the organisations and numbers are real and well known, but the framing overclaims.
- **Correction:** restated as published support lines with an explicit instruction to check the number before relying on it.

---

### F20 — low — Server engine code shipped in the browser bundle

- **Evidence:** `src/App.tsx` imported `generateKinshipBridge` and `parseFamilyStoryToKinship` from `server/` at module scope, pulling 1,512 lines of engine plus the catalogue into the client bundle. **No credential is exposed** — the key is read from `process.env` server-side only, and `getKinshipQlooStatus()` returns a masked hint.
- **Impact:** Bundle weight (addressed in F15) and a maintainability smell; not a security leak.
- **Correction:** both moved to dynamic imports inside their failure paths.

---

### F21 — low — `POST /api/kinship-bridge` is public and unthrottled

- **Evidence:** no authentication, no rate limit; each call fans out to up to six upstream Qloo requests with 3.2–4 s timeouts.
- **Impact:** An anonymous visitor can consume hackathon API quota or induce 429s for everyone. Not a data-exposure risk (the endpoint stores nothing).
- **Correction not applied:** on Vercel's serverless runtime an in-process limiter is per-instance and therefore close to useless, so adding one would create a false sense of protection. **Recommended:** platform-level rate limiting, documented in §6.

---

## 4. Journey-level assessment (Phase 2)

| Journey | Verdict at audit time | Notes |
|---|---|---|
| First-time user understands the purpose in 5 s | **Failed** | F9: compliance prose preceded the value proposition |
| Next action obvious without instruction | **Partial** | Two buttons styled as primaries on Home; the featured card repeated the first (fixed) |
| Navigate predictably on a small phone | **Failed** | F1: back button exits the app |
| Reach an important function easily | **Passed** | Four-thumb-reach nav + header gear; passport/detail one tap from Home and Preferences |
| Portrait, narrow viewport layout | **Likely passed, unverified** | No horizontal-scroll containers found; F17 risks addressed statically |
| Larger system fonts / display scaling | **Passed (by design)** | Root font-size drives every rem step; 17/19/21 px preference persisted |
| Touch targets | **Passed** | 44 px coarse-pointer minimum globally; dialog controls enlarged in this pass |
| Forms minimise typing and decisions | **Partial** | Only five inputs, one-click examples; but F13/F14 applied |
| Recover from errors without losing work | **Failed** | F10 (session loss) and F8 (silent fallback, no retry) |
| Loading / empty / success / error states | **Partial** | Calm loading state and empty states existed; error state did not (F8) |
| Back button, refresh, session | **Failed** | F1, F10 |
| Participate without recalling facts | **Passed** | No quizzes, scores or correctness indicators anywhere; explicit "no right answers" |
| Stop an experience immediately | **Passed after F4** | Stop was always present in the UI; the dialog exit was not reliable |
| Consistent without being sterile | **Partial** | Loam identity is strong; F5/F6/F16 were the inconsistencies |
| Truthful about capabilities | **Failed** | F2, F3, F19 |
| Privacy and consent | **Partial** | Data minimisation genuinely good; consent/deletion controls absent, one claim inaccurate (F10) |

---

## 5. What could not be verified

Stated plainly, because the alternative would be fabrication:

1. **No pixel-level or layout verification.** No browser, no screenshot, no layout engine. Horizontal overflow, clipped text, overlapping elements, fixed controls covering content, keyboard-open behaviour and safe-area spacing were reasoned about from CSS and DOM structure and, where a concrete risk was found (F17), fixed defensively. **They were not measured at 320/360/393/430 px.**
2. **No physical Redmi Note 10 Pro testing.** No device, no emulator.
3. **No console-error observation.** Requires a browser.
4. **No verification of live Qloo responses in this environment.** `QLOO_API_KEY` is not present in the sandbox, so the offline path is what was exercised end-to-end. Production's live path was verified earlier the same day via `fetch_page` on `/api/health` (`connected: true`) and the rendered live banner.
5. **Focus-trap and Escape behaviour are unit-verified in structure only** (rendered attributes and the hook's source), not exercised in a live DOM.
6. **Helpline numbers were not independently re-verified** against the organisations' current published material; the copy now tells the user to check.

---

## 6. Recommended next improvements (ranked by impact ÷ effort)

| # | Recommendation | Impact | Effort |
|---|---|---|---|
| 1 | **Human device pass** on a real Android phone at 393 px and with system font scale at maximum: confirm no overflow, confirm back-button behaviour, confirm the splash timing feels right | High | Low |
| 2 | **Platform-level rate limiting** on `/api/kinship-bridge` (Vercel WAF or an upstream proxy) — F21 | High | Low |
| 3 | **Caregiver copy review by a dementia-care practitioner** for the settling-sounds dialog and the care sheet | High | Medium |
| 4 | Add `React.StrictMode` + an ESLint config (`jsx-a11y` plugin) to catch name/label regressions automatically | Medium | Low |
| 5 | Move the offline catalogue out of the client entirely (serve it from `/api/bootstrap`) to cut a further ~40 KB | Medium | Medium |
| 6 | Persist the current screen across a *device* restart via the hash (already works) plus a "resume where you left off" affordance | Medium | Low |
| 7 | Screen-reader pass with TalkBack on Android; the structural fixes are in place but untested with real AT | High | Medium |
| 8 | Add `og:image` using the approved logo for shared links | Low | Low |
| 9 | Replace the `detail` view's dense clinical layout with a progressive-disclosure pattern on phones | Medium | High |
| 10 | Localise the caregiver surfaces (Afrikaans, isiXhosa) for the Western Cape context | Medium | High |
