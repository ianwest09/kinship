/**
 * Hash routing.
 *
 * Why this exists
 * ---------------
 * Screens used to live only in React state. On a phone that means the system
 * back button — the single most used navigation control on Android — left
 * Kinship completely instead of returning to the previous screen. A caregiver
 * who tapped Home → Discover → back was thrown out of the app and had to start
 * again.
 *
 * A hash route fixes that without adding a router dependency, and without
 * touching the server: `#/discover` needs no rewrite rules and survives a
 * refresh, so a reloaded phone lands on the screen the person was on.
 *
 * Compatibility
 * -------------
 * The bedside passport already puts its payload in the hash as `#kinship=<b64>`
 * and printed QR codes in the field contain that exact URL. That format is
 * preserved byte-for-byte: a hash containing `kinship=` still decodes, and a
 * route may be combined with it (`#/passport&kinship=<b64>`) so the address bar
 * can be copied by hand without losing the screen you are on.
 */

export type RouteId =
  | 'home'
  | 'discover'
  | 'together'
  | 'family'
  | 'passport'
  | 'detail'
  | 'operators'
  | 'settings';

export const ROUTE_IDS: readonly RouteId[] = [
  'home',
  'discover',
  'together',
  'family',
  'passport',
  'detail',
  'operators',
  'settings',
] as const;

export const DEFAULT_ROUTE: RouteId = 'home';

function isRouteId(value: string): value is RouteId {
  return (ROUTE_IDS as readonly string[]).includes(value);
}

/**
 * Read the current screen out of a location hash.
 *
 * Accepts `#/discover`, `#discover` and `#/discover&kinship=…`. Returns null
 * when the hash carries no route (including the legacy `#kinship=…` share
 * link), so callers can decide what to do rather than being forced to `home`.
 */
export function parseRouteFromHash(hash: string | null | undefined): RouteId | null {
  if (!hash) return null;
  const body = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!body || !body.startsWith('/')) return null;

  // Strip a combined passport payload or query before matching.
  const segment = body.slice(1).split('&')[0].split('?')[0].replace(/\/+$/, '');
  return isRouteId(segment) ? segment : null;
}

/** Build the hash for a screen: `#/discover`. */
export function buildRouteHash(route: RouteId): string {
  return `#/${route}`;
}

/**
 * Does this hash carry a bedside passport payload?
 * Mirrors the check in decodeKinshipPassportHash so routing and decoding agree.
 */
export function hashHasPassportPayload(hash: string | null | undefined): boolean {
  return Boolean(hash && hash.includes('kinship='));
}

/**
 * Combine a route with an existing passport payload so the address bar stays
 * copyable: `#/passport&kinship=<b64>`.
 *
 * Returns the plain route hash when there is no payload to preserve.
 */
export function combineRouteAndPayload(route: RouteId, hash: string | null | undefined): string {
  const payloadIndex = hash ? hash.indexOf('kinship=') : -1;
  if (!hash || payloadIndex < 0) return buildRouteHash(route);
  const payload = hash.slice(payloadIndex).split('&')[0];
  return `${buildRouteHash(route)}&${payload}`;
}
