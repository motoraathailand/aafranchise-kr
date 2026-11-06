// Google 로그인 — Firebase Authentication(@capacitor-firebase/authentication), 다른 AA 앱(AA Scanner Lite)과 같은 방식. 앱마다 별도 Firebase 프로젝트(공통 규칙).
// 플러그인은 번들 없이 Capacitor 레지스트리로만 호출. 테스트는 window.__FR_AUTH_PLUGIN 으로 가짜 주입. 서버 없음: 이름·이메일은 화면 표시용으로만 쓰고 이 폰 밖으로 보내지 않음.
import { CONFIG } from './config.js';
const PLUGIN = 'FirebaseAuthentication';
const isNative = () => !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
function plugin() {
  if (window.__FR_AUTH_PLUGIN) return window.__FR_AUTH_PLUGIN;
  const C = window.Capacitor; if (!C || !isNative()) return null;
  if (C.Plugins && C.Plugins[PLUGIN]) return C.Plugins[PLUGIN];
  try { if (typeof C.registerPlugin === 'function') return C.registerPlugin(PLUGIN); } catch { /* 네이티브 플러그인 없음 */ }
  return null;
}
export const required = () => !!(CONFIG.auth && CONFIG.auth.required);
export const configured = () => !!(CONFIG.auth && CONFIG.auth.configured) || !!window.__FR_AUTH_PLUGIN;
/** 로그인 없이 시험(debug 빌드 + Firebase 미설정일 때만) */
export const canSkip = (debug) => !!debug && !configured() && !window.__FR_AUTH_PLUGIN;
export function normUser(raw) { const u = raw && (raw.user || raw); if (!u || !u.uid) return null; return { uid: String(u.uid), email: u.email ? String(u.email) : '', name: u.displayName ? String(u.displayName) : '' }; }
/** 'cancelled' | 'network' | 'recent' | 'notready' | 'other' */
export function errorKind(e) {
  const s = `${(e && (e.code || '')) || ''} ${(e && (e.message || e)) || ''}`.toLowerCase();
  if (/cancel|12501|dismiss|user_cancel|no credential/.test(s)) return 'cancelled';
  if (/network|offline|unreachable|timeout|12502|unavailable/.test(s)) return 'network';
  if (/recent/.test(s)) return 'recent';
  if (/not_ready|no auth plugin|default_web_client_id|developer_error|10:|28444|api.?key|configuration/.test(s)) return 'notready';
  return 'other';
}
let user = null, skipped = false;
export const getUser = () => user;
export const isSkipped = () => skipped;
export const signedIn = () => !!user || skipped;
export async function restore(timeoutMs = 4000) {
  const p = plugin(); if (!p) return null;
  try { const r = await Promise.race([p.getCurrentUser(), new Promise((res) => setTimeout(() => res(null), timeoutMs))]); user = normUser(r); return user; } catch { return null; }
}
export async function signIn() {
  const p = plugin(); if (!p) { const e = new Error('no auth plugin'); e.code = 'not_ready'; throw e; }
  const u = normUser(await p.signInWithGoogle({})); if (!u) throw new Error('no user returned'); user = u; return u;
}
export function skip() { skipped = true; }
export async function signOut() { const p = plugin(); try { if (p) await p.signOut(); } finally { user = null; skipped = false; } }
/** 계정 삭제(Play 정책: 앱에서 만든 계정은 앱 안에서 삭제 가능). 최근 로그인 요구 시 한 번 다시 로그인 후 삭제 */
export async function deleteAccount() {
  const p = plugin(); if (!p) { const e = new Error('no auth plugin'); e.code = 'not_ready'; throw e; }
  try { await p.deleteUser(); } catch (e) { if (errorKind(e) !== 'recent') throw e; await p.signInWithGoogle({}); await p.deleteUser(); }
  try { await p.signOut(); } catch { /* 이미 삭제됨 */ }
  user = null;
}
