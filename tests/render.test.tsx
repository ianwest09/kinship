/**
 * Rendered-output tests.
 *
 * There is no browser in this environment, so nothing here claims to be a
 * visual or layout test. What it does do is render every screen to real HTML
 * with react-dom/server, using a genuine engine result rather than a stub, and
 * assert on the DOM that a phone would actually receive: accessible names,
 * dialog semantics, labels, control text, and the absence of claims the product
 * cannot support.
 *
 * Run with: npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString as renderToStaticMarkup } from 'react-dom/server';

/**
 * Render to HTML and strip React's text-node separators (`<!-- -->`), so
 * assertions can match the copy a person actually reads.
 */
const renderToString = (element: React.ReactElement): string =>
  renderToStaticMarkup(element).replace(/<!--[\s\S]*?-->/g, '');

import { App } from '../src/App';
import { HomeView } from '../src/components/HomeView';
import { DiscoverView } from '../src/components/DiscoverView';
import { SharedMomentView } from '../src/components/SharedMomentView';
import { PreferencesView } from '../src/components/PreferencesView';
import { MemoryCarePassportView } from '../src/components/MemoryCarePassportView';
import { OperatorAppendixView } from '../src/components/OperatorAppendixView';
import { FamilyIntakePanel } from '../src/components/FamilyIntakePanel';
import { ReminiscenceAndBridgeView } from '../src/components/ReminiscenceAndBridgeView';
import { SundowningRescueModal } from '../src/components/SundowningRescueModal';
import { KinshipQlooDrawer } from '../src/components/KinshipQlooDrawer';
import { ExampleFamilyNote } from '../src/components/ExampleFamilyNote';
import { ROUTE_IDS, type RouteId } from '../src/utils/routing';

import { generateKinshipBridge } from '../server/kinshipQlooEngine';
import { parseFamilyStoryToKinship } from '../server/kinshipQlooEngine';
import {
  CARE_HOME_COHORT,
  ELDER_CLUE_CATALOG,
  FAMILY_PRESETS,
  GRANDCHILD_SEED_CATALOG,
  YOUTH_GEOGRAPHIES,
} from '../server/reminiscenceGraph';

const preset = FAMILY_PRESETS[0];

const elderClues = preset.elderClueIds
  .map((id) => ELDER_CLUE_CATALOG.find((c) => c.entity_id === id))
  .filter((c): c is NonNullable<typeof c> => Boolean(c))
  .map((c) => ({ entity_id: c.entity_id, name: c.name, subtype: c.subtype, weight: c.weight }));

const grandchildSeeds = preset.grandchildSeedIds
  .map((id) => GRANDCHILD_SEED_CATALOG.find((c) => c.entity_id === id))
  .filter((c): c is NonNullable<typeof c> => Boolean(c))
  .map((c) => ({ entity_id: c.entity_id, name: c.name, subtype: c.subtype }));

// No QLOO_API_KEY in the test environment, so this exercises the offline
// collection path — the same data a visitor without a credential would see.
const data = await generateKinshipBridge({
  guardrails: preset.guardrails,
  elderClues,
  grandchildSeeds,
  boostedCueIds: [],
  excludedCueIds: [],
});

const noop = () => {};
const count = (haystack: string, needle: string): number =>
  haystack.split(needle).length - 1;

test('the engine fixture produced usable content', () => {
  assert.ok(data.reconstructedYouthUniverse.length > 0, 'expected suggestions to render');
  assert.equal(data.mode, 'verified_cultural_twin');
  assert.equal(data.guardrailsApplied.elderName, preset.guardrails.elderName);
});

/* ------------------------------------------------------------------ shell */

test('App renders the first screen without a browser and without throwing', () => {
  const html = renderToString(<App />);
  assert.ok(html.length > 5000, 'App rendered suspiciously little markup');
  assert.match(html, /Skip to content/);
  assert.match(html, /Kinship is opening\./);
  assert.match(html, /Enter Kinship/);
  assert.match(html, /id="kinship-main"/);
});

test('the phone navigation has four labelled destinations, not icons alone', () => {
  const html = renderToString(<App />);
  for (const label of ['Home', 'Discover', 'Together', 'Family']) {
    assert.ok(html.includes(`>${label}</span>`), `bottom nav is missing a text label: ${label}`);
  }
  // Icons must stay decorative; the label carries the accessible name.
  assert.ok(html.includes('aria-hidden="true"'), 'nav icons should be aria-hidden');
});

test('the clinical disclaimer is present at every width, not hidden on phones', () => {
  const html = renderToString(<App />);
  assert.match(html, /Educational prompts only — not medical advice\./);
  assert.match(html, /not individualised clinical guidance/);
  // It used to be hidden below `md`; the padding that clears the bottom nav is
  // what keeps it readable above it.
  assert.match(html, /pb-28 md:pb-6/);
});

test('no provenance claim is made before there is a result to describe', () => {
  const html = renderToString(<App />);
  assert.ok(!html.includes('Live Qloo Taste AI'), 'provenance strip rendered without data');
});

/* ------------------------------------------------------------------- home */

const homeProps = {
  guardrails: data.guardrailsApplied,
  bumpWindow: data.bumpWindow,
  ready: true,
  usingExampleFamily: false,
  onExplore: noop,
  onOpenTogether: noop,
  onOpenFamily: noop,
  onOpenPassport: noop,
  onOpenRescue: noop,
};

/**
 * The four destinations Home offers, as the reader sees them, each tagged with
 * the route it leads to so the order can be checked against ROUTE_IDS.
 */
const HOME_STEPS: Array<[RouteId, string]> = [
  ['discover', 'Explore what’s familiar'],
  ['together', 'Share a moment'],
  ['family', 'Add what you know'],
  ['passport', 'Care passport'],
];

test('Home offers exactly one primary action, in plain language', () => {
  const html = renderToString(<HomeView {...homeProps} />);
  assert.equal(count(html, 'loam-btn-primary'), 1, 'Home must have a single primary button');
  assert.match(html, /Explore what’s familiar/);
  assert.match(html, /Nothing to set up first/);
});

test('Home offers each destination once, not twice under two labels', () => {
  const html = renderToString(<HomeView {...homeProps} />);
  for (const [, label] of HOME_STEPS) {
    assert.equal(
      count(html, `>${label}</span>`),
      1,
      `"${label}" should be offered exactly once on Home`
    );
  }
});

test('Home presents its destinations in the journey order', () => {
  const html = renderToString(<HomeView {...homeProps} />);
  const positions = HOME_STEPS.map(([, label]) => html.indexOf(`>${label}</span>`));
  assert.ok(positions.every((at) => at > -1), 'a Home destination was not rendered');
  const routes = HOME_STEPS.map(([route]) => route);
  const expected = [...routes].sort((a, b) => ROUTE_IDS.indexOf(a) - ROUTE_IDS.indexOf(b));
  assert.deepEqual(routes, expected, 'Home lists its destinations out of journey order');
  assert.deepEqual(
    positions,
    [...positions].sort((a, b) => a - b),
    'Home renders its destinations out of the order it lists them'
  );
});

test('the phone navigation follows the same journey order as Home', () => {
  const html = renderToString(<App />);
  const navRoutes: RouteId[] = ['home', 'discover', 'together', 'family'];
  const labels = { home: 'Home', discover: 'Discover', together: 'Together', family: 'Family' };
  const positions = navRoutes.map((r) => html.indexOf(`>${labels[r]}</span>`));
  assert.ok(positions.every((at) => at > -1), 'a bottom-nav label was not rendered');
  assert.deepEqual(
    navRoutes,
    [...navRoutes].sort((a, b) => ROUTE_IDS.indexOf(a) - ROUTE_IDS.indexOf(b)),
    'bottom nav is not in journey order'
  );
  assert.deepEqual(
    positions,
    [...positions].sort((a, b) => a - b),
    'bottom nav renders in a different order from the journey'
  );
});

test('Home says so when the family on screen is an example', () => {
  const example = renderToString(<HomeView {...homeProps} usingExampleFamily />);
  assert.match(example, /is an example family/, 'the sample family is presented as the reader’s own');
  assert.match(example, /Add what you know and these suggestions become theirs/);
  assert.match(example, /Nothing to set up first/, 'the example must not create a setup barrier');

  const own = renderToString(<HomeView {...homeProps} usingExampleFamily={false} />);
  assert.ok(!own.includes('is an example family'), 'a family’s own details were called an example');
});

test('the example note names the sample and offers the way to change it', () => {
  const html = renderToString(
    <ExampleFamilyNote
      elderName={preset.guardrails.elderName}
      birthYear={preset.guardrails.birthYear}
      onAddYourOwn={noop}
    />
  );
  assert.match(html, /Showing an example family\./);
  assert.match(html, new RegExp(preset.guardrails.elderName));
  assert.match(html, new RegExp(String(preset.guardrails.birthYear)));
  assert.match(html, /not\s+anyone you know|a sample, not/);
  assert.match(html, />Add what you know</);

  // On the screen the action leads to, the button is omitted rather than
  // left in place to do nothing.
  const noAction = renderToString(
    <ExampleFamilyNote elderName={preset.guardrails.elderName} birthYear={preset.guardrails.birthYear} />
  );
  assert.ok(!noAction.includes('loam-btn-secondary'), 'the note offered a button that goes nowhere');
});

test('Home explains the era without turning it into a test', () => {
  const html = renderToString(<HomeView {...homeProps} />);
  assert.match(html, /No right answers\. Just time together\./);
  assert.match(html, /Find a familiar feeling\./);
  assert.ok(!/Do you remember/.test(html), 'Home must not ask recall questions');
});

/* --------------------------------------------------------------- discover */

const discoverHtml = renderToString(
  <DiscoverView
    data={data}
    onListenTogether={noop}
    onNotForUs={noop}
    onUndoNotForUs={noop}
    onOpenDetail={noop}
  />
);

test('every Discover card can be chosen and can be declined', () => {
  const cards = count(discoverHtml, '<li');
  assert.ok(cards > 0, 'expected at least one suggestion card');
  assert.equal(count(discoverHtml, 'Enjoy together'), cards);
  assert.equal(count(discoverHtml, 'Not for us today'), cards);
});

test('every Discover card states where its suggestion came from', () => {
  const cards = count(discoverHtml, '<li');
  const attributed =
    count(discoverHtml, 'Suggested by Qloo, live.') +
    count(discoverHtml, 'From Kinship’s own collection — not a Qloo result.');
  assert.equal(attributed, cards, 'each card needs a per-item provenance line');
  assert.match(discoverHtml, /A suggestion, not a fact about anyone\./);
});

test('Discover frames suggestions as invitations, never as recall checks', () => {
  assert.match(discoverHtml, /Nothing needs\s+to be recognised/);
  assert.match(discoverHtml, /Why this might feel familiar/);
  assert.ok(!discoverHtml.includes('mPFC'), 'clinical shorthand leaked into a family screen');
  assert.ok(!discoverHtml.includes('Salience'), 'pseudo-clinical metric leaked into Discover');
});

/* ---------------------------------------------------------- shared moment */

const togetherHtml = renderToString(
  <SharedMomentView
    data={data}
    focusCue={null}
    warmEq={false}
    onCueReaction={noop}
    onOpenRescue={noop}
    onBackToDiscover={noop}
  />
);

test('Share a moment can start, stop and skip, and says stopping is fine', () => {
  assert.match(togetherHtml, /Play gentle chords/);
  assert.match(togetherHtml, /Stop and sit quietly/);
  assert.match(togetherHtml, /Try something else/);
  assert.match(togetherHtml, /No need to finish anything\./);
  assert.match(togetherHtml, /aria-pressed="false"/);
});

test('no media autoplays and no commercial track is implied', () => {
  assert.ok(!/<audio/i.test(togetherHtml), 'an <audio> element would autoplay or fetch media');
  assert.ok(!/autoPlay/i.test(togetherHtml));
  assert.ok(!/Spotify|Apple Music|YouTube/.test(togetherHtml), 'no streaming integration exists');
  // The button says what the sound actually is: locally generated chords.
  assert.match(togetherHtml, /Play gentle chords/);
});

test('the shared screen announces itself politely to assistive tech', () => {
  assert.match(togetherHtml, /aria-live="polite"/);
});

/* ----------------------------------------------------------- preferences */

const prefsHtml = renderToString(
  <PreferencesView
    textSize="normal"
    onTextSizeChange={noop}
    darkMode={false}
    onToggleDarkMode={noop}
    guardrails={data.guardrailsApplied}
    onUpdateGuardrails={noop}
    qlooStatus={{ connected: false, baseUrl: 'https://hackathon.api.qloo.com', maskedKey: '' }}
    onOpenTrace={noop}
    onOpenDetail={noop}
    onOpenPassport={noop}
    onOpenOperators={noop}
    onClearDeviceData={noop}
    clearedNote={null}
    rememberOnDevice={false}
    onToggleRemember={noop}
  />
);

test('Preferences exposes every toggle as a real switch with state', () => {
  const switches = prefsHtml.match(/<button[^>]*role="switch"[^>]*>/g) ?? [];
  assert.ok(switches.length >= 5, `expected at least 5 switches, found ${switches.length}`);
  for (const tag of switches) {
    assert.match(tag, /aria-checked="(true|false)"/, `switch without state: ${tag}`);
    assert.match(tag, /id="pref-/, 'switch must be labelled by its <label for>');
  }
  assert.match(prefsHtml, /role="radiogroup"/);
  assert.equal(count(prefsHtml, 'role="radio"'), 3);
});

test('Preferences states the privacy position the code actually supports', () => {
  assert.match(prefsHtml, /There is no account and no database\./);
  assert.match(prefsHtml, /never passed\s+on to Qloo/);
  assert.match(prefsHtml, /Remember my details in this browser/);
  assert.match(prefsHtml, /Clear everything on this device/);
  assert.ok(!/stay on this device\./.test(prefsHtml), 'over-broad privacy claim');
});

test('device storage is opt-in, because care-home phones are shared', () => {
  assert.match(prefsHtml, /Off by default/);
  assert.match(prefsHtml, /often shared/);
});

/* --------------------------------------------------------------- passport */

const passportHtml = renderToString(
  <MemoryCarePassportView
    data={data}
    sparkLog={[]}
    elderClues={elderClues}
    grandchildSeeds={grandchildSeeds}
    onOpenTrace={noop}
    onOpenOperators={noop}
  />
);

test('the printable care sheet carries no outcome statistics, pricing or other people', () => {
  const banned = [
    'agitation episodes',
    'ROI',
    '$14',
    'ARR',
    'HIPAA',
    'POPIA',
    'GDPR',
    'MMSE',
    'Medicare',
    'MC-204-ANON',
    'MC-118-ANON',
    'MC-309-ANON',
    'calm and smiling',
    'Zero Cloud PII',
    'SaaS',
  ];
  for (const phrase of banned) {
    assert.ok(!passportHtml.includes(phrase), `care sheet still contains "${phrase}"`);
  }
});

test('the care sheet keeps the actions a family actually needs', () => {
  assert.match(passportHtml, /Copy link/);
  assert.match(passportHtml, /Print this sheet/);
  assert.match(passportHtml, /Test this QR code/);
  assert.match(passportHtml, /Operator appendix/);
  assert.match(passportHtml, /aria-label="Scannable Kinship Memory Care Room Passport QR Code"/);
});

test('the care sheet makes no promise about how someone will respond', () => {
  assert.match(passportHtml, /not a promise of any particular response/);
  assert.ok(!/activate .*prefrontal/i.test(passportHtml), 'unsupported neuroscience claim');
  assert.ok(!/to prevent/i.test(passportHtml), 'prevention claim on a care document');
});

/* ------------------------------------------------------- operator appendix */

const appendixHtml = renderToString(
  <OperatorAppendixView cohort={CARE_HOME_COHORT} onOpenTrace={noop} onOpenPassport={noop} />
);

test('operator material labels itself as a model and its cohort as fictional', () => {
  assert.match(appendixHtml, /Illustrative model — not measured results/);
  assert.match(appendixHtml, /Demo cohort \(fictional\)/);
  assert.match(appendixHtml, /no claim of HIPAA, POPIA or GDPR certification/);
  assert.match(appendixHtml, /not a medical device/);
});

test('the appendix states only what can be verified in the code', () => {
  assert.match(appendixHtml, /No database and no accounts\./);
  assert.match(appendixHtml, /Names are not forwarded to Qloo\./);
  assert.match(appendixHtml, /Request bodies are not logged\./);
  assert.match(appendixHtml, /Share it deliberately\./);
});

/* ------------------------------------------------------------- family form */

const familyHtml = renderToString(
  <FamilyIntakePanel
    presets={FAMILY_PRESETS}
    activePresetId={preset.id}
    elderCatalog={ELDER_CLUE_CATALOG}
    grandchildCatalog={GRANDCHILD_SEED_CATALOG}
    geographies={Object.values(YOUTH_GEOGRAPHIES).map((g) => ({
      id: g.id,
      name: g.name,
      country: g.country,
      eraCulturalPortrait: g.eraCulturalPortrait,
    }))}
    guardrails={data.guardrailsApplied}
    bumpWindow={data.bumpWindow}
    elderClues={elderClues}
    grandchildSeeds={grandchildSeeds}
    onSelectPreset={noop}
    onUpdateGuardrails={noop}
    onToggleElderClue={noop}
    onAddCustomElderClue={noop}
    onRemoveElderClue={noop}
    onToggleGrandchildSeed={noop}
    onAddCustomGrandchildSeed={noop}
    onRemoveGrandchildSeed={noop}
    onSelectCareCircleRole={noop}
    onApplyNarrative={(text: string) =>
      Promise.resolve(parseFamilyStoryToKinship(text, data.guardrailsApplied))
    }
    onOpenBridgeView={noop}
  />
);

test('every input on the family form has an accessible name', () => {
  assert.match(familyHtml, /<label[^>]+for="family-story"/);
  assert.match(familyHtml, /id="family-story"/);
  assert.match(familyHtml, /<label[^>]+for="birth-year"/);
  assert.match(familyHtml, /id="birth-year"/);
  assert.match(familyHtml, /aria-valuetext=/);
});

test('the family form uses plain language and no invented percentages', () => {
  assert.match(familyHtml, /Find suggestions/);
  assert.ok(!familyHtml.includes('Reconstruct Era &amp; Bridge'), 'jargon button label');
  assert.match(familyHtml, /The years to draw from/);
  assert.match(familyHtml, /reminiscence bump/);
  assert.match(familyHtml, /Strongest/);
  assert.match(familyHtml, /not a\s+measurement of anyone’s memory/);
  assert.ok(!familyHtml.includes('mpfcRetentionPct'), 'internal field name leaked into markup');
  assert.ok(!/dorsal/i.test(familyHtml), 'neuroanatomical claim on a family screen');
});

test('the birth year range can represent early-onset dementia', () => {
  assert.match(familyHtml, /id="birth-year"[^>]*max="1980"/s);
});

/* ------------------------------------------------------ detailed care view */

const detailHtml = renderToString(
  <ReminiscenceAndBridgeView
    data={data}
    sparkLog={[]}
    excludedCount={0}
    onResetExcludes={noop}
    onCueReaction={noop}
    onOpenSharedMoment={noop}
  />
);

test('the detailed view names its numbers after what they really are', () => {
  assert.match(detailHtml, /Qloo affinity/);
  assert.ok(!detailHtml.includes('mPFC'), 'pseudo-neuroscience metric label');
  assert.match(detailHtml, /They lit up — save this/);
  assert.match(detailHtml, /Helps the late afternoon/);
  assert.match(detailHtml, /Not for them — set aside/);
});

test('the detailed view describes screening, not clinical verification', () => {
  assert.match(detailHtml, /Kinship’s own safety filters/);
  assert.ok(!/verified for dementia sensory comfort/.test(detailHtml));
});

test('the Qloo comparison says what it actually is', () => {
  // Rendered from the real engine fixture above, so this is what a visitor sees.
  // The section used to call itself a "Live request-by-request diff" and wear a
  // "Zero PII" badge, while its left column is authored prose: no model is
  // called to produce it. The operator appendix already refuses compliance
  // claims, so this screen must not make one either.
  const text = detailHtml.replace(/<!--\s*-->/g, '');

  assert.match(text, /Without Qloo vs\. with Qloo/);
  assert.match(text, /A generic model would probably guess/);
  assert.match(text, /no model is called to produce it/);
  assert.match(text, /No names sent to Qloo/);
  assert.ok(!/zero\s*pii/i.test(text), 'a compliance claim the appendix refuses to make');
  assert.ok(!text.includes('Live request-by-request'), 'calling an authored comparison live');
  assert.ok(!/Generic Prompted LLM/.test(text), 'implies a model was prompted at request time');
});

/* --------------------------------------------------------------- overlays */

test('the settling-sounds dialog is a real dialog with plain-language title', () => {
  const html = renderToString(
    <SundowningRescueModal open onClose={noop} data={data} onToggleWarmEq={noop} />
  );
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /aria-labelledby="settling-title"/);
  assert.match(html, /id="settling-title"/);
  assert.match(html, /Settling sounds for the late afternoon/);
  assert.match(html, /Stop it at any point\./);
  assert.ok(!html.includes('De-Escalation Protocol'), 'protocol jargon in a crisis screen');
  assert.match(html, /Warmer, softer sound: off/);
});

test('the trace drawer is a labelled dialog with a named close button', () => {
  const html = renderToString(
    <KinshipQlooDrawer
      open
      onClose={noop}
      trace={data.agentTrace}
      reasoningLog={data.agentReasoningLog}
      currentGuardrails={data.guardrailsApplied}
      primaryElderClue={elderClues[0]?.name ?? ''}
      primaryGrandchildSeed={grandchildSeeds[0]?.name ?? ''}
      qlooStatus={{ connected: false, baseUrl: '', maskedKey: '' }}
    />
  );
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /aria-label="Close the request trace"/);
  assert.match(html, /How these suggestions were built/);
});

/* ------------------------------------------------- cross-cutting honesty */

test('no caregiver-facing screen claims zero-PII, graph size or memory scores', () => {
  const surfaces: Array<[string, string]> = [
    ['home', renderToString(<HomeView {...homeProps} />)],
    ['discover', discoverHtml],
    ['together', togetherHtml],
    ['family', familyHtml],
    ['passport', passportHtml],
    ['preferences', prefsHtml],
    ['detail', detailHtml],
  ];
  for (const [name, html] of surfaces) {
    for (const phrase of ['zero-PII', 'Zero-PII', '250M+', 'diagnos', 'cure', 'guarantee']) {
      assert.ok(!html.includes(phrase), `${name} contains "${phrase}"`);
    }
  }
});
