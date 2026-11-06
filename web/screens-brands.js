// 홈 · 브랜드 목록(검색/필터) · 상세 · 비교 · 예산 찾기. 화면 상태는 params 객체에 저장(뒤로 가기로 다시 그려도 유지).
import { LOGO_GLYPH } from './logo.js';
import { t, getLang } from './i18n.js';
import { icon } from './icons.js';
import { esc, btn, ibtn, openSheet } from './ui.js';
import * as D from './data.js';
import * as S from './store.js';
import * as native from './native.js';
import { top, brandCard, cardActs, avatar, groupLabel, GROUP_ICON, empty, asofLine, na } from './views.js';
import { langPill } from './screens-start.js';
import { BRAND } from './brand.js';

const PAGE = 30;
const rollNum = (n, cls = '') => `<b class="${cls}" data-rollup="${n}" data-rollup-sep="1">${Number(n).toLocaleString('en-US')}</b>`;
const BUDGETS = [30000000, 50000000, 100000000, 200000000, 300000000, 500000000];
const budgetChip = (v) => D.baht(v, getLang());

// ---------- 홈 ----------
export function home(ctx) {
  const L = getLang(); const m = D.meta(); const gc = D.groupCounts();
  const asof = m.asofMax || (m.generatedAt || '').slice(0, 10);
  const pop = D.all().filter((b) => b.branches != null && D.entryCost(b) != null).sort((a, b) => b.branches - a.branches).slice(0, 8);
  const tile = (g, i) => `<button type="button" class="gtile g-${g} m-stagger" style="--i:${i}" data-act="group" data-g="${g}">${icon(GROUP_ICON[g])}<b>${esc(groupLabel(g))}</b><small>${esc(t('brandsN', { n: gc[g] || 0 }))}</small></button>`;
  const short = (act, ic, label, sub, i, badge = '') => `<button type="button" class="short m-stagger" style="--i:${i}" data-act="${act}"><span class="sic">${icon(ic)}</span><span class="stx"><b>${esc(label)}</b><small>${esc(sub)}</small></span>${badge ? `<span class="badge">${badge}</span>` : ''}</button>`;
  return {
    name: 'home', ad: 'home',
    html: `<div class="top">${ibtn({ icon: 'menu', aria: t('menuTitle'), act: 'menu', attrs: ctx.menuBadge() ? 'data-badge' : '' })}<span class="applogo">${LOGO_GLYPH}</span><span class="title">${esc(t('appName'))}<small class="sub">${esc(t('tagline'))}</small></span>${langPill()}</div>
      <div class="scroll"><div class="page">
        <section class="hero2 m-rise">
          <h1>${esc(t('homeTitle'))}</h1>
          <p>${esc(t('homeSub', { n: D.count().toLocaleString('en-US'), d: asof }))}</p>
          <button type="button" class="searchfake" data-act="search">${icon('search')}<span>${esc(t('searchPh'))}</span></button>
        </section>
        <h3 class="sec">${esc(t('byBudget'))}</h3>
        <div class="chiprow m-rise">${BUDGETS.slice(0, 5).map((v) => `<button type="button" class="chip pick" data-act="budgetchip" data-v="${v}">${icon('wallet')}${esc(t('upTo', { v: budgetChip(v) }))}</button>`).join('')}</div>
        <h3 class="sec">${esc(t('byCategory'))}</h3>
        <div class="gtiles">${D.GROUPS.filter((g) => gc[g]).map(tile).join('')}</div>
        <h3 class="sec">${esc(t('tools'))}</h3>
        <div class="shorts">
          ${short('budget', 'calculator', t('budgetFinder'), t('budgetFinderSub'), 0)}
          ${short('compare', 'compare', t('compare'), t('compareSub'), 1, S.state().compare.length ? String(S.state().compare.length) : '')}
          ${short('ai', 'sparkle', t('askAi'), t('askAiSub'), 2)}
          ${short('guides', 'book', t('guides'), t('guidesSub'), 3)}
          ${short('favs', 'star', t('favorites'), t('favoritesSub', { n: S.state().favs.length }), 4)}
        </div>
        ${pop.length ? `<h3 class="sec">${esc(t('popular'))}</h3><div class="hscroll m-rise">${pop.map((b) => `<button type="button" class="pcard" data-act="open" data-id="${esc(b.id)}">${avatar(b)}<b>${esc(D.nameOf(b, L))}</b><small>${esc(t('branchesN', { n: b.branches.toLocaleString('en-US') }))}</small><em>${esc(D.bahtRange(b.totalInvestment, L) || D.baht(D.feeMin(b), L))}</em></button>`).join('')}</div>` : ''}
        <p class="small muted dis">${icon('info')}<span>${esc(t('dataDisclaimer'))}</span></p>
      </div></div>`,
    mount(root) { if (window.Motion) Motion.scan(root); },
    acts: {
      search() { ctx.go('list', { focus: true }); },
      group(el) { ctx.go('list', { group: el.dataset.g }); },
      budgetchip(el) { ctx.go('list', { maxBudget: +el.dataset.v, sort: 'costDesc' }); },
      budget() { ctx.go('budget', {}); },
      compare() { ctx.go('compare', {}); },
      ai() { ctx.go('ai', {}); },
      guides() { ctx.go('guides', {}); },
      favs() { ctx.go('list', { favOnly: true }); },
      open(el) { ctx.go('detail', { id: el.dataset.id }); },
    },
  };
}

// ---------- 목록 ----------
export function list(ctx, p) {
  const L = getLang();
  p.group ??= ''; p.q ??= ''; p.sort ??= 'name'; p.maxBudget ??= 0; p.shown ??= PAGE; p.favOnly ??= false;
  const title = p.favOnly ? t('favorites') : t('brandsTitle');
  const chips = ['', ...D.GROUPS].map((g) => `<button type="button" class="chip pick" data-act="g" data-g="${g}" aria-pressed="${p.group === g}">${g ? icon(GROUP_ICON[g]) : ''}${esc(g ? groupLabel(g) : t('all'))}</button>`).join('');
  const sorts = [['name', t('sortName')], ['cost', t('sortCost')], ['costDesc', t('sortCostDesc')], ['fee', t('sortFee')], ['branches', t('sortBranches')]];
  const html = `${top(title)}
    <div class="searchbar"><div class="inline">${icon('search')}<input class="field" id="q" type="search" enterkeyhint="search" autocomplete="off" value="${esc(p.q)}" placeholder="${esc(t('searchPh'))}" aria-label="${esc(t('searchPh'))}"></div></div>
    <div class="filters"><div class="chiprow" id="gchips">${chips}</div>
      <div class="chiprow"><button type="button" class="chip pick" data-act="budget" aria-pressed="${p.maxBudget > 0}">${icon('wallet')}<span id="budlbl">${esc(p.maxBudget ? t('upTo', { v: D.baht(p.maxBudget, L) }) : t('anyBudget'))}</span></button>
        <button type="button" class="chip pick" data-act="sort">${icon('sort')}<span id="sortlbl">${esc(sorts.find((s) => s[0] === p.sort)[1])}</span></button></div></div>
    <div class="scroll" id="lscroll"><div class="page"><div class="count small muted" id="cnt" role="status"></div><div id="rows"></div><div id="more"></div></div></div>`;
  const fill = (root, keepScroll) => {
    const rows = root.querySelector('#rows'), res = D.search({ q: p.q, group: p.group, maxBudget: p.maxBudget, sort: p.sort, ids: p.favOnly ? S.state().favs : null });
    const shown = res.slice(0, p.shown);
    root.querySelector('#cnt').textContent = t('resultsN', { n: res.length.toLocaleString('en-US') });
    rows.innerHTML = shown.length ? shown.map((b, i) => brandCard(b, i % 10, { still: i < (p.animFrom || 0) })).join('') : empty('search', t(p.favOnly ? 'noFavs' : 'noResults'));
    root.querySelector('#more').innerHTML = res.length > shown.length ? `<div class="morewrap">${btn({ icon: 'plus', label: t('showMore', { n: Math.min(PAGE, res.length - shown.length) }), cls: 'soft block', act: 'more' })}</div>` : '';
    p.animFrom = 0;
    if (window.Motion) Motion.scan(rows);
  };
  return {
    name: 'list', ad: 'list', html,
    mount(root) {
      fill(root);
      const q = root.querySelector('#q'); let tm = 0;
      q.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(() => { p.q = q.value.trim(); p.shown = PAGE; fill(root); }, 160); });
      q.addEventListener('keydown', (e) => { if (e.key === 'Enter') q.blur(); });
      if (p.focus) { p.focus = false; setTimeout(() => q.focus(), 350); }
    },
    acts: {
      ...cardActs(ctx, { onChange(kind) { /* 목록은 그대로 둠(버튼 상태는 이미 바뀜) */ if (kind === 'fav' && p.favOnly) ctx.refresh(); } }),
      g(el) { p.group = el.dataset.g; p.shown = PAGE; const root = el.closest('.screen'); root.querySelectorAll('#gchips .chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.g === p.group))); fill(root); root.querySelector('#lscroll').scrollTop = 0; },
      more(el) { p.animFrom = p.shown; p.shown += PAGE; const root = el.closest('.screen'); const prev = root.querySelector('#lscroll').scrollTop; fill(root); root.querySelector('#lscroll').scrollTop = prev; },
      sort(el) {
        const root = el.closest('.screen');
        const s = openSheet({ html: `<h2>${esc(t('sortBy'))}</h2><div class="langlist">${sorts.map(([k, l]) => `<button type="button" class="row" data-k="${k}">${icon('sort')}<span class="grow">${esc(l)}</span>${k === p.sort ? icon('checkCircle', 'sel') : ''}</button>`).join('')}</div>` });
        s.el.addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (!b) return; p.sort = b.dataset.k; root.querySelector('#sortlbl').textContent = sorts.find((x) => x[0] === p.sort)[1]; p.shown = PAGE; s.close(); fill(root); });
      },
      budget(el) {
        const root = el.closest('.screen');
        const opts = [0, ...BUDGETS];
        const s = openSheet({ html: `<h2>${esc(t('maxInvest'))}</h2><div class="langlist">${opts.map((v) => `<button type="button" class="row" data-v="${v}">${icon('wallet')}<span class="grow">${esc(v ? t('upTo', { v: D.baht(v, getLang()) }) : t('anyBudget'))}</span>${v === p.maxBudget ? icon('checkCircle', 'sel') : ''}</button>`).join('')}</div>` });
        s.el.addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (!b) return; p.maxBudget = +b.dataset.v; const bl = root.querySelector('#budlbl'); bl.textContent = p.maxBudget ? t('upTo', { v: D.baht(p.maxBudget, getLang()) }) : t('anyBudget'); root.querySelector('[data-act=budget]').setAttribute('aria-pressed', String(p.maxBudget > 0)); p.shown = PAGE; s.close(); fill(root); });
      },
    },
  };
}

// ---------- 상세 ----------
const row = (label, value) => `<div class="kv"><span>${esc(label)}</span><b>${value == null || value === '' ? na() : esc(value)}</b></div>`;
export function detail(ctx, p) {
  const b = D.byId(p.id); const L = getLang();
  if (!b) return { name: 'detail', ad: '', html: `${top(t('brandsTitle'))}<div class="scroll"><div class="page">${empty('search', t('noResults'))}</div></div>`, acts: {} };
  S.addRecent(b.id);
  const src = b.sources && b.sources[0]; const c = b.contact || {};
  const inv = D.bahtRange(b.totalInvestment, L) || (b.totalInvestment && b.totalInvestment.raw);
  const kpi = (label, val, ic, i) => `<div class="kpi m-stagger" style="--i:${i}">${icon(ic)}<small>${esc(label)}</small><b>${val ? esc(val) : na()}</b></div>`;
  const ul = (arr) => (arr && arr.length ? `<ul class="bul">${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
  const sec = (title, inner) => (inner ? `<section class="card m-rise"><h3>${esc(title)}</h3>${inner}</section>` : '');
  const phones = (c.phones || []).map((ph) => `<button type="button" class="linkrow" data-act="tel" data-v="${esc(ph)}">${icon('phone')}<span>${esc(ph)}</span></button>`).join('');
  const emails = (c.emails || []).map((e) => `<button type="button" class="linkrow" data-act="mail" data-v="${esc(e)}">${icon('mail')}<span>${esc(e)}</span></button>`).join('');
  const web = (label, v, ic = 'link') => (v ? `<button type="button" class="linkrow" data-act="ext" data-v="${esc(v)}">${icon(ic)}<span>${esc(label)}: ${esc(v)}</span></button>` : '');
  const contact = [c.company ? row(t('company'), c.company) : '', c.address ? row(t('address'), c.address) : '', phones, emails, web('Website', c.website), web('Facebook', c.facebook), web('Instagram', c.instagram), web('LINE', c.line)].join('');
  const fav = S.isFav(b.id), cmp = S.inCompare(b.id);
  return {
    name: 'detail', ad: 'detail',
    html: `${top(D.nameOf(b, L), { right: ibtn({ icon: 'star', aria: t('favorite'), cls: 'fav' + (fav ? ' fav-on' : ''), act: 'fav', data: `data-id="${esc(b.id)}" aria-pressed="${fav}"` }) })}
      <div class="scroll pad-bottom"><div class="page">
        <section class="dhero m-rise">${avatar(b)}<div><h1>${esc(D.nameOf(b, L))}</h1>${D.altName(b, L) ? `<div class="muted">${esc(D.altName(b, L))}</div>` : ''}
          <div class="itags"><span class="tag g-${esc(b.group)}">${esc(groupLabel(b.group))}</span>${D.subLabel(b, L) ? `<span class="tag soft">${esc(D.subLabel(b, L))}</span>` : ''}${b.firstRegistrationAt ? `<span class="tag soft">${esc(t('registeredY', { y: b.firstRegistrationAt }))}</span>` : ''}</div></div></section>
        <div class="kpis">${kpi(t('invest'), inv, 'wallet', 0)}${kpi(t('feeLabel'), D.bahtRange(b.franchiseFee, L) || (b.franchiseFee && b.franchiseFee.raw), 'coins', 1)}${kpi(t('royalty'), D.royaltyText(b.royalty, L), 'percent', 2)}${kpi(t('payback'), D.monthsText(b.payback, L), 'trend', 3)}</div>
        <div class="dacts m-rise">${btn({ icon: 'compare', label: t(cmp ? 'inCompare' : 'addCompare'), cls: 'soft', act: 'cmp', data: `data-id="${esc(b.id)}"`, attrs: `aria-pressed="${cmp}"` })}${src ? btn({ icon: 'external', label: t('sourcePage'), cls: 'plain', act: 'src' }) : ''}</div>
        ${sec(t('costsTerms'), `${row(t('feeLabel'), D.bahtRange(b.franchiseFee, L) || (b.franchiseFee && b.franchiseFee.raw))}${row(t('educationFee'), D.bahtRange(b.educationFee, L))}${row(t('otherStartupCost'), D.bahtRange(b.otherStartupCost, L))}${row(t('amountYear'), b.amountAsOf)}${row(t('invest'), inv)}${row(t('workingCap'), b.workingCapital ? (D.bahtRange(b.workingCapital, L) ? D.bahtRange(b.workingCapital, L) + (b.workingCapital.per === 'month' ? ' ' + t('perMonth') : '') : b.workingCapital.raw) : null)}${row(t('deposit'), D.bahtRange(b.deposit, L) || (b.deposit && b.deposit.raw))}${row(t('royalty'), D.royaltyText(b.royalty, L))}${row(t('marketing'), D.royaltyText(b.marketingFee, L))}${row(t('contract'), D.yearsText(b.contract, L))}${row(t('payback'), D.monthsText(b.payback, L))}<p class="srcnote">${icon('clock')}<span>${esc(asofLine(b))}</span></p>`)}
        ${sec(t('about'), `${b.description ? `<p class="aboutp">${esc(b.description)}</p>` : ''}${b.products ? `<p class="muted">${esc(b.products)}</p>` : ''}${row(t('branches'), b.branches != null ? t('branchesN', { n: b.branches.toLocaleString('en-US') }) : null)}${row(t('managementNo'), b.registrationNo)}${row(t('brandMnno'), b.brandMnno)}${row(t('sector'), b.category && b.category.sector)}${row(t('products'), b.category && b.category.product)}${row(t('franchiseStarted'), b.firstRegistrationAt)}`)}
        ${sec(t('support'), ul(b.support))}${sec(t('requirements'), ul(b.requirements))}${sec(t('highlights'), ul(b.highlights))}
        ${sec(t('contactTitle'), `${contact}<p class="srcnote">${icon('info')}<span>${esc(t('contactNote'))}</span></p>`)}
        <p class="small muted dis">${icon('warn')}<span>${esc(t('detailDisclaimer'))}</span></p><p class="small muted dis">${icon('info')}<span>${esc(t('disclosureCoverage'))}</span></p>
      </div></div>
      <div class="bottom-bar"><div class="page">${btn({ icon: 'sparkle', label: t('askAboutBrand'), cls: 'primary block', act: 'ai' })}</div></div>`,
    mount(root) { if (window.Motion) Motion.scan(root); },
    acts: {
      fav(el) { const on = S.toggleFav(b.id); el.classList.toggle('fav-on', on); el.setAttribute('aria-pressed', String(on)); if (window.Motion) { Motion.pop(el.querySelector('.ic')); Motion.ring(el); } ctx.toast(t(on ? 'favAdded' : 'favRemoved'), 'star'); },
      cmp(el) {
        const r = S.toggleCompare(b.id); if (r === 'full') { ctx.toast(t('cmpFull', { n: S.MAX_COMPARE }), 'info'); return; }
        const on = r === 'added'; el.setAttribute('aria-pressed', String(on)); el.querySelector('span').textContent = t(on ? 'inCompare' : 'addCompare'); ctx.toast(t(on ? 'cmpAdded' : 'cmpRemoved', { n: S.state().compare.length }), 'compare');
        if (on && S.state().compare.length >= 2) setTimeout(() => ctx.toast(t('cmpReady'), 'compare'), 700);
      },
      src() { native.openExternal(src.url); },
      ai() { ctx.go('ai', { brandId: b.id }); },
      tel(el) { native.openExternal('tel:' + el.dataset.v.replace(/[^\d+]/g, '')); },
      mail(el) { native.openExternal('mailto:' + el.dataset.v); },
      ext(el) { let v = el.dataset.v; if (!/^https?:|^line:/i.test(v)) v = /^[@\w.\-]+$/.test(v) && !v.includes('.') ? null : 'https://' + v.replace(/^\/+/, ''); if (v) native.openExternal(v); },
    },
  };
}

// ---------- 비교 ----------
export function compare(ctx) {
  const L = getLang(); const ids = S.state().compare; const bs = ids.map(D.byId).filter(Boolean);
  const n = bs.length;
  if (n < 2) return { name: 'compare', ad: 'compare', html: `${top(t('compare'))}<div class="scroll"><div class="page">${empty('compare', t(n === 0 ? 'cmpEmpty0' : 'cmpEmpty1'), btn({ icon: 'search', label: t('pickBrands'), cls: 'primary', act: 'pick' }))}${n ? `<div>${bs.map((b, i) => brandCard(b, i)).join('')}</div>` : ''}</div></div>`, acts: { ...cardActs(ctx, { onChange() { ctx.refresh(); } }), pick() { ctx.go('list', { focus: true }); } } };
  const min = (f) => { const v = bs.map(f); const ok = v.filter((x) => x != null); return ok.length > 1 ? Math.min(...ok) : null; };
  const rows = [
    ['invest', t('invest'), (b) => D.bahtRange(b.totalInvestment, L), (b) => b.totalInvestment && b.totalInvestment.min, 'low'],
    ['fee', t('feeLabel'), (b) => D.bahtRange(b.franchiseFee, L), (b) => b.franchiseFee && b.franchiseFee.min, 'low'],
    ['wc', t('workingCap'), (b) => (b.workingCapital && D.bahtRange(b.workingCapital, L) ? D.bahtRange(b.workingCapital, L) + (b.workingCapital.per === 'month' ? ' ' + t('perMonth') : '') : null), (b) => b.workingCapital && b.workingCapital.min, 'low'],
    ['dep', t('deposit'), (b) => D.bahtRange(b.deposit, L), (b) => b.deposit && b.deposit.min, 'low'],
    ['roy', t('royalty'), (b) => D.royaltyText(b.royalty, L), (b) => (b.royalty ? (b.royalty.none ? 0 : b.royalty.pct) : null), 'low'],
    ['mkt', t('marketing'), (b) => D.royaltyText(b.marketingFee, L), (b) => (b.marketingFee ? (b.marketingFee.none ? 0 : b.marketingFee.pct) : null), 'low'],
    ['con', t('contract'), (b) => D.yearsText(b.contract, L), null],
    ['pay', t('payback'), (b) => D.monthsText(b.payback, L), (b) => b.payback && b.payback.months && b.payback.months.min, 'low'],
    ['br', t('branches'), (b) => (b.branches != null ? b.branches.toLocaleString('en-US') : null), null],
    ['since', t('franchiseSince'), (b) => b.firstRegistrationAt, null],
  ];
  const cell = (b, f, best, key) => { const v = f(b); const num = key; return `<div class="cc ${best != null && num != null && num === best ? 'best' : ''}">${v == null || v === '' ? na() : esc(v)}</div>`; };
  const body = rows.map(([k, label, f, num, dir], i) => { const best = num && dir === 'low' ? min(num) : null; return `<div class="crow m-stagger" style="--i:${i}"><div class="clabel">${esc(label)}</div><div class="cvals" style="--n:${n}">${bs.map((b) => cell(b, f, best, num ? num(b) : null)).join('')}</div></div>`; }).join('');
  return {
    name: 'compare', ad: 'compare',
    html: `${top(t('compare'), { right: ibtn({ icon: 'trash', aria: t('clear'), act: 'clear' }) })}
      <div class="scroll"><div class="page">
        <div class="chead" style="--n:${n}">${bs.map((b) => `<button type="button" class="chb m-scale-in" data-act="open" data-id="${esc(b.id)}">${avatar(b)}<b>${esc(D.nameOf(b, L))}</b><small>${esc(groupLabel(b.group))}</small></button>`).join('')}</div>
        <div class="ctable">${body}</div>
        <p class="small muted dis">${icon('info')}<span>${esc(t('cmpNote'))}</span></p>
        <div class="two">${bs.map((b) => btn({ icon: 'close', label: D.nameOf(b, L), cls: 'plain sm', act: 'rm', data: `data-id="${esc(b.id)}"`, aria: t('remove') + ' ' + D.nameOf(b, L) })).join('')}</div>
      </div></div>`,
    mount(root) { if (window.Motion) Motion.scan(root); },
    acts: { open(el) { ctx.go('detail', { id: el.dataset.id }); }, clear() { S.clearCompare(); ctx.toast(t('cleared'), 'trash'); ctx.refresh(); }, rm(el) { S.toggleCompare(el.dataset.id); ctx.refresh(); } },
  };
}

// ---------- 예산 찾기 ----------
const SL_MIN = Math.log(10000), SL_MAX = Math.log(500000000);
const toSlider = (v) => Math.round(((Math.log(Math.max(10000, Math.min(500000000, v))) - SL_MIN) / (SL_MAX - SL_MIN)) * 1000);
const fromSlider = (s) => { const raw = Math.exp(SL_MIN + (s / 1000) * (SL_MAX - SL_MIN)); const step = raw < 100000 ? 5000 : raw < 1e6 ? 10000 : raw < 5e6 ? 50000 : 100000; return Math.round(raw / step) * step; };
export function budget(ctx, p) {
  const L = getLang(); const st = S.state(); p.v ??= st.budget; p.reserve ??= st.reserve; p.shown ??= 20;
  const groupBars = (res) => { const c = {}; res.forEach((b) => { c[b.group] = (c[b.group] || 0) + 1; }); const mx = Math.max(1, ...Object.values(c)); return D.GROUPS.filter((g) => c[g]).map((g, i) => `<div class="gbar"><span class="gl">${icon(GROUP_ICON[g])}${esc(groupLabel(g))}</span><span class="gtrack"><i class="gfill g-${g}" style="--s:${(c[g] / mx).toFixed(3)};transition-delay:${i * 40}ms"></i></span><b>${c[g]}</b></div>`).join(''); };
  const html = `${top(t('budgetFinder'))}
    <div class="scroll"><div class="page">
      <section class="card bud m-rise"><label class="lbl" for="bv" style="margin-top:0">${esc(t('myBudget'))}</label>
        <div class="inline budin"><span class="cur">₩</span><input class="field" id="bv" inputmode="numeric" autocomplete="off" value="${p.v.toLocaleString('en-US')}" aria-label="${esc(t('myBudget'))}"></div>
        <input type="range" id="bs" min="0" max="1000" value="${toSlider(p.v)}" aria-label="${esc(t('myBudget'))}">
        <div class="chiprow">${[30000000, 50000000, 100000000, 200000000, 300000000, 500000000].map((v) => `<button type="button" class="chip pick" data-act="preset" data-v="${v}">${esc(D.baht(v, L))}</button>`).join('')}</div>
        <button type="button" class="toggle" data-act="reserve" aria-pressed="${p.reserve}"><span class="box">${icon('check')}</span><span>${esc(t('reserveToggle'))}</span></button>
      </section>
      <section class="card result m-rise"><div class="big"><span id="bigN">${rollNum(0)}</span><small>${esc(t('brandsFit'))}</small></div><div id="gb"></div><p class="small muted" id="bnote"></p></section>
      <h3 class="sec">${esc(t('closestFit'))}</h3><div id="rows"></div><div id="more"></div>
      <p class="small muted dis">${icon('info')}<span>${esc(t('budgetNote'))}</span></p>
    </div></div>`;
  let last = 0;
  const render = (root) => {
    const res = D.search({ maxBudget: p.v, sort: 'costDesc', reserve: p.reserve }); const total = D.count(); const nodata = D.all().filter((b) => D.entryCost(b) == null).length;
    const big = root.querySelector('#bigN'); big.innerHTML = rollNum(res.length); if (window.Motion) Motion.scan(big); last = res.length;
    root.querySelector('#gb').innerHTML = groupBars(res);
    requestAnimationFrame(() => root.querySelectorAll('.gfill').forEach((el) => el.classList.add('on')));
    root.querySelector('#bnote').textContent = t('budgetCoverage', { a: res.length, b: total - nodata, c: nodata });
    const shown = res.slice(0, p.shown);
    root.querySelector('#rows').innerHTML = shown.length ? shown.map((b, i) => brandCard(b, i % 10, { buffer: p.v - D.entryCost(b) - (p.reserve ? D.reserveOf(b) : 0) })).join('') : empty('wallet', t('budgetNone'));
    root.querySelector('#more').innerHTML = res.length > shown.length ? `<div class="morewrap">${btn({ icon: 'plus', label: t('showMore', { n: Math.min(20, res.length - shown.length) }), cls: 'soft block', act: 'more' })}</div>` : '';
    if (window.Motion) Motion.scan(root.querySelector('#rows'));
  };
  return {
    name: 'budget', ad: 'budget', html,
    mount(root) {
      const bv = root.querySelector('#bv'), bs = root.querySelector('#bs'); let tm = 0;
      const apply = (v, fromSl) => { p.v = Math.max(0, Math.round(v)); S.setBudget(p.v); if (!fromSl) bs.value = toSlider(p.v); clearTimeout(tm); tm = setTimeout(() => { p.shown = 20; render(root); }, 120); };
      bs.addEventListener('input', () => { const v = fromSlider(+bs.value); bv.value = v.toLocaleString('en-US'); apply(v, true); });
      bv.addEventListener('input', () => { const d = bv.value.replace(/[^\d]/g, ''); const v = d ? Math.min(+d, 2e9) : 0; bv.value = v ? v.toLocaleString('en-US') : ''; apply(v, false); });
      render(root);
    },
    acts: {
      ...cardActs(ctx),
      preset(el) { const root = el.closest('.screen'); p.v = +el.dataset.v; S.setBudget(p.v); root.querySelector('#bv').value = p.v.toLocaleString('en-US'); root.querySelector('#bs').value = toSlider(p.v); p.shown = 20; render(root); },
      reserve(el) { p.reserve = !p.reserve; S.setBudget(NaN, p.reserve); el.setAttribute('aria-pressed', String(p.reserve)); p.shown = 20; render(el.closest('.screen')); },
      more(el) { p.shown += 20; render(el.closest('.screen')); },
    },
  };
}
