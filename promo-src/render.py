# usage: python3 render.py   -> frames to /tmp/fr-frames/, then ffmpeg (see make-video.sh)
import sys, os, shutil
from playwright.sync_api import sync_playwright
FPS = 30
out = '/tmp/fr-frames/'; shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': 1080, 'height': 1920})
    pg.goto('file:///workspace/fr/promo-src/reel.html'); pg.wait_for_timeout(1200); pg.evaluate('document.fonts.ready')
    total = pg.evaluate('window.TOTAL'); N = int(round(total * FPS)); print('duration', total, 'frames', N)
    for f in range(N):
        pg.evaluate(f'render({f/FPS})'); pg.screenshot(path=out + f'{f:04d}.png')
    b.close()
