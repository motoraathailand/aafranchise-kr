# AA Franchise 런처 아이콘 생성기: python3 scripts/make-icons.py
# 확정 디자인(오너 선택 2026-11-02): 차양 + 굵은 바(style='bar').
# 산출: 적응형(전경 PNG + 배경 그라데이션 XML + 단색 monochrome) · 레거시/라운드 PNG(전 밀도) · Play용 512×512 PNG(docs/icon-512.png)
# 스타일: AA 앱 패밀리(그라데이션 배경 + 굵은 흰색 단일 도형). 주제: 프랜차이즈 가게 오픈(차양 가게 + 문 + 오픈 반짝임).
from PIL import Image, ImageDraw
import math, os
RES = 'android/app/src/main/res'
C1, C2 = (214, 35, 104), (181, 25, 88)   # 아주 옅은 그라데이션(#D62368 → #B51958)
def mask(size, style='bar', scale=1.0):
    """알파 마스크(L). 108dp 그리드. 굵고 단순한 가게: 차양(사다리꼴+큰 물결 3개) + 몸통(문 구멍 1개). 장식 없음."""
    S = size * 4; u = S / 108.0 * scale
    P = lambda x, y: (S / 2 + (x - 54) * u, S / 2 + (y - 54) * u)
    m = Image.new('L', (S, S), 0); d = ImageDraw.Draw(m)
    # 차양
    d.polygon([P(33, 31), P(75, 31), P(82, 45), P(26, 45)], fill=255)
    w = 56 / 3
    for i in range(3): d.pieslice([*P(26 + i * w, 45 - w / 2), *P(26 + (i + 1) * w, 45 + w / 2)], 0, 180, fill=255)
    if style == 'bar':       # 대안1: 차양 + 굵은 카운터 바(가장 단순)
        d.rounded_rectangle([*P(34, 61), *P(74, 69)], radius=int(4 * u), fill=255)
    else:                    # 몸통 + 아치형 문 구멍
        d.rectangle([*P(32, 60), *P(76, 80)], fill=255)
        d.rounded_rectangle([*P(46, 66), *P(62, 92)], radius=int(8 * u), fill=0)
    return m.resize((size, size), Image.LANCZOS)
def glyph(size, mono=False, scale=1.0, style='bar'):
    im = Image.new('RGBA', (size, size), (255, 255, 255, 255)); im.putalpha(mask(size, style, scale)); return im
def grad(size):
    S = size; g = Image.new('RGBA', (S, S)); px = g.load()
    for y in range(S):
        for x in range(S):
            t = (x + y) / (2 * S - 2); px[x, y] = tuple(int(C1[i] + (C2[i] - C1[i]) * t) for i in range(3)) + (255,)
    return g
def shaped(size, round_=False, rr=0.2):
    S = size * 4; g = grad(S); m = Image.new('L', (S, S), 0); dm = ImageDraw.Draw(m)
    if round_: dm.ellipse([0, 0, S - 1, S - 1], fill=255)
    else: dm.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * rr), fill=255)
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0)); im.paste(g, (0, 0), m); return im.resize((size, size), Image.LANCZOS)
dens = {'mdpi': (48, 108), 'hdpi': (72, 162), 'xhdpi': (96, 216), 'xxhdpi': (144, 324), 'xxxhdpi': (192, 432)}
for k, (L, F) in dens.items():
    d = f'{RES}/mipmap-{k}'; os.makedirs(d, exist_ok=True)
    for name, rnd in (('ic_launcher', False), ('ic_launcher_round', True)):
        b = shaped(L, rnd); b.alpha_composite(glyph(L, scale=1.3 if not rnd else 1.22)); b.save(f'{d}/{name}.png')   # 레거시: 전경을 안전영역 밖까지 키움
    glyph(F).save(f'{d}/ic_launcher_foreground.png')
    glyph(F, mono=True).save(f'{d}/ic_launcher_monochrome.png')
os.makedirs(f'{RES}/mipmap-anydpi-v26', exist_ok=True)
for name in ('ic_launcher', 'ic_launcher_round'):
    open(f'{RES}/mipmap-anydpi-v26/{name}.xml', 'w').write('<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@drawable/ic_launcher_background"/>\n    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>\n</adaptive-icon>\n')
open(f'{RES}/drawable/ic_launcher_background.xml', 'w').write('<?xml version="1.0" encoding="utf-8"?>\n<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">\n    <gradient android:angle="315" android:startColor="#D62368" android:endColor="#B51958"/>\n</shape>\n')
open(f'{RES}/values/ic_launcher_background.xml', 'w').write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#BE185D</color>\n</resources>\n')
# Play 스토어용 512×512(전체 사각형, 모서리는 스토어가 자름)
os.makedirs('docs', exist_ok=True)
p = grad(512); p.alpha_composite(glyph(512, scale=1.3)); p.convert('RGB').save('docs/icon-512.png')

# 미리보기 시트: 현재안(원/둥근사각/사각/단색) + 크기 확인(48px)
sheet = Image.new('RGB', (4 * 200 + 20, 330), (245, 245, 245))
def masked(shape):
    S = 160 * 4; im = grad(S); im.alpha_composite(glyph(S, scale=1.0)); m = Image.new('L', (S, S), 0); dm = ImageDraw.Draw(m)
    if shape == 'circle': dm.ellipse([0, 0, S - 1, S - 1], fill=255)
    elif shape == 'squircle': dm.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * .3), fill=255)
    else: dm.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * .12), fill=255)
    o = Image.new('RGBA', (S, S), (0, 0, 0, 0)); o.paste(im, (0, 0), m); return o.resize((160, 160), Image.LANCZOS)
for i, sh in enumerate(('circle', 'squircle', 'square')):
    t = masked(sh); sheet.paste(t, (20 + i * 200, 20), t)
mono = Image.new('RGBA', (160, 160), (0, 0, 0, 0)); ImageDraw.Draw(mono).ellipse([0, 0, 159, 159], fill=(210, 220, 255, 255))
tinted = Image.new('RGBA', (160, 160), (40, 50, 90, 255)); tinted.putalpha(glyph(160, True, 1.0).split()[3]); mono.alpha_composite(tinted); sheet.paste(mono, (620, 20), mono)
for i, f in enumerate(('docs/icon-512.png',)):
    t = Image.open(f).convert('RGB').resize((48, 48), Image.LANCZOS); sheet.paste(t, (20 + i * 200, 220)); t2 = Image.open(f).convert('RGB').resize((96, 96), Image.LANCZOS); sheet.paste(t2, (90 + i * 200, 200))
sheet.save('screenshots/icon-preview-sheet.png')
print('icons ok')

# ---- 벡터 로고(앱 안·소개 페이지·파비콘용). 비트맵 아이콘과 같은 도형(scale 1.3). 출력: web/logo.svg, docs/icon.svg, web/logo.js ----
K = 1.3; PX = lambda x: round(54 + (x - 54) * K, 2); PY = PX
def parts():
    aw = f'<path d="M{PX(33)} {PY(31)}H{PX(75)}L{PX(82)} {PY(45)}H{PX(26)}Z"/>'
    w = 56 / 3; r = round(w / 2 * K, 2)
    sc = ''.join(f'<path d="M{PX(26 + i * w)} {PY(45)}a{r} {r} 0 0 0 {round(w * K, 2)} 0Z"/>' for i in range(3))
    bar = f'<rect x="{PX(34)}" y="{PY(61)}" width="{round(40 * K, 2)}" height="{round(8 * K, 2)}" rx="{round(4 * K, 2)}"/>'
    return aw + sc + bar
G = parts()
svg = lambda rx: f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D62368"/><stop offset="1" stop-color="#B51958"/></linearGradient></defs><rect width="108" height="108" rx="{rx}" fill="url(#g)"/><g fill="#fff">{G}</g></svg>\n'
open('web/logo.svg', 'w').write(svg(24)); open('docs/icon.svg', 'w').write(svg(24))
GLYPH = f'<svg class="ic logo" viewBox="17 20 74 58" fill="currentColor" aria-hidden="true">{G}</svg>'
open('web/logo.js', 'w').write("// 자동 생성(scripts/make-icons.py) — 앱 로고 도형(흰색, 배경은 .brandmark). 직접 수정하지 말 것.\nexport const LOGO_GLYPH = '" + GLYPH + "';\n")
print('logo svg ok')
