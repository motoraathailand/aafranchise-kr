// 키보드 대응(웹 쪽): 입력창이 키보드에 가려지지 않게 함.
// 1순위는 네이티브(MainActivity 가 IME 인셋만큼 WebView 를 줄임 → 웹뷰 높이 자체가 줄어 #app 이 같이 줄어듦).
// 2순위(보험): 웹뷰가 안 줄고 visualViewport 만 줄어드는 환경이면 --kb 로 #app 아래를 키보드 높이만큼 비움. 두 방식이 겹쳐서 이중으로 비우지 않도록 "레이아웃 높이 − 보이는 높이" 만 사용.
// 또 입력칸에 포커스가 가면 광고를 숨기고, 채팅 목록은 맨 아래로, 폼 입력칸은 보이는 위치로 스크롤.
import * as ads from './ads.js';
import * as native from './native.js';

const root = () => document.documentElement;
let kb = 0, started = false, base = 0, fallbackKb = 0;
const isField = (el) => !!el && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit', 'range', 'color', 'file'].includes(el.type)) || el.isContentEditable);

export function measure() { // 가려진 키보드 높이(px). 웹뷰가 이미 줄었으면 0.
  const vv = window.visualViewport; if (!vv) return 0;
  const layoutH = root().clientHeight || window.innerHeight;
  const hidden = Math.round(layoutH - vv.height - (vv.offsetTop || 0));
  return hidden > 80 ? hidden : 0;
}
export function update() {
  const h = measure() || fallbackKb;
  if (!h && !isField(document.activeElement)) base = root().clientHeight;
  if (h !== kb) { kb = h; root().style.setProperty('--kb', h + 'px'); root().classList.toggle('kb-open', h > 0); }
  const open = h > 0 || isField(document.activeElement); ads.setTyping(open);
  if (document.activeElement && isField(document.activeElement)) reveal(document.activeElement);
}
// 입력칸이 보이게 + 채팅 목록 맨 아래로
function reveal(el) {
  const msgs = document.querySelector('.screen:not(.gone) .msgs');
  if (msgs && el.closest('.composer')) { msgs.scrollTop = msgs.scrollHeight; return; }
  const box = el.closest('.scroll, .sheet'); if (!box) return;
  const r = el.getBoundingClientRect(), b = box.getBoundingClientRect();
  if (r.bottom > b.bottom - 8 || r.top < b.top + 8) { try { el.scrollIntoView({ block: 'center', behavior: 'auto' }); } catch {} }
}
export function init() {
  if (started) return; started = true;
  const run = () => requestAnimationFrame(update);
  window.addEventListener('resize', () => { run(); setTimeout(run, 120); setTimeout(run, 350); });
  if (window.visualViewport) { window.visualViewport.addEventListener('resize', run); window.visualViewport.addEventListener('scroll', run); }
  // 3순위(보험): 네이티브 키보드 이벤트가 알려 준 높이(dp = CSS px). 키보드가 완전히 뜬 뒤에도 웹뷰가 안 줄어 있으면 그 높이만큼 비움.
  base = root().clientHeight;
  native.onKeyboard((open, h, done) => {
    if (!open) { fallbackKb = 0; run(); return; }
    if (done && h > 80) setTimeout(() => { if (measure() === 0 && root().clientHeight > (base || 0) - 40) { fallbackKb = Math.round(h); update(); } }, 450);
  });
  document.addEventListener('focusin', (e) => { if (isField(e.target)) { ads.setTyping(true); setTimeout(run, 80); setTimeout(run, 320); setTimeout(run, 650); } });
  document.addEventListener('focusout', () => setTimeout(() => { if (!isField(document.activeElement)) { ads.setTyping(measure() > 0); } }, 120));
}
