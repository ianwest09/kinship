/**
 * Routing and bedside-link tests.
 *
 * The back button is the most used navigation control on Android. These tests
 * pin the hash grammar that makes it work, including the legacy `#kinship=`
 * share links that are already printed on QR codes in the field.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRouteHash,
  combineRouteAndPayload,
  DEFAULT_ROUTE,
  hashHasPassportPayload,
  parseRouteFromHash,
  ROUTE_IDS,
} from '../src/utils/routing';
import { decodeKinshipPassportHash, encodeKinshipPassportLink } from '../src/utils/qrAndPassport';
import { FAMILY_PRESETS, ELDER_CLUE_CATALOG, GRANDCHILD_SEED_CATALOG } from '../server/reminiscenceGraph';

test('every screen has a route and a hash', () => {
  for (const id of ROUTE_IDS) {
    assert.equal(buildRouteHash(id), `#/${id}`);
    assert.equal(parseRouteFromHash(`#/${id}`), id);
  }
  assert.equal(DEFAULT_ROUTE, 'home');
});

test('a hash with no route returns null so callers keep control', () => {
  assert.equal(parseRouteFromHash(''), null);
  assert.equal(parseRouteFromHash(null), null);
  assert.equal(parseRouteFromHash('#'), null);
  assert.equal(parseRouteFromHash('#nonsense'), null);
  assert.equal(parseRouteFromHash('#/not-a-screen'), null);
});

test('legacy printed passport links still decode and still carry no route', () => {
  const preset = FAMILY_PRESETS[0];
  const link = encodeKinshipPassportLink({
    guardrails: preset.guardrails,
    elderClues: preset.elderClueIds
      .map((id) => ELDER_CLUE_CATALOG.find((c) => c.entity_id === id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .map((c) => ({ name: c.name, subtype: c.subtype })),
    grandchildSeeds: preset.grandchildSeedIds
      .map((id) => GRANDCHILD_SEED_CATALOG.find((c) => c.entity_id === id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .map((c) => ({ name: c.name, subtype: c.subtype })),
  });

  assert.match(link.hash, /^#kinship=/);
  assert.equal(hashHasPassportPayload(link.hash), true);
  assert.equal(parseRouteFromHash(link.hash), null);

  const decoded = decodeKinshipPassportHash(link.hash);
  assert.ok(decoded, 'a printed QR payload must decode');
  assert.equal(decoded.birthYear, preset.guardrails.birthYear);
  assert.equal(decoded.youthGeography, preset.guardrails.youthGeography);
  assert.equal(decoded.dementiaStage, preset.guardrails.dementiaStage);
  assert.ok(decoded.elderNames.length > 0);
  assert.ok(decoded.grandchildNames.length > 0);
});

test('a route can be combined with a payload without breaking either', () => {
  const combined = combineRouteAndPayload('passport', '#kinship=eyJ2IjoxfQ');
  assert.equal(combined, '#/passport&kinship=eyJ2IjoxfQ');
  assert.equal(parseRouteFromHash(combined), 'passport');
  assert.equal(hashHasPassportPayload(combined), true);
  // The payload itself still decodes from the combined form.
  assert.ok(decodeKinshipPassportHash(combined));
});

test('combining without a payload gives a clean route', () => {
  assert.equal(combineRouteAndPayload('discover', '#/home'), '#/discover');
  assert.equal(combineRouteAndPayload('discover', ''), '#/discover');
});

test('trailing slashes and query strings do not defeat the parser', () => {
  assert.equal(parseRouteFromHash('#/discover/'), 'discover');
  assert.equal(parseRouteFromHash('#/together?x=1'), 'together');
});
