// 브랜드 데이터 로더 + 검색/필터/정렬 + 금액 표시. 데이터는 번들된 data/brands.json(오프라인 우선).
// 원격 갱신(매주 사이트에 올라가는 JSON): CONFIG.dataUrl 의 meta.version 이 더 크고 검증을 통과할 때만 받아 localStorage 에 저장, 다음 실행부터 사용. 실패하면 번들/저장본 그대로.
import { CONFIG } from './config.js';
import { getLang, pickL } from './i18n.js';
import { GROUPS, MAX_DROP, validateData } from './data-validate.js';

const REMOTE_KEY = 'frkr.data.remote'; const CHECK_KEY = 'frkr.data.checked'; // 기기에 저장한 원격 데이터 · 마지막 확인 시각(ms)
export const CHECK_EVERY_MS = 24 * 3600 * 1000; // 원격 확인은 하루 한 번까지
let DATA = { meta: { count: 0, version: 0 }, groups: [], brands: [] };
let FROM = 'none'; // 'bundled' | 'remote' — 지금 쓰는 데이터 출처
let BY = new Map();
export { GROUPS, MAX_DROP, validateData };

function index(d, from) { DATA = d; FROM = from; BY = new Map(d.brands.map((b) => [b.id, b])); }
export async function load(fetchFn = globalThis.fetch && globalThis.fetch.bind(globalThis)) {
  let bundled = null;
  try { const r = await fetchFn('data/brands.json'); if (r.ok) bundled = await r.json(); } catch {}
  let remote = await storedRemote();
  const useRemote = remote && remote.meta && Array.isArray(remote.brands) && remote.brands.length && (!bundled || (remote.meta.version || 0) > (bundled.meta.version || 0));
  if (useRemote) index(remote, 'remote'); else if (bundled && Array.isArray(bundled.brands)) index(bundled, 'bundled');
  if (!useRemote && remote) await deleteRemote(); // 번들이 더 새 것이면 오래된 원격 사본은 버림
  return DATA;
}
export const source = () => FROM;
export const lastChecked = () => { try { return Number(localStorage.getItem(CHECK_KEY)) || 0; } catch { return 0; } };
const metaUrlOf = (u) => (CONFIG.dataMetaUrl || u.replace(/[^/]*$/, 'meta.json'));
async function getJson(fetchFn, url, ms) {
  const ac = typeof AbortController === 'function' ? new AbortController() : null; const tm = ac ? setTimeout(() => ac.abort(), ms) : null;
  try { const r = await fetchFn(url, { cache: 'no-store', ...(ac ? { signal: ac.signal } : {}) }); if (!r.ok) return { status: r.status }; return { status: r.status, json: await r.json() }; }
  catch { return { status: 0 }; } finally { if (tm) clearTimeout(tm); }
}
// 하루 한 번까지, 백그라운드에서. 실패(오프라인·잘못된 데이터)해도 지금 데이터를 그대로 씀. 새 데이터는 기기에 저장하고 다음 실행부터 사용.
// 반환: 'off' | 'throttled' | 'offline' | 'current' | 'updated' | 'rejected:<이유>'
export async function refreshRemote(fetchFn = globalThis.fetch && globalThis.fetch.bind(globalThis), { force = false, now = Date.now() } = {}) {
  const url = CONFIG.dataUrl; if (!url || !/^https:\/\//.test(url) || !fetchFn) return 'off';
  if (!force && now - lastChecked() < CHECK_EVERY_MS && now >= lastChecked()) return 'throttled';
  const done = (r) => { try { localStorage.setItem(CHECK_KEY, String(now)); } catch {} return r; };
  let sv = (await storedRemote())?.meta?.version || 0;
  const cv = Math.max(DATA.meta.version || 0, sv); // 이미 받아 둔(다음 실행에 적용될) 버전도 포함
  const m = await getJson(fetchFn, metaUrlOf(url), 15000); // 작은 meta.json 먼저: 새 버전이 아니면 큰 파일은 받지 않음
  if (m.json && Number.isInteger(m.json.version) && m.json.version <= cv) return done('current');
  if (m.status === 0) return 'offline'; // 네트워크 없음: 확인 시각을 기록하지 않아 다음 실행에 다시 시도
  const r = await getJson(fetchFn, url, 90000);
  if (r.status === 0) return 'offline';
  if (!r.json) return done('rejected:http');
  const v = validateData(r.json, { ...DATA, meta: { ...DATA.meta, version: cv } }); if (!v.ok) return done('rejected:' + v.reason);
  if (!await saveRemote(r.json)) return done('rejected:storage');
  return done('updated');
}
export const meta = () => DATA.meta;
export const all = () => DATA.brands;
export const byId = (id) => BY.get(id) || null;
export const count = () => DATA.brands.length;
export const groupCounts = () => { const c = {}; for (const b of DATA.brands) c[b.group] = (c[b.group] || 0) + 1; return c; };

// ---- 대형 원격 카탈로그 영속 저장 ----
// 11k개 데이터를 localStorage의 작은 UTF-16 quota에 넣지 않는다. IndexedDB는 앱 소유 저장소이며
// 키/계정은 보관하지 않는다. Node(단위 검사)와 IndexedDB 미지원 환경에서는 기존 폐기 안전 경로를 유지한다.
function remoteDb() {
 return new Promise((resolve,reject)=>{if(!globalThis.indexedDB)return reject(new Error('idb-unavailable'));const r=indexedDB.open('frkr-catalog',1);r.onupgradeneeded=()=>r.result.createObjectStore('catalog');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('idb-open-failed'));});
}
async function storedRemote(){try{const db=await remoteDb();const value=await new Promise((resolve,reject)=>{const tx=db.transaction('catalog','readonly'),r=tx.objectStore('catalog').get('remote');r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close();tx.onerror=()=>{db.close();reject(tx.error)};} );if(value)return value;}catch{}try{return JSON.parse(localStorage.getItem(REMOTE_KEY)||'null')}catch{return null;}}
async function saveRemote(value){ /* true on success; never repair malformed newer/older data after this gate. */ let db;try{db=await remoteDb();await new Promise((resolve,reject)=>{const tx=db.transaction('catalog','readwrite');tx.objectStore('catalog').put(value,'remote');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('idb-write-failed'));tx.onabort=()=>reject(tx.error||new Error('idb-write-aborted'));});try{localStorage.removeItem(REMOTE_KEY)}catch{}return true;}catch{if(db)try{db.close()}catch{} }
 try{localStorage.setItem(REMOTE_KEY,JSON.stringify(value));return true}catch{return false;}}
async function deleteRemote(){try{localStorage.removeItem(REMOTE_KEY)}catch{}try{const db=await remoteDb();await new Promise((resolve,reject)=>{const tx=db.transaction('catalog','readwrite');tx.objectStore('catalog').delete('remote');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});}catch{} }

// ---- 이름·분류 ----
export function nameOf(b, lang = getLang()) {
  const th = b.name.ko || b.name.en || b.id, en = b.name.en || b.name.ko || b.id;
  return lang === 'ko' ? th : en; // 한국어와 공식 원문 병기 영문만 사용. 임의 기계번역 브랜드명 없음.
}
export function altName(b, lang = getLang()) { const a = nameOf(b, lang), th = b.name.ko, en = b.name.en; const o = lang === 'ko' ? en : th; return o && o !== a ? o : ''; }
// 소분류(원문 태국어). 번역 표(SUBCATS)에 있으면 그 언어로, 없으면 태국어 원문.
export const SUBCATS = {}; // 필요 시 scraper 가 만든 data.categories 로 채움
export function subLabel(b, lang = getLang()) { const th = b.category && b.category.ko; if (!th) return ''; if (lang === 'ko') return th; const m = (DATA.categories || {})[th]; return (m && m[lang]) || th; }

// ---- 금액 ----
const trim = (x) => String(Math.round(x * 10) / 10).replace(/\.0$/, '');
const grp = (n) => Math.round(n).toLocaleString('en-US');
export function krw(n, lang = getLang()) {
  if (n == null || !Number.isFinite(n)) return '–';
  if (lang === 'th') return n >= 10000 ? `${grp(n / 10000)} หมื่นวอน` : `${grp(n)} วอน`;
  if (lang === 'ko') return n >= 10000 ? `${grp(n / 10000)}만 원` : `${grp(n)} 원`;
  if (lang === 'zh') return n >= 10000 ? `${grp(n / 10000)}万韩元` : `${grp(n)}韩元`;
  if (lang === 'hi') return n >= 100000 ? `${grp(n / 100000)} लाख वॉन` : `${grp(n)} वॉन`;
  return n >= 1000000 ? `₩${trim(n / 1000000)}M` : `₩${grp(n)}`;
}
export function krwRange(r, lang = getLang()) {
  if (!r || r.min == null) return null;
  if (r.max == null || r.max === r.min) return krw(r.min, lang);
  return `${krw(r.min, lang)} – ${krw(r.max, lang)}`;
}
// 공통 화면 인터페이스 보존: 내부 값은 원단위 숫자. 표시는 한국 원/만원.
export const baht = krw;
export const bahtRange = krwRange;
// 대표 금액(예산 필터용): 총 투자비 최소 → 없으면 가맹비 최소
export const entryCost = (b) => (b.totalInvestment && b.totalInvestment.min != null ? b.totalInvestment.min : b.franchiseFee && b.franchiseFee.min != null ? b.franchiseFee.min : null);
export const feeMin = (b) => (b.franchiseFee && b.franchiseFee.min != null ? b.franchiseFee.min : null);
export function reserveOf(b, months = 3) { const w = b.workingCapital; return w && w.min != null && w.per === 'month' ? w.min * months : 0; }
const NONE = { th: 'ไม่มี', en: 'None', ko: '없음', zh: '无', hi: 'कोई नहीं' };
const PER = {
  month: { th: ' ต่อเดือน', en: ' / month', ko: ' / 월', zh: ' / 月', hi: ' / माह' },
  sales: { th: ' ของยอดขาย', en: ' of sales', ko: ' (매출 기준)', zh: '（按销售额）', hi: ' (बिक्री पर)' },
  year: { th: ' ต่อปี', en: ' / year', ko: ' / 년', zh: ' / 年', hi: ' / वर्ष' },
};
export function royaltyText(f, lang = getLang()) {
  if (!f) return null; if (f.none) return pickL(NONE, lang);
  if (f.pct != null) { const p = f.pctMax && f.pctMax !== f.pct ? `${f.pct}–${f.pctMax}%` : `${f.pct}%`; return p + (f.per && PER[f.per] ? pickL(PER[f.per], lang) : ''); }
  if (f.amount) return krwRange(f.amount, lang); return f.raw || null;
}
const YR = { th: (r) => `${r} ปี`, en: (r) => `${r} yr`, ko: (r) => `${r}년`, zh: (r) => `${r}年`, hi: (r) => `${r} वर्ष` };
const MO = { th: (r) => `${r} เดือน`, en: (r) => `${r} mo`, ko: (r) => `${r}개월`, zh: (r) => `${r}个月`, hi: (r) => `${r} माह` };
export function yearsText(c, lang = getLang()) { if (!c || !c.years) return c ? c.raw : null; const a = c.years.min, b = c.years.max; return (YR[lang] || YR.en)(a === b ? `${a}` : `${a}–${b}`); }
export function monthsText(p, lang = getLang()) { if (!p || !p.months || p.months.max < 1) return p ? p.raw : null; const a = p.months.min, b = p.months.max; return (MO[lang] || MO.en)(a === b ? `${trim(a)}` : `${trim(a)}–${trim(b)}`); }

// ---- 검색 ----
const norm = (s) => String(s || '').toLowerCase().normalize('NFKC').replace(/[\s\-_.'’"]+/g, '');
export function search({ q = '', group = '', maxBudget = 0, sort = 'name', ids = null, reserve = false } = {}) {
  const nq = norm(q);
  let list = DATA.brands;
  if (ids) { const s = new Set(ids); list = list.filter((b) => s.has(b.id)); }
  if (group) list = list.filter((b) => b.group === group);
  if (nq) list = list.filter((b) => norm(`${b.name.ko || ''} ${b.name.en || ''} ${(b.category && b.category.ko) || ''} ${b.id}`).includes(nq));
  if (maxBudget > 0) list = list.filter((b) => { const c = entryCost(b); return c != null && c + (reserve ? reserveOf(b) : 0) <= maxBudget; });
  const L = getLang();
  const cmp = {
    name: (a, b) => nameOf(a, L).localeCompare(nameOf(b, L), L === 'th' ? 'th' : 'ko'),
    cost: (a, b) => (entryCost(a) ?? 1e12) - (entryCost(b) ?? 1e12),
    costDesc: (a, b) => (entryCost(b) ?? -1) - (entryCost(a) ?? -1),
    fee: (a, b) => (feeMin(a) ?? 1e12) - (feeMin(b) ?? 1e12),
    branches: (a, b) => (b.branches ?? -1) - (a.branches ?? -1),
  }[sort] || (() => 0);
  return [...list].sort(cmp);
}
