# 로그인 게이트 점검(브라우저, 가짜 Firebase 플러그인): (1) 첫 실행 = 로그인 화면(건너뛰기 없음 — 플러그인 설정된 빌드) → 취소 메시지 → 로그인 → 동의 → 홈
# (2) 설정에 계정/로그아웃/계정삭제 (3) 재시작하면 세션 복원 → 바로 홈 (4) 로그아웃 → 로그인 화면 (5) BYOK AI 키로 질문(가짜 Gemini 응답) — 키는 AI 공급자 주소로만 전송
# 사용: python3 tests/login-flow.py www <스크린샷 폴더> [언어]   (먼저 node scripts/build-app.mjs noads --no-sync)
import sys, os, json, threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright
from fakeauth import FAKE
ROOT, OUT = sys.argv[1], sys.argv[2]; LANG = sys.argv[3] if len(sys.argv) > 3 else 'ko'
os.makedirs(OUT, exist_ok=True)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start(); errs = []; fails = []
def check(c, m):
    print('OK  ' if c else 'FAIL', m)
    if not c: fails.append(m)
cur = lambda pg: pg.evaluate("FR.stack[FR.stack.length-1].name")
URL = f'http://127.0.0.1:{port}/index.html'
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    c = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale=LANG); pg = c.new_page(); pg.set_default_timeout(6000)
    out_reqs = []; pg.on('request', lambda r: out_reqs.append((r.url, r.post_data or '')) if not r.url.startswith(f'http://127.0.0.1:{port}') else None)
    pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') and 'favicon' not in m.text and 'ERR_FAILED' not in m.text else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.add_init_script(FAKE); pg.add_init_script(f"localStorage.setItem('frkr.tutorial.done','1');if(!localStorage.getItem('frkr.lang'))localStorage.setItem('frkr.lang','{LANG}')")
    pg.route('**/motoraathailand.github.io/**', lambda r: r.abort())
    gem = {'bodies': []}
    def fake(route):
        gem['bodies'].append(route.request.post_data or '')
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'candidates': [{'content': {'parts': [{'text': 'ok answer'}]}}]}))
    pg.route('**/generativelanguage.googleapis.com/**', fake)
    pg.goto(URL); pg.wait_for_timeout(2000)
    check(cur(pg) == 'login', '1 first run starts at the login screen'); check(pg.locator('[data-act=google]').count() == 1, '1 Google button present'); check(pg.locator('[data-act=skip]').count() == 0, '1 no skip button (sign-in required)')
    pg.screenshot(path=f'{OUT}/{LANG}-login.png')
    pg.evaluate("window.__mode='cancel'"); pg.click('[data-act=google]'); pg.wait_for_timeout(800)
    check(pg.locator('#loginErr').is_visible() and pg.locator('#loginErr').inner_text().strip() != '', '1 cancelled sign-in shows a message'); check(cur(pg) == 'login', '1 still on login after cancel')
    pg.evaluate("window.__mode='ok'"); pg.click('[data-act=google]'); pg.wait_for_timeout(1400); check(cur(pg) == 'consent', '2 sign-in -> consent')
    pg.click('[data-act=age]'); pg.click('[data-act=agree]'); pg.wait_for_timeout(1400); check(cur(pg) == 'home', '2 consent -> home')
    pg.reload(); pg.wait_for_timeout(2200); check(cur(pg) == 'home', '3 relaunch restores the session and goes straight to home')
    # BYOK AI as a signed-in user
    pg.locator('[data-act=ai]').first.click(); pg.wait_for_timeout(700); pg.locator('[data-act=keys]').first.click(); pg.wait_for_timeout(800)
    KEY = 'AIza' + 'x' * 35; pg.locator('input[data-key=gemini]').fill(KEY); pg.locator('[data-act=save]').click(); pg.wait_for_timeout(1500)
    pg.locator('#ainput').fill('Which franchise is cheapest?'); pg.locator('[data-act=send]').click(); pg.wait_for_timeout(2500)
    check(len(gem['bodies']) >= 1, '5 AI question went to the Gemini endpoint with the user key')
    bad = [u for u, d in out_reqs if (KEY in u or KEY in d) and 'generativelanguage.googleapis.com' not in u]; check(not bad, '5 the user key was sent to no server other than the AI provider')
    check('ok answer' in pg.locator('.screen:not(.gone)').last.inner_text(), '5 AI answer shown'); pg.screenshot(path=f'{OUT}/{LANG}-ai-signedin.png')
    pg.locator('[data-act=back]').first.click(); pg.wait_for_timeout(600)
    pg.locator('[data-act=menu]').first.click(); pg.wait_for_timeout(700); pg.locator('#drawer [data-act=settings]').click(); pg.wait_for_timeout(1000)
    scr = pg.locator('.screen:not(.gone)').last
    check(scr.locator('.acct').count() == 1 and 'jae@example.com' in scr.locator('.acct').inner_text(), '2 settings shows the signed-in account'); check(scr.locator('[data-act=delacct]').count() == 1, '2 delete-account row present')
    pg.screenshot(path=f'{OUT}/{LANG}-settings-account.png')
    scr.locator('[data-act=signout]').click(); pg.wait_for_timeout(700); pg.locator('.sheet [data-act=ok], .sheet .btn.primary').last.click(); pg.wait_for_timeout(1300)
    check(cur(pg) == 'login', '4 sign out -> login screen'); pg.reload(); pg.wait_for_timeout(2000); check(cur(pg) == 'login', '4 after relaunch still login (signed out)')
    b.close()
print('errors:', errs); print('FAILS:', fails); sys.exit(1 if fails else 0)
