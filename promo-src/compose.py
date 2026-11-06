# Play 스크린샷(1080x1920) · 피처 그래픽(1024x500) · 사이트용 webp(480x853) 생성. python3 promo-src/compose.py
import os, base64, sys
from playwright.sync_api import sync_playwright
ROOT = '/workspace/fr'; RAW = ROOT + '/dist/raw'
LANGS = ['th', 'en', 'ko', 'zh', 'hi']
CAP = {  # [home, list, detail, compare, budget, ai, guides]
 'th': ['ค้นหา 697 แฟรนไชส์ไทย', 'กรองตามหมวดและงบ', 'ค่าสิทธิ์และระยะคืนทุน', 'เทียบแบรนด์ข้างกัน', 'หาแบรนด์ที่พอดีงบ', 'ถาม AI ด้วยคีย์ของคุณ', 'ขั้นตอนเริ่มต้นทีละขั้น'],
 'en': ['Search 697 Thai franchises', 'Filter by category and budget', 'Fees, royalty and payback', 'Compare brands side by side', 'Find brands that fit your budget', 'Ask AI with your own key', 'Start-up steps, one by one'],
 'ko': ['태국 프랜차이즈 697개 검색', '카테고리·예산으로 거르기', '가맹비·로열티·회수 기간', '브랜드 나란히 비교', '예산에 맞는 브랜드 찾기', '내 키로 AI에게 질문', '창업 절차를 단계별로'],
 'zh': ['搜索 697 个泰国特许经营', '按类别和预算筛选', '加盟费、权利金、回本周期', '并排对比品牌', '按预算找品牌', '用自己的密钥问 AI', '创业步骤，一步步来'],
 'hi': ['697 थाई फ्रेंचाइज़ खोजें', 'श्रेणी और बजट से छाँटें', 'शुल्क, रॉयल्टी, लागत वापसी', 'ब्रांड साथ-साथ तुलना', 'बजट में फिट ब्रांड', 'अपनी कुंजी से AI से पूछें', 'शुरुआती कदम, एक-एक करके'],
}
SUB = {'th': 'คู่มือแฟรนไชส์ในประเทศไทย', 'en': 'Thailand franchise guide', 'ko': '태국 프랜차이즈 가이드', 'zh': '泰国特许经营指南', 'hi': 'थाईलैंड फ्रेंचाइज़ गाइड'}
FONT = {'th': "'Kanit'", 'en': "'Kanit','Gothic A1'", 'ko': "'Gothic A1'", 'zh': "'Noto Sans CJK SC'", 'hi': "'Baloo 2','Noto Sans Devanagari'"}
FILES = ['01-home', '02-list', '03-detail', '04-compare', '05-budget', '06-ai', '07-guides']
SITEMAP = [0, 2, 3, 4, 5, 6]   # site shot 1..6
b64 = lambda p: 'data:image/png;base64,' + base64.b64encode(open(p, 'rb').read()).decode()
LOGO = open(ROOT + '/web/logo.svg').read()
CSS = """*{margin:0;padding:0;box-sizing:border-box}html,body{overflow:hidden;background:#9d174d}
.bg{position:absolute;inset:0;background:linear-gradient(165deg,#d62368 0%,#b51958 55%,#7d1040 100%)}
.blob{position:absolute;border-radius:50%;background:radial-gradient(circle at 35% 35%,rgba(255,190,215,.30),rgba(255,190,215,0) 70%)}
.phone{position:absolute;background:#17101a;border-radius:84px;padding:20px;box-shadow:0 50px 100px rgba(60,0,30,.5),inset 0 0 0 3px #3b2a35}
.phone .s{border-radius:66px;overflow:hidden;background:#fff}.phone img{display:block;width:100%}
"""
def shot_html(lang, i):
    cap = CAP[lang][i]; f = FONT[lang]; fs = 92 if lang in ('th', 'hi') else 96
    return f"""<!doctype html><meta charset=utf-8><style>{CSS}body{{width:1080px;height:1920px;font-family:{f},sans-serif;font-weight:700;color:#fff}}
.logo{{position:absolute;left:60px;top:58px;display:flex;align-items:center;gap:18px;font-size:44px;opacity:.95}}.logo svg{{width:84px;height:84px;border-radius:22px}}
.cap{{position:absolute;left:60px;right:60px;top:196px;text-align:center;font-size:{fs}px;line-height:1.25;text-shadow:0 6px 24px rgba(60,0,30,.35)}}
.phone{{left:150px;top:420px;width:780px;height:1700px}}</style>
<div class=bg></div><div class=blob style="width:900px;height:900px;left:-300px;top:900px"></div><div class=blob style="width:700px;height:700px;left:560px;top:-200px"></div>
<div class=logo>{LOGO}<span>AA Franchise</span></div><div class=cap>{cap}</div>
<div class=phone><div class=s><img src="{b64(f'{RAW}/{lang}-{FILES[i]}.png')}"></div></div>"""
def feature_html(lang):
    f = FONT[lang]
    return f"""<!doctype html><meta charset=utf-8><style>{CSS}body{{width:1024px;height:500px;font-family:{f},sans-serif;font-weight:700;color:#fff}}
.logo{{position:absolute;left:64px;top:70px;width:150px;height:150px}}.logo svg{{width:150px;height:150px;border-radius:38px;box-shadow:0 20px 50px rgba(60,0,30,.45)}}
h1{{position:absolute;left:64px;top:240px;font-size:76px;line-height:1.1;font-weight:700}}
.th{{position:absolute;left:64px;top:330px;font-size:50px;font-weight:600;color:#ffe3ee}}
.sub{{position:absolute;left:64px;top:405px;font-size:34px;font-weight:500;opacity:.95}}
.phone{{width:300px;border-radius:44px;padding:11px}}.phone .s{{border-radius:34px}}</style>
<div class=bg></div><div class=blob style="width:620px;height:620px;left:480px;top:-120px"></div>
<div class=logo>{LOGO}</div><h1>AA Franchise</h1><div class=th>เปิดร้านดี</div><div class=sub>{SUB[lang]}</div>
<div class=phone style="left:560px;top:70px"><div class=s><img src="{b64(f'{RAW}/{lang}-01-home.png')}"></div></div>
<div class=phone style="left:720px;top:130px"><div class=s><img src="{b64(f'{RAW}/{lang}-04-compare.png')}"></div></div>"""
os.makedirs(ROOT + '/dist/play/th/screenshots', exist_ok=True); os.makedirs(ROOT + '/dist/play/en-US/screenshots', exist_ok=True)
SITE = '/workspace/aafranchise-site/src/assets/img/play'; os.makedirs(SITE, exist_ok=True)
from PIL import Image
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': 1080, 'height': 1920})
    for lang in LANGS:
        for i in range(7):
            pg.set_viewport_size({'width': 1080, 'height': 1920}); pg.set_content(shot_html(lang, i)); pg.wait_for_timeout(250)
            loc = {'th': 'th', 'en': 'en-US'}.get(lang)
            tmp = f'/tmp/fr-shot-{lang}-{i}.png'; pg.screenshot(path=tmp)
            if loc: Image.open(tmp).convert('RGB').save(f'{ROOT}/dist/play/{loc}/screenshots/{i+1:02d}-{FILES[i][3:]}.png')
            if i in SITEMAP: Image.open(tmp).convert('RGB').resize((480, 853), Image.LANCZOS).save(f'{SITE}/{lang}-{SITEMAP.index(i)+1}.webp', quality=82, method=6)
        if lang in ('th', 'en'):
            pg.set_viewport_size({'width': 1024, 'height': 500}); pg.set_content(feature_html(lang)); pg.wait_for_timeout(250)
            loc = {'th': 'th', 'en': 'en-US'}[lang]; tmp = f'/tmp/fr-fg-{lang}.png'; pg.screenshot(path=tmp); Image.open(tmp).convert('RGB').save(f'{ROOT}/dist/play/{loc}/feature-graphic.png')
    b.close()
print('ok')
