import test from "node:test";
import assert from "node:assert/strict";
import { runAgent } from "../server/moment/agent";
import { emptyProfile, type Progress } from "../shared/moment";
const profile = {
  ...emptyProfile,
  references: "Artist One",
  activity: "listening" as const,
};
const original = globalThis.fetch;
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

test("missing keys: unmistakable demo, no invented Qloo entities or calls", async () => {
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    throw Error();
  };
  try {
    const events: Progress[] = [];
    const m = await runAgent(profile, (p) => events.push(p), {
      qlooKey: "",
      geminiKey: "",
    });
    assert.equal(m.source, "demo");
    assert.equal(m.reference, undefined);
    assert.equal(called, false);
    assert.match(m.activity, /Artist One/);
    assert.equal(events.find((e) => e.step === 2)?.status, "skipped");
  } finally {
    globalThis.fetch = original;
  }
});
test("Qloo resolution and Insights use returned IDs and truthful provenance", async () => {
  const calls: URL[] = [];
  globalThis.fetch = async (input) => {
    const u = new URL(String(input));
    calls.push(u);
    return u.pathname === "/search"
      ? json({
          results: [
            {
              entity_id: "verified-seed",
              name: "Artist One",
              type: "urn:entity:artist",
            },
          ],
        })
      : json({
          results: {
            entities: [
              {
                entity_id: "verified-result",
                name: "Artist Two",
                type: "urn:entity:artist",
              },
            ],
          },
        });
  };
  try {
    const events: Progress[] = [];
    const m = await runAgent(profile, (p) => events.push(p), {
      qlooKey: "test-key",
      geminiKey: "",
    });
    assert.equal(m.source, "qloo");
    assert.equal(m.reference?.id, "verified-result");
    assert.match(m.activity, /Artist Two/);
    assert.equal(calls[1].pathname, "/v2/insights");
    assert.equal(
      calls[1].searchParams.get("signal.interests.entities"),
      "verified-seed",
    );
    assert.equal(
      events.find((e) => e.step === 3 && e.status === "done")?.status,
      "done",
    );
  } finally {
    globalThis.fetch = original;
  }
});
test("ambiguous exact matches and empty sets do not become Qloo recommendations", async () => {
  globalThis.fetch = async () =>
    json({
      results: [
        { entity_id: "a", name: "Artist One", type: "urn:entity:artist" },
        { entity_id: "b", name: "Artist One", type: "urn:entity:artist" },
      ],
    });
  try {
    const m = await runAgent(profile, () => {}, {
      qlooKey: "key",
      geminiKey: "",
    });
    assert.equal(m.source, "general");
    assert.match(m.note, /No sufficiently relevant/);
  } finally {
    globalThis.fetch = original;
  }
});
test("empty Insights set is a general suggestion", async () => {
  globalThis.fetch = async (input) =>
    new URL(String(input)).pathname === "/search"
      ? json({
          results: [
            { entity_id: "a", name: "Artist One", type: "urn:entity:artist" },
          ],
        })
      : json({ results: { entities: [] } });
  try {
    const m = await runAgent(profile, () => {}, {
      qlooKey: "key",
      geminiKey: "",
    });
    assert.equal(m.source, "general");
    assert.equal(m.reference, undefined);
  } finally {
    globalThis.fetch = original;
  }
});
test("Qloo failure or timeout fails visibly rather than inventing data", async () => {
  globalThis.fetch = async () => {
    throw new DOMException("timeout", "TimeoutError");
  };
  const events: Progress[] = [];
  try {
    await assert.rejects(
      runAgent(profile, (p) => events.push(p), {
        qlooKey: "key",
        geminiKey: "",
      }),
      /unavailable or the request timed out/,
    );
    assert.equal(events.at(-1)?.status, "error");
  } finally {
    globalThis.fetch = original;
  }
});
test("malformed Gemini JSON falls back to a labelled template", async () => {
  globalThis.fetch = async () =>
    json({ candidates: [{ content: { parts: [{ text: "not json" }] } }] });
  try {
    const m = await runAgent(profile, () => {}, {
      qlooKey: "",
      geminiKey: "key",
    });
    assert.match(m.model, /invalid response/);
    assert.equal(m.source, "demo");
  } finally {
    globalThis.fetch = original;
  }
});
test("exclusions prevent unsuitable output, and constraints suppress unverified cultural items", async () => {
  globalThis.fetch = async (input) =>
    new URL(String(input)).pathname === "/search"
      ? json({
          results: [
            { entity_id: "a", name: "Artist One", type: "urn:entity:artist" },
          ],
        })
      : json({
          results: {
            entities: [
              { entity_id: "b", name: "Artist Two", type: "urn:entity:artist" },
            ],
          },
        });
  try {
    const m = await runAgent({ ...profile, avoid: "Artist Two" }, () => {}, {
      qlooKey: "key",
      geminiKey: "",
    });
    assert.equal(m.source, "general");
    assert.doesNotMatch(JSON.stringify(m), /Artist Two/i);
    await assert.rejects(
      runAgent({ ...profile, avoid: "together" }, () => {}, {
        qlooKey: "",
        geminiKey: "",
      }),
      /avoids every exclusion/,
    );
  } finally {
    globalThis.fetch = original;
  }
});
