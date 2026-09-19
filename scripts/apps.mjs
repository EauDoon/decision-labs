// Canonical catalog apps. Single source of truth for the four workbenches
// the launcher serves, the check script validates, and the tests assert on.
// Add an app here only together with a launcher surface test.
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);

export const APPS = Object.freeze([
  Object.freeze({ id: 'partnership-breakpoint', label: 'Partnership Breakpoint' }),
  Object.freeze({ id: 'common-cart', label: 'Common Cart' }),
  Object.freeze({ id: 'smallest-agreement', label: 'The Smallest Agreement' }),
  Object.freeze({ id: 'weekend-gap', label: 'Weekend Gap' }),
]);

export const APP_PATHS = Object.freeze(APPS.map((a) => `/apps/${a.id}/standalone.html`));

export const APP_ROUTES = Object.freeze(APPS.map((a) => `apps/${a.id}/standalone.html`));

export function catalogVersionLine(base = root) {
  return APPS
    .map(({ id, label }) => {
      const version = JSON.parse(readFileSync(new URL(`apps/${id}/package.json`, base), 'utf8')).version;
      return `${label} ${version}`;
    })
    .join(', ');
}
