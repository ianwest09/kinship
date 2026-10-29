# Kinship: Moments of Connection

*A familiar interest. A meaningful moment. A little closer together.*

Kinship is a small, mobile-first companion for families and caregivers to turn explicitly supplied cultural interests into an invitation to spend time together. It is not a medical device, memory test, treatment, or substitute for professional care. A person may decline, change or stop an activity at any time. **This prototype is for fictional information only; do not enter real patient, personal or medical information.**

## Start locally

Requires Node.js 22 or later and npm.

```sh
npm ci
cp .env.example .env
# Optionally set QLOO_API_KEY and GEMINI_API_KEY in .env on the server only
npm run dev
```

Open `http://localhost:3000`. Without a Qloo key, the banner identifies **demonstration mode** and no Qloo calls are made. “Explore an example” uses a fictional profile. You can also use the form without an account. `npm run build` and `npm start` run the production build locally. Do not commit `.env`; `.env.example` has placeholders only. Restart the server after changing secrets.

A Qloo hackathon key is obtained through the [Qloo hackathon developer guide](https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide). The server uses the documented `https://hackathon.api.qloo.com` host. A Gemini API key and access to `gemini-2.5-flash` are optional. Model availability, quotas, and free-tier terms depend on the provider and account; no billing is set up by this project. Never enter secrets in the browser or a public repository.

## What works

- A short profile with optional references, interests, language, activity, duration, atmosphere, exclusions and practical preferences; no account or diagnosis field.
- A streamed, five-step status display reporting completed, skipped and failed operations. Failed Qloo calls offer retry or an explicitly non-Qloo suggestion.
- Conservative entity resolution, Qloo Insights requests, provenance, and a clearly labelled general fallback. No synthetic IDs or affinity scores are used in the active workflow.
- A structured Gemini template selection when configured; a labelled deterministic template fallback otherwise. The generated card contains an opening, shared activity, invitations, closing and stop/adapt advice.
- Save, remove and clear moments in browser local storage, with session-only fallback if storage is unavailable. Local storage is limited to 20 saved cards.
- Responsive layouts, labelled controls, keyboard focus, touch targets, reduced-motion support, and no autoplay.

## How the agent uses Qloo

The server emits actual workflow events as newline-delimited JSON over `POST /api/moment`:

1. Normalise the supplied profile. It does not infer preferences from age, diagnosis, ethnicity or location.
2. Split up to three comma-, semicolon- or newline-separated cultural references. For each non-excluded reference, call Qloo's documented **GET `/search`** with `query` and `take`, using `X-Api-Key`. Only a single exact, case-insensitive name match with a supported returned type and ID is accepted; ambiguous and fuzzy matches are not guessed. A search 404 is treated as no match.
3. With verified IDs, call documented **GET `/v2/insights`** with `filter.type`, `signal.interests.entities`, and `take`. Listening asks for artists; looking asks for movies; other activities use the first seed's supported type. Multiple verified seeds are submitted together, not separately compared. Returned ID, name, type and seed names are retained. Neither `/recommendations` nor `/recs` is used. See the [hackathon guide](https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide), [search reference](https://docs.qloo.com/reference/get-search) and [entity type parameter guide](https://docs.qloo.com/reference/available-parameters-by-entity-type).
4. If configured, Gemini receives the preferences and verified candidate entities and returns structured JSON selecting one of two prewritten activity variants. The server validates the selection and assembles the card from controlled templates; Gemini does **not** generate free-form final prose or establish facts about Qloo entities. Invalid output, timeout or provider errors use a labelled template fallback. No internal reasoning is shown.
5. Exact exclusion phrases are checked against the assembled card. If the card contains one, the workflow stops and offers recovery. The check cannot understand synonyms or context; a caregiver must review the whole suggestion and any cultural item. Because name-only Qloo results cannot verify subject matter, language or practical suitability, cultural recommendations are suppressed when any exclusion, preferred language or practical preference is supplied. The result then clearly says it is a general suggestion.

A Qloo relationship is not proof that an individual likes, remembers or has experienced an item. When no sufficiently relevant match is found, the general suggestion uses only the supplied interests; demonstration mode is never described as a successful live lookup. Cultural-item links are search links, not assertions that content is available or licensed.

## Privacy and limitations

- The form is transmitted to the Kinship server for the current request, and is not intentionally stored in a Kinship database. When configured, references are sent to Qloo and preferences plus verified entities to Gemini; their own processing and retention policies apply. Do not submit sensitive data. There are no accounts, analytics, audio recording or location collection.
- Saved cards remain in the browser's local storage until removed, cleared, or browser data is deleted. The privacy screen clears Kinship-prefixed local storage. If local storage is blocked, the session can continue but saves do not persist.
- The interface and template prose are currently English only; a preferred language does not translate the activity. Practical preferences must be reviewed by the caregiver and are not mechanically enforced beyond the conservative suppression of cultural results.
- Exclusion checks are literal, not a complete safety filter; the caregiver must review each suggestion. Metadata returned by Qloo is not enough to verify themes or availability. Qloo may not resolve a song title as a supported Insights seed. The app intentionally falls back rather than inventing a match.
- Gemini currently chooses from two controlled templates rather than producing fully free-form personalised prose. “Try another suggestion” switches the template and, where possible, the returned Qloo reference; it is not a guarantee of a wholly different activity.
- A provider key being configured is not a claim of successful access. Live status is attributed only to a successfully returned and selected Qloo Insights entity.

## Architecture and deployment

`src/App.tsx` and `src/index.css` contain the UI; `shared/moment.ts` defines the data model; `server/moment/` contains the Qloo client, Gemini client, orchestration and suitability checks; `server/apiRouter.ts` exposes the current API. The original repository's clinical-style prototype, its unused modules and historical reports remain in the tree for reference, but the active entrypoint and API no longer expose those routes or claims. Historical reports do **not** describe the current application.

The existing Vite/React + Express structure is retained rather than migrating to Next.js. `vercel.json` routes `/api/*` to `api/index.ts` and serves the Vite output. For Vercel-compatible hosting, import the repository, use `npm run build` and output directory `dist`, and set server-side environment variables through the host's secret settings. Check current provider free-tier limits and streaming/function time limits before deployment; if billing is required, use local hosting or another genuinely free host instead. No deployment or paid service has been activated. Streaming can be buffered by some hosts, in which case progress may arrive together at the end.

## Checks

```sh
npm run typecheck
npm run build
npm test
```

The current test suite exercises the no-key path, mocked successful Qloo responses, ambiguous and empty matches, timeout, malformed Gemini output, exclusions, and a DOM-simulated example-to-save/remove journey against the real local HTTP API. The DOM simulation sets a 360px viewport but does **not** validate browser rendering or layout. There is no lint script configured. The prior prototype's tests remain available as `npm run test:legacy`; many assert the retired UI and routes and are not acceptance tests for this version. On this build the old suite was run and reported 20 failures, mostly obsolete expectations.

Live Qloo/Gemini calls require valid credentials and outbound access to the provider hosts. They were not verified in the build environment. A real mobile-browser layout and touch test is still needed; the available headless Chromium could not start because system NSS libraries were missing. Do not treat the mocked Qloo test or the DOM simulation as live-provider or browser-layout verification.

## License

MIT; see [LICENSE](LICENSE).
