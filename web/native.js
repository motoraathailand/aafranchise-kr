// Android(Capacitor) 다리. 브라우저(개발·테스트)에서는 가능한 것만 대체 동작. 플러그인: AppUpdate(Play), Clipboard, App(뒤로 가기), Keyboard, AABuild/AASecure(자체).
import { CONFIG } from './config.js';

const cap = () => globalThis.Capacitor;
export const isNative = () => { try { const c = cap(); return !!(c && c.isNativePlatform && c.isNativePlatform() && (!c.getPlatform || c.getPlatform() === 'android')); } catch { return false; } };
const P = () => (cap() && cap().Plugins) || {};

let infoP = null;
export function buildInfo() {
  if (infoP) return infoP;
  infoP = (async () => {
    try { const r = await P().AABuild.getInfo(); const c = parseInt(r && r.versionCode, 10); if (c > 0) return { debug: r.debug === true, versionName: String(r.versionName || ''), versionCode: c }; } catch {}
    return { debug: true, versionName: 'web', versionCode: 0, web: true };
  })();
  return infoP;
}


// ---- 클립보드 ----
export async function readClipboard() {
  const c = P().Clipboard;
  if (c && c.read) { const r = await c.read(); return r && typeof r.value === 'string' ? r.value : ''; }
  if (navigator.clipboard && navigator.clipboard.readText) return navigator.clipboard.readText();
  throw new Error('no clipboard');
}
export async function writeClipboard(text) {
  const c = P().Clipboard;
  if (c && c.write) { await c.write({ string: String(text) }); return; }
  if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(String(text)); return; }
  throw new Error('no clipboard');
}

// ---- 외부 열기(시스템 브라우저/메일 앱). Capacitor 는 allowNavigation 에 없는 주소를 시스템에 넘김 ----
export function openExternal(url) {
  try { const w = window.open(url, '_blank'); if (w) return true; } catch {}
  try { window.location.href = url; return true; } catch {}
  return false;
}

// ---- 스토어/업데이트 ----
export async function openStore() {
  const id = CONFIG.packageId;
  try { if (P().AppUpdate && P().AppUpdate.openAppStore) { await P().AppUpdate.openAppStore({ androidPackageName: id }); return 'plugin'; } } catch {}
  try { window.location.href = 'market://details?id=' + id; return 'market'; } catch {}
  openExternal('https://play.google.com/store/apps/details?id=' + id); return 'https';
}
export async function playUpdateInfo() { // Play In-App Updates: 새 versionCode(없으면 0)
  try { const r = await P().AppUpdate.getAppUpdateInfo(); const a = parseInt(r && r.availableVersionCode, 10); return Number.isFinite(a) && a > 0 && (r.updateAvailability === 2 || r.updateAvailability === 3 || r.updateAvailability === undefined) ? a : 0; } catch { return 0; }
}

// ---- 뒤로 가기 / 키보드 ----
export function onBackButton(handler) {
  try { const A = P().App; if (A && A.addListener) A.addListener('backButton', handler); } catch {}
}
export function exitApp() { try { const A = P().App; if (A && A.minimizeApp) return A.minimizeApp(); if (A && A.exitApp) return A.exitApp(); } catch {} }
export function onKeyboard(cb) {
  try { const K = P().Keyboard; if (K && K.addListener) { K.addListener('keyboardWillShow', (e) => cb(true, e && e.keyboardHeight)); K.addListener('keyboardDidShow', (e) => cb(true, e && e.keyboardHeight, true)); K.addListener('keyboardWillHide', () => cb(false)); } } catch {}
}
