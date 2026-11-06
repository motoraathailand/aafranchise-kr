// [ADS 변형 전용 — noads 빌드에서는 scripts/ads-stub.js 로 바뀜] 광고 컨트롤러 — 배너 전용(전면·앱 시작·보상형 금지), 한 화면에 고정 배너 1개, 콘텐츠·버튼을 가리지 않음(배너가 보이면 --ad-h 만큼 화면이 위로 올라감 + 위쪽 여백 16px).
// 광고가 없는 곳: 로그인·동의·키 안내(온보딩)·로딩·피드백 폼·카메라/사진 선택·재료 확인(편집) 화면·모든 모달/시트·키보드가 열려 있을 때. 비공개 테스트용 release 는 광고 0(CONFIG.adsInRelease=false).
// 웹(브라우저)에서는 아무것도 하지 않음. 단 ?adsdemo=1 이면 레이아웃 확인용 "광고 자리표시자"를 보여 줌(스크린샷 전용).
import { CONFIG } from './config.js';
import ADMOB from './admob-config.js';
import * as native from './native.js';
import { banner } from './ads-bridge.js';

export const AD_SCREENS = new Set(['home', 'list', 'detail', 'compare', 'budget', 'ai', 'guides', 'guide', 'settings', 'notices', 'updates', 'about']); // 배너를 허용하는 화면
const GAP = 16, DEMO_H = 50, RETRY_MS = 60000;
let screen = '', overlay = false, typing = false, mode = 'off', policy = 'none', want = null, failedAt = 0, timer = 0;
const root = () => document.documentElement;

function setHeight(h) {
  const on = h > 0; root().classList.toggle('ad-banner-on', on); root().style.setProperty('--ad-h', on ? h + GAP + 'px' : '0px');
  const d = document.getElementById('adDemo'); if (d) d.hidden = !on;
}
function allowedNow() { return AD_SCREENS.has(screen) && !overlay && !typing; }

async function sync() {
  const w = allowedNow();
  if (mode === 'demo') { if (!document.getElementById('adDemo')) { const d = document.createElement('div'); d.id = 'adDemo'; d.className = 'ad-demo'; d.innerHTML = '<span class="ad-tag">Ad</span><b>AD PLACEHOLDER</b>'; document.body.appendChild(d); } setHeight(w ? DEMO_H : 0); return; }
  if (mode !== 'native' || policy === 'none') return;
  if (w === want) return;
  if (w && failedAt && Date.now() - failedAt < RETRY_MS) return;
  want = w;
  if (!w) { setHeight(0); try { await banner.hide(); } catch {} return; }
  try { await banner.show(ADMOB.test.banner, true); } catch { failedAt = Date.now(); want = null; setTimeout(later, RETRY_MS + 300); }
}
function later() { if (timer) return; timer = setTimeout(() => { timer = 0; sync(); }, 120); }

export async function init() {
  try { if (new URLSearchParams(location.search).get('adsdemo') === '1') { mode = 'demo'; policy = 'test'; root().classList.add('ads-on'); return; } } catch {}
  if (!native.isNative()) return;
  const info = await native.buildInfo();
  // debug 앱 = 테스트 단위만. release 는 실제 단위·허용 스위치가 준비되기 전까지 광고 0
  policy = info.debug ? 'test' : (CONFIG.adsInRelease && ADMOB.units.banner ? 'real' : 'none');
  if (policy === 'none') return;
  mode = 'native'; root().classList.add('ads-on');
  banner.onSize((h) => { if (h > 0 && want !== true) return; setHeight(h); }, () => { failedAt = Date.now(); want = null; setHeight(0); setTimeout(later, RETRY_MS + 300); });
  native.onKeyboard((open, h, done) => { if (done) return; typing = open; later(); });
}
export function setScreen(name) { screen = name; later(); }
export function setOverlay(on) { overlay = !!on; later(); }
export function setTyping(on) { typing = !!on; later(); }
export const state = () => ({ mode, policy, screen, overlay, typing });
