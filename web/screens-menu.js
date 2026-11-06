// 메뉴(드로어)·공지사항·업데이트(변경 내역)·피드백·앱 소개·언어 시트·개인정보 시트·업데이트/새로 바뀐 점 팝업.
import { LOGO_GLYPH } from './logo.js';
import { t, getLang, LANGS, setLang } from './i18n.js';
import { icon } from './icons.js';
import { CONFIG } from './config.js';
import { BRAND } from './brand.js';
import { esc, btn, ibtn, row, openSheet, renderText, toast } from './ui.js';
import { langPill } from './screens-start.js';
import * as native from './native.js';
import * as notices from './notices.js';
import { CHANGELOG, entryFor } from './changelog.js';
import * as ads from './ads.js';

// ---------- 드로어 ----------
export function openMenu(ctx) {
  if (document.getElementById('drawer')) return;
  const wrap = document.createElement('div'); wrap.id = 'drawer';
  const nBadge = ctx.noticesBadge(), uBadge = ctx.updatesBadge();
  wrap.innerHTML = `<div class="scrim m-scrim-in" data-close></div><aside class="drawer m-drawer-in" role="dialog" aria-modal="true" aria-label="${esc(t('menuTitle'))}">
    <div class="head"><h2>${esc(t('menuTitle'))}</h2>${langPill()}${ibtn({ icon: 'close', aria: t('close'), act: 'close' })}</div>
    ${row({ icon: 'settings', label: t('settings'), act: 'settings' })}
    ${row({ icon: 'bell', label: t('notices'), act: 'notices', badge: nBadge })}
    ${row({ icon: 'sparkle', label: t('updates'), act: 'updates', badge: uBadge })}
    ${row({ icon: 'mail', label: t('feedback'), act: 'feedback' })}
    ${row({ icon: 'help', label: t('howTo'), act: 'howto' })}
    ${row({ icon: 'info', label: t('about'), act: 'about' })}
    ${row({ icon: 'upload', label: t('updateLatest'), act: 'store' })}
    <div class="foot"><span>${esc(t('versionLabel', { v: ctx.versionLabel() }))}</span><span style="display:flex;gap:6px;align-items:flex-start">${icon('lock')}<span>${esc(t('storedLocal'))}</span></span></div>
  </aside>`;
  document.body.appendChild(wrap); ads.setOverlay(false);
  const close = (after) => {
    if (wrap.classList.contains('closing')) return; wrap.classList.add('closing');
    const dr = wrap.querySelector('.drawer'), sc = wrap.querySelector('.scrim'); const red = window.Motion && Motion.reduced();
    if (!red) { dr.className = 'drawer m-drawer-out'; sc.className = 'scrim m-scrim-out'; }
    setTimeout(() => { wrap.remove(); if (after) after(); }, red ? 0 : 260);
  };
  wrap._close = close;
  wrap.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]') && !e.target.closest('.drawer')) return close();
    const a = e.target.closest('[data-act]'); if (!a) return;
    const act = a.dataset.act;
    if (act === 'close') return close();
    if (act === 'lang') return ctx.openLang();
    if (act === 'store') { native.openStore(); return; }
    close(() => {
      if (act === 'settings') ctx.go('settings', {});
      else if (act === 'notices') ctx.go('notices');
      else if (act === 'updates') ctx.go('updates');
      else if (act === 'feedback') ctx.go('feedback');
      else if (act === 'howto') ctx.go('keys', { onboarding: false });
      else if (act === 'about') ctx.go('about');
    });
  });
}
export const menuOpen = () => !!document.getElementById('drawer');
export function closeMenu() { const d = document.getElementById('drawer'); if (d && d._close) { d._close(); return true; } return false; }

// ---------- 언어 시트 ----------
export function openLang(ctx) {
  const s = openSheet({ html: `<h2>${esc(t('language'))}</h2><div class="langlist">${LANGS.map((l) => `<button type="button" class="row" data-lang="${l.code}">${icon('globe')}<span class="grow">${esc(l.name)}</span>${l.code === getLang() ? icon('checkCircle', 'sel') : ''}</button>`).join('')}</div>` });
  s.el.addEventListener('click', (e) => { const b = e.target.closest('[data-lang]'); if (!b) return; setLang(b.dataset.lang); s.close(); ctx.onLangChanged(); });
}

// ---------- 개인정보 시트 ----------
export function openPrivacy() {
  const s = openSheet({ html: `<h2>${esc(t('privacyTitle'))}</h2><div class="pre">${esc(t('privacyBody'))}</div><div class="acts">${btn({ icon: 'external', label: t('privacyOnline'), cls: 'soft', act: 'online' })}${btn({ icon: 'check', label: t('gotIt'), cls: 'primary', act: 'x', attrs: 'data-close' })}</div>`, onMount: (api) => { const b = api.el.querySelector('[data-act=online]'); if (b) b.addEventListener('click', () => native.openExternal(CONFIG.privacyUrl)); } });
  return s;
}

// ---------- 공지사항 ----------
export function noticesScreen(ctx) {
  return {
    name: 'notices', ad: 'notices',
    html: `<div class="top">${ibtn({ icon: 'back', aria: t('back'), act: 'back' })}<span class="title">${esc(t('notices'))}</span>${langPill(true)}</div>
      <div class="scroll"><div class="page" id="nlist"><div class="skel m-skeleton"></div><div class="skel m-skeleton"></div></div></div>`,
    async mount(root) {
      const list = await notices.load(); const lang = getLang();
      const box = root.querySelector('#nlist'); if (!box) return;
      ctx.markNoticesSeen(list);
      box.innerHTML = list.length ? `<div data-stagger>${list.map((n, i) => `<article class="card notice-card">${i === 0 && ctx.noticesWasNew() ? `<span class="badge" style="float:right">${esc(t('newBadge'))}</span>` : ''}<h3>${esc(notices.pick(n.title, lang))}</h3><time>${esc(n.at || '')}</time><p style="margin:8px 0 0">${esc(notices.pick(n.body, lang))}</p></article>`).join('')}</div>` : `<div class="empty">${icon('bell')}<p>${esc(t('noticesEmpty'))}</p></div>`;
    },
    acts: {},
  };
}

// ---------- 업데이트(변경 내역) ----------
export function updatesScreen(ctx) {
  const lang = getLang(); const cur = ctx.versionCode();
  ctx.markUpdatesSeen();
  return {
    name: 'updates', ad: 'updates',
    html: `<div class="top">${ibtn({ icon: 'back', aria: t('back'), act: 'back' })}<span class="title">${esc(t('updatesTitle'))}</span>${langPill(true)}</div>
      <div class="scroll"><div class="page" data-stagger>${CHANGELOG.map((e, i) => `<article class="card"><h3>${esc(t('versionN', { v: e.version }))} ${i === 0 && ctx.updatesWasNew() ? `<span class="badge">${esc(t('newBadge'))}</span>` : ''}</h3><time class="muted small">${esc(e.date)}</time><ul class="cl-list">${(e.items[lang] || e.items.en).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></article>`).join('')}
        <div style="margin-top:8px">${btn({ icon: 'upload', label: t('updateLatest'), cls: 'soft block', act: 'store' })}</div></div></div>`,
    acts: { store() { native.openStore(); } },
  };
}

// ---------- 피드백 ----------
export function feedbackScreen(ctx) {
  return {
    name: 'feedback', ad: '',
    html: `<div class="top">${ibtn({ icon: 'back', aria: t('back'), act: 'back' })}<span class="title">${esc(t('fbTitle'))}</span>${langPill(true)}</div>
      <div class="scroll"><div class="page"><p class="muted" style="margin:4px 2px 10px">${esc(t('fbHint'))}</p>
        <textarea class="field" id="fbText" rows="8" maxlength="3000" placeholder="${esc(t('fbPh'))}" aria-label="${esc(t('fbTitle'))}"></textarea>
        <div class="err" id="fbErr" role="alert" hidden></div>
        <div style="margin-top:16px">${btn({ icon: 'mail', label: t('fbSend'), cls: 'primary block', act: 'send' })}</div>
      </div></div>`,
    mount(root) { const f = root.querySelector('#fbText'); f.addEventListener('focus', () => ads.setTyping(true)); f.addEventListener('blur', () => ads.setTyping(false)); },
    acts: {
      send(el) {
        const root = el.closest('.screen'), txt = root.querySelector('#fbText').value.trim(), err = root.querySelector('#fbErr');
        if (!txt) { err.textContent = t('fbEmpty'); err.hidden = false; return; }
        err.hidden = true;
        const body = `${txt}\n\n---\n${BRAND.names.en} ${ctx.versionLabel()}\nLang: ${getLang()}\nDevice: ${navigator.userAgent}`;
        native.openExternal(`mailto:${CONFIG.feedbackEmail}?subject=${encodeURIComponent(t('fbSubject'))}&body=${encodeURIComponent(body)}`);
      },
    },
  };
}

// ---------- 앱 소개 ----------
export function aboutScreen(ctx) {
  return {
    name: 'about', ad: 'about',
    html: `<div class="top">${ibtn({ icon: 'back', aria: t('back'), act: 'back' })}<span class="title">${esc(t('aboutTitle'))}</span>${langPill(true)}</div>
      <div class="scroll"><div class="page"><div class="center" style="padding:10px 0 4px"><div class="brandmark" style="width:76px;height:76px;border-radius:24px">${LOGO_GLYPH}</div><h2 style="margin:14px 0 2px">${esc(t('appName'))}</h2><div class="muted small" style="margin-bottom:2px">${esc(t('tagline'))}</div><div class="muted small">${esc(t('versionLabel', { v: ctx.versionLabel() }))}</div></div>
        <p style="margin:16px 2px">${esc(t('aboutBody'))}</p>
        <div class="card" style="padding:6px 14px">
          ${row({ icon: 'globe', label: t('aboutSite'), act: 'site', trailing: icon('external') })}
          ${row({ icon: 'shield', label: t('aboutPrivacy'), act: 'privacy' })}
          ${row({ icon: 'mail', label: `${t('aboutContact')}: ${CONFIG.feedbackEmail}`, act: 'mail' })}
          ${row({ icon: 'users', label: t('aboutTesters'), act: 'testers', trailing: icon('external') })}
        </div>
        <p class="small muted" style="display:flex;gap:8px">${icon('info')}<span>${esc(t('aboutAi'))}</span></p>
        <p class="small muted center">${esc(t('aboutOperator'))}</p></div></div>`,
    acts: {
      site() { native.openExternal(CONFIG.siteUrl); },
      privacy() { openPrivacy(); },
      mail() { native.openExternal(`mailto:${CONFIG.feedbackEmail}?subject=${encodeURIComponent(t('fbSubject'))}`); },
      testers() { native.openExternal(CONFIG.testersGroupUrl); },
    },
  };
}

// ---------- 새 버전 팝업 / 새로 바뀐 점 팝업 ----------
export function openUpdatePopup(ctx, d) {
  const lang = getLang(); const e = CHANGELOG[0]; const first = e && (e.items[lang] || e.items.en)[0];
  const s = openSheet({ mid: true, locked: !!d.forced, html: `<div class="center"><div class="brandmark" style="width:64px;height:64px;border-radius:20px">${icon('upload')}</div><h2 style="margin-top:14px">${esc(t('updPopTitle'))}</h2><p class="muted" style="margin:0">${esc(t(d.forced ? 'updForce' : 'updPopBody'))}</p></div>
    <div class="acts">${btn({ icon: 'upload', label: t('updNow'), cls: 'primary', act: 'go' })}${d.forced ? '' : btn({ icon: 'clock', label: t('updLater'), cls: 'plain', act: 'later' })}</div>` });
  s.el.addEventListener('click', (ev) => { const a = ev.target.closest('[data-act]'); if (!a) return; if (a.dataset.act === 'go') native.openStore(); else { ctx.snoozeUpdate(d.latest); s.close(); } });
  return s;
}
export function openChangelogPopup(ctx, code) {
  const e = entryFor(code) || CHANGELOG[0]; if (!e) return null; const lang = getLang();
  const s = openSheet({ mid: true, html: `<div class="center"><div class="brandmark" style="width:64px;height:64px;border-radius:20px">${icon('sparkle')}</div><h2 style="margin-top:14px">${esc(t('whatsNewTitle', { v: e.version }))}</h2></div>
    <ul class="cl-list">${(e.items[lang] || e.items.en).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    <div class="acts">${btn({ icon: 'check', label: t('gotIt'), cls: 'primary', act: 'x', attrs: 'data-close' })}</div>` });
  return s;
}
