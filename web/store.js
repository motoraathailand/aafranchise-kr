import { decodeEntities } from './text-entities.js';
// 기기 안 저장소(앱 서버 없음). 비밀(API 키)은 secure.js, 그 외(즐겨찾기·비교·최근 본 브랜드·대화·설정)는 localStorage 한 키(frkr.data.v1).
const KEY = 'frkr.data.v1';
const mem = new Map();
const ls = () => { try { return globalThis.localStorage || { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) }; } catch { return { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) }; } };
export const MAX_COMPARE = 3;
const fresh = () => ({ v: 1, favs: [], compare: [], recent: [], chat: [], budget: 50000000, reserve: true, seen: { consent: false, lastCode: 0, noticeId: '', updatesCode: 0 } });
let S = fresh();
export function load() {
  try {
    const raw = ls().getItem(KEY); const j = raw ? JSON.parse(raw) : null;
    if (j && j.v === 1) { S = { ...fresh(), ...j, seen: { ...fresh().seen, ...(j.seen || {}) } }; for (const k of ['favs', 'compare', 'recent', 'chat']) if (!Array.isArray(S[k])) S[k] = []; if (!Number.isFinite(S.budget)) S.budget = 500000; }
    else S = fresh();
  } catch { S = fresh(); }
  return S;
}
export function save() { try { ls().setItem(KEY, JSON.stringify(S)); return true; } catch { return false; } }
export const state = () => S;
export function wipe() { S = fresh(); try { ls().removeItem(KEY); } catch {} }

export const isFav = (id) => S.favs.includes(id);
export function toggleFav(id) { const i = S.favs.indexOf(id); if (i >= 0) S.favs.splice(i, 1); else S.favs.unshift(id); S.favs = S.favs.slice(0, 300); save(); return i < 0; }
export const inCompare = (id) => S.compare.includes(id);
export function toggleCompare(id) { // → 'added' | 'removed' | 'full'
  const i = S.compare.indexOf(id); if (i >= 0) { S.compare.splice(i, 1); save(); return 'removed'; }
  if (S.compare.length >= MAX_COMPARE) return 'full';
  S.compare.push(id); save(); return 'added';
}
export function clearCompare() { S.compare = []; save(); }
export function addRecent(id) { S.recent = [id, ...S.recent.filter((x) => x !== id)].slice(0, 12); save(); }
export function setBudget(n, reserve) { if (Number.isFinite(n)) S.budget = Math.max(0, Math.round(n)); if (typeof reserve === 'boolean') S.reserve = reserve; save(); }

// 대화(최근 40개, 텍스트만 — 비밀값 없음)
export const chat = () => S.chat.map(m => { if (m.role !== 'bot') return m; const text = decodeEntities(m.text); return text === m.text ? m : { ...m, text }; });
export function pushChat(m) { S.chat.push({ role: m.role, text: String(m.text || '').slice(0, 6000), at: Date.now(), ids: (m.ids || []).slice(0, 12), err: !!m.err, fb: !!m.fb }); S.chat = S.chat.slice(-40); save(); }
export function clearChat() { S.chat = []; save(); }
// Response-local control. Requires the exact persisted bot message index; no remote send.
export function hideChat(i) { if (!Number.isInteger(i) || i < 0 || i >= S.chat.length || S.chat[i].role !== 'bot') return false; S.chat.splice(i, 1); save(); return true; }
