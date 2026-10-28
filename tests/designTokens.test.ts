/**
 * Design-token contrast tests.
 *
 * Every ratio here is computed from the real values in tailwind.config.js at
 * test time, so the suite fails if a token is later changed to something that
 * does not pass — rather than trusting a comment written once.
 *
 * WCAG 2.2 AA thresholds used:
 *   1.4.3  normal text           4.5:1
 *   1.4.3  large text (>=24px)   3.0:1
 *   1.4.11 non-text (focus, graphics, control boundaries) 3.0:1
 */
import test from 'node:test';
import assert from 'node:assert/strict';
// @ts-expect-error — the config is a plain ESM object with no type declarations
import config from '../tailwind.config.js';

const colors = config.theme.extend.colors;

type Hex = string;

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: Hex): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: Hex, b: Hex): number {
  const la = luminance(a);
  const lb = luminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

const AA = 4.5;
const NON_TEXT = 3;

function atLeast(ratio: number, min: number): boolean {
  return Number(ratio.toFixed(2)) >= min;
}

function check(pairs: Array<[string, Hex, Hex, number]>) {
  for (const [label, fg, bg, min] of pairs) {
    const ratio = contrast(fg, bg);
    assert.ok(
      atLeast(ratio, min),
      `${label}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1, needs ${min}:1`
    );
  }
}

const paper = colors.loam.paper as Hex;
const card = colors.loam.card as Hex;
const parchment50 = colors.parchment[50] as Hex;
const parchment200 = colors.parchment[200] as Hex;
const vinyl950 = colors.vinyl[950] as Hex;
const vinyl900 = colors.vinyl[900] as Hex;
const vinyl800 = colors.vinyl[800] as Hex;
const vinyl700 = colors.vinyl[700] as Hex;

test('WCAG contrast math agrees with known reference values', () => {
  assert.equal(Number(contrast('#000000', '#FFFFFF').toFixed(2)), 21);
  assert.equal(Number(contrast('#777777', '#FFFFFF').toFixed(2)), 4.48);
  assert.equal(Number(contrast('#FFFFFF', '#FFFFFF').toFixed(2)), 1);
});

test('body and secondary text pass AA in day mode', () => {
  check([
    ['loam.body on paper', colors.loam.body, paper, AA],
    ['loam.body on card', colors.loam.body, card, AA],
    ['loam.muted on paper', colors.loam.muted, paper, AA],
    ['loam.muted on card', colors.loam.muted, card, AA],
    ['loam.muted on parchment-50', colors.loam.muted, parchment50, AA],
    ['loam.ink on paper (AAA)', colors.loam.ink, paper, 7],
    ['loam.ink on card (AAA)', colors.loam.ink, card, 7],
    ['plum-600 on paper', colors.plum[600], paper, AA],
    ['plum-700 on paper', colors.plum[700], paper, AA],
    ['pine-700 on paper', colors.pine[700], paper, AA],
    ['brass-700 on paper', colors.brass[700], paper, AA],
    ['clay-600 on paper', colors.clay[600], paper, AA],
    ['clay-700 on paper', colors.clay[700], paper, AA],
  ]);
});

test('body and secondary text pass AA in evening mode', () => {
  check([
    ['loam.body-dark on vinyl-900', colors.loam['body-dark'], vinyl900, AA],
    ['loam.body-dark on vinyl-800', colors.loam['body-dark'], vinyl800, AA],
    ['loam.muted-dark on vinyl-900', colors.loam['muted-dark'], vinyl900, AA],
    ['loam.muted-dark on vinyl-800', colors.loam['muted-dark'], vinyl800, AA],
    ['loam.muted-dark on vinyl-700', colors.loam['muted-dark'], vinyl700, AA],
    ['parchment-50 on vinyl-950 (AAA)', parchment50, vinyl950, 7],
    ['plum-300 on vinyl-900', colors.plum[300], vinyl900, AA],
    ['brass-200 on vinyl-950', colors.brass[200], vinyl950, AA],
    ['pine-300 on vinyl-900', colors.pine[300], vinyl900, AA],
    ['clay-300 on vinyl-900', colors.clay[300], vinyl900, AA],
  ]);
});

test('filled buttons carry legible labels', () => {
  check([
    ['white on plum-600 (primary)', '#FFFFFF', colors.plum[600], AA],
    ['white on plum-500', '#FFFFFF', colors.plum[500], AA],
    ['white on pine-600', '#FFFFFF', colors.pine[600], AA],
    ['white on clay-600', '#FFFFFF', colors.clay[600], AA],
    ['white on brass-600', '#FFFFFF', colors.brass[600], AA],
    ['vinyl-950 on brass-500 (evening dialog)', vinyl950, colors.brass[500], AA],
    ['loam.ink on card (secondary button)', colors.loam.ink, card, AA],
  ]);
});

test('focus indicators and data graphics meet the 3:1 non-text minimum', () => {
  check([
    ['focus ring on paper', colors.loam.focus, paper, NON_TEXT],
    ['focus ring on card', colors.loam.focus, card, NON_TEXT],
    ['dark focus ring on vinyl-900', colors.blue[300], vinyl900, NON_TEXT],
    // Chart bars sit on a track, not on the page, so the track is the
    // adjacent colour that matters.
    ['pine-600 bar on light track', colors.pine[600], parchment200, NON_TEXT],
    ['pine-300 bar on dark track', colors.pine[300], vinyl700, NON_TEXT],
    ['plum-600 bar on light track', colors.plum[600], parchment200, NON_TEXT],
    ['brass-300 bar on dark track', colors.brass[300], vinyl700, NON_TEXT],
    ['clay-500 bar on light track', colors.clay[500], parchment200, NON_TEXT],
    ['clay-300 bar on dark track', colors.clay[300], vinyl700, NON_TEXT],
    ['provenance dot (live) on card', colors.pine[500], card, NON_TEXT],
    ['provenance dot (offline) on card', colors.brass[500], card, NON_TEXT],
    ['slider thumb on paper', colors.plum[500], paper, NON_TEXT],
  ]);
});

test('the cool default grey scale is no longer used for text', async () => {
  // stone-* measured 4.22:1 on warm paper and 3.27:1 on vinyl-900, which is why
  // the warm loam text tokens exist. This keeps them from creeping back in.
  const { readdir, readFile } = await import('node:fs/promises');
  const files = (await readdir('src/components')).map((f) => `src/components/${f}`);
  files.push('src/App.tsx', 'src/index.css');
  for (const file of files) {
    const src = await readFile(file, 'utf8');
    assert.ok(
      !/(text|bg|border)-stone-\d/.test(src),
      `${file} uses Tailwind's cool stone scale; use the warm loam/parchment/vinyl tokens`
    );
  }
});
