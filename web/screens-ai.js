// AI 채팅(BYOK): 질문 → 로컬 데이터로 먼저 거르기(chat.js) → 사용자의 키로 공급자를 기기에서 직접 호출 → 답 + 근거 브랜드 칩.
import { t, getLang } from './i18n.js';
import { icon } from './icons.js';
import { esc, btn, ibtn, renderText, busy } from './ui.js';
import * as D from './data.js';
import * as S from './store.js';
import * as secure from './secure.js';
import { top, groupLabel } from './views.js';
import { ask, AiFailure, ProviderError } from './chat.js';

const hasAnyKey = () => secure.hasKey('gemini');
const SUGGEST = ['sug1', 'sug2', 'sug3', 'sug4'];

function bubble(m, i) {
  const L = getLang();
  const chips = (m.ids || []).map((id) => D.byId(id)).filter(Boolean).map((b) => `<button type="button" class="chip pick" data-act="open" data-id="${esc(b.id)}">${icon('store')}${esc(D.nameOf(b, L))}</button>`).join('');
  if (m.role === 'user') return `<div class="msg user m-rise"><div class="bubble">${esc(m.text)}</div></div>`;
  return `<div class="msg bot ${m.err ? 'err' : ''} m-rise"><div class="bubble">${m.err ? esc(m.text) : renderText(m.text)}</div>${chips ? `<div class="chiprow wrap">${chips}</div>` : ''}${!m.err && m.fb ? `<div class="small muted">${esc(t('aiFallback'))}</div>` : ''}</div>`;
}
const failText = (e) => {
  if (e instanceof AiFailure) return t(e.code === 'no_key' ? 'aiNoKey' : e.code === 'bad_key' ? 'aiBadKey' : e.code === 'aborted' ? 'aiAborted' : 'aiFailed');
  if (e instanceof ProviderError) return t('aiFailed'); return t('aiFailed');
};

export function ai(ctx, p) {
  const L = getLang(); const ctxBrand = p.brandId ? D.byId(p.brandId) : null; const m = D.meta();
  const keyCard = !hasAnyKey() ? `<div class="card keybanner m-rise">${icon('key')}<div><b>${esc(t('aiNeedKeyTitle'))}</b><p class="small muted">${esc(t('aiNeedKeyBody'))}</p>${btn({ icon: 'key', label: t('addKey'), cls: 'primary sm', act: 'keys' })}</div></div>` : '';
  const html = `${top(t('askAi'), { right: ibtn({ icon: 'trash', aria: t('clearChat'), act: 'clear' }) })}
    ${ctxBrand ? `<div class="ctxbar m-fade">${icon('store')}<span>${esc(t('aboutBrand', { name: D.nameOf(ctxBrand, L) }))}</span>${ibtn({ icon: 'close', aria: t('close'), act: 'dropctx', cls: 'sm' })}</div>` : ''}
    <div class="msgs" id="msgs" aria-live="polite"></div>
    <div class="ainote">${esc(t('aiNote', { n: D.count().toLocaleString('en-US'), d: m.asofMax || '' }))}</div>
    <div class="composer"><textarea class="field" id="ainput" rows="1" maxlength="800" placeholder="${esc(t('aiPh'))}" aria-label="${esc(t('aiPh'))}"></textarea>${ibtn({ icon: 'send', aria: t('send'), cls: 'send btn primary', act: 'send' })}</div>`;
  let busyNow = false;
  const draw = (root) => {
    const box = root.querySelector('#msgs'); const msgs = S.chat();
    box.innerHTML = (keyCard) + (msgs.length ? msgs.map(bubble).join('') : `<div class="chat-empty m-rise"><div class="brandmark sm">${icon('sparkle')}</div><h2>${esc(t('aiHello'))}</h2><p class="small">${esc(t('aiHelloSub'))}</p><div class="sugs">${SUGGEST.map((k) => `<button type="button" class="sug" data-act="sug" data-k="${k}">${icon('chat')}<span>${esc(t(k))}</span></button>`).join('')}</div></div>`);
    box.scrollTop = box.scrollHeight;
  };
  return {
    name: 'ai', ad: 'ai', html,
    mount(root) {
      draw(root);
      const inp = root.querySelector('#ainput');
      const grow = () => { inp.style.height = 'auto'; inp.style.height = Math.min(inp.scrollHeight, 132) + 'px'; };
      inp.addEventListener('input', grow);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); root.querySelector('[data-act=send]').click(); } });
      if (p.prefill) { inp.value = p.prefill; p.prefill = ''; grow(); }
    },
    acts: {
      open(el) { ctx.go('detail', { id: el.dataset.id }); },
      keys() { ctx.go('keys', { onboarding: false }); },
      dropctx(el) { p.brandId = null; ctx.refresh(); },
      sug(el) { const inp = el.closest('.screen').querySelector('#ainput'); inp.value = t(el.dataset.k); inp.dispatchEvent(new Event('input')); el.closest('.screen').querySelector('[data-act=send]').click(); },
      async clear(el) { if (!S.chat().length) return; if (!(await ctx.confirm({ title: t('clearChat'), body: t('clearChatBody'), okLabel: t('delete'), okIcon: 'trash', okCls: 'danger' }))) return; S.clearChat(); draw(el.closest('.screen')); ctx.toast(t('cleared'), 'trash'); },
      async send(el) {
        const root = el.closest('.screen'); const inp = root.querySelector('#ainput'); const q = inp.value.trim();
        if (!q || busyNow) return;
        if (!hasAnyKey()) { ctx.toast(t('aiNoKey'), 'key'); return; }
        busyNow = true; el.disabled = true;
        const history = S.chat().filter((x) => !x.err);
        S.pushChat({ role: 'user', text: q }); inp.value = ''; inp.style.height = 'auto'; inp.blur();
        const box = root.querySelector('#msgs'); box.querySelector('.chat-empty')?.remove(); box.querySelector('.keybanner')?.remove();
        box.insertAdjacentHTML('beforeend', bubble({ role: 'user', text: q })); box.insertAdjacentHTML('beforeend', `<div class="msg bot m-rise" id="typing"><div class="bubble"><span class="dots"><i></i><i></i><i></i></span></div></div>`); box.scrollTop = box.scrollHeight;
        try {
          const r = await ask({ keys: secure.getKeys(), question: q, history, lang: getLang(), ctxBrandId: p.brandId || null });
          root.querySelector('#typing')?.remove();
          const msg = { role: 'bot', text: r.text || t('aiEmpty'), ids: r.ids, fb: r.fallback }; S.pushChat(msg);
          box.insertAdjacentHTML('beforeend', bubble(msg));
        } catch (e) {
          root.querySelector('#typing')?.remove(); const msg = { role: 'bot', text: failText(e), err: true }; S.pushChat(msg); box.insertAdjacentHTML('beforeend', bubble(msg));
        } finally { busyNow = false; el.disabled = false; box.scrollTop = box.scrollHeight; }
      },
    },
  };
}
