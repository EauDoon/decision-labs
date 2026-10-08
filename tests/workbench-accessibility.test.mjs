import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { APPS } from '../scripts/apps.mjs';

// Static WCAG AA gate for the workbench colour contract. axe undercounts these
// failures (hover states and tinted rows are never checked), so the ratios are
// computed here from the source tokens instead of from a rendered page.
const AA_TEXT = 4.5;

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

function rootTokens(css) {
  const block = css.match(/:root\s*\{([^}]*)\}/)?.[1] ?? '';
  return Object.fromEntries([...block.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\b/g)].map(([, name, value]) => [name, value.toLowerCase()]));
}

function ruleBackground(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const value = css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{[^}]*\\bbackground:\\s*(#[0-9a-fA-F]{6})\\b`))?.[1];
  assert.ok(value, `${selector} background not found`);
  return value.toLowerCase();
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(first, second) {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

const partnership = read('apps/partnership-breakpoint/styles.css');
const commonCart = read('apps/common-cart/styles.css');
const smallest = read('apps/smallest-agreement/styles.css');

// Each text ink and every light surface it is drawn on, including the tinted
// first-fail row (Partnership) and the literal control-panel colour (Smallest).
const INKS = [
  {
    app: 'partnership-breakpoint',
    ink: '--coral-ink',
    tokens: rootTokens(partnership),
    surfaces: (tokens) => ({ '--paper': tokens['--paper'], '--coral-pale': tokens['--coral-pale'], panel: ruleBackground(partnership, '.panel') }),
    whiteOnInk: true,
  },
  {
    app: 'common-cart',
    ink: '--orange-ink',
    tokens: rootTokens(commonCart),
    surfaces: (tokens) => ({ '--paper': tokens['--paper'], '--surface': tokens['--surface'] }),
  },
  {
    app: 'smallest-agreement',
    ink: '--pencil-ink',
    tokens: rootTokens(smallest),
    surfaces: (tokens) => ({ '--paper': tokens['--paper'], '--card': tokens['--card'], '.control-panel': ruleBackground(smallest, '.control-panel') }),
  },
];

test('the colour helper matches known WCAG ratios', () => {
  assert.equal(contrast('#000000', '#ffffff').toFixed(2), '21.00');
  assert.equal(contrast('#ffffff', '#ffffff').toFixed(2), '1.00');
  assert.equal(contrast('#d94f3d', '#f5f3ed').toFixed(2), '3.68');
});

for (const { app, ink, tokens, surfaces, whiteOnInk } of INKS) {
  test(`${app}: ${ink} text meets WCAG AA on every light surface it is drawn on`, () => {
    const inkColour = tokens[ink];
    assert.ok(inkColour, `${ink} must be defined in :root`);
    for (const [name, surface] of Object.entries(surfaces(tokens))) {
      assert.ok(surface, `${name} must be defined`);
      const ratio = contrast(inkColour, surface);
      assert.ok(ratio >= AA_TEXT, `${ink} ${inkColour} on ${name} ${surface} is ${ratio.toFixed(2)}:1`);
    }
    if (whiteOnInk) {
      const ratio = contrast('#ffffff', inkColour);
      assert.ok(ratio >= AA_TEXT, `white on ${ink} is ${ratio.toFixed(2)}:1`);
    }
  });
}

test('decorative accent colours are never used as text colours', () => {
  const decorativeText = /(?:^|[;{\s])color\s*:\s*var\(--(?:coral|orange|pencil)\)/m;
  for (const { id } of APPS) {
    for (const file of [`apps/${id}/styles.css`, `apps/${id}/index.html`]) {
      assert.doesNotMatch(read(file), decorativeText, `${file} uses a decorative accent as a text colour`);
    }
  }
});

test('weekend-gap keeps complementary landmarks out of main', () => {
  const html = read('apps/weekend-gap/index.html');
  const main = html.match(/<main\b[\s\S]*?<\/main>/)?.[0];
  assert.ok(main, 'weekend-gap index.html must have a main element');
  assert.doesNotMatch(main, /<aside\b/);
  assert.doesNotMatch(main, /role="complementary"/);
  const standalone = read('apps/weekend-gap/standalone.html').match(/<main\b[\s\S]*?<\/main>/)?.[0] ?? '';
  assert.doesNotMatch(standalone, /<aside\b/);
});
