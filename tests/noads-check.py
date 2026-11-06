# noads 번들: 광고 DOM 0, 광고 관련 요청 0, ?adsdemo=1 을 줘도 아무 것도 안 나옴.
import sys, threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright
from fakeauth import FAKE
ROOT = sys.argv[1]
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox']); pg = b.new_page(viewport={'width': 390, 'height': 844}); reqs = []; errs = []
    pg.on('request', lambda r: reqs.append(r.url)); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.add_init_script(FAKE)
    pg.goto(f'http://127.0.0.1:{port}/index.html?adsdemo=1'); pg.wait_for_timeout(1500)
    pg.click('[data-act=google]'); pg.wait_for_timeout(1000)
    pg.click('[data-act=age]'); pg.click('[data-act=agree]'); pg.wait_for_timeout(900)
    print('ad DOM:', pg.locator('.ad-demo, .ad-tag').count(), '| ads-on class:', pg.evaluate("document.documentElement.classList.contains('ads-on')||document.body.classList.contains('ads-on')||!!document.querySelector('.ads-on')"), '| --ad-h:', pg.evaluate("getComputedStyle(document.getElementById('app')).bottom"))
    print('ad-related requests:', [r for r in reqs if any(k in r.lower() for k in ('admob', 'doubleclick', 'googleads', 'gstatic', 'google'))], '| external:', [r for r in reqs if not r.startswith('http://127.0.0.1')], '| errors:', errs)
    b.close()
