// 비밀값 보관소(API 키). Android 앱 = 네이티브 AASecure 플러그인(Android Keystore AES-GCM 암호화). 평문 localStorage 에는 저장하지 않음.
// 브라우저(개발·자동 테스트) 전용 대체: localStorage — 네이티브가 아닐 때만 사용되고 화면에 "개발용" 임을 표시하지는 않지만 앱(APK)에서는 절대 타지 않는다.
const mem = new Map();
let loaded = false;
const cap = () => globalThis.Capacitor;
export const isNative = () => { try { const c = cap(); return !!(c && c.isNativePlatform && c.isNativePlatform()); } catch { return false; } };
const plugin = () => (cap() && cap().Plugins && cap().Plugins.AASecure) || null;
const WEB = 'frkr.devvault.';

export async function load() {
  if (loaded) return;
  if (isNative()) {
    const p = plugin(); if (!p) throw new Error('secure plugin missing');
    const { keys } = await p.keys();
    for (const k of keys || []) { const r = await p.get({ key: k }); if (r && typeof r.value === 'string') mem.set(k, r.value); }
  } else {
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(WEB)) mem.set(k.slice(WEB.length), localStorage.getItem(k)); } } catch {}
  }
  loaded = true;
}
export const get = (k) => (mem.has(k) ? mem.get(k) : null);
export async function set(k, v) {
  v = String(v);
  if (isNative()) { const p = plugin(); if (!p) throw new Error('secure plugin missing'); await p.set({ key: k, value: v }); }
  else { try { localStorage.setItem(WEB + k, v); } catch { throw new Error('storage failed'); } }
  mem.set(k, v);
}
export async function remove(k) {
  if (isNative()) { const p = plugin(); if (p) await p.remove({ key: k }); } else { try { localStorage.removeItem(WEB + k); } catch {} }
  mem.delete(k);
}
export async function clear() {
  if (isNative()) { const p = plugin(); if (p) await p.clear(); } else { try { for (const k of [...mem.keys()]) localStorage.removeItem(WEB + k); } catch {} }
  mem.clear();
}
export const _resetForTest = () => { mem.clear(); loaded = false; };

// 키 이름
export const KEY_NAMES = { gemini: 'key.gemini', groq: 'key.groq', openrouter: 'key.openrouter' };
export const getKeys = () => ({ gemini: get(KEY_NAMES.gemini) || '', groq: get(KEY_NAMES.groq) || '', openrouter: get(KEY_NAMES.openrouter) || '' });
export const hasKey = (p) => !!get(KEY_NAMES[p]);
export const mask = (k) => (k ? '••••' + String(k).slice(-4) : '');
export function cleanKey(s) { return String(s || '').replace(/[\s"'\u200b]/g, '').slice(0, 300); }

