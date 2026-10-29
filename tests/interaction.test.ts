/**
 * Interaction tests — the things that only happen after a person acts.
 *
 * `render.test.tsx` renders screens to static HTML, which proves markup and
 * accessible names but cannot prove behaviour. These tests mount the real `App`
 * in jsdom and drive it with real events: clicks, the history back button,
 * Escape, input changes. That covers the audit's most serious finding (F1, no
 * back button) and the fixes for F4 (dialog semantics), F7 (silent exclusion
 * with no undo), F8 (silent data swap with no retry) and the storage promise
 * that switching off deletes rather than hides.
 *
 * Limits, stated plainly: jsdom has no layout engine, so nothing here verifies
 * overflow, clipping, spacing, focus rings or contrast. It also runs the offline
 * path — `fetch` is stubbed to fail — so it never exercises the live Qloo API.
 * See tests/helpers/jsdomHarness.ts.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { ROUTE_IDS } from '../src/utils/routing';
import { YOUTH_GEOGRAPHIES } from '../server/reminiscenceGraph';

/** Place names as the picker renders them, so the selector cannot drift. */
const GEOGRAPHY_NAMES = Object.values(YOUTH_GEOGRAPHIES).map((g) =>
  g.name.split('&')[0].trim()
);
import { mountApp, realConsoleErrors, type MountedApp } from './helpers/jsdomHarness';

let q: MountedApp;

test.before(async () => {
  q = await mountApp();
});

test.after(() => q.teardown());

/* ------------------------------------------------------------------- shell */

test('the app mounts on Home with a real heading', () => {
  assert.equal(q.byId('kinship-main')?.querySelector('h1')?.textContent, 'Home');
  assert.match(q.text(), /Find a familiar feeling\./);
});

test('Home offers each destination exactly once, in journey order', () => {
  const steps: Array<[string, string]> = [
    ['discover', 'Explore what’s familiar'],
    ['together', 'Share a moment'],
    ['family', 'Add what you know'],
    ['passport', 'Care passport'],
  ];
  const html = q.html();
  const positions: number[] = [];
  for (const [route, label] of steps) {
    const matches = q.buttons().filter((b) => b.textContent.trim().startsWith(label));
    assert.equal(matches.length, 1, `"${label}" should be offered once, found ${matches.length}`);
    positions.push(html.indexOf(matches[0].outerHTML.slice(0, 60)));
  }
  const routes = steps.map(([r]) => r);
  assert.deepEqual(
    routes,
    [...routes].sort((a, b) => ROUTE_IDS.indexOf(a as any) - ROUTE_IDS.indexOf(b as any)),
    'Home lists its destinations out of journey order'
  );
  assert.deepEqual(
    positions,
    [...positions].sort((a, b) => a - b),
    'Home renders its destinations in a different order from the one it lists'
  );
});

test('Home declares the sample family before showing its results', () => {
  assert.match(q.text(), /is an example family/);
  assert.match(q.text(), /Nothing to set up first/);
});

/* -------------------------------------------------------------- navigation */

test('the primary action routes to Discover and states whose data it is', async () => {
  await q.click('Explore what’s familiar');
  assert.equal(q.hash(), '#/discover');
  assert.match(q.text(), /Showing an example family/);
  assert.ok(!q.text().includes('Where to start'), 'Home content was left behind');
});

test('the phone back button returns to the previous screen, not out of the app', async () => {
  // F1 was the audit's most serious finding: the system back button left
  // Kinship entirely and a carer had to start again.
  q.w.history.back();
  await q.tick(600);
  assert.equal(q.hash(), '');
  assert.match(q.text(), /Where to start/);
});

test('every bottom-nav destination is reachable and routed', async () => {
  // A first load has a bare URL and Home comes from DEFAULT_ROUTE; once the
  // person navigates, Home is written as #/home. Both resolve to the same screen.
  const expected: Array<[string, string]> = [
    ['Discover', '#/discover'],
    ['Together', '#/together'],
    ['Family', '#/family'],
    ['Home', '#/home'],
  ];
  for (const [label, hash] of expected) {
    await q.click(label);
    assert.equal(q.hash(), hash, `the nav item "${label}" did not route`);
  }
});

/* ----------------------------------------------------------------- overlays */

test('the settling-sounds overlay is a real modal dialog that Escape closes', async () => {
  await q.click('Open settling sounds');
  const dialog = q.w.document.querySelector('[role="dialog"]');
  assert.ok(dialog, 'no dialog was mounted');
  assert.equal(dialog!.getAttribute('aria-modal'), 'true');
  assert.match(dialog!.textContent ?? '', /Settling sounds for the late afternoon/);
  assert.ok(dialog!.contains(q.w.document.activeElement), 'focus did not move into the dialog');

  await q.key('Escape');
  assert.equal(q.w.document.querySelector('[role="dialog"]'), null, 'Escape did not close it');
  assert.match(q.text(), /Where to start/, 'the reader is back on Home');
});

/* ------------------------------------------------------- declining and undo */

test('declining a suggestion says so and can be undone', async () => {
  // F7: a card used to vanish with no feedback and no way back.
  await q.click('Discover');
  const declineButtons = q.buttons().filter((b) => b.textContent.trim() === 'Not for us today');
  assert.ok(declineButtons.length > 0, 'expected decline controls on the suggestion cards');

  await q.click(declineButtons[0]);
  assert.match(q.text(), /is set aside/);
  assert.match(q.text(), /unless you put it back/);

  await q.click('Put it back');
  await q.tick(1500);
  assert.ok(!q.text().includes('is set aside'), 'undo did not clear the set-aside notice');
});

/* ------------------------------------------------------------------- honesty */

test('an unreachable API is disclosed, and offers a retry, rather than silently swapped', async () => {
  // F8. The harness stubs fetch to fail, so this is the real fallback path:
  // the offline collection, visibly labelled, with a way to try again.
  assert.match(q.text(), /Qloo is not connected|own collection/);
  assert.match(q.text(), /The request to Kinship did not complete/);
  assert.ok(q.button('Try again'), 'no retry was offered after a failed request');
});

/* ------------------------------------------------------------------ privacy */

test('device storage is opt-in, and switching it off deletes rather than hides', async () => {
  await q.click('Preferences');
  const toggle = q.byId('pref-remember-my-details-in-this-browser');
  assert.ok(toggle, 'the remember switch was not rendered');
  assert.equal(toggle!.getAttribute('role'), 'switch');
  assert.equal(toggle!.getAttribute('aria-checked'), 'false', 'storage must start off');
  assert.equal(q.storage.getItem('kinship.family.v1'), null);

  await q.click(toggle);
  assert.equal(toggle!.getAttribute('aria-checked'), 'true');
  assert.equal(q.storage.getItem('kinship.remember'), 'on');
  assert.ok(q.storage.getItem('kinship.family.v1'), 'nothing was written when switched on');

  await q.click(toggle);
  assert.equal(toggle!.getAttribute('aria-checked'), 'false');
  assert.equal(
    q.storage.getItem('kinship.family.v1'),
    null,
    'switching off must delete the record, not merely hide it'
  );
});

test('choosing a different place stops the sample family being presented as an example', async () => {
  // Driven through the place picker rather than the birth-year slider: jsdom
  // cannot drive controlled inputs at all (see the harness note), while these
  // are real buttons calling the same handler that clears the sample family.
  await q.click('Family');
  const chips = q.buttons().filter((b: any) => {
    const t = b.textContent.trim();
    return GEOGRAPHY_NAMES.some((n) => t.startsWith(n)) && !t.includes('\u00b7');
  });
  assert.ok(chips.length > 1, 'the place picker did not render');
  const unselected = chips.find((b: any) => !b.className.includes('bg-plum-600')) ?? chips[1];

  await q.click(unselected);
  await q.tick(1500);
  assert.equal(
    q.w.document.querySelectorAll('[role="note"]').length,
    0,
    'the example notice survived a choice the reader made themselves'
  );

  await q.click('Discover');
  assert.ok(!q.text().includes('Showing an example family'), 'still claiming to be an example');

  await q.click('Home');
  assert.ok(!q.text().includes('is an example family'), 'Home still called it an example');
  assert.match(q.text(), /Nothing to set up first/);
});

/* ------------------------------------------------------------- accessibility */

test('every button on every screen has an accessible name', async () => {
  // Found by this test, not by inspection: the Family screen had six icon-only
  // buttons — two "add" submits and four "remove" crosses — whose accessible
  // name was empty. WCAG 4.1.2, and the brief's rule against icon-only actions.
  const nameOf = (b: any) =>
    (b.getAttribute('aria-label') || b.getAttribute('title') || b.textContent || '').trim();
  const audit = (where: string) => {
    const unnamed = q.buttons().filter((b) => !nameOf(b));
    assert.deepEqual(
      unnamed.map((b: any) => b.outerHTML.slice(0, 80)),
      [],
      `${where}: buttons with no accessible name`
    );
  };

  for (const destination of ['Home', 'Discover', 'Together', 'Family', 'Preferences']) {
    await q.click(destination);
    audit(destination);
  }
  await q.click('Home');
  await q.click('Open settling sounds');
  audit('the settling-sounds dialog');
  await q.key('Escape');
});

/* ------------------------------------------------------------------- hygiene */

test('driving the whole app logged no unexpected errors', () => {
  assert.deepEqual(realConsoleErrors(q.consoleErrors), [], 'console.error was called');
});
