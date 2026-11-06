import sys, threading, http.server, socketserver, functools, re
from playwright.sync_api import sync_playwright
from fakeauth import FAKE
ROOT, OUT, LANG = sys.argv[1], sys.argv[2], sys.argv[3]
EXTRA = sys.argv[4] if len(sys.argv) > 4 else ''
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
logs = []; reqs = []
def shot(pg, name): pg.wait_for_timeout(700); pg.screenshot(path=f'{OUT}/{LANG}-{name}.png'); 
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox']); c = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale=LANG)
    pg = c.new_page(); pg.set_default_timeout(6000)
    pg.on('console', lambda m: logs.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') and 'favicon' not in m.text else None)
    pg.on('pageerror', lambda e: logs.append('PAGEERROR ' + str(e)))
    pg.on('request', lambda r: reqs.append(r.url))
    pg.add_init_script(FAKE)
    pg.add_init_script(f"localStorage.setItem('frkr.tutorial.done','1');if(!localStorage.getItem('frkr.lang'))localStorage.setItem('frkr.lang','{LANG}')")
    pg.goto(f'http://127.0.0.1:{port}/index.html{EXTRA}'); pg.wait_for_timeout(2200)
    shot(pg, '01-consent')
    pg.click('[data-act=google]'); pg.wait_for_timeout(1000)
    pg.click('[data-act=age]'); pg.click('[data-act=agree]'); pg.wait_for_timeout(900)
    def scr(): return pg.locator('.screen:not(.gone)').last
    def go(sel, name=None, wait=700):
        scr().locator(sel).first.click(); pg.wait_for_timeout(wait)
        if name: shot(pg, name)
    def back(): scr().locator('[data-act=back]').first.click(); pg.wait_for_timeout(600)
    shot(pg, '02-home')
    go('[data-act=group]', '03-list-group')            # first category tile
    scr().locator('[data-act=cmp]').nth(0).click(); pg.wait_for_timeout(300); scr().locator('[data-act=cmp]').nth(1).click(); pg.wait_for_timeout(300)
    scr().locator('[data-act=fav]').nth(0).click(); pg.wait_for_timeout(300); shot(pg, '04-list-actions')
    scr().locator('[data-act=sort]').click(); pg.wait_for_timeout(600); shot(pg, '05-sort-sheet'); pg.keyboard.press('Escape'); pg.mouse.click(195, 60); pg.wait_for_timeout(500)
    go('[data-act=open]', '06-detail')
    scr().locator('.scroll').evaluate('e=>e.scrollTop=700'); shot(pg, '07-detail-scrolled')
    back(); back()
    go('[data-act=compare]', '08-compare')
    back(); go('[data-act=budget]', '09-budget')
    scr().locator('[data-act=preset]').nth(2).click(); pg.wait_for_timeout(1200); shot(pg, '10-budget-100m')
    back(); go('[data-act=ai]', '11-ai-nokey')
    scr().locator('[data-act=sug]').first.click(); pg.wait_for_timeout(900); shot(pg, '12-ai-nokey-send')
    back(); go('[data-act=guides]', '13-guides')
    go('[data-act=open]', '14-guide')
    back(); back()
    scr().locator('[data-act=menu]').click(); pg.wait_for_timeout(900); shot(pg, '15-menu')
    pg.locator('#drawer [data-act=settings]').click(); pg.wait_for_timeout(800); shot(pg, '16-settings')
    scr().locator('[data-act=keys]').first.click(); pg.wait_for_timeout(900); shot(pg, '17-keys')
    # 키 저장 규칙: Gemini 없이 Groq 키만 → 막힘
    scr().locator('input[data-key=groq]').fill('gsk_' + 'x' * 30); scr().locator('[data-act=save]').click(); pg.wait_for_timeout(900); shot(pg, '18-keys-need-gemini')
    print('keys err:', scr().locator('#keysErr').inner_text())
    b.close()
print('\n'.join(logs[:30])); print('requests outside localhost:', [r for r in reqs if not r.startswith('http://127.0.0.1')][:5])
