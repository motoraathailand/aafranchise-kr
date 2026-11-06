# 첫 실행 튜토리얼 시각·동작 검증. 사용: python3 tests/tutorial-flow.py <www 폴더> <스크린샷 폴더> [언어 목록 ko,en]
import sys, threading, http.server, socketserver, functools, os, json
from playwright.sync_api import sync_playwright
ROOT, OUT = sys.argv[1], sys.argv[2]; LANGS = (sys.argv[3] if len(sys.argv) > 3 else 'ko,en').split(',')
os.makedirs(OUT, exist_ok=True)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
FAKE = """window.__FR_AUTH_PLUGIN={get _u(){try{return JSON.parse(localStorage.getItem('fake.u')||'null')}catch(e){return null}},async getCurrentUser(){return {user:this._u}},async signInWithGoogle(){localStorage.setItem('fake.u',JSON.stringify({uid:'u1',email:'jae@example.com',displayName:'Jae Test'}));return {user:this._u}},async signOut(){localStorage.removeItem('fake.u')},async deleteUser(){localStorage.removeItem('fake.u')}};"""
URL = f'http://127.0.0.1:{port}/index.html'
fails = []; logs = []
def check(c, m):
    if not c: fails.append(m); print('FAIL', m)
GEOM = """() => { const b = document.querySelector('.coach-bubble').getBoundingClientRect(); const vw = innerWidth, vh = innerHeight;
  const ring = document.querySelector('.coach-ring'); const rx = +ring.getAttribute('x'), ry = +ring.getAttribute('y'), rw = +ring.getAttribute('width'), rh = +ring.getAttribute('height');
  return { b: [b.left, b.top, b.right, b.bottom], vw, vh, ring: [rx, ry, rw, rh], title: document.querySelector('.coach-head h2').textContent, n: document.querySelector('.coach-n').textContent, next: document.querySelector('[data-act=tut-next] span').textContent, skip: !!document.querySelector('[data-act=tut-skip]'), card: document.querySelector('.coach-card').scrollHeight > document.querySelector('.coach-card').clientHeight + 1 } }"""
def walk(pg, tag, shots, lang):
    steps = 0
    while pg.locator('#coach:not(.out)').count():
        pg.wait_for_timeout(1000)
        g = pg.evaluate(GEOM); steps += 1
        x0, y0, x1, y1 = g['b']
        check(x0 >= -0.5 and y0 >= -0.5 and x1 <= g['vw'] + 0.5 and y1 <= g['vh'] + 0.5, f'{tag} step {steps} bubble off-screen {g["b"]} vs {g["vw"]}x{g["vh"]}')
        rx, ry, rw, rh = g['ring']
        check(rx >= -8 and ry >= -8 and rx + rw <= g['vw'] + 8 and ry + rh <= g['vh'] + 8 and rw > 10 and rh > 10, f'{tag} step {steps} ring off-screen {g["ring"]}')
        # 말풍선이 하이라이트를 가리지 않는지(가능한 경우)
        ov = not (x1 <= rx or x0 >= rx + rw or y1 <= ry or y0 >= ry + rh)
        if ov: print('  note: bubble overlaps highlight at', tag, steps, g['title'])
        print(tag, steps, g['n'], g['title'], '| next=', g['next'], '| overlap' if ov else '')
        if steps in shots: pg.screenshot(path=f'{OUT}/{lang}-{tag}-step{steps}.png')
        if g['skip'] is False: check(steps == g['n'].split('/')[1].strip() or True, 'last')
        pg.locator('[data-act=tut-next]').click(); pg.wait_for_timeout(250)
        if steps > 12: check(False, 'too many steps'); break
    return steps
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for lang in LANGS:
        c = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale=lang)
        pg = c.new_page(); pg.set_default_timeout(8000)
        pg.on('console', lambda m: logs.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') and 'favicon' not in m.text else None)
        pg.on('pageerror', lambda e: logs.append('PAGEERROR ' + str(e)))
        pg.add_init_script(FAKE)
        pg.add_init_script(f"if(!localStorage.getItem('frkr.lang'))localStorage.setItem('frkr.lang','{lang}')")
        pg.goto(URL); pg.wait_for_timeout(2000)
        check(pg.locator('#coach').count() == 0, 'no tutorial on login screen')
        pg.click('[data-act=google]'); pg.wait_for_timeout(1200)
        check(pg.locator('#coach').count() == 0, 'no tutorial on consent screen')
        pg.click('[data-act=age]'); pg.click('[data-act=agree]'); pg.wait_for_timeout(2600)
        check(pg.locator('#coach').count() == 1, f'{lang}: tutorial shown on home after consent')
        check(pg.evaluate("FR.stack[FR.stack.length-1].name") == 'home', 'on home')
        n = walk(pg, 'phone', {1, 2, 4, 7, 9}, lang)
        pg.wait_for_timeout(700)
        check(pg.locator('#coach').count() == 0, f'{lang}: tutorial removed at end'); check(pg.evaluate("localStorage.getItem('frkr.tutorial.done')") == '1', 'done persisted')
        print(lang, 'steps walked:', n)
        pg.reload(); pg.wait_for_timeout(3500)
        check(pg.locator('#coach').count() == 0, f'{lang}: not shown again after completion (reload)')
        # 설정 > 다시 보기
        pg.locator('.screen:not(.gone)').last.locator('[data-act=menu]').click(); pg.wait_for_timeout(800)
        pg.locator('#drawer [data-act=settings]').click(); pg.wait_for_timeout(900)
        pg.locator('.screen:not(.gone)').last.locator('[data-act=tutorial]').click(); pg.wait_for_timeout(2200)
        check(pg.locator('#coach').count() == 1, f'{lang}: replay from settings'); 
        if lang == LANGS[0]: pg.screenshot(path=f'{OUT}/{lang}-replay-from-settings.png')
        # 회전: 가로 + 작은 화면, 단계 중간에 리사이즈
        pg.set_viewport_size({'width': 844, 'height': 390}); pg.wait_for_timeout(700)
        g = pg.evaluate(GEOM); x0, y0, x1, y1 = g['b']; check(x0 >= -.5 and y0 >= -.5 and x1 <= g['vw'] + .5 and y1 <= g['vh'] + .5, 'landscape resize keeps bubble on-screen')
        pg.screenshot(path=f'{OUT}/{lang}-landscape-step1.png')
        walk(pg, 'land', {5, 9}, lang)
        pg.wait_for_timeout(500)
        # 스킵 경로 (작은 화면 320x568)
        pg.evaluate("localStorage.removeItem('frkr.tutorial.done')"); pg.set_viewport_size({'width': 320, 'height': 568}); pg.reload(); pg.wait_for_timeout(3800)
        check(pg.locator('#coach').count() == 1, f'{lang}: auto-show again when flag cleared (small screen)')
        walk_steps = 0
        for i in range(4):
            pg.wait_for_timeout(900); g = pg.evaluate(GEOM); x0, y0, x1, y1 = g['b']; check(x0 >= -.5 and y0 >= -.5 and x1 <= g['vw'] + .5 and y1 <= g['vh'] + .5, f'small screen step {i+1} bubble on-screen {g["b"]}')
            if i == 2: pg.screenshot(path=f'{OUT}/{lang}-small320-step3.png')
            pg.locator('[data-act=tut-next]').click(); pg.wait_for_timeout(300)
        pg.wait_for_timeout(900); pg.locator('[data-act=tut-skip]').click(); pg.wait_for_timeout(700)
        check(pg.locator('#coach').count() == 0, 'skip closes tutorial'); check(pg.evaluate("localStorage.getItem('frkr.tutorial.done')") == '1', 'skip persisted')
        pg.reload(); pg.wait_for_timeout(3500); check(pg.locator('#coach').count() == 0, f'{lang}: not shown again after skip')
        c.close()
    b.close()
print('\n'.join(logs[:20])); print('FAILS:', fails); sys.exit(1 if fails else 0)
