// 첫 실행 튜토리얼(코치마크 오버레이) — AA 공통 규칙(2026-11-02): 별도 화면이 아니라 "진짜 홈 화면" 위에 반투명 배경 + 하이라이트 + 말풍선을 씌움.
// 한 번 끝나거나 건너뛰면 localStorage('frkr.tutorial.done')에 기록 → 자동으로 다시 뜨지 않음. 설정 > "튜토리얼 다시 보기"로 언제든 다시.
// 움직임: 하이라이트 구멍은 SVG 경로를 rAF 로 보간(레이아웃 속성 애니메이션 없음), 말풍선은 transform/opacity 만. 동작 줄이기면 즉시 이동.
import { t } from './i18n.js';
import { icon } from './icons.js';
import { esc, btn } from './ui.js';
import * as ads from './ads.js';

const KEY = 'frkr.tutorial.done';
let memDone = false;
export function isDone() { try { return localStorage.getItem(KEY) === '1' || memDone; } catch { return memDone; } }
export function markDone() { memDone = true; try { localStorage.setItem(KEY, '1'); } catch {} }

const HOME = '#app > .screen[data-screen="home"] ';
// sel: 하이라이트할 요소(여러 개면 합친 영역). menu: 이 단계는 메뉴(드로어)를 열어 둠. 대상이 화면에 없으면 단계를 건너뜀.
export const STEPS = [
  { id: 'welcome', ic: 'sparkle', sel: [HOME + '.top .applogo', HOME + '.top .title'], k: 'tutWelcome' },
  { id: 'search', ic: 'search', sel: [HOME + '.searchfake'], k: 'tutSearch' },
  { id: 'list', ic: 'store', sel: [HOME + '.gtiles .gtile:nth-child(-n+2)'], k: 'tutList' },
  { id: 'detail', ic: 'building', sel: [HOME + '.pcard:nth-child(-n+2)'], k: 'tutDetail' },
  { id: 'compare', ic: 'compare', sel: [HOME + '.short[data-act="compare"]'], k: 'tutCompare' },
  { id: 'budget', ic: 'calculator', sel: [HOME + '.short[data-act="budget"]'], k: 'tutBudget' },
  { id: 'ai', ic: 'sparkle', sel: [HOME + '.short[data-act="ai"]'], k: 'tutAi' },
  { id: 'guides', ic: 'book', sel: [HOME + '.short[data-act="guides"]'], k: 'tutGuides' },
  { id: 'settings', ic: 'settings', sel: ['#drawer [data-act="settings"]'], alt: [HOME + '.top [data-act="menu"]'], menu: true, k: 'tutSettings' },
];

const PAD = 6, MARGIN = 12, GAP = 14, DIM = 'rgba(10,10,18,.68)';
const reduced = () => !!(window.Motion && Motion.reduced());
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// cubic-bezier(.22,1,.36,1) (공통 모션 토큰 --m-ease-out)
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (s) => ((ax * s + bx) * s + cx) * s, Y = (s) => ((ay * s + by) * s + cy) * s, dX = (s) => (3 * ax * s + 2 * bx) * s + cx;
  return (x) => { let s = x; for (let i = 0; i < 8; i++) { const e = X(s) - x; if (Math.abs(e) < 1e-5) break; const d = dX(s); if (Math.abs(d) < 1e-6) break; s -= e / d; } return Y(Math.min(1, Math.max(0, s))); };
}
const easeOut = bezier(0.22, 1, 0.36, 1);
const rr = (x, y, w, h, r) => { r = Math.max(0, Math.min(r, w / 2, h / 2)); return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`; };

let S = null; // 진행 중인 세션
export const active = () => !!S;

// 보이는 요소만(display:none 이나 크기 0 은 제외)
function visibleEls(sels) {
  const out = [];
  for (const s of sels) document.querySelectorAll(s).forEach((e) => { const r = e.getBoundingClientRect(); if (r.width > 1 && r.height > 1 && !out.includes(e)) out.push(e); });
  return out;
}
function union(els) {
  let l = 1e9, tp = 1e9, r = -1e9, b = -1e9;
  for (const e of els) { const q = e.getBoundingClientRect(); l = Math.min(l, q.left); tp = Math.min(tp, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom); }
  return { x: l, y: tp, w: r - l, h: b - tp };
}
function radiusOf(els) {
  let m = 14; for (const e of els) { const v = parseFloat(getComputedStyle(e).borderTopLeftRadius); if (Number.isFinite(v)) m = Math.max(m, v); }
  return m;
}

export function start(host, { force = false } = {}) {
  if (S || (!force && isDone())) return false;
  const steps = STEPS.filter((s) => visibleEls(s.menu ? s.alt : s.sel).length);
  if (!steps.length) return false;

  const layer = document.createElement('div');
  layer.id = 'coach'; layer.className = 'coach'; layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true'); layer.setAttribute('aria-label', t('tutAria'));
  layer.innerHTML = `<svg class="coach-dim" aria-hidden="true" focusable="false"><path class="coach-fill" fill="${DIM}" fill-rule="evenodd"></path><rect class="coach-ring" fill="none"></rect></svg>
    <div class="coach-probe" aria-hidden="true"></div>
    <div class="coach-bubble"><div class="coach-card" tabindex="-1" aria-labelledby="coach-t"><div class="coach-in"></div></div><span class="coach-arrow"></span></div>`;
  document.body.appendChild(layer);
  const fill = layer.querySelector('.coach-fill'), ring = layer.querySelector('.coach-ring'), bubble = layer.querySelector('.coach-bubble'),
    inner = layer.querySelector('.coach-in'), card = layer.querySelector('.coach-card'), arrow = layer.querySelector('.coach-arrow'), probe = layer.querySelector('.coach-probe');
  ads.setOverlay(true);

  const ses = S = { idx: -1, token: 0, cur: null, raf: 0, ended: false, steps };
  const size = () => { const r = layer.getBoundingClientRect(); return { w: r.width, h: r.height }; };
  const insets = () => { const c = getComputedStyle(probe); return { top: parseFloat(c.paddingTop) || 0, bottom: parseFloat(c.paddingBottom) || 0 }; };

  function paint(c) {
    const { w, h } = size();
    fill.setAttribute('d', `M0 0H${w}V${h}H0Z${rr(c.x, c.y, c.w, c.h, c.r)}`);
    ring.setAttribute('x', c.x); ring.setAttribute('y', c.y); ring.setAttribute('width', c.w); ring.setAttribute('height', c.h); ring.setAttribute('rx', Math.min(c.r, c.w / 2, c.h / 2)); ring.setAttribute('ry', Math.min(c.r, c.h / 2, c.w / 2));
    ses.cur = c;
  }
  function holeOf(els) { const u = union(els); return { x: u.x - PAD, y: u.y - PAD, w: u.w + PAD * 2, h: u.h + PAD * 2, r: radiusOf(els) + PAD * 0.6 }; }
  function tween(to, ms) {
    cancelAnimationFrame(ses.raf);
    const from = ses.cur || { x: to.x - 40, y: to.y - 40, w: to.w + 80, h: to.h + 80, r: to.r + 20 };
    if (reduced() || ms <= 0) { paint(to); return Promise.resolve(); }
    return new Promise((res) => {
      const t0 = performance.now();
      const f = (now) => {
        const p = Math.min(1, (now - t0) / ms), e = easeOut(p), L = (a, b) => a + (b - a) * e;
        paint({ x: L(from.x, to.x), y: L(from.y, to.y), w: L(from.w, to.w), h: L(from.h, to.h), r: L(from.r, to.r) });
        if (p < 1) ses.raf = requestAnimationFrame(f); else res();
      };
      ses.raf = requestAnimationFrame(f);
    });
  }
  function tweenScroll(sc, y, ms = 380) {
    const from = sc.scrollTop; if (Math.abs(y - from) < 1) return Promise.resolve();
    if (reduced() || ms <= 0) { sc.scrollTop = y; return Promise.resolve(); }
    return new Promise((res) => { const t0 = performance.now(); const f = (now) => { const p = Math.min(1, (now - t0) / ms); sc.scrollTop = from + (y - from) * easeOut(p); if (p < 1) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
  }

  function setContent(step, n) {
    const bt = btn({ icon: n === steps.length - 1 ? 'check' : 'chevron', label: t(n === steps.length - 1 ? 'tutDone' : 'tutNext'), cls: 'primary sm', act: 'tut-next' });
    const sk = n === steps.length - 1 ? '<span></span>' : btn({ icon: 'close', label: t('tutSkip'), cls: 'plain sm', act: 'tut-skip' });
    inner.innerHTML = `<div class="coach-head"><span class="coach-ic">${icon(step.ic)}</span><h2 id="coach-t">${esc(t(step.k + 'T'))}</h2><span class="coach-n" aria-label="${esc(t('tutStepN', { n: n + 1, total: steps.length }))}">${esc(t('tutStepN', { n: n + 1, total: steps.length }))}</span></div>
      <p class="coach-body">${esc(t(step.k + 'B'))}</p>
      <div class="coach-acts">${sk}${bt}</div>`;
    sizeBubble();
  }
  function sizeBubble() {
    const { w: vw, h: vh } = size(), ins = insets();
    bubble.style.width = Math.min(360, vw - MARGIN * 2) + 'px';
    bubble.querySelector('.coach-card').style.maxHeight = (vh - ins.top - ins.bottom - MARGIN * 2) + 'px';
  }
  // 말풍선 위치: 대상 아래 → 위 → (둘 다 안 되면) 화면 가장자리. 화면 밖으로 절대 나가지 않게 clamp.
  function place(rect, instant) {
    const { w: vw, h: vh } = size(), ins = insets();
    sizeBubble();
    const bw = Math.min(360, vw - MARGIN * 2), maxH = vh - ins.top - ins.bottom - MARGIN * 2;
    const bh = Math.min(bubble.offsetHeight, maxH);
    const topEdge = ins.top + MARGIN, botEdge = vh - ins.bottom - MARGIN;
    const below = botEdge - (rect.y + rect.h) - GAP, above = rect.y - GAP - topEdge;
    let y, dir;
    if (below >= bh) { y = rect.y + rect.h + GAP; dir = 'up'; }
    else if (above >= bh) { y = rect.y - GAP - bh; dir = 'down'; }
    else { dir = ''; y = below >= above ? botEdge - bh : topEdge; }
    let sideX = null; // 위·아래 모두 자리가 없으면(가로 화면 등) 옆에 놓아 하이라이트를 가리지 않게
    if (!dir) {
      const right = vw - MARGIN - (rect.x + rect.w) - GAP, left = rect.x - GAP - MARGIN;
      if (right >= bw) { sideX = rect.x + rect.w + GAP; y = rect.y + rect.h / 2 - bh / 2; } else if (left >= bw) { sideX = rect.x - GAP - bw; y = rect.y + rect.h / 2 - bh / 2; }
    }
    y = Math.max(topEdge, Math.min(y, botEdge - bh));
    const cx = rect.x + rect.w / 2, x = sideX != null ? sideX : Math.max(MARGIN, Math.min(cx - bw / 2, vw - MARGIN - bw));
    arrow.className = 'coach-arrow' + (dir ? ' ' + dir : ''); arrow.style.left = Math.max(22, Math.min(cx - x - 8, bw - 38)) + 'px';
    if (instant || reduced()) bubble.classList.add('noanim');
    bubble.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`;
    if (instant || reduced()) { void bubble.offsetWidth; bubble.classList.remove('noanim'); }
  }
  // 대상이 보이도록(그리고 말풍선 자리가 나오도록) 스크롤 영역을 부드럽게 움직임
  async function reveal(els, step, instant) {
    const sc = els[0].closest('.scroll'); if (!sc) return;
    const { h: vh } = size(), ins = insets(), bh = bubble.offsetHeight;
    const r = union(els), cr = sc.getBoundingClientRect();
    const fitsBelow = r.y + r.h + PAD + GAP + bh + MARGIN <= vh - ins.bottom, fitsAbove = r.y - PAD - GAP - bh - MARGIN >= ins.top;
    const inView = r.y >= cr.top + 4 && r.y + r.h <= cr.bottom - 4;
    if (inView && (fitsBelow || fitsAbove)) return;
    const max = sc.scrollHeight - sc.clientHeight;
    const wantTop = cr.top + PAD + 10; // 대상을 영역 맨 위쪽으로 → 말풍선은 아래에
    const y = Math.max(0, Math.min(max, sc.scrollTop + (r.y - wantTop)));
    await tweenScroll(sc, y, instant ? 0 : 380);
  }
  function resolve(step) {
    let els = visibleEls(step.sel);
    if (!els.length && step.alt) els = visibleEls(step.alt);
    return els;
  }

  async function show(i, dir = 1) {
    const tok = ++ses.token;
    if (i < 0) i = 0;
    if (i >= steps.length) return finish(true);
    const step = steps[i];
    // 메뉴 단계: 드로어를 열고, 아니면 닫음
    if (step.menu) { if (!host.menuOpen()) { host.openMenu(); await wait(reduced() ? 40 : 520); } }
    else if (host.menuOpen()) { host.closeMenu(); await wait(reduced() ? 40 : 320); }
    if (tok !== ses.token || ses.ended) return;
    let els = resolve(step);
    if (!els.length) return show(i + dir, dir); // 대상이 없으면 조용히 건너뜀
    ses.idx = i;
    const first = !ses.cur;
    inner.classList.add('swap');
    if (!first) await wait(reduced() ? 0 : 130);
    if (tok !== ses.token || ses.ended) return;
    setContent(step, i);
    await reveal(els, step, first);
    if (tok !== ses.token || ses.ended) return;
    els = resolve(step); if (!els.length) return show(i + dir, dir);
    const hole = holeOf(els);
    place(hole, first);
    const mv = tween(hole, first ? 520 : 460);
    inner.classList.remove('swap');
    try { card.focus({ preventScroll: true }); } catch {}
    await mv;
  }
  function relayout() {
    if (ses.ended || ses.idx < 0) return;
    const step = steps[ses.idx]; let els = resolve(step);
    if (!els.length) return;
    reveal(els, step, true).then(() => { if (ses.ended) return; els = resolve(step); if (!els.length) return; const hole = holeOf(els); cancelAnimationFrame(ses.raf); paint(hole); place(hole, true); });
  }
  let rt = 0; const later = () => { clearTimeout(rt); rt = setTimeout(relayout, 60); };
  const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); finish(true); } else if (e.key === 'ArrowRight') { e.preventDefault(); next(); } };
  const next = () => { if (ses.idx + 1 >= steps.length) finish(true); else show(ses.idx + 1, 1); };
  layer.addEventListener('click', (e) => { const a = e.target.closest('[data-act]'); if (!a) return; if (a.dataset.act === 'tut-next') next(); else if (a.dataset.act === 'tut-skip') finish(true); });
  window.addEventListener('resize', later); window.addEventListener('orientationchange', later); document.addEventListener('keydown', onKey, true);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', later);
  const appEl = document.getElementById('app');
  const mo = appEl ? new MutationObserver(later) : null; if (mo) mo.observe(appEl, { childList: true });

  function finish(done) {
    if (ses.ended) return; ses.ended = true; ses.token++; cancelAnimationFrame(ses.raf); clearTimeout(rt);
    if (done) markDone();
    window.removeEventListener('resize', later); window.removeEventListener('orientationchange', later); document.removeEventListener('keydown', onKey, true);
    if (window.visualViewport) window.visualViewport.removeEventListener('resize', later);
    if (mo) mo.disconnect();
    if (host.menuOpen()) host.closeMenu();
    layer.classList.add('out');
    setTimeout(() => { layer.remove(); ads.setOverlay(false); if (S === ses) S = null; }, reduced() ? 0 : 260);
    if (S === ses && reduced()) S = null;
  }
  ses.finish = finish;
  show(0, 1);
  return true;
}
export function skip() { if (S) S.finish(true); }   // 안드로이드 뒤로 가기 = 건너뛰기
export function abort() { if (S) S.finish(false); } // 화면이 바뀌는 등 비정상 종료: 완료로 기록하지 않음
