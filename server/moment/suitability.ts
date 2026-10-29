import type { Entity, Profile } from "../../shared/moment.js";
export function exclusions(profile: Profile): string[] {
  return profile.avoid
    .split(/[,;\n]+/)
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}
export function containsExcluded(text: string, profile: Profile): boolean {
  const lower = text.toLowerCase();
  return exclusions(profile).some((x) => lower.includes(x));
}
// Names alone cannot establish language or subject-matter safety. Be conservative.
export function suitableEntities(items: Entity[], profile: Profile): Entity[] {
  if (
    profile.language.trim() ||
    profile.avoid.trim() ||
    profile.practical.trim()
  )
    return [];
  return items.filter((item) => !containsExcluded(item.name, profile));
}
