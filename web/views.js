// 화면들이 같이 쓰는 조각: 상단 바, 브랜드 카드, 아바타, 빈 상태, 출처 줄.
import { t, getLang } from './i18n.js';
import { icon } from './icons.js';
import { esc, ibtn } from './ui.js';
import * as D from './data.js';
import * as S from './store.js';
import { langPill } from './screens-start.js';

export const GROUP_ICON = { food: 'utensils', beverage: 'cup', education: 'cap', service: 'tools', store: 'store', beauty: 'sparkle', other: 'grid' };
export const groupLabel = (g) => t('grp_' + (D.GROUPS.includes(g) ? g : 'other'));
export function top(title, { back = true, menu = false, right = '', pill = true } = {}) {
  return `<div class="top">${back ? ibtn({ icon: 'back', aria: t('back'), act: 'back' }) : ''}${menu ? ibtn({ icon: 'menu', aria: t('menuTitle'), act: 'menu' }) : ''}<span class="title">${esc(title)}</span>${right}${pill ? langPill(true) : ''}</div>`;
}
export const avatar = (b) => `<span class="bav g-${esc(b.group)}" aria-hidden="true">${icon(GROUP_ICON[b.group] || 'grid')}</span>`;
export const empty = (ic, text, btnHtml = '') => `<div class="empty m-rise">${`<div class="brandmark">${icon(ic)}</div>`}<p>${esc(text)}</p>${btnHtml}</div>`;
export function asofLine(b) {
  const s = b.sources && b.sources[0]; if (!s) return '';
  return t('srcLine', { site: s.site || '공정거래위원회', date: s.asof || (s.fetchedAt || '').slice(0, 10) || '–' });
}
export const na = () => `<span class="na">${esc(t('notListed'))}</span>`;

// 카드 한 장. 즐겨찾기·비교 버튼은 data-act(open/fav/cmp) — 화면 쪽 acts 에서 처리.
export function brandCard(b, i = 0, { buffer = null, still = false } = {}) {
  const L = getLang(); const inv = D.bahtRange(b.totalInvestment, L) || D.baht(D.feeMin(b), L);
  const fee = b.franchiseFee && b.franchiseFee.min != null ? D.bahtRange(b.franchiseFee, L) : null;
  const roy = b.royalty ? D.royaltyText(b.royalty, L) : null;
  const sub = D.subLabel(b, L);
  const fav = S.isFav(b.id), cmp = S.inCompare(b.id);
  return `<article class="bcard${still ? '' : ' m-stagger'}" style="--i:${Math.min(i, 9)}" data-id="${esc(b.id)}">
    <button type="button" class="bmain" data-act="open" data-id="${esc(b.id)}" aria-label="${esc(D.nameOf(b, L))}">
      ${avatar(b)}
      <span class="binfo"><b>${esc(D.nameOf(b, L))}</b>${D.altName(b, L) ? `<small>${esc(D.altName(b, L))}</small>` : ''}
        <span class="itags"><span class="tag g-${esc(b.group)}">${esc(groupLabel(b.group))}</span>${sub ? `<span class="tag soft">${esc(sub)}</span>` : ''}</span></span>
      <span class="bnum"><em>${esc(t('invest'))}</em><strong>${inv ? esc(inv) : na()}</strong></span>
    </button>
    <div class="bfoot">
      <span class="bchips">${fee ? `<span class="mini">${icon('wallet')}${esc(t('feeShort'))} ${esc(fee)}</span>` : ''}${roy ? `<span class="mini">${icon('percent')}${esc(roy)}</span>` : ''}${b.branches != null ? `<span class="mini">${icon('store')}${esc(t('branchesN', { n: b.branches.toLocaleString('en-US') }))}</span>` : ''}${buffer != null ? `<span class="mini ok">${icon('checkCircle')}${esc(t('leftover', { v: D.baht(buffer, L) }))}</span>` : ''}</span>
      <span class="bacts">${ibtn({ icon: 'star', aria: t('favorite'), cls: 'fav' + (fav ? ' fav-on' : ''), act: 'fav', data: `data-id="${esc(b.id)}" aria-pressed="${fav}"` })}${ibtn({ icon: 'compare', aria: t('compare'), cls: 'cmpb' + (cmp ? ' cmp-on' : ''), act: 'cmp', data: `data-id="${esc(b.id)}" aria-pressed="${cmp}"` })}</span>
    </div></article>`;
}
// 목록 안 카드 버튼 공통 처리(open/fav/cmp). onChange() 는 상태가 바뀐 뒤 화면이 할 일.
export function cardActs(ctx, { onChange } = {}) {
  return {
    open(el) { ctx.go('detail', { id: el.dataset.id }); },
    fav(el) {
      const on = S.toggleFav(el.dataset.id); el.classList.toggle('fav-on', on); el.setAttribute('aria-pressed', String(on));
      if (window.Motion) { Motion.pop(el.querySelector('.ic')); Motion.ring(el); }
      ctx.toast(t(on ? 'favAdded' : 'favRemoved'), 'star'); if (onChange) onChange('fav', el.dataset.id);
    },
    cmp(el) {
      const r = S.toggleCompare(el.dataset.id);
      if (r === 'full') { ctx.toast(t('cmpFull', { n: S.MAX_COMPARE }), 'info'); return; }
      el.classList.toggle('cmp-on', r === 'added'); el.setAttribute('aria-pressed', String(r === 'added'));
      if (window.Motion) { Motion.pop(el.querySelector('.ic')); Motion.ring(el); }
      ctx.toast(t(r === 'added' ? 'cmpAdded' : 'cmpRemoved', { n: S.state().compare.length }), 'compare'); if (onChange) onChange('cmp', el.dataset.id);
    },
  };
}
