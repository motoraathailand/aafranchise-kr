import test from 'node:test'; import assert from 'node:assert/strict';
import { STEPS } from '../web/tutorial.js';
import { RAW, ORDER } from '../web/i18n.js';
import { CHANGELOG } from '../web/changelog.js';
test('every tutorial step has title+body in all 5 languages, plus the shared button strings', () => {
  for (const s of STEPS) for (const k of [s.k + 'T', s.k + 'B']) { assert.ok(RAW[k], k); assert.equal(RAW[k].length, ORDER.length, k); RAW[k].forEach((x) => assert.ok(x.trim(), k)); }
  for (const k of ['tutSkip', 'tutNext', 'tutDone', 'tutAgain', 'tutAria', 'tutStepN']) assert.equal(RAW[k].length, ORDER.length, k);
  const ids = STEPS.map((s) => s.id); for (const need of ['search', 'list', 'detail', 'compare', 'budget', 'ai', 'guides', 'settings']) assert.ok(ids.includes(need), need);
});
test('0.1.1 / versionCode 2 changelog entry exists', () => { assert.equal(CHANGELOG[0].version, '0.1.1'); assert.equal(CHANGELOG[0].versionCode, 2); });
