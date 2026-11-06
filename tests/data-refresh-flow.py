# 원격 데이터 갱신 점검(브라우저): 가짜 서버 응답으로 — 새 버전이면 저장 → 다음 실행에 적용 · 설정에 버전/날짜/상태 표시 · 오프라인·잘못된 데이터면 번들 유지 · 하루 한 번 제한.
# 사용: python3 tests/data-refresh-flow.py <www 폴더> <스크린샷 폴더> [언어]
import sys, os, json, threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright
from fakeauth import FAKE
ROOT, OUT = sys.argv[1], sys.argv[2]; LANG = sys.argv[3] if len(sys.argv) > 3 else 'en'
os.makedirs(OUT, exist_ok=True)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start(); fails = []; errs = []
def check(c, m):
    print('OK  ' if c else 'FAIL', m)
    if not c: fails.append(m)
bundled = json.load(open(os.path.join(ROOT, 'data/brands.json'), encoding='utf8')); BV = bundled['meta']['version']
newer = json.loads(json.dumps(bundled)); newer['meta']['version'] = BV + 7; newer['meta']['asofMax'] = '2030-01-01'; newer['brands'] = newer['brands'][:-3]; newer['meta']['count'] = len(newer['brands'])
bad = json.loads(json.dumps(newer)); bad['meta']['version'] = BV + 9; bad['brands'] = bad['brands'][:150]; bad['meta']['count'] = 150
mode = {'v': 'ok'}; hits = []
def handler(route):
    u = route.request.url; hits.append(u); m = mode['v']
    hdr = {'access-control-allow-origin': '*'}
    if m == 'offline': return route.abort()
    if m == '500': return route.fulfill(status=500, body='err', headers=hdr)
    j = newer if m == 'ok' else bad if m == 'bad' else None
    if u.endswith('/meta.json'): return route.fulfill(status=200, content_type='application/json', headers=hdr, body=json.dumps({'version': j['meta']['version']}))
    return route.fulfill(status=200, content_type='application/json', headers=hdr, body=json.dumps(j))
def dm(pg, expr):
    pg.wait_for_function("import('./data.js').then(D=>D.count()>0)", timeout=20000)  # 느린 PC 에서도 로드가 끝난 뒤에 확인
    return pg.evaluate("import('./data.js').then(D=>" + expr + ")")
def settings_text(pg):
    pg.locator('[data-act=menu]').first.click(); pg.wait_for_timeout(600); pg.locator('#drawer [data-act=settings]').click(); pg.wait_for_timeout(900)
    return pg.locator('.screen:not(.gone)').last.inner_text()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    c = b.new_context(viewport={'width': 390, 'height': 844}, locale=LANG); pg = c.new_page(); pg.set_default_timeout(6000)
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/motoraathailand.github.io/aafranchise-kr-site/data/*', handler)
    pg.add_init_script(FAKE)
    pg.add_init_script(f"localStorage.setItem('frkr.tutorial.done','1');if(!localStorage.getItem('frkr.lang'))localStorage.setItem('frkr.lang','{LANG}');if(!localStorage.getItem('frkr.state'))localStorage.setItem('fr.seedOnce','1')")
    pg.goto(f'http://127.0.0.1:{port}/index.html'); pg.wait_for_timeout(1500)
    pg.click('[data-act=google]'); pg.wait_for_timeout(1000)
    pg.click('[data-act=age]'); pg.click('[data-act=agree]'); pg.wait_for_timeout(800)
    # 1) 온라인 새 버전: 부팅 4초 뒤 비차단 갱신 → 저장
    pg.wait_for_timeout(5500)
    stored = pg.evaluate("new Promise((ok,fail)=>{const r=indexedDB.open('frkr-catalog',1);r.onsuccess=()=>{const q=r.result.transaction('catalog','readonly').objectStore('catalog').get('remote');q.onsuccess=()=>ok(q.result||JSON.parse(localStorage.getItem('frkr.data.remote')||'null'));q.onerror=()=>fail(q.error)};r.onerror=()=>fail(r.error)})")
    check(stored is not None and stored['meta']['version'] == BV + 7, 'newer remote data stored on device')
    check(any(u.endswith('/meta.json') for u in hits) and any(u.endswith('/brands.json') for u in hits), 'meta.json then brands.json fetched')
    check(pg.evaluate("FR.ctx && 1") and dm(pg, "D.meta().version") == BV, 'running session still shows the bundled version (applies next start)')
    n = len(hits); pg.reload(); pg.wait_for_timeout(6500)
    check(len(hits) == n, 'reload within a day does not hit the network again (throttled)')
    t = settings_text(pg); pg.screenshot(path=f'{OUT}/{LANG}-settings-remote.png')
    check(str(BV + 7) in t and '2030-01-01' in t, 'settings shows remote version and as-of date'); check(str(len(newer['brands'])) in t.replace(',', ''), 'settings shows remote brand count')
    check(dm(pg, "D.source()") == 'remote', 'data source = remote after restart')
    # 2) 하루 뒤 + 오프라인/500/나쁜 데이터 → 저장본 유지
    for m in ['offline', '500', 'bad']:
        mode['v'] = m; pg.evaluate("localStorage.setItem('frkr.data.checked','1')"); pg.reload(); pg.wait_for_timeout(6500)
        st = pg.evaluate("new Promise((ok,fail)=>{const r=indexedDB.open('frkr-catalog',1);r.onsuccess=()=>{const q=r.result.transaction('catalog','readonly').objectStore('catalog').get('remote');q.onsuccess=()=>ok(q.result||JSON.parse(localStorage.getItem('frkr.data.remote')||'null'));q.onerror=()=>fail(q.error)};r.onerror=()=>fail(r.error)})")
        check(st is not None and st['meta']['version'] == BV + 7, f'{m}: stored data kept'); check(pg.evaluate("document.querySelectorAll('.screen').length") >= 1, f'{m}: app still alive')
        check(dm(pg, "D.count()") == len(newer['brands']), f'{m}: brand list intact')
    # 3) 저장본 지움 → 번들로 돌아감
    pg.evaluate("localStorage.removeItem('frkr.data.remote');new Promise((ok,fail)=>{const r=indexedDB.open('frkr-catalog',1);r.onsuccess=()=>{const tx=r.result.transaction('catalog','readwrite');tx.objectStore('catalog').delete('remote');tx.oncomplete=ok;tx.onerror=()=>fail(tx.error)};r.onerror=()=>fail(r.error)})"); mode['v'] = 'offline'; pg.reload(); pg.wait_for_timeout(2500)
    check(dm(pg, "D.meta().version") == BV, 'without stored data: bundled data in use (offline-safe)')
    t = settings_text(pg); check('weekly' in t.lower() or 'once a week' in t.lower() or 'สัปดาห์' in t or '일주일' in t or '매주' in t, 'settings explains weekly online refresh'); pg.screenshot(path=f'{OUT}/{LANG}-settings-bundled.png')
    b.close()
print('errors:', errs); print('FAILS:', fails); sys.exit(1 if (fails or errs) else 0)
