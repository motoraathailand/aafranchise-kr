// 설정: 언어 · AI 키(등록 상태) · 데이터 정보 · 로컬 데이터 지우기 · 개인정보/소개.
import { t, getLang, LANGS } from './i18n.js';
import { icon } from './icons.js';
import { esc, btn, row } from './ui.js';
import * as D from './data.js';
import * as S from './store.js';
import * as secure from './secure.js';
import { top } from './views.js';
import { CONFIG } from './config.js';
import * as auth from './auth.js';

export function settings(ctx) {
  const n = ['gemini', 'groq', 'openrouter'].filter((p) => secure.hasKey(p)).length; const m = D.meta(); const chk = D.lastChecked();
  const acct = auth.getUser();
  const curLang = LANGS.find((l) => l.code === getLang()).name;
  const kv = (l, v) => `<div class="kv"><span>${esc(l)}</span><b>${esc(v)}</b></div>`;
  return {
    name: 'settings', ad: 'settings',
    html: `${top(t('settings'))}<div class="scroll"><div class="page" data-stagger>
      <h3 class="sec">${esc(t('account'))}</h3>
      <div class="card" style="padding:6px 14px">
        <div class="acct">${icon('user')}<div><b>${esc(acct ? (acct.name || acct.email) : t('loginSkipped'))}</b>${acct && acct.name && acct.email ? `<div class="small muted">${esc(acct.email)}</div>` : ''}</div></div>
        ${row({ icon: 'logout', label: t('signOut'), act: 'signout' })}
        ${acct ? row({ icon: 'trash', label: t('deleteAccount'), act: 'delacct' }) : ''}
      </div>
      <div class="card" style="padding:6px 14px">
        ${row({ icon: 'globe', label: t('language'), act: 'lang', trailing: `<span class="muted">${esc(curLang)}</span>` })}
        ${row({ icon: 'play', label: t('tutAgain'), act: 'tutorial' })}
        ${row({ icon: 'key', label: t('aiKeys'), act: 'keys', trailing: `<span class="status ${n ? 'ok' : 'wait'}">${esc(t('keysCount', { n }))}</span>` })}
      </div>
      <h3 class="sec">${esc(t('dataInfo'))}</h3>
      <div class="card">${kv(t('brandsLbl'), D.count().toLocaleString('en-US'))}${kv(t('dataAsOf'), (m.asofMin ? m.asofMin + ' ~ ' : '') + (m.asofMax || '–'))}${kv(t('dataVersion'), String(m.version || '–'))}${kv(t('dataSource'), 'ThaiFranchiseCenter')}${CONFIG.dataUrl ? kv(t('dataChecked'), chk ? new Date(chk).toISOString().slice(0, 10) : '–') : ''}<p class="srcnote">${icon('info')}<span>${esc(!CONFIG.dataUrl ? t('dataBundled') : D.source() === 'remote' ? t('dataRemoteOn') : t('dataWeekly'))}</span></p></div>
      <h3 class="sec">${esc(t('myData'))}</h3>
      <div class="card" style="padding:6px 14px">
        ${row({ icon: 'trash', label: t('clearChat'), act: 'clearchat' })}
        ${row({ icon: 'star', label: t('clearFavs'), act: 'clearfavs' })}
      </div>
      <div class="card" style="padding:6px 14px">${row({ icon: 'shield', label: t('privacyTitle'), act: 'privacy' })}${row({ icon: 'info', label: t('aboutTitle'), act: 'about' })}${row({ icon: 'mail', label: t('feedback'), act: 'feedback' })}</div>
    </div></div>`,
    mount(root) { if (window.Motion) Motion.scan(root); },
    acts: {
      async signout() { if (await ctx.confirm({ title: t('signOut'), body: t('signOutBody'), okLabel: t('signOut'), okIcon: 'logout' })) ctx.signOut(); },
      async delacct() {
        if (!(await ctx.confirm({ title: t('deleteAccount'), body: t('deleteAccountBody'), okLabel: t('delete'), okIcon: 'trash', okCls: 'danger' }))) return;
        try { await auth.deleteAccount(); S.state().favs = []; S.state().compare = []; S.state().chat = []; S.state().seen.loginSkip = false; S.save(); ctx.toast(t('accountDeleted'), 'trash'); ctx.setRoot('login'); }
        catch { ctx.toast(t('loginFail'), 'warn'); }
      },
      lang() { ctx.openLang(); }, tutorial() { ctx.replayTutorial(); }, keys() { ctx.go('keys', { onboarding: false }); }, privacy() { ctx.openPrivacy(); }, about() { ctx.go('about'); }, feedback() { ctx.go('feedback'); },
      async clearchat() { if (await ctx.confirm({ title: t('clearChat'), body: t('clearChatBody'), okLabel: t('delete'), okIcon: 'trash', okCls: 'danger' })) { S.clearChat(); ctx.toast(t('cleared'), 'trash'); } },
      async clearfavs() { if (await ctx.confirm({ title: t('clearFavs'), body: t('clearFavsBody'), okLabel: t('delete'), okIcon: 'trash', okCls: 'danger' })) { S.state().favs = []; S.state().compare = []; S.save(); ctx.toast(t('cleared'), 'trash'); } },
    },
  };
}
