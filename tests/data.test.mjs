// 브랜드 데이터: 번들 로드 · 원격 갱신(하루 한 번, 오프라인 안전, 검증 실패 시 기존 데이터 유지) · 설정 표시 연결.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path';
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => { store.set(k, String(v)); }, removeItem: (k) => { store.delete(k); } };
const D = await import('../web/data.js'); const { CONFIG } = await import('../web/config.js');
const root = path.resolve(import.meta.dirname, '..'); const rd = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const bundled = JSON.parse(rd('web/data/brands.json'));
const clone = (o) => JSON.parse(JSON.stringify(o));
const next = (over = {}) => { const j = clone(bundled); j.meta.version = bundled.meta.version + 1; Object.assign(j.meta, over); return j; };
const resp = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const mkFetch = (routes, log = []) => async (url) => { log.push(String(url)); const r = routes[String(url).replace(/^https:\/\/[^/]+/, '')] ?? routes.default; if (r instanceof Error) throw r; if (!r) return resp(null, 404); return typeof r === 'function' ? r() : r; };
const BUNDLE = async (u) => resp(bundled);
const reset = async () => { store.clear(); await D.load(async () => resp(bundled)); };
const P = '/aafranchise-kr-site/data/';

test('config: data URLs point at the site repo GitHub Pages (https, brands.json + meta.json)', () => {
  assert.equal(CONFIG.dataUrl, 'https://motoraathailand.github.io/aafranchise-kr-site/data/brands.json');
  assert.equal(CONFIG.dataMetaUrl, 'https://motoraathailand.github.io/aafranchise-kr-site/data/meta.json');
});
test('bundled data: schema 1, count matches, passes the same validation the app applies to remote data', () => {
  assert.equal(bundled.meta.schema, 1); assert.equal(bundled.meta.count, bundled.brands.length); assert.ok(bundled.brands.length >= 100);
  assert.deepEqual(D.validateData(next(), bundled), { ok: true });
});
test('validateData rejects bad shape / schema / old version / big drop / dup ids / mass-empty fees', () => {
  const cur = bundled; const bad = (j) => D.validateData(j, cur);
  assert.equal(bad(null).reason, 'shape'); assert.equal(bad({ meta: {}, brands: 'x' }).reason, 'shape');
  assert.equal(bad(next({ schema: 2 })).reason, 'schema'); assert.equal(bad(clone(bundled)).reason, 'not-newer'); assert.equal(bad(next({ version: 'x' })).reason, 'not-newer');
  const drop = next(); drop.brands = drop.brands.slice(0, Math.floor(cur.brands.length * 0.8)); drop.meta.count = drop.brands.length; assert.equal(bad(drop).reason, 'count');
  const ok90 = next(); ok90.brands = ok90.brands.slice(0, Math.floor(cur.brands.length * 0.86)); ok90.meta.count = ok90.brands.length; assert.equal(bad(ok90).ok, true);
  const mc = next({ count: 5 }); assert.equal(bad(mc).reason, 'meta-count');
  const dup = next(); dup.brands[1] = dup.brands[0]; assert.equal(bad(dup).reason, 'brand');
  const noname = next(); noname.brands[2] = { ...noname.brands[2], name: {} }; assert.equal(bad(noname).reason, 'brand');
  const empty = next({ feeCoverageRequired: true }); empty.brands = empty.brands.map((b) => ({ ...b, franchiseFee: undefined, totalInvestment: undefined })); assert.equal(bad(empty).reason, 'empty-fees');
});
test('load(): bundled by default; stored remote used only when its version is higher; stale remote copy is dropped', async () => {
  store.clear(); await D.load(async () => resp(bundled)); assert.equal(D.source(), 'bundled'); assert.equal(D.count(), bundled.brands.length);
  const r = next(); store.set('frkr.data.remote', JSON.stringify(r)); await D.load(async () => resp(bundled)); assert.equal(D.source(), 'remote'); assert.equal(D.meta().version, r.meta.version);
  const old = clone(bundled); old.meta.version = bundled.meta.version - 1; store.set('frkr.data.remote', JSON.stringify(old)); await D.load(async () => resp(bundled)); assert.equal(D.source(), 'bundled'); assert.equal(store.has('frkr.data.remote'), false);
  await D.load(async () => { throw new Error('offline'); }); assert.equal(D.count(), bundled.brands.length, 'load() failure keeps previous data object');
});
test('refreshRemote: offline -> nothing stored, check time not recorded (retry next launch), no throw', async () => {
  await reset(); const s = await D.refreshRemote(mkFetch({ default: new Error('offline') })); assert.equal(s, 'offline'); assert.equal(D.lastChecked(), 0); assert.equal(store.has('frkr.data.remote'), false);
});
test('refreshRemote: meta says same version -> only the small meta.json is fetched', async () => {
  await reset(); const log = []; const s = await D.refreshRemote(mkFetch({ [P + 'meta.json']: resp({ version: bundled.meta.version }) }, log)); assert.equal(s, 'current'); assert.equal(log.length, 1); assert.ok(log[0].endsWith('/meta.json')); assert.ok(D.lastChecked() > 0);
});
test('refreshRemote: heartbeat meta.json (same version + checkedAt) never triggers a brands.json download', async () => {
  await reset(); const log = []; const s = await D.refreshRemote(mkFetch({ [P + 'meta.json']: resp({ version: bundled.meta.version, count: bundled.brands.length, checkedAt: '2030-01-01T00:00:00.000Z' }) }, log)); assert.equal(s, 'current'); assert.equal(log.length, 1);
});
test('refreshRemote: newer valid data is stored; second call within a day is throttled; after a day it checks again', async () => {
  await reset(); const j = next(); const log = []; const f = mkFetch({ [P + 'meta.json']: resp({ version: j.meta.version }), [P + 'brands.json']: resp(j) }, log);
  const t = 1_800_000_000_000; assert.equal(await D.refreshRemote(f, { now: t }), 'updated'); assert.equal(JSON.parse(store.get('frkr.data.remote')).meta.version, j.meta.version);
  assert.equal(D.meta().version, bundled.meta.version, 'running session keeps its data; new data applies on next start');
  const n = log.length; assert.equal(await D.refreshRemote(f, { now: t + 3600e3 }), 'throttled'); assert.equal(log.length, n);
  assert.equal(await D.refreshRemote(mkFetch({ [P + 'meta.json']: resp({ version: j.meta.version }) }), { now: t + 25 * 3600e3 }), 'current');
  await D.load(async () => resp(bundled)); assert.equal(D.source(), 'remote'); assert.equal(D.meta().version, j.meta.version);
});
test('refreshRemote: meta.json missing (404) still works through brands.json; invalid data is rejected and stored data is untouched', async () => {
  await reset(); const j = next(); assert.equal(await D.refreshRemote(mkFetch({ [P + 'brands.json']: resp(j) })), 'updated');
  const kept = store.get('frkr.data.remote'); const worse = next(); worse.meta.version = j.meta.version + 1; worse.brands = worse.brands.slice(0, 200); worse.meta.count = 200;
  assert.equal(await D.refreshRemote(mkFetch({ [P + 'meta.json']: resp({ version: worse.meta.version }), [P + 'brands.json']: resp(worse) }), { force: true }), 'rejected:count'); assert.equal(store.get('frkr.data.remote'), kept);
  assert.equal(await D.refreshRemote(mkFetch({ [P + 'brands.json']: resp({ html: 'oops' }) }), { force: true }), 'rejected:shape');
  assert.equal(await D.refreshRemote(mkFetch({ default: resp(null, 500) }), { force: true }), 'rejected:http'); assert.equal(store.get('frkr.data.remote'), kept);
});
test('refreshRemote: full storage -> rejected:storage, no throw', async () => {
  await reset(); const j = next(); const orig = globalThis.localStorage.setItem; globalThis.localStorage.setItem = (k, v) => { if (k === 'frkr.data.remote') throw new Error('quota'); orig(k, v); };
  try { assert.equal(await D.refreshRemote(mkFetch({ [P + 'brands.json']: resp(j) })), 'rejected:storage'); } finally { globalThis.localStorage.setItem = orig; }
});
test('app wiring: refreshRemote runs after boot (non-blocking, caught) and on resume; settings shows version/date/online-refresh status', () => {
  const app = rd('web/app.js'); assert.match(app, /await D\.load\(\);\s*\n\s*setTimeout\(\(\) => \{ D\.refreshRemote\(\)\.catch/); assert.match(app, /visibilitychange[^\n]*D\.refreshRemote\(\)\.catch/);
  const st = rd('web/screens-settings.js'); for (const k of ['dataVersion', 'dataAsOf', 'dataChecked', 'dataWeekly', 'dataRemoteOn', 'D.lastChecked()', 'D.source()']) assert.ok(st.includes(k), k);
});
