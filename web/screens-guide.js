// 창업 절차 카드: 목록 → 카드 상세. 법적 수치는 "확인 필요"(노란) 또는 "확인함(날짜)"(초록) 배지 — 둘 다 참고용이며 자문이 아님.
import { t, getLang, ORDER } from './i18n.js';
import { icon } from './icons.js';
import { esc, btn } from './ui.js';
import * as native from './native.js';
import { GUIDES, guideText } from './guides.js';
import { top, empty } from './views.js';

export function guides(ctx) {
  const L = getLang();
  return {
    name: 'guides', ad: 'guides',
    html: `${top(t('guides'))}<div class="scroll"><div class="page">
      <div class="note warnbox m-rise">${icon('warn')}<span>${esc(t('guideDisclaimer'))}</span></div>
      <div data-stagger>${GUIDES.map((g) => `<button type="button" class="gcard" data-act="open" data-id="${g.id}"><span class="sic">${icon(g.icon)}</span><span class="stx"><b>${esc(guideText(g, 'title', L))}</b><small>${esc(guideText(g, 'sum', L))}</small></span>${icon('chevron')}</button>`).join('')}</div>
      <div class="two">${btn({ icon: 'calculator', label: t('budgetFinder'), cls: 'soft sm', act: 'budget' })}${btn({ icon: 'sparkle', label: t('askAi'), cls: 'soft sm', act: 'ai' })}</div>
    </div></div>`,
    mount(root) { if (window.Motion) Motion.scan(root); },
    acts: { open(el) { ctx.go('guide', { id: el.dataset.id }); }, budget() { ctx.go('budget', {}); }, ai() { ctx.go('ai', {}); } },
  };
}
export function guide(ctx, p) {
  const L = getLang(); const g = GUIDES.find((x) => x.id === p.id);
  if (!g) return { name: 'guide', ad: '', html: `${top(t('guides'))}<div class="scroll"><div class="page">${empty('book', t('noResults'))}</div></div>`, acts: {} };
  const i = ORDER.indexOf(L);
  const facts = g.facts.map((f) => `<div class="fact ${f.chk ? 'ok' : 'unv'}"><div class="ftop"><b>${esc(f.l[i])}</b><span class="vbadge ${f.chk ? 'ok' : 'unv'}">${icon(f.chk ? 'checkCircle' : 'warn')}${esc(f.chk ? t('checkedOn', { d: f.chk }) : t('needsVerify'))}</span></div><p>${esc(f.v[i])}</p>${f.src ? `<small class="muted">${esc(t('sourceLbl'))}: ${esc(f.src)}</small>` : ''}</div>`).join('');
  return {
    name: 'guide', ad: 'guide',
    html: `${top(guideText(g, 'title', L))}<div class="scroll"><div class="page">
      <div class="note warnbox m-rise">${icon('warn')}<span>${esc(t('guideDisclaimer'))}</span></div>
      <p class="aboutp m-rise">${esc(guideText(g, 'sum', L))}</p>
      <section class="card m-rise"><h3>${esc(t('stepsTitle'))}</h3><ol class="steps big">${g.steps.map((s) => `<li>${esc(s[i])}</li>`).join('')}</ol></section>
      ${facts ? `<section class="card m-rise"><h3>${esc(t('keyFigures'))}</h3>${facts}</section>` : ''}
      ${g.links.length ? `<section class="card m-rise"><h3>${esc(t('officialLinks'))}</h3>${g.links.map((l, k) => `<button type="button" class="linkrow" data-act="ext" data-k="${k}">${icon('external')}<span>${esc(l[0][i])}</span></button>`).join('')}</section>` : ''}
      <div class="two">${btn({ icon: 'sparkle', label: t('askAboutThis'), cls: 'primary sm', act: 'ai' })}${g.id === 'budget' ? btn({ icon: 'calculator', label: t('budgetFinder'), cls: 'soft sm', act: 'budget' }) : ''}</div>
    </div></div>`,
    mount(root) { if (window.Motion) Motion.scan(root); },
    acts: { ext(el) { native.openExternal(g.links[+el.dataset.k][1]); }, ai() { ctx.go('ai', { prefill: guideText(g, 'title', L) + '?' }); }, budget() { ctx.go('budget', {}); } },
  };
}
