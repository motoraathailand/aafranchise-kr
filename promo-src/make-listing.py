# Writes docs/store-listing.md + dist/play/listing-*.txt with checked character counts. usage: python3 promo-src/make-listing.py
import os
R='/workspace/fr'
L={}
L['th']=dict(
 title='AA Franchise – เปิดร้านดี',
 short='ค้นหา เทียบ และเลือกแฟรนไชส์ไทย 697 แบรนด์ ใช้ฟรี เฉพาะประเทศไทย',
 full='''AA Franchise – เปิดร้านดี คือแอปคู่มือแฟรนไชส์สำหรับคนไทยที่อยากเปิดร้าน รวม 697 แบรนด์แฟรนไชส์ในประเทศไทยไว้ในมือถือ ดูค่าแฟรนไชส์ ค่าสิทธิ์ และระยะคืนทุนได้ในที่เดียว แล้วตัดสินใจอย่างมั่นใจ

ค้นหาและกรอง 697 แบรนด์
• พิมพ์ชื่อแบรนด์ หรือเลือกหมวด เช่น อาหาร เครื่องดื่ม การศึกษา บริการ ค้าปลีก และความงาม
• ชิปงบด่วน (ไม่เกิน 50,000 หรือ 200,000 บาท) ช่วยกรองได้ในแตะเดียว
• บันทึกแบรนด์โปรดไว้กลับมาดูได้

ดูรายละเอียดพร้อมแหล่งที่มา
• เงินลงทุนรวม ค่าแฟรนไชส์ เงินทุนหมุนเวียน เงินประกัน ค่าธรรมเนียมรายเดือน อายุสัญญา และระยะคืนทุน
• ทุกตัวเลขมีแหล่งที่มาและวันที่ พร้อมข้อความต้นฉบับ

เปรียบเทียบแบรนด์
• วางแบรนด์เทียบกันทีละคอลัมน์ ดูความต่างของต้นทุนได้ชัด ๆ
• ไฮไลต์ค่าที่ต่ำสุด เพื่อเห็นตัวเลือกที่เบาที่สุด

ตัวช่วยหางบประมาณ
• เลื่อนแถบใส่งบ แล้วดูว่าหมวดและแบรนด์ไหนพอดี
• กันเงินทุนหมุนเวียนสำรองให้อัตโนมัติ

ถาม AI และอ่านคู่มือเริ่มต้น
• ใช้คีย์ AI ฟรีของคุณเอง (ต้องมีคีย์ Gemini ส่วน Groq และ OpenRouter ไม่บังคับ) คีย์เก็บในมือถือของคุณเท่านั้น
• คำตอบอ้างอิงจากข้อมูลในแอป และข้อที่ต้องตรวจสอบจะมีป้ายกำกับ
• การ์ดขั้นตอนเริ่มต้น เช่น จดทะเบียน ใบอนุญาต และการเลือกทำเล

ใช้ง่ายและเป็นส่วนตัว
• ล็อกอินด้วย Google แตะครั้งเดียว ใช้เพียงชื่อและอีเมลเพื่อระบุตัวคุณ ออกจากระบบหรือลบบัญชีได้ในตั้งค่า
• ข้อมูลแบรนด์อยู่ในแอป ใช้ดูได้แม้ไม่มีอินเทอร์เน็ต (ต้องใช้เน็ตเฉพาะการล็อกอินและแชต AI)
• 5 ภาษา: ไทย อังกฤษ เกาหลี จีน และฮินดี ตามภาษาของมือถือ
• ใช้ฟรี เวอร์ชันทดสอบนี้ไม่มีโฆษณา

ข้อควรทราบ
• เปิดให้ใช้เฉพาะในประเทศไทย
• ข้อมูลแฟรนไชส์รวบรวมจากหน้าสาธารณะ (ThaiFranchiseCenter) และอาจล้าสมัยหรือคลาดเคลื่อน โปรดยืนยันรายละเอียดกับเจ้าของแบรนด์ก่อนลงทุนเสมอ
• AA Franchise เป็นแอปอิสระ ไม่ได้เป็นตัวแทนหรือได้รับการรับรองจากแบรนด์ใดหรือเว็บไซต์แหล่งข้อมูล และไม่ใช่คำแนะนำทางการเงินหรือกฎหมาย

มีคำถามหรือไอเดีย? motoraathailand@gmail.com''',
 notes='''<th>
AA Franchise รุ่นทดสอบแบบปิดรุ่นแรก
• ค้นหาและกรอง 697 แบรนด์แฟรนไชส์ไทย
• ดูรายละเอียด เปรียบเทียบแบรนด์ และตัวช่วยหางบประมาณ
• ถาม AI ด้วยคีย์ของคุณเอง และคู่มือขั้นตอนเริ่มต้น
• ล็อกอินด้วย Google ไม่มีโฆษณาในรุ่นทดสอบ
• แจ้งปัญหาหรือข้อเสนอแนะได้ที่เมนู > ส่งความคิดเห็น
</th>
<en-US>
First closed-test version of AA Franchise
• Search and filter 697 Thai franchise brands
• Brand details, side-by-side compare and a budget finder
• Ask an AI with your own key, plus start-up guide cards
• Google sign-in, no ads in the test version
• Send problems or ideas from Menu > Send feedback
</en-US>''')
L['en-US']=dict(
 title='AA Franchise - Thai Franchises',
 short='Search, compare and choose from 697 Thai franchise brands. Free. Thailand only.',
 full='''AA Franchise (Thai name: เปิดร้านดี) is a franchise guide for people who want to open a shop in Thailand. It puts 697 Thai franchise brands in your phone: fees, royalty and payback in one place, so you can decide with confidence.

SEARCH AND FILTER 697 BRANDS
• Type a brand name or pick a category: food, drinks, education, services, retail, beauty and more
• Quick budget chips (up to 50,000 or 200,000 baht) filter in one tap
• Save favourite brands to come back to

DETAILS WITH SOURCES
• Total investment, franchise fee, working capital, deposit, monthly fees, contract length and payback
• Every figure shows its source and date, with the original text next to it

COMPARE BRANDS
• Put brands side by side, column by column, and see the cost differences clearly
• The lowest value is highlighted so the lightest option stands out

BUDGET FINDER
• Slide in your budget and see which categories and brands fit
• A working-capital reserve is kept aside automatically

ASK AI AND READ THE START-UP GUIDE
• Bring your own free AI key (a Gemini key is required; Groq and OpenRouter are optional). Your keys stay on your phone only
• Answers are grounded on the data in the app, and items that need checking are marked
• Start-up cards: company registration, permits, choosing a location and more

SIMPLE AND PRIVATE
• One-tap Google sign-in. Only your name and email identify you. Sign out or delete your account in Settings
• Brand data is inside the app, so you can browse offline (only sign-in and AI chat need a connection)
• 5 languages: Thai, English, Korean, Chinese and Hindi, following your phone language
• Free. This test version has no ads

GOOD TO KNOW
• Available in Thailand only
• Franchise data is collected from public pages (ThaiFranchiseCenter) and may be out of date or inaccurate. Always confirm the details with the brand owner before you invest
• AA Franchise is an independent app. It is not affiliated with or endorsed by any brand or data source, and it is not financial or legal advice

Questions or ideas? motoraathailand@gmail.com''',
 notes='')
out=['# AA Franchise – Play store listing text (checked counts)\nApp **AA Franchise – เปิดร้านดี** · `com.motoraa.aafranchise` · Thailand only. Default language **Thai (th)**, translation **English (United States) en-US**. Limits: title ≤ 30, short ≤ 80, full ≤ 4000, release notes ≤ 500 per language. Generated by `promo-src/make-listing.py`; edit there.\n\nPromotion text is Thai-first (owner rule). The test build has no ads, so the text says so; when the ads build ships, replace the last bullet under "ใช้ง่ายและเป็นส่วนตัว" / "SIMPLE AND PRIVATE" with "Free, with small banner ads" (ใช้ฟรี มีแบนเนอร์โฆษณาเล็ก ๆ).\n']
names={'th':'Thai – th (DEFAULT)','en-US':'English (United States) – en-US'}
for k,v in L.items():
    assert len(v['title'])<=30 and len(v['short'])<=80 and len(v['full'])<=4000,(k,len(v['title']),len(v['short']),len(v['full']))
    out.append(f"\n## {names[k]}\n\n- App name ({len(v['title'])} chars):\n```\n{v['title']}\n```\n- Short description ({len(v['short'])} chars):\n```\n{v['short']}\n```\n- Full description ({len(v['full'])} chars):\n```\n{v['full']}\n```\n- Feature graphic: `/workspace/fr/dist/play/{k}/feature-graphic.png`\n- Phone screenshots (1080x1920, upload in this order):\n"+''.join(f"  {i+1}. `/workspace/fr/dist/play/{k}/screenshots/{n}`\n" for i,n in enumerate(sorted(os.listdir(f'{R}/dist/play/{k}/screenshots')))))
    d=f'{R}/dist/play/{k}'
    open(f'{d}/listing.txt','w').write(f"TITLE ({len(v['title'])})\n{v['title']}\n\nSHORT ({len(v['short'])})\n{v['short']}\n\nFULL ({len(v['full'])})\n{v['full']}\n")
notes=L['th']['notes']; assert all(len(b)<=500 for b in notes.split('</')[:-1])
out.append(f"\n## Release notes (first closed-test release; paste the whole block)\n```\n{notes}\n```\n")
open(f'{R}/docs/store-listing.md','w').write(''.join(out))
open(f'{R}/dist/play/release-notes.txt','w').write(notes+'\n')
print({k:(len(v['title']),len(v['short']),len(v['full'])) for k,v in L.items()})
