// 언어 알약 · 동의(시작 전 안내) · AI 키 관리. 로그인 없음(BYOK 앱): 키는 이 폰의 보안 저장소에만 두고 공급자를 직접 호출.
import { t, getLang, LANGS } from './i18n.js';
import { icon } from './icons.js';
import { CONFIG } from './config.js';
import { esc, btn, ibtn, busy, G_LOGO } from './ui.js';
import * as auth from './auth.js';
import { LOGO_GLYPH } from './logo.js';
import * as native from './native.js';
import * as secure from './secure.js';
import { testKey, resetCooldowns } from './providers.js';
import { PROVIDER_IDS } from './models.js';

export const langPill = (compact = false) => `<button type="button" class="lang-pill ${compact ? 'compact' : ''}" data-act="lang" aria-label="${esc(t('language'))}">${icon('globe')}${compact ? '' : `<span>${esc(LANGS.find((l) => l.code === getLang()).name)}</span>`}</button>`;
export const hasAnyKey = () => secure.hasKey('gemini'); // AA 공통 규칙: Gemini 키 필수(Groq·OpenRouter 는 추가 권장 — 폴백)

// ---------- 로그인(Google 필수) ----------
export function login(ctx) {
  const skipOk = auth.canSkip(ctx.info().debug === true);
  return {
    name: 'login', ad: '',
    html: `<div class="top"><span class="grow"></span>${langPill()}</div>
      <div class="scroll"><div class="page center hero loginhero">
        <div class="brandmark m-scale-in">${LOGO_GLYPH}</div>
        <h1 class="m-rise">${esc(t('appName'))}</h1>
        <div class="tagline m-rise">${esc(t('tagline'))}</div>
        <p class="m-rise lsub">${esc(t('loginSub'))}</p>
        <div style="height:26px"></div>
        <button type="button" class="btn block google-btn m-rise" data-act="google" aria-label="${esc(t('loginBtn'))}" style="max-width:340px">${G_LOGO}<span>${esc(t('loginBtn'))}</span></button>
        <div class="err" id="loginErr" role="alert" hidden></div>
        ${skipOk ? `<div class="m-rise" style="margin-top:14px">${btn({ icon: 'play', label: t('loginSkip'), cls: 'plain sm', act: 'skip' })}<p class="small muted" style="margin:8px 0 0;max-width:320px">${esc(t('loginSkipNote'))}</p></div>` : ''}
        <p class="small muted" style="margin-top:22px;max-width:340px;display:flex;gap:8px;text-align:left">${icon('lock')}<span>${esc(t('loginWhy'))}</span></p>
      </div></div>`,
    acts: {
      async google(el) {
        const root = el.closest('.screen'), err = root.querySelector('#loginErr'); err.hidden = true;
        const label = el.querySelector('span'); el.disabled = true; label.textContent = t('loginWait');
        try { await auth.signIn(); ctx.afterLogin(); }
        catch (e) {
          const k = auth.errorKind(e); const key = k === 'cancelled' ? 'loginCancelled' : k === 'network' ? 'loginNetwork' : k === 'notready' ? 'loginNotReady' : 'loginFail';
          err.textContent = t(key); err.hidden = false; el.disabled = false; label.textContent = t('loginBtn');
          if (window.Motion) Motion.pop(err);
        }
      },
      skip() { auth.skip(); ctx.store.state().seen.loginSkip = true; ctx.store.save(); ctx.afterLogin(); },
    },
  };
}

// ---------- 동의 ----------
export function consent(ctx) {
  let age = false;
  const items = [['consentData', 'building'], ['consentKeys', 'lock'], ['consentAdvice', 'warn']].map(([k, ic], i) => `<div class="check-row m-stagger" style="--i:${i}">${icon(ic)}<span>${esc(t(k))}</span></div>`).join('');
  return {
    name: 'consent', ad: '',
    html: `<div class="top"><span class="title">${esc(t('consentTitle'))}</span>${langPill()}</div>
      <div class="scroll pad-bottom"><div class="page">
        <div class="card" data-stagger>${items}</div>
        <button type="button" class="toggle" data-act="age" aria-pressed="false"><span class="box">${icon('check')}</span><span>${esc(t('consentAge'))}</span></button>
        <div style="margin-top:14px">${btn({ icon: 'shield', label: t('consentPrivacy'), cls: 'plain sm', act: 'privacy' })}</div>
      </div></div>
      <div class="bottom-bar"><div class="page">${btn({ icon: 'check', label: t('consentAgree'), cls: 'primary block', act: 'agree', attrs: 'disabled' })}</div></div>`,
    acts: {
      age(el) { age = !age; el.setAttribute('aria-pressed', String(age)); el.closest('.screen').querySelector('[data-act=agree]').disabled = !age; },
      privacy() { ctx.openPrivacy(); },
      agree() { if (!age) return; ctx.store.state().seen.consent = true; ctx.store.save(); ctx.afterConsent(); },
    },
  };
}

// ---------- 키 안내 / 관리 ----------
const GUIDE = { gemini: ['g1', 'g2', 'g3'], groq: ['q1', 'q2', 'q3'], openrouter: ['o1', 'o2', 'o3'] };
const NAMES = { gemini: 'geminiName', groq: 'groqName', openrouter: 'orName' };
const WHY = { gemini: 'geminiWhy', groq: 'groqWhy', openrouter: 'orWhy' };

export function keys(ctx, params = {}) {
  const onboarding = !!params.onboarding;
  const card = (p, i) => {
    const saved = secure.hasKey(p), req = p === 'gemini';
    return `<div class="card m-stagger" style="--i:${i}" data-prov="${p}">
      <div class="prov-head"><div class="prov-ic">${icon(req ? 'sparkle' : p === 'groq' ? 'cpu' : 'globe')}</div>
        <div style="flex:1;min-width:0"><b>${esc(t(NAMES[p]))}</b><div class="small muted">${esc(t(WHY[p]))}</div></div>
        <span class="tag ${p === 'gemini' ? 'req' : 'rec'}">${esc(t(p === 'gemini' ? 'required' : 'recommended'))}</span></div>
      <ol class="steps">${GUIDE[p].map((k) => `<li>${esc(t(k))}</li>`).join('')}</ol>
      ${btn({ icon: 'external', label: t('openSite'), cls: 'soft sm', act: 'site', data: `data-p="${p}"` })}
      ${saved ? `<div class="keyactions"><span class="status ok" data-saved="${p}">${icon('checkCircle')}<span>${esc(t('keySaved'))} · ${esc(secure.mask(secure.get(secure.KEY_NAMES[p])))}</span></span>${btn({ icon: 'trash', label: t('keyRemove'), cls: 'danger sm', act: 'remove', data: `data-p="${p}"` })}</div>` : ''}
      <div class="keyrow"><input class="field" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" data-key="${p}" placeholder="${esc(t('keyField'))}" aria-label="${esc(t(NAMES[p]) + ' ' + t('keyField'))}">
        ${ibtn({ icon: 'eye', aria: t('keyShow'), cls: 'soft', act: 'toggle', data: `data-p="${p}"` })}</div>
      <div class="keyactions">${btn({ icon: 'clipboard', label: t('paste'), cls: 'plain sm', act: 'paste', data: `data-p="${p}"` })}${btn({ icon: 'checkCircle', label: t('keyTest'), cls: 'plain sm', act: 'test', data: `data-p="${p}"` })}<span class="status wait" data-status="${p}" role="status"></span></div>
    </div>`;
  };
  const rootOf = (el) => el.closest('.screen');
  const field = (root, p) => root.querySelector(`input[data-key=${p}]`);
  const setStatus = (root, p, kind, text) => { const s = root.querySelector(`[data-status=${p}]`); if (!s) return; s.className = 'status ' + kind; s.innerHTML = (kind === 'ok' ? icon('checkCircle') : kind === 'bad' ? icon('xCircle') : '') + (text ? `<span>${esc(text)}</span>` : ''); };
  async function runTest(root, p) {
    const typed = secure.cleanKey(field(root, p).value) || secure.get(secure.KEY_NAMES[p]) || '';
    if (!typed) { setStatus(root, p, 'bad', t('keyEmpty')); return 'empty'; }
    setStatus(root, p, 'wait', t('keyTesting'));
    const r = await testKey(p, typed);
    setStatus(root, p, r === 'ok' ? 'ok' : r === 'bad' ? 'bad' : 'wait', t(r === 'ok' ? 'keyOk' : r === 'bad' ? 'keyBad' : 'keyNet'));
    return r;
  }
  return {
    name: 'keys', ad: '',
    html: `<div class="top">${onboarding ? '<span style="width:6px"></span>' : ibtn({ icon: 'back', aria: t('back'), act: 'back' })}<span class="title">${esc(t('guideTitle'))}</span>${langPill()}</div>
      <div class="scroll pad-bottom"><div class="page">
        <p class="muted" style="margin:4px 2px 8px">${esc(t('guideIntro'))}</p>
        ${PROVIDER_IDS.map(card).join('')}
        <p class="small muted" style="display:flex;gap:8px">${icon('lock')}<span>${esc(t('keysLocal'))}</span></p>
        <div class="err" id="keysErr" role="alert" hidden></div>
      </div></div>
      <div class="bottom-bar"><div class="page">${btn({ icon: 'check', label: t('save'), cls: 'primary block', act: 'save' })}</div></div>`,
    acts: {
      site(el) { native.openExternal(CONFIG.keyLinks[el.dataset.p]); },
      toggle(el) { const f = field(rootOf(el), el.dataset.p); const show = f.type === 'password'; f.type = show ? 'text' : 'password'; el.innerHTML = icon(show ? 'eyeOff' : 'eye'); el.setAttribute('aria-label', t(show ? 'keyHide' : 'keyShow')); },
      async paste(el) {
        const f = field(rootOf(el), el.dataset.p);
        try { const v = secure.cleanKey(await native.readClipboard()); if (v) { f.value = v; setStatus(rootOf(el), el.dataset.p, 'wait', ''); } else ctx.toast(t('pasteFail'), 'info'); }
        catch { ctx.toast(t('pasteFail'), 'info'); }
      },
      async test(el) { busy(el, true); try { await runTest(rootOf(el), el.dataset.p); } finally { busy(el, false); } },
      async remove(el) {
        const p = el.dataset.p;
        if (!(await ctx.confirm({ title: t(NAMES[p]), body: t('keyRemove') + '?', okLabel: t('delete'), okIcon: 'trash', okCls: 'danger' }))) return;
        await secure.remove(secure.KEY_NAMES[p]); resetCooldowns(); ctx.toast(t('deleted'), 'trash'); ctx.refresh();
      },
      async save(el) {
        const root = rootOf(el), err = root.querySelector('#keysErr'); err.hidden = true;
        busy(el, true);
        try {
          const typed = {}; for (const p of PROVIDER_IDS) { const v = secure.cleanKey(field(root, p).value); if (v) typed[p] = v; }
          if (Object.keys(typed).length && !typed.gemini && !secure.hasKey('gemini')) { setStatus(root, 'gemini', 'bad', t('keyNeedGemini')); err.textContent = t('keyNeedGemini'); err.hidden = false; return; }
          for (const p of Object.keys(typed)) {
            if (typed[p].length < 16) { setStatus(root, p, 'bad', t('keyBad')); err.textContent = t('keyBad'); err.hidden = false; return; }
            const r = await runTest(root, p);
            if (r === 'bad') { err.textContent = t(NAMES[p]) + ': ' + t('keyBad'); err.hidden = false; return; }
          }
          try { for (const p of Object.keys(typed)) await secure.set(secure.KEY_NAMES[p], typed[p]); }
          catch { err.textContent = t('secureFail'); err.hidden = false; return; }
          resetCooldowns();
                    ctx.toast(t('toastSaved'));
          ctx.back();
        } finally { busy(el, false); }
      },
    },
  };
}
