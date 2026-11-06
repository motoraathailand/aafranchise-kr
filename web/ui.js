// 화면 조립 도우미: 이스케이프, 버튼(아이콘 필수), 시트·모달, 토스트, 확인창. 시트가 떠 있는 동안은 광고 배너를 숨김(ads.setOverlay).
import { icon } from './icons.js';
import { t } from './i18n.js';
import * as ads from './ads.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// 버튼: icon 은 필수. label 이 없으면 아이콘만 + aria-label(접근성 라벨)
export function btn({ icon: ic, label, aria, cls = '', act = '', data = '', type = 'button', attrs = '' }) {
  if (!ic) throw new Error('button without icon: ' + (label || aria));
  const text = label ? `<span>${esc(label)}</span>` : '';
  return `<button type="${type}" class="btn ${cls}" ${act ? `data-act="${esc(act)}"` : ''} ${data} aria-label="${esc(aria || label || '')}" ${attrs}>${icon(ic)}${text}</button>`;
}
export function ibtn({ icon: ic, aria, cls = '', act = '', data = '', attrs = '' }) {
  if (!ic) throw new Error('icon button without icon: ' + aria);
  return `<button type="button" class="icon-btn ${cls}" ${act ? `data-act="${esc(act)}"` : ''} ${data} aria-label="${esc(aria)}" ${attrs}>${icon(ic)}</button>`;
}
export function row({ icon: ic, label, act, data = '', badge = false, trailing = '', cls = '' }) {
  return `<button type="button" class="row ${cls}" data-act="${esc(act)}" ${data}>${icon(ic)}<span class="grow">${esc(label)}</span>${badge ? `<span class="badge">${esc(t('newBadge'))}</span>` : ''}${trailing}</button>`;
}

// 간단한 마크다운(굵게·코드·글머리표·줄바꿈)만. 먼저 이스케이프하므로 HTML 은 들어올 수 없음.
export function renderText(s) {
  const e = esc(s).replace(/`([^`\n]+)`/g, '<code>$1</code>').replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>');
  return e.split(/\n{2,}/).map((p) => `<p>${p.replace(/^[-*] /gm, '• ').replace(/\n/g, '<br>')}</p>`).join('');
}

// ---- 토스트 ----
export function toast(text, ic = 'check') {
  const box = $('#toasts'); if (!box) return;
  const el = document.createElement('div'); el.className = 'toast m-toast'; el.setAttribute('role', 'status'); el.innerHTML = `${icon(ic, '')}<span>${esc(text)}</span>`;
  box.appendChild(el);
  setTimeout(() => { if (window.Motion) Motion.toastOut(el, () => el.remove()); else el.remove(); }, 2200);
}

// ---- 시트/모달 ----
const stack = [];
export const sheetOpen = () => stack.length > 0;
export function openSheet({ html, mid = false, onClose, locked = false, onMount }) {
  const wrap = document.createElement('div'); wrap.className = 'sheet-wrap' + (mid ? ' mid' : '');
  wrap.innerHTML = `<div class="scrim m-scrim-in"></div><div class="sheet m-sheet ${mid ? 'center' : ''}" role="dialog" aria-modal="true">${mid ? '' : '<div class="grab"></div>'}${html}</div>`;
  document.body.appendChild(wrap);
  const api = { el: wrap, locked, closed: false, close() {
    if (api.closed) return; api.closed = true; const i = stack.indexOf(api); if (i >= 0) stack.splice(i, 1);
    wrap.classList.add('closing');
    const sheet = wrap.querySelector('.sheet'), scrim = wrap.querySelector('.scrim');
    const reduced = window.Motion && Motion.reduced();
    if (!reduced) { sheet.style.animation = 'm-fade-out var(--m-exit) var(--m-ease-in) forwards'; scrim.className = 'scrim m-scrim-out'; }
    setTimeout(() => { wrap.remove(); ads.setOverlay(stack.length > 0); if (onClose) onClose(); }, reduced ? 0 : 260);
  } };
  if (!locked) wrap.querySelector('.scrim').addEventListener('click', () => api.close());
  wrap.addEventListener('click', (e) => { const c = e.target.closest('[data-close]'); if (c) api.close(); });
  stack.push(api); ads.setOverlay(true);
  if (onMount) onMount(api);
  return api;
}
export function closeTopSheet() { const s = stack[stack.length - 1]; if (!s || s.locked) return !!s; s.close(); return true; }

export function confirmSheet({ title, body, okLabel, okIcon = 'check', okCls = 'primary', cancelLabel }) {
  return new Promise((resolve) => {
    let result = false;
    const s = openSheet({ mid: true, onClose: () => resolve(result), html: `<h2>${esc(title || '')}</h2><p class="muted" style="margin:0">${esc(body || '')}</p>
      <div class="acts rowwise">${btn({ icon: 'close', label: cancelLabel || t('cancel'), cls: 'plain', act: 'no' })}${btn({ icon: okIcon, label: okLabel || t('ok'), cls: okCls, act: 'yes' })}</div>` });
    s.el.addEventListener('click', (e) => { const a = e.target.closest('[data-act]'); if (!a) return; result = a.dataset.act === 'yes'; s.close(); });
  });
}

// 로딩 스피너 버튼 상태
export function busy(button, on) {
  if (!button) return;
  if (on) { button.dataset.html = button.innerHTML; button.disabled = true; button.innerHTML = '<span class="spin"></span>' + (button.querySelector('span') ? `<span>${button.querySelector('span').textContent}</span>` : ''); }
  else if (button.dataset.html != null) { button.innerHTML = button.dataset.html; button.disabled = false; delete button.dataset.html; }
}
export function fmtTime(ts, lang) {
  if (!ts) return '';
  const d = new Date(ts), n = new Date();
  const same = d.toDateString() === n.toDateString();
  try { return same ? d.toLocaleTimeString(lang || undefined, { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString(lang || undefined, { month: 'short', day: 'numeric' }); } catch { return ''; }
}

// Google "G" (공식 4색 로고, 로그인 버튼용)
export const G_LOGO = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
