import type { Entity, Profile } from "../../shared/moment.js";
export async function chooseVariant(
  profile: Profile,
  entities: Entity[],
  key: string,
): Promise<number> {
  const prompt = `Choose a suitable activity template for a respectful shared moment. Return JSON only: {"variant":0} or {"variant":1}. 0 is a gentle invitation to explore together; 1 is a quieter invitation to simply share the moment. Consider the preferences and exclusions. Do not diagnose or infer memories. Do not add names or facts. Input: ${JSON.stringify({ profile, verifiedQlooEntities: entities })}`;
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: { variant: { type: "INTEGER" } },
            required: ["variant"],
          },
        },
      }),
      signal: AbortSignal.timeout(12000),
    },
  );
  if (!response.ok) throw new Error("Language model unavailable");
  const data = (await response.json()) as any;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") throw new Error("Empty model response");
  const parsed = JSON.parse(text);
  if (parsed?.variant !== 0 && parsed?.variant !== 1)
    throw new Error("Invalid model response");
  return parsed.variant;
}
