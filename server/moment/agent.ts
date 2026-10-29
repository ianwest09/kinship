import type { Entity, Moment, Profile, Progress } from "../../shared/moment.js";
import { resolveReferences, explore } from "./qloo.js";
import { chooseVariant } from "./gemini.js";
import { containsExcluded, suitableEntities } from "./suitability.js";

export function validateProfile(raw: any): Profile {
  const text = (v: unknown) =>
    typeof v === "string" ? v.trim().slice(0, 500) : "";
  const allowed = (v: unknown, values: readonly string[], fallback: string) =>
    values.includes(String(v)) ? String(v) : fallback;
  return {
    references: text(raw?.references),
    interests: text(raw?.interests),
    language: text(raw?.language),
    activity: allowed(
      raw?.activity,
      ["listening", "looking", "conversation", "hands-on", "quiet"],
      "conversation",
    ) as Profile["activity"],
    duration: ([5, 10, 15].includes(Number(raw?.duration))
      ? Number(raw.duration)
      : 10) as Profile["duration"],
    atmosphere: allowed(
      raw?.atmosphere,
      ["calm", "cheerful", "reflective", "playful"],
      "calm",
    ) as Profile["atmosphere"],
    avoid: text(raw?.avoid),
    practical: text(raw?.practical),
  };
}
const actions: Record<Profile["activity"], string[]> = {
  listening: [
    "If you both wish, choose something to listen to together at a comfortable volume.",
    "Sit together and, if welcome, listen to something of their choosing.",
  ],
  looking: [
    "Choose an image or object together and take a little time to look at it.",
    "Sit together with an image or object they choose, without needing to talk.",
  ],
  conversation: [
    "Share a thought about an interest they choose. Leave plenty of space for a response, or for silence.",
    "Sit together and offer a thought about an interest they choose, if conversation feels welcome.",
  ],
  "hands-on": [
    "Choose a simple, comfortable activity to do side by side, using materials already at hand.",
    "Sit side by side and explore a familiar object or material together, if they wish.",
  ],
  quiet: [
    "Sit comfortably together. Enjoy the company without needing to fill the silence.",
    "Share a quiet space together, allowing the moment to unfold at its own pace.",
  ],
};
export async function runAgent(
  raw: unknown,
  emit: (p: Progress) => void,
  opts: {
    skipQloo?: boolean;
    qlooKey?: string;
    geminiKey?: string;
    variantOffset?: number;
  } = {},
): Promise<Moment> {
  const p = validateProfile(raw);
  const qlooKey = opts.qlooKey ?? process.env.QLOO_API_KEY ?? "";
  const geminiKey = opts.geminiKey ?? process.env.GEMINI_API_KEY ?? "";
  emit({
    step: 1,
    status: "working",
    detail: "Reading the preferences you shared.",
  });
  emit({
    step: 1,
    status: "done",
    detail: "Preferences noted; no personal history inferred.",
  });
  let seeds: Entity[] = [];
  let results: Entity[] = [];
  let source: Moment["source"] = "general";
  let note = "";
  if (!qlooKey && !opts.skipQloo) {
    source = "demo";
    note = "Illustrative sample only. No Qloo request was made.";
    emit({
      step: 2,
      status: "skipped",
      detail: "Demonstration mode: no live Qloo lookup.",
    });
    emit({
      step: 3,
      status: "skipped",
      detail: "Demonstration mode: no live Qloo Insights request.",
    });
  } else if (opts.skipQloo) {
    note = "General suggestion only. Qloo was not used for this moment.";
    emit({ step: 2, status: "skipped", detail: "Continuing without Qloo." });
    emit({ step: 3, status: "skipped", detail: "Continuing without Qloo." });
  } else {
    try {
      const safeReferences = p.references
        .split(/[,;\n]+/)
        .map((s) => s.trim())
        .filter((s) => s && !containsExcluded(s, p))
        .join(", ");
      if (safeReferences) {
        emit({
          step: 2,
          status: "working",
          detail: "Searching Qloo for exact, unambiguous matches.",
        });
        seeds = await resolveReferences(
          { ...p, references: safeReferences },
          qlooKey,
        );
        emit({
          step: 2,
          status: "done",
          detail: seeds.length
            ? `Found ${seeds.length} exact, unambiguous match${seeds.length === 1 ? "" : "es"}.`
            : "No unambiguous exact match found.",
        });
      } else
        emit({
          step: 2,
          status: "skipped",
          detail: "No non-excluded cultural reference supplied for search.",
        });
      if (seeds.length) {
        emit({
          step: 3,
          status: "working",
          detail: "Exploring related entities through Qloo Insights.",
        });
        results = await explore(seeds, p, qlooKey);
        emit({
          step: 3,
          status: "done",
          detail: `Qloo Insights returned ${results.length} related ${results.length === 1 ? "entity" : "entities"}.`,
        });
      } else
        emit({
          step: 3,
          status: "skipped",
          detail: "No verified seed was available for Insights.",
        });
      const suitable = suitableEntities(results, p);
      results = suitable;
      if (results.length) {
        source = "qloo";
        note =
          "Qloo returned this cultural relationship; it does not establish anyone’s personal preference.";
      } else
        note =
          "No sufficiently relevant cultural match could be confirmed. This is a general suggestion based on the interests you supplied.";
    } catch {
      emit({
        step: seeds.length ? 3 : 2,
        status: "error",
        detail:
          "Qloo is unavailable or the request timed out. Retry or continue without Qloo.",
      });
      throw new Error(
        "Qloo is unavailable or the request timed out. Retry or continue without Qloo.",
      );
    }
  }
  emit({
    step: 4,
    status: "working",
    detail: geminiKey
      ? "Asking Gemini to choose a suitable activity template."
      : "Preparing a simple activity template.",
  });
  let variant = 0;
  let model = "A simple Kinship template was used; Gemini is not configured.";
  if (geminiKey) {
    try {
      variant = await chooseVariant(p, results.slice(0, 3), geminiKey);
      model = "Gemini selected a validated Kinship activity template.";
    } catch {
      model =
        "Gemini was unavailable or returned an invalid response; a Kinship template was used instead.";
    }
  }
  variant = (variant + (opts.variantOffset || 0)) % 2;
  emit({ step: 4, status: "done", detail: model });
  emit({
    step: 5,
    status: "working",
    detail: "Checking the suggested wording against exclusions.",
  });
  const ref =
    source === "qloo"
      ? results[(opts.variantOffset || 0) % results.length]
      : undefined;
  const interest = [p.interests, p.references]
    .flatMap((s) => s.split(/[,;\n]+/))
    .map((s) => s.trim())
    .find((s) => s && !containsExcluded(s, p));
  const focus = ref ? ref.name : interest;
  const focusAction = focus
    ? p.activity === "listening"
      ? `If you both wish, explore ${focus} together at a comfortable volume.`
      : p.activity === "looking"
        ? `If you both wish, find something to look at together related to ${focus}.`
        : p.activity === "conversation"
          ? `If it feels welcome, share a thought about ${focus}. Leave space for a response or silence.`
          : p.activity === "hands-on"
            ? `If you both wish, choose a simple hands-on activity related to ${focus}, using materials already at hand.`
            : `Sit comfortably together. If it feels welcome, share a quiet moment with ${focus}; there is no need to talk.`
    : actions[p.activity][variant];
  const moment: Moment = {
    title:
      p.activity === "quiet" ? "A little time together" : "A moment, shared",
    why: ref
      ? `Qloo found ${ref.name} in an Insights request using ${ref.seedNames?.join(" and ")}. It is an option to explore, not a statement of personal taste.`
      : `A simple invitation shaped by ${focus ? `the interest you shared, ${focus}, and ` : ""}the ${p.atmosphere} atmosphere and activity you chose.`,
    opening: variant
      ? "We can simply enjoy this time together."
      : "Would you enjoy spending a little time together?",
    invitations: [
      "What would you enjoy doing together?",
      "What do you like about this?",
    ],
    activity: focusAction,
    closing: "Thank you for sharing this moment with me.",
    adaptation:
      "Follow their lead. If they seem uncomfortable or decline, pause, change course or stop. Silence is always welcome. Review any practical preferences before beginning.",
    duration: p.duration,
    source,
    reference: ref,
    note,
    model,
  };
  if (containsExcluded(JSON.stringify(moment), p)) {
    emit({
      step: 5,
      status: "error",
      detail:
        "We could not create wording that avoids every exclusion. Try a different activity or revise the exclusions.",
    });
    throw new Error(
      "We could not create wording that avoids every exclusion. Try a different activity or revise the exclusions.",
    );
  }
  emit({
    step: 5,
    status: "done",
    detail:
      "Checked for the exact exclusion phrases supplied. Please review for context before sharing.",
  });
  return moment;
}
