import type { Entity, Profile } from "../../shared/moment.js";
const BASE = "https://hackathon.api.qloo.com";
const types = new Set([
  "urn:entity:artist",
  "urn:entity:movie",
  "urn:entity:tv_show",
  "urn:entity:book",
  "urn:entity:podcast",
]);
function entities(data: unknown): Entity[] {
  const root = data as any;
  const items =
    root?.results?.entities ?? root?.results ?? root?.entities ?? [];
  if (!Array.isArray(items)) return [];
  return items.flatMap((x: any) => {
    const id = x?.entity_id ?? x?.id;
    const type = x?.type ?? x?.subtype;
    return typeof id === "string" &&
      typeof x?.name === "string" &&
      typeof type === "string" &&
      types.has(type)
      ? [{ id, name: x.name, type }]
      : [];
  });
}
async function get(
  path: string,
  params: Record<string, string>,
  key: string,
): Promise<unknown> {
  const url = new URL(path, BASE);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const response = await fetch(url, {
    headers: { "X-Api-Key": key, accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 404 && path === "/search")
    return { results: { entities: [] } };
  if (!response.ok) throw new Error("Qloo could not complete the request.");
  return response.json();
}
const normalize = (s: string) =>
  s.trim().toLocaleLowerCase().replace(/\s+/g, " ");
export async function resolveReferences(
  profile: Profile,
  key: string,
): Promise<Entity[]> {
  const terms = profile.references
    .split(/[,\n;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  const resolved: Entity[] = [];
  for (const term of terms) {
    const found = entities(
      await get("/search", { query: term, take: "10" }, key),
    );
    // Only an unambiguous exact name match is accepted. No fuzzy or top-result guessing.
    const exact = found.filter((e) => normalize(e.name) === normalize(term));
    if (exact.length === 1) resolved.push(exact[0]);
  }
  return resolved;
}
export async function explore(
  seeds: Entity[],
  profile: Profile,
  key: string,
): Promise<Entity[]> {
  if (!seeds.length) return [];
  const category =
    profile.activity === "listening"
      ? "urn:entity:artist"
      : profile.activity === "looking"
        ? "urn:entity:movie"
        : seeds[0].type;
  const data = await get(
    "/v2/insights",
    {
      "filter.type": category,
      "signal.interests.entities": seeds.map((s) => s.id).join(","),
      take: "10",
    },
    key,
  );
  return entities(data)
    .filter((e) => e.type === category && !seeds.some((s) => s.id === e.id))
    .map((e) => ({ ...e, seedNames: seeds.map((s) => s.name) }));
}
