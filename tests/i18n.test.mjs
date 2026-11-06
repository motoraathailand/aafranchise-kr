import test from 'node:test'; import assert from 'node:assert/strict';
import { RAW, STRINGS, ORDER } from '../web/i18n.js';
import { GUIDES } from '../web/guides.js';
import { CHANGELOG } from '../web/changelog.js'; import { BUILTIN } from '../web/notices.js';
const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
test('every string has 5 languages, non-empty, same placeholders', () => {
  for (const [k, v] of Object.entries(RAW)) {
    assert.equal(v.length, ORDER.length, k); v.forEach((s, i) => { assert.ok(typeof s === 'string' && s.trim(), `${k}[${ORDER[i]}]`); assert.equal(ph(s), ph(v[0]), `${k} placeholders ${ORDER[i]}`); });
  }
});
test('guides have 5 languages everywhere', () => {
  for (const g of GUIDES) for (const a of [g.title, g.sum, ...g.steps, ...g.facts.flatMap((f) => [f.l, f.v]), ...g.links.map((l) => l[0])]) assert.equal(a.length, 5, g.id);
});
test('changelog and notices have 5 languages', () => {
  for (const e of CHANGELOG) for (const l of ORDER) assert.ok(e.items[l] && e.items[l].length === e.items.en.length, e.version + l);
  for (const n of BUILTIN) for (const l of ORDER) { assert.ok(n.title[l] && n.body[l]); }
});
