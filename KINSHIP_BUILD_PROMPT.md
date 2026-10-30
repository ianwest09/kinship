# Detailed Build Prompt — Kinship

Use the following prompt with a capable coding agent or app-generation system.

---

## Role and mission

You are a senior product designer, accessibility specialist, and full-stack TypeScript engineer. Build a production-ready web application called **Kinship: A Taste-Grounded Companion for Familiar Moments**.

Kinship is a dementia-support prototype for people living with dementia and the family members, friends, or care partners they choose. It turns **person-approved cultural preferences** into optional ideas for music, screen content, conversation, and shared activities that can make it easier to begin a familiar moment together.

The product must preserve the person’s agency and dignity. It must never test memory, diagnose, assess cognition, present recommendations as verified memories, or imply that a cultural suggestion is treatment. Every suggestion is an invitation that can be skipped, rejected, edited, or removed.

Treat these principles as non-negotiable:

1. **Person first, recommendation second.** The person or family supplies the initial cultural clues. Do not infer dementia, identity, clinical needs, or personal history from taste data.
2. **Suggestions are not facts.** Label ideas as optional and make their source visible.
3. **No memory testing.** Avoid “Do you remember…?”, quizzes, scores, countdown pressure, correctness language, or prompts that demand recall.
4. **Easy refusal.** Include calm actions such as “Not for us today,” “Try something else,” “Stop for now,” and “Remove suggestion.”
5. **Honest provenance.** Clearly distinguish live Qloo results from Kinship’s curated offline demonstration material.
6. **Privacy by default.** Do not send health details, diagnoses, free-form private family notes, uploaded photos, or personally identifying care data to Qloo. Keep private notes and saved profiles on-device unless the user explicitly chooses another storage model.
7. **No clinical claims.** Describe Kinship as a supportive cultural companion and prototype—not a medical device, treatment, safety system, or clinically validated intervention.

## Product outcome

Create a calm, responsive application in which a user can:

- add or select a loved one and a companion/care partner;
- enter a small number of approved cultural interests and practical preferences;
- generate a low-pressure “Connection Moment” grounded in Qloo taste signals when live Qloo is available;
- inspect why an idea was suggested and where it came from;
- use optional in-session tools such as a gentle timer, ambient sound, and read-aloud guidance;
- save, revisit, print, or remove moments;
- record private, on-device reflections;
- understand and clear all locally stored data.

The primary success criterion is not “engagement.” It is whether the app gives two people a respectful, understandable, low-pressure way to spend a few minutes together.

## Information architecture

Use five plain-language destinations:

1. **Home** — welcoming overview, saved people, sample profiles, and recent moments.
2. **Discover** — profile builder and taste-grounded suggestion workflow.
3. **Together** — the active Connection Moment, presented in large, simple, side-by-side-friendly form.
4. **Family** — manage loved-one and companion profiles and prepare printable handover material.
5. **Preferences** — reading size, motion, sound, privacy, provenance explanation, disclaimers, and clear-local-data controls.

On desktop, use a restrained top navigation. On mobile, use a four-item bottom navigation for the primary destinations and place Preferences in a clearly accessible menu. Maintain at least 44×44 px touch targets and safe-area padding.

If preserving the source app’s naming is preferable, map its existing tabs as follows:

- Welcome → Home
- Create → Discover / Together depending on workflow state
- Saved → Family or a Saved section within Home
- How it works → Preferences / About
- Privacy → Preferences / Privacy

## Core user journey

### 1. Home

Design a warm hero with the title **“Gentle moments, shaped around the person.”** Explain in one short paragraph that Kinship uses preferences the person or family chooses to provide and that every result is optional.

Primary actions:

- **Create a moment**
- **Choose a person**
- **Try a sample profile**

Show:

- saved people with dignified illustrated avatar fallbacks;
- recent saved moments;
- three sample profiles representing different cultural contexts, clearly marked as fictional demonstration data;
- a short privacy reassurance: “Private details stay on this device. Only approved cultural clues are used for taste matching.”

Sample profiles may include a jazz and gardening profile, an acoustic folk and coastal-craft profile, and a bolero, courtyard-cooking, and herb-garden profile. Never present demographic stereotypes as personalized truth.

### 2. Person and companion profile builder

Split the form into understandable sections.

**Loved one**

- preferred name;
- optional illustrated avatar or local image upload;
- age or age range (optional; explain why it is requested);
- formative cultural era, entered by the user rather than inferred;
- nationality or cultural context (optional, free-text, user-controlled);
- preferred language.

**Companion / care partner**

- preferred name;
- relationship;
- optional age or age range;
- nationality/cultural context (optional);
- optional avatar.

**Shared cultural clues**

- primary interest;
- additional interests as removable chips;
- examples: artist, song, film, television program, book, hobby, food tradition, place, sport, craft;
- explicit instruction to enter only information the person or family is comfortable using for recommendations.

**Session shape**

- activity type: listening, looking, conversation, hands-on, or quiet companionship;
- desired atmosphere: calm, cheerful, reflective, or playful;
- duration: 5, 10, or 15 minutes;
- “please avoid” exclusions;
- practical preferences such as low volume, seated activity, limited steps, or no screen;
- a clear consent checkbox confirming that the cultural clues may be sent to the taste service, while private profile details and notes are not.

Use progressive disclosure. Do not overwhelm the user with the entire form at once. Validate gently and never frame incomplete fields as failure.

### 3. Generation workflow

After submission, display an understandable five-step process rather than a generic spinner:

1. **Understanding the people** — use only user-provided preferences and session constraints.
2. **Resolving the cultural reference** — match approved clues to canonical Qloo entities.
3. **Exploring related culture** — retrieve supported related entities and possible cross-generational overlap.
4. **Composing the shared activity** — create a short opening, sensory action, optional conversation invitations, and closing.
5. **Dignity and exclusions check** — remove memory-testing language, respect exclusions, check provenance, and confirm that everything is optional.

Each step needs pending, active, complete, and failed states. Offer **Cancel** and **Try again**. Never fake completed network work. If Qloo fails, either stop with an honest error or switch to the offline collection only after clearly labeling the change.

### 4. Connection Moment

Present one focused moment with large type and minimal controls. Include:

- moment title;
- a one-sentence reason it was selected;
- provenance badge: **Live Qloo Taste AI**, **Kinship offline collection**, or **User-provided clue**;
- cultural reference name, category, optional Qloo entity ID, and a plain-language relationship note;
- **Opening invitation** that does not demand recall;
- two or three **Gentle invitations** written as observations or choices rather than questions with correct answers;
- **Shared activity** with simple steps;
- optional sensory companions such as visual atmosphere, texture, scent, or beverage, clearly presented as user-checkable ideas—not safety or medical guidance;
- **Closing** that allows the moment to end naturally;
- short care-partner note;
- visible actions: **Save**, **Try something else**, **Not for us today**, **Edit preferences**, **Stop for now**, and **Print handover**.

Example language:

- Good: “This melody has a soft, unhurried rhythm. We could listen together for a minute.”
- Good: “Would quiet music or looking through the album cover feel better today?”
- Avoid: “Do you remember this song from 1962?”
- Avoid: “This will calm agitation.”

Add an expandable **Why this suggestion?** panel that shows:

- which user-approved clue seeded the result;
- which information came from Qloo;
- which wording was composed by Kinship;
- whether fallback data was used;
- that affinity does not prove preference or memory.

### 5. Optional together-mode tools

Include only opt-in tools and keep them visually secondary:

- a gentle 5/10/15-minute timer with pause, add/subtract one minute, and no alarming countdown styling;
- ambient sound generator with subtle rain, breeze, hearth, chimes, or vinyl-like room tone; start muted and never autoplay;
- browser speech synthesis for reading guidance aloud, with pause/stop and language/voice selection when supported;
- simple cultural bridge visualization showing the user-provided seed, related entity, and sensory/activity idea without implying clinical causation;
- reduced-motion support and an immediate “Stop all sound” action.

Do not use copyrighted audio recordings unless properly licensed. Generated ambient tones must be described accurately.

### 6. Saved moments and private reflection

Save locally using versioned keys and validated schemas. Include:

- saved moment cards with person, date, duration, provenance, and activity type;
- reopen, print, and remove actions;
- private reflection field: “What felt comfortable? What would you change next time?”;
- an optional 1–5 “felt comfortable” rating, explicitly described as the companion’s private reflection—not a cognitive, mood, or health score;
- a small trend view only if enough entries exist, titled **“Your reflections over time”** rather than implying measured wellbeing;
- per-item deletion and a clear-all control with confirmation.

Do not claim that attention, laughter, posture, or a rating measures clinical improvement.

### 7. Family and handover

Support multiple saved people. Provide:

- add, edit, select, and remove;
- local image upload with a dignified SVG avatar fallback;
- clear indication of which profile is active;
- a printable one-page Connection Moment card containing only the minimum information needed for the activity;
- blank space for handwritten observations;
- no QR code or cloud sharing unless its privacy behavior is fully implemented and explained.

The printed card must repeat: “Optional cultural suggestion—not a verified memory, assessment, or treatment.”

### 8. Preferences, privacy, and about

Include:

- reading size: Normal, Large, Largest;
- reduced motion / minimal animation;
- sound defaults, always off by default;
- provenance explainer;
- list of what is stored locally;
- clear-local-data controls;
- disclaimer;
- concise “How Kinship works” explanation.

Use this disclaimer or equivalent:

> Kinship is a supportive cultural companion and prototype. It is not a medical device, diagnostic product, cognitive assessment, treatment, emergency service, or substitute for professional care. A recommendation is not proof of a person’s memory, preference, identity, or likely response.

## Qloo integration

Implement Qloo server-side. Never expose or accept the Qloo API key in client code.

Required environment variables:

- `QLOO_API_KEY`
- `QLOO_BASE_URL`, defaulting to the documented hackathon endpoint

Use only documented Qloo capabilities and parameters supported by the current API:

1. **Search** to resolve user-approved cultural clues to canonical entity IDs.
2. **`GET /v2/insights`** for supported cultural entity types and related suggestions.
3. **`/v2/analysis/compare`** to compare two sets of approved interests for possible cross-generational overlap.

Implementation rules:

- make requests from the server only;
- use flat dot-notation query parameters where required by the Qloo endpoint;
- validate all inputs with an explicit allowlist of supported fields and entity types;
- apply timeouts, abort handling, bounded retries, and response-shape validation;
- do not send names, ages, relationship labels, diagnosis, exclusions, private notes, images, or raw family stories to Qloo;
- send only the minimum cultural query needed for entity resolution or comparison;
- log no secrets and no private profile content;
- return a normalized result with `mode`, `source`, `entityId`, `entityType`, `relationship`, and `explanation` fields;
- when live Qloo is unavailable, use a curated Kinship collection only if the response mode is explicitly `offline_kinship_collection`;
- never label offline content as Qloo output;
- never simulate live Qloo calls or show fake verification badges.

Provide these server routes:

- `GET /api/health` — reports service readiness and whether Qloo is configured, never the key;
- `POST /api/entities/resolve` — resolves a minimal cultural clue;
- `POST /api/insights` — returns normalized related cultural entities;
- `POST /api/compare` — returns normalized overlap between two approved interest sets;
- `POST /api/connection-moment` — orchestrates the full workflow and returns provenance per field;
- `GET /api/mcp/tools` and `POST /api/mcp/call` — a small MCP-compatible surface for the same bounded workflows, with the same privacy and provenance rules.

If an existing Kinship server engine is available, reuse and refactor it rather than replacing it with browser-only demonstration logic. If starting from the uploaded standalone app, replace its local “Qloo-style graph” wording with honest **Kinship offline collection** wording and connect the production path to the server routes above.

## Suggested data contracts

Use strict TypeScript types similar to:

```ts
type SourceMode = "live_qloo" | "offline_kinship_collection" | "user_provided";
type ActivityType = "listening" | "looking" | "conversation" | "hands-on" | "quiet-companionship";
type Atmosphere = "calm" | "cheerful" | "reflective" | "playful";
type DurationMinutes = 5 | 10 | 15;

interface CulturalProfile {
  person: {
    preferredName: string;
    ageRange?: string;
    formativeEra?: string;
    culturalContext?: string;
    preferredLanguage?: string;
    avatarUrl?: string; // local-only
  };
  companion: {
    preferredName: string;
    relationship?: string;
    culturalContext?: string;
    avatarUrl?: string; // local-only
  };
  approvedClues: string[];
  activityType: ActivityType;
  atmosphere: Atmosphere;
  durationMinutes: DurationMinutes;
  exclusions: string[];
  practicalPreferences: string[];
  tasteServiceConsent: boolean;
}

interface Provenance {
  mode: SourceMode;
  label: string;
  seedClue?: string;
  entityId?: string;
  entityType?: string;
  explanation: string;
}

interface ConnectionMoment {
  id: string;
  title: string;
  selectionRationale: string;
  openingInvitation: string;
  gentleInvitations: string[];
  sharedActivity: string;
  closing: string;
  companionNote: string;
  durationMinutes: DurationMinutes;
  provenance: Provenance[];
  dignityChecks: Array<{ label: string; passed: boolean; detail: string }>;
  createdAt: string;
}
```

Separate local-only profile data from the minimal request DTO sent to Qloo.

## Visual direction

Use a calm editorial system rather than a generic dashboard.

- Warm paper background around `#F4F0E8` or `#FAF8F5`.
- White or cream cards with thin warm-gray borders.
- Soft charcoal text around `#353432` / deep green ink around `#14261C`.
- Muted sage for supporting elements; ensure actual contrast passes WCAG AA.
- Soft blue or another clearly visible 3:1+ focus indicator.
- Deep green primary actions around `#1B4332` with white text.
- Rounded corners used consistently, subtle shadows only where hierarchy requires them.
- No glassmorphism-heavy, neon, gamified, or hospital-dashboard aesthetic.
- Root text approximately 17 px; use rem units so reading preferences scale type and spacing together.
- Keep line length around 60–75 characters for instructional copy.
- Do not use tiny 9–11 px body copy; metadata still needs to be readable.

Use simple line icons with text labels. Never rely on color alone. Use calm, brief transitions and fully disable nonessential motion under `prefers-reduced-motion`.

## Accessibility requirements

Meet WCAG 2.2 AA as a minimum:

- semantic landmarks and heading order;
- keyboard-operable flows with visible focus;
- skip link;
- correctly associated labels, hints, errors, and required state;
- polite live regions for workflow progress and network status;
- dialogs with focus trapping, Escape handling, initial focus, and focus return;
- minimum 44×44 px coarse-pointer targets;
- no autoplay audio;
- no time limit required to complete a task;
- content remains usable at 200% zoom and in Largest reading mode;
- reduced-motion support;
- screen-reader labels for icons, charts, timers, avatars, and status badges;
- print stylesheet for the one-page handover card.

Test with keyboard-only navigation and at least one screen reader workflow.

## Security and privacy requirements

- API key stays server-side in environment variables.
- Add secure headers and a restrictive Content Security Policy compatible with the app.
- Validate request sizes, content types, and schemas.
- Rate-limit public generation endpoints.
- Abort slow upstream calls and bound retries.
- Do not persist server-side profile data or Qloo requests containing user details.
- Do not use analytics, trackers, or third-party fonts by default.
- Sanitize any user-controlled content rendered into print views.
- Treat uploaded avatar images as local browser data; validate file type/size and never upload without explicit consent.
- Make clearing local data complete and verifiable.

## Technical stack

Preferred stack:

- React + TypeScript + Vite;
- Node.js + Express or the repository’s existing serverless Express adapter;
- Tailwind CSS or the existing CSS/token system;
- Lucide icons;
- minimal animation library, optional;
- native Web Audio and Web Speech APIs only as progressive enhancements;
- no unnecessary database for the prototype;
- localStorage or IndexedDB behind a versioned repository layer with runtime validation;
- Vercel-compatible deployment.

Preserve the repository’s current build and API architecture if one already exists. Do not downgrade a working live Qloo server integration into a client-only mock.

## Error, empty, and offline states

Design explicit states for:

- no saved people;
- no saved moments;
- incomplete cultural clues;
- no Qloo entity match;
- Qloo timeout;
- Qloo configured but malformed response;
- offline browser;
- local storage blocked or full;
- speech synthesis unavailable;
- audio unavailable;
- print unavailable;
- reduced-motion preference;
- result removed or declined.

Copy must be calm and actionable. Example: “We couldn’t find a reliable match for that clue. Try a more specific artist, title, or place—or continue without a suggestion.”

## Testing requirements

Add automated tests for:

1. provenance labels never call offline items Qloo results;
2. private profile fields are excluded from Qloo request DTOs;
3. API keys cannot appear in client bundles or API responses;
4. every generated moment contains a neutral exit and no memory-testing language;
5. exclusions are respected;
6. local data can be saved, loaded, version-migrated, removed individually, and fully cleared;
7. Qloo timeout and invalid-response fallbacks are honest;
8. core screens render at mobile and desktop widths;
9. keyboard navigation and dialog focus behavior;
10. reading-size and reduced-motion preferences persist;
11. print output contains the disclaimer and omits private reflection notes by default;
12. server routes validate schemas and rate limits;
13. typecheck, unit tests, and production build pass.

Include a small set of fictional fixtures. Never place real personal or health data in tests.

## Documentation and delivery

Deliver:

- complete application source;
- `.env.example` with variable names only;
- setup, test, build, and deploy instructions;
- API route documentation;
- data-flow/privacy diagram showing exactly what stays local and what may be sent to Qloo;
- provenance explanation;
- accessibility notes and manual test checklist;
- known limitations;
- public-facing disclaimer;
- MIT license if this is a hackathon submission.

The README and submission copy must accurately match the deployed build. Do not claim live Qloo functionality unless the deployed end-to-end path has been tested from a clean browser and visibly returns `live_qloo` provenance.

## Acceptance criteria

The work is complete only when:

- a first-time user can create a Connection Moment without training;
- all recommendations can be skipped, corrected, or removed;
- no prompt tests memory or pressures the person to respond;
- live and offline provenance are unmistakable at card and workflow level;
- only approved cultural clues leave the browser for Qloo;
- the app works without audio, animation, login, or a database;
- mobile navigation, Largest text, keyboard access, and print mode are usable;
- health, privacy, error, and offline states are honest;
- no clinical efficacy, safety, medication, neurological, or measured-outcome claims appear;
- `npm run typecheck`, tests, and production build pass;
- the public deployment, health route, Qloo-backed judge flow, repository, and license are verified before submission.

## Final instruction

Before writing code, inspect the existing source and identify which capabilities already exist. Reuse good interaction patterns such as the local saved-person manager, avatar fallbacks, five-step workflow, Connection Moment card, timer, ambient sound, speech narration, cultural bridge visualizer, private reflections, and printable handover. Replace any unsupported or overconfident claims. Then provide a brief implementation plan, implement in small testable increments, and finish with a factual report of what works, what is fallback-only, and what still needs validation.
