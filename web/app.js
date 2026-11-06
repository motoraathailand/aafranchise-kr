// fr 시작점: 부팅(언어·보안 저장소·로컬 저장소·브랜드 데이터) → 화면 흐름(동의 → 홈) + 라우터 + 팝업(새 버전·새로 바뀐 점) + 안드로이드 뒤로 가기. 로그인 없음.
// 앱 서버 없음: 업데이트 확인 = Play In-App Update + (선택) CONFIG.remoteConfigUrl 정적 JSON.
import { initLang, t, getLang } from './i18n.js';
import { icon } from './icons.js';
import { BRAND } from './brand.js';
import * as secure from './secure.js';
import * as S from './store.js';
import * as native from './native.js';
import * as ads from './ads.js';
import * as notices from './notices.js';
import { latest } from './changelog.js';
import { decide, changelogDecision, SNOOZE_MS } from './update.js';
import { esc, toast, closeTopSheet, sheetOpen, confirmSheet } from './ui.js';
import { consent, keys, login } from './screens-start.js';
import * as auth from './auth.js';
import { home, list, detail, compare, budget } from './screens-brands.js';
import { ai } from './screens-ai.js';
import { guides, guide } from './screens-guide.js';
import { settings } from './screens-settings.js';
import * as D from './data.js';
import * as M from './screens-menu.js';
import * as kbd from './keyboard.js';
import * as Tut from './tutorial.js';

const SCREENS = { login, consent, keys, home, list, detail, compare, budget, ai, guides, guide, settings, notices: M.noticesScreen, updates: M.updatesScreen, feedback: M.feedbackScreen, about: M.aboutScreen };
const appEl = () => document.getElementById('app');
const snoozeKey = 'frkr.update.snooze';

const state = { info: { versionName: '', versionCode: 0, debug: true }, remote: null, noticeList: null, noticesNew: false, updatesNew: false };
const stack = []; // { name, params, el, view }

const ctx = {
  store: S, t,
  toast, confirm: confirmSheet,
  info: () => state.info,
  versionLabel: () => `${state.info.versionName}${state.info.versionCode ? ` (${state.info.versionCode})` : ''}`,
  versionCode: () => state.info.versionCode,
  noticesBadge: () => state.noticesNew, updatesBadge: () => state.updatesNew, menuBadge: () => state.noticesNew || state.updatesNew,
  noticesWasNew: () => state.noticesNew || state._noticesWasNew, updatesWasNew: () => state.updatesNew || state._updatesWasNew,
  markNoticesSeen(list) { const id = notices.latestId(list); state._noticesWasNew = state.noticesNew; if (id) { S.state().seen.noticeId = id; S.save(); } state.noticesNew = false; },
  markUpdatesSeen() { state._updatesWasNew = state.updatesNew; S.state().seen.updatesCode = latest().versionCode; S.save(); state.updatesNew = false; },
  snoozeUpdate(code) { try { localStorage.setItem(snoozeKey, JSON.stringify({ code, until: Date.now() + SNOOZE_MS })); } catch {} },
  openMenu: () => M.openMenu(ctx), openLang: () => M.openLang(ctx), openPrivacy: () => M.openPrivacy(),
  go, back, setRoot, popTo, refresh, onLangChanged,
  replaceParams(p) { const top = stack[stack.length - 1]; if (top) { top.params = { ...(top.params || {}), ...p }; refresh(); } },
  afterConsent() { setRoot('home'); },
  afterLogin() { setRoot(S.state().seen.consent ? 'home' : 'consent'); },
  replayTutorial() { if (stack[0] && stack[0].name === 'home') popTo('home'); else setRoot('home', {}); setTimeout(() => Tut.start(tutHost, { force: true }), 950); },
  async signOut() { await auth.signOut(); S.state().seen.loginSkip = false; S.save(); setRoot('login'); },
};

// ---------- 첫 실행 튜토리얼 ----------
const tutHost = { openMenu: () => ctx.openMenu(), closeMenu: () => M.closeMenu(), menuOpen: () => M.menuOpen() };
let tutPending = false;
// 로그인 → 동의 → 홈에 도착한 뒤 한 번. 팝업(새 버전·새로 바뀐 점·시트·메뉴)이 떠 있으면 닫힐 때까지 기다림. 끝나거나 건너뛰면 다시 자동으로 뜨지 않음.
function scheduleTutorial() {
  if (tutPending || Tut.isDone() || Tut.active()) return; tutPending = true; let tries = 0;
  const tick = () => {
    if (Tut.isDone() || Tut.active() || ++tries > 400) { tutPending = false; return; }
    const top = stack[stack.length - 1];
    if (!top || top.name !== 'home' || sheetOpen() || M.menuOpen() || document.querySelector('.sheet-wrap')) { setTimeout(tick, 700); return; }
    tutPending = false; Tut.start(tutHost);
  };
  setTimeout(tick, 1300);
}

// ---------- 라우터 ----------
function build(name, params) {
  const view = SCREENS[name](ctx, params || {});
  const el = document.createElement('section'); el.className = 'screen'; el.dataset.screen = name; el.dataset.langRoot = '';
  el.innerHTML = view.html || '';
  return { name, params, el, view };
}
function bind(entry) {
  const { el, view } = entry;
  el.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act]'); if (!a || !el.contains(a) || a.disabled) return;
    const act = a.dataset.act;
    if (act === 'back') return back();
    if (act === 'menu') return ctx.openMenu();
    if (act === 'lang') return ctx.openLang();
    const fn = view.acts && view.acts[act]; if (fn) { e.preventDefault(); fn(a, e); }
  });
  if (view.mount) view.mount(el);
}
function show(entry, cls) {
  const host = appEl();
  entry.el.classList.add(cls); host.appendChild(entry.el); bind(entry);
  setTimeout(() => entry.el.classList.remove(cls), 600);
  ads.setScreen(entry.view.ad || '');
  document.activeElement && document.activeElement.blur && document.activeElement.blur();
}
function go(name, params) {
  const prev = stack[stack.length - 1]; if (prev) { const sc = prev.el.querySelector('.scroll'); prev.scroll = sc ? sc.scrollTop : 0; prev.el.classList.add('gone'); prev.el.style.display = 'none'; }
  const entry = build(name, params); stack.push(entry); show(entry, 'm-screen-fwd');
}
function setRoot(name, params) {
  stack.splice(0).forEach((e) => e.el.remove());
  document.querySelectorAll('#app > .screen').forEach((n) => n.remove());
  if (Tut.active()) Tut.abort();
  const entry = build(name, params); stack.push(entry); show(entry, 'm-fade');
  if (name === 'home') { maybeChangelog(); setTimeout(checkUpdate, 1500); scheduleTutorial(); }
}
function back() {
  if (stack.length <= 1) return false;
  const cur = stack.pop(); cur.el.remove();
  rebuildTop('m-screen-back'); return true;
}
function popTo(name) { while (stack.length > 1 && stack[stack.length - 1].name !== name) stack.pop().el.remove(); rebuildTop('m-screen-back', true); }
function rebuildTop(cls, removeCurrent) {
  const top = stack[stack.length - 1]; if (!top) return;
  const cursc = top.el.querySelector('.scroll'); const keep = cls === 'm-fade' && cursc ? cursc.scrollTop : (top.scroll || 0);
  if (removeCurrent) top.el.remove(); stack[stack.length - 1] = build(top.name, top.params);
  stack[stack.length - 1].el.style.display = ''; show(stack[stack.length - 1], cls);
  if (keep) { const sc = stack[stack.length - 1].el.querySelector('.scroll'); if (sc) { const set = () => { sc.scrollTop = keep; }; set(); requestAnimationFrame(set); } stack[stack.length - 1].scroll = keep; }
  document.querySelectorAll('#app > .screen').forEach((n) => { if (n !== stack[stack.length - 1].el && !stack.some((s) => s.el === n)) n.remove(); });
}
function refresh() { rebuildTop('m-fade', true); }
function onLangChanged() {
  const wasMenu = M.menuOpen(); if (wasMenu) document.getElementById('drawer').remove();
  document.title = t('appName'); document.documentElement.lang = getLang();
  refresh(); if (window.Motion) Motion.langFade(stack[stack.length - 1].el);
  if (wasMenu) ctx.openMenu();
}

// 안드로이드 뒤로 가기: 시트 → 메뉴 → 이전 화면 → (맨 처음 화면이면) 앱을 뒤로 보냄
function onBack() {
  if (Tut.active()) { Tut.skip(); return; }
  if (sheetOpen()) { closeTopSheet(); return; }
  if (M.closeMenu()) return;
  if (!back()) native.exitApp();
}

// ---------- 업데이트·새로 바뀐 점 ----------
async function checkUpdate() {
  try {
    if (!state.info.versionCode) return;
    if (!state.remote) state.remote = await notices.loadRemote();
    const c = state.remote || {};
    let snooze = null; try { snooze = JSON.parse(localStorage.getItem(snoozeKey) || 'null'); } catch {}
    const d = decide({ current: state.info.versionCode, serverLatest: c.latestVersionCode, serverMin: c.minVersionCode, playAvailable: await native.playUpdateInfo(), snooze });
    if (d.show && !sheetOpen() && !document.querySelector('.sheet-wrap')) M.openUpdatePopup(ctx, d);
  } catch {}
}
function maybeChangelog() {
  const cur = state.info.versionCode; if (!cur) return;
  const dec = changelogDecision(S.state().seen.lastCode || 0, cur);
  if (dec.record) { S.state().seen.lastCode = cur; S.save(); }
  if (dec.show) setTimeout(() => { if (!sheetOpen()) M.openChangelogPopup(ctx, cur); }, 900);
}
async function computeBadges() {
  state.noticeList = await notices.load();
  state.noticesNew = !!notices.latestId(state.noticeList) && S.state().seen.noticeId !== notices.latestId(state.noticeList);
  state.updatesNew = (S.state().seen.updatesCode || 0) < latest().versionCode && !!(S.state().seen.lastCode);
}

// ---------- 부팅 ----------
async function boot() {
  initLang(); document.documentElement.lang = getLang();
  if (window.Motion) Motion.use({ ripple: '.btn, .icon-btn, .row, .lang-pill, .toggle, .chip.pick, .bmain, .short, .gtile, .gcard, .pcard, .sug' });
  document.title = t('appName');
  S.load();
  let fatal = false;
  try { await secure.load(); } catch { fatal = true; }
  state.info = await native.buildInfo();
  ads.init().catch(() => {}); kbd.init();
  native.onBackButton(onBack);
  if (fatal) { appEl().innerHTML = `<div class="screen"><div class="scroll"><div class="page center hero"><div class="brandmark">${icon('lock')}</div><h1>${esc(t('secureFail'))}</h1></div></div></div>`; hideSplash(); return; }
  await D.load();
  setTimeout(() => { D.refreshRemote().catch(() => {}); }, 4000); // 비차단: 화면이 뜬 뒤 하루 한 번까지 온라인 데이터 확인(오프라인·오류면 조용히 무시)
  if (auth.required()) { await auth.restore(); if (!auth.getUser() && S.state().seen.loginSkip && auth.canSkip(state.info.debug === true)) auth.skip(); }
  const first = auth.required() && !auth.signedIn() ? 'login' : S.state().seen.consent ? 'home' : 'consent';
  setRoot(first, {});
  hideSplash();
  computeBadges().then(() => { if (stack[stack.length - 1] && stack[stack.length - 1].name === 'home') refresh(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && S.state().seen.consent && auth.signedIn()) { checkUpdate(); D.refreshRemote().catch(() => {}); } });
}
function hideSplash() { const s = document.getElementById('splash'); if (s) { s.classList.add('out'); setTimeout(() => s.remove(), 300); } }

window.FR = { ctx, state, stack, store: S, kbd, brand: BRAND }; // 디버깅·자동 테스트용(비밀값 없음)
boot();
