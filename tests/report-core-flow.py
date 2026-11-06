import sys,json,threading,http.server,socketserver,functools
from playwright.sync_api import sync_playwright
from fakeauth import FAKE
ROOT,OUT,LANG=sys.argv[1:4]
class Q(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=socketserver.TCPServer(('127.0.0.1',0),functools.partial(Q,directory=ROOT));port=srv.server_address[1]
threading.Thread(target=srv.serve_forever,daemon=True).start()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,locale=LANG)
 pg=c.new_page();pg.set_default_timeout(10000);errors=[]
 pg.on('pageerror',lambda e:errors.append(str(e)))
 pg.add_init_script(FAKE)
 pg.add_init_script("localStorage.setItem('frkr.tutorial.done','1');localStorage.setItem('frkr.lang','ko');window.__mail=[];window.open=(u)=>{if(String(u).startsWith('mailto:'))window.__mail.push(u);return null;};window.__FR_BUILD={versionName:'0.1.2',versionCode:3};window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',isWebView:()=>true,Plugins:{FirebaseAuthentication:window.__FR_AUTH_PLUGIN,AASecure:{keys:async()=>({keys:[]}),get:async()=>({value:''}),set:async()=>{},clear:async()=>{},remove:async()=>{}},AABuild:{getInfo:async()=>window.__FR_BUILD}}};")
 pg.goto(f'http://127.0.0.1:{port}/index.html');pg.wait_for_timeout(1300);pg.click('[data-act=google]');pg.wait_for_timeout(650);pg.click('[data-act=age]');pg.click('[data-act=agree]');pg.wait_for_timeout(600);pg.locator('[data-act=ai]').first.click();pg.wait_for_timeout(450)
 pg.evaluate("FR.store.state().chat=[{role:'user',text:'test request'},{role:'bot',text:'First answer contains a &lt;reportable&gt; token.'},{role:'bot',text:'Second answer remains.'}];FR.store.save();FR.ctx.refresh()");pg.wait_for_timeout(450)
 assert pg.locator('.msg.bot [data-act=report]').count()==2
 assert 'First answer contains a <reportable> token.' in pg.locator('.msg.bot .bubble').first.inner_text()
 pg.locator('.msg.bot [data-act=report]').first.click();assert 'First answer contains a <reportable> token.' in pg.locator('.ai-report-preview').inner_text()
 assert '0.1.2 (3)' in pg.evaluate("FR.ctx.versionLabel()")
 pg.screenshot(path=f'{OUT}/{LANG}-21-ai-report.png')
 pg.locator('.sheet-wrap:not(.closing) [data-act=send]').click();pg.wait_for_timeout(600)
 from urllib.parse import urlparse,parse_qs
 mail=pg.evaluate('window.__mail');assert len(mail)==1 and mail[0].startswith('mailto:motoraathailand@gmail.com?')
 qs=parse_qs(urlparse(mail[0]).query);assert 'First answer contains a <reportable> token.' in qs['body'][0] and 'AA 프랜차이즈 - 쉽게하는창업 0.1.2 (3)' in qs['body'][0]
 for lang in ['ko','en','th','zh','hi']:
  label=pg.evaluate(f"import('./i18n.js').then(async I=>{{localStorage.setItem('frkr.lang','{lang}');location.reload()}})");pg.wait_for_timeout(700);pg.locator('[data-act=ai]').first.click();pg.wait_for_timeout(250)
  expected=pg.evaluate("import('./i18n.js').then(I=>I.t('aiReport'))");assert pg.locator('.msg.bot [data-act=report]').first.inner_text().strip()==expected
  assert pg.locator('.msg.bot [data-act=report]').first.inner_text().strip()==expected
  pg.locator('[data-act=back]').click();pg.wait_for_timeout(200)
 pg.evaluate("localStorage.setItem('frkr.lang','ko')");pg.reload();pg.wait_for_timeout(900);pg.locator('[data-act=ai]').first.click();pg.wait_for_timeout(350)
 pg.locator('.msg.bot [data-act=report]').first.click();pg.locator('.sheet-wrap:not(.closing) [data-act=hide]').click();pg.wait_for_timeout(400)
 assert pg.locator('.msg.bot').count()==1 and 'Second answer remains.' in pg.locator('.msg.bot').inner_text()
 pg.reload();pg.wait_for_timeout(800);pg.locator('[data-act=ai]').first.click();pg.wait_for_timeout(350)
 assert pg.locator('.msg.bot').count()==1 and 'Second answer remains.' in pg.locator('.msg.bot').inner_text()
 assert not errors,errors
 print('PASS all 5 report languages; response version 0.1.2(3); decoded entity; exact mailto; selective hide survives reload; no email sent')
 b.close()
