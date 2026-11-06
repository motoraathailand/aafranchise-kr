# Play/사이트/영상용 원본 화면(390x844 @3 = 1170x2532). 가짜 로그인 플러그인으로 로그인 게이트 통과(빌드에는 영향 없음).
import sys, threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright
ROOT, OUT, LANG = sys.argv[1], sys.argv[2], sys.argv[3]
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
FAKE = """window.__FR_AUTH_PLUGIN={_u:{uid:'u1',email:'tester@example.com',displayName:'AA Tester'},async getCurrentUser(){return {user:this._u}},async signInWithGoogle(){return {user:this._u}},async signOut(){this._u=null},async deleteUser(){this._u=null}};"""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox']); c = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=3, locale=LANG)
    pg = c.new_page(); pg.set_default_timeout(6000)
    pg.add_init_script(f"localStorage.setItem('frkr.tutorial.done','1');localStorage.setItem('frkr.lang','{LANG}')"); pg.add_init_script(FAKE)
    pg.goto(f'http://127.0.0.1:{port}/index.html'); pg.wait_for_timeout(2000)
    def shot(n): pg.wait_for_timeout(900); pg.screenshot(path=f'{OUT}/{LANG}-{n}.png')
    shot('00-login') if False else None
    pg.click('[data-act=age]'); pg.click('[data-act=agree]'); pg.wait_for_timeout(1500)
    scr = lambda: pg.locator('.screen:not(.gone)').last
    back = lambda: (scr().locator('[data-act=back]').first.click(), pg.wait_for_timeout(600))
    shot('01-home')
    scr().locator('[data-act=group]').first.click(); pg.wait_for_timeout(900)
    shot('02-list')
    pg.evaluate("FR.ctx.go('detail',{id:'f000004012'})"); pg.wait_for_timeout(1000); shot('03-detail')
    back(); back()
    pg.evaluate("FR.store.state().compare=['f000004012','f000003778']; FR.store.save()")
    scr().locator('[data-act=compare]').first.click(); pg.wait_for_timeout(1000); shot('04-compare')
    back(); scr().locator('[data-act=budget]').first.click(); pg.wait_for_timeout(700)
    scr().locator('[data-act=preset]').nth(2).click(); pg.wait_for_timeout(1500); shot('05-budget')
    back(); scr().locator('[data-act=ai]').first.click(); pg.wait_for_timeout(900); shot('06-ai')
    back(); scr().locator('[data-act=guides]').first.click(); pg.wait_for_timeout(900); shot('07-guides')
    scr().locator('[data-act=open]').first.click(); pg.wait_for_timeout(900); shot('08-guide')
    b.close()
print('ok')
