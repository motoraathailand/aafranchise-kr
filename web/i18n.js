// 5개 언어(th, en, ko, zh, hi) — AA 공통 규칙: 기본 언어 = 사용자가 저장한 선택 → 폰 언어(지역 코드 포함) → 지원하지 않으면 영어. 태국어를 목록 맨 앞에.
// 문자열 항목은 [en, th, ko, zh, hi] 순서의 배열(i18n-base.js 공통, i18n-fr.js 앱 전용). 한 언어라도 빠지면 tests/i18n.test.mjs 가 실패. {자리표시자}는 모든 언어에서 같아야 함.
import { BRAND } from './brand.js';
import { BASE } from './i18n-base.js';
import { FR } from './i18n-fr.js';
export const LANGS = [
  { code: 'th', name: 'ไทย' },
  { code: 'en', name: 'English' },
  { code: 'ko', name: '한국어' },
  { code: 'zh', name: '简体中文' },
  { code: 'hi', name: 'हिन्दी' },
];
export const LANG_CODES = LANGS.map((l) => l.code);
export const ORDER = ['en', 'th', 'ko', 'zh', 'hi'];
const KEY = 'frkr.lang';
const T = { ...BASE, ...FR };

export function mapLang(tag) {
  const base = String(tag || '').toLowerCase().replace('_', '-').split('-')[0];
  return LANG_CODES.includes(base) ? base : null;
}
export function pickLang(saved, deviceLangs) {
  const s = mapLang(saved); if (s && String(saved).length <= 8) return s;
  for (const l of deviceLangs || []) { const m = mapLang(l); if (m) return m; }
  return 'ko';
}
export function detectLang(win = globalThis) {
  let saved = null; try { saved = win.localStorage.getItem(KEY); } catch {}
  const nav = win.navigator || {};
  return pickLang(saved, nav.languages && nav.languages.length ? nav.languages : [nav.language]);
}
export const STRINGS = Object.fromEntries(ORDER.map((l, i) => [l, Object.fromEntries(Object.entries(T).map(([k, v]) => [k, v[i]]))]));
export const RAW = T;
// 언어별 값 고르기: pickL({en, th, ko, zh, hi}) — 없으면 영어
export const pickL = (o, lang = cur) => (o && (o[lang] ?? o.en)) ?? '';

let cur = 'ko';
export const getLang = () => cur;
export function setLang(code, win = globalThis) {
  cur = LANG_CODES.includes(code) ? code : 'ko';
  try { win.localStorage.setItem(KEY, cur); } catch {}
  try { if (win.document) win.document.documentElement.lang = cur; } catch {}
  return cur;
}
export function initLang(win = globalThis) { cur = detectLang(win); try { if (win.document) win.document.documentElement.lang = cur; } catch {} return cur; }
export function t(key, vars, lang = cur) {
  if (key === 'appName') return BRAND.names[lang] || BRAND.names.en;
  if (STRINGS.en[key] === undefined && globalThis.console) console.warn('i18n-missing', key);
  let s = (STRINGS[lang] && STRINGS[lang][key]) ?? STRINGS.en[key] ?? key;
  if (Array.isArray(s)) s = s[0];
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
  return s;
}
