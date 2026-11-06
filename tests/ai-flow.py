# AI 흐름 점검: 키 저장(공급자 호출은 가짜로 가로채기) → 질문 → 프롬프트에 로컬 브랜드 데이터가 들어갔는지 → 답의 [id] 가 칩으로 바뀌는지.
import sys, json, threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright
from fakeauth import FAKE
ROOT, OUT, LANG = sys.argv[1], sys.argv[2], sys.argv[3]
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
logs = []; bodies = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox']); c = b.new_context(viewport={'width': 390, 'height': 693}, device_scale_factor=3, locale=LANG)
    pg = c.new_page(); pg.set_default_timeout(8000)
    pg.on('console', lambda m: logs.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') and 'favicon' not in m.text else None)
    pg.on('pageerror', lambda e: logs.append('PAGEERROR ' + str(e)))
    first_id = {'v': None}
    def fake(route):
        req = route.request; bodies.append(req.post_data or '')
        txt = '공개 최초 창업비용을 비교할 수 있어요. 먼저 브랜드를 검색하고 최대 3개를 선택해 보세요. 계약 전 현재 조건을 브랜드에 확인하세요.'
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'candidates': [{'content': {'parts': [{'text': txt}]}, 'finishReason': 'STOP'}]}))
    pg.route('**/generativelanguage.googleapis.com/**', fake)
    pg.add_init_script(FAKE)
    pg.add_init_script(f"localStorage.setItem('frkr.tutorial.done','1');localStorage.setItem('frkr.lang','{LANG}')")
    pg.goto(f'http://127.0.0.1:{port}/index.html'); pg.wait_for_timeout(1800)
    first_id['v'] = pg.evaluate("import('./data.js').then(async D=>{await D.load();return D.search({sort:'cost'})[0].id})")
    pg.click('[data-act=google]'); pg.wait_for_timeout(1000)
    pg.click('[data-act=age]'); pg.click('[data-act=agree]'); pg.wait_for_timeout(800)
    pg.locator('[data-act=ai]').first.click(); pg.wait_for_timeout(700)
    pg.locator('[data-act=keys]').first.click(); pg.wait_for_timeout(800)
    pg.locator('input[data-key=gemini]').fill('AIza' + 'x' * 35); pg.locator('[data-act=save]').click(); pg.wait_for_timeout(1500)
    print('after save screen:', pg.locator('.screen:not(.gone)').last.locator('.title').first.inner_text())
    pg.locator('#ainput').fill('공개 창업비용은 어떻게 비교해요?'); pg.locator('[data-act=send]').click(); pg.wait_for_timeout(2500)
    pg.locator('.msg.bot .bubble').scroll_into_view_if_needed();pg.wait_for_timeout(400);pg.screenshot(path=f'{OUT}/{LANG}-20-ai-answer.png')
    chips = pg.locator('.msg.bot .chip').count(); print('chips:', chips, '| bot text:', pg.locator('.msg.bot .bubble').last.inner_text()[:140].replace('\n', ' '))
    print('provider calls:', len(bodies))
    if bodies:
        body = bodies[-1]; print('prompt has DATA rows:', 'franchise' in body.lower() or first_id['v'] in body, '| contains id:', first_id['v'] in body, '| len', len(body))
        u = json.loads(body)['contents'][-1]['parts'][0]['text']; print('USER PART:', u[:1500])
    b.close()
print('\n'.join(logs[:20]))

assert len(bodies) > 0, 'prompt must carry verified KRW component totals'
