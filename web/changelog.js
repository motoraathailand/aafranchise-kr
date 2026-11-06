// Korean release. New entries contain all five UI languages.
export const CHANGELOG = [{
  versionCode: 2, version: '0.1.1', date: '2026-11-06',
  items: {
    th: ['ขยายแคตตาล็อก KFTC ปี 2025 เป็นมากกว่า 11,000 แบรนด์ พร้อมค่าแฟรนไชส์ การศึกษา เงินประกัน ค่าใช้จ่ายอื่น และยอดรวมในสกุลวอน','แสดงเฉพาะค่าที่ตรงจาก API อย่างเป็นทางการ แต่ละรายการมียศและลิงก์ต้นทาง ไม่มีจำนวนร้าน ยอดขายเฉลี่ย หรือต้นทุนตกแต่งที่ไม่ได้ยืนยัน','รายการสัปดาห์ขนาดใหญ่ถูกบันทึกบนเครื่องอย่างเหมาะสม โดยคงข้อมูลเดิมเมื่อออฟไลน์'],
    en: ['Expanded to more than 11,000 KFTC 2025 brand-list records with franchise, education, deposit, other-cost and total amounts in KRW.','Amounts come only from precisely matched official API rows with their source and base year. Unavailable outlet counts, average sales, royalties and interior fees remain omitted.','Weekly remote catalogs now use larger on-device storage, with offline and failed-update fallbacks.'],
    ko: ['2025년 공정위 브랜드 목록 1만 1천여 개로 확대하고 가맹비·교육비·보증금·기타비용·합계를 원 단위로 제공해요.','공식 API의 브랜드·법인·업종이 정확히 일치하는 금액만 출처·기준연도와 함께 표시해요. 확인할 수 없는 점포 수·평균매출·로열티·인테리어 상세는 표시하지 않아요.','대형 주간 목록 저장을 보완해 오프라인이나 저장 실패에도 기존 공식 데이터를 유지해요.'],
    zh: ['扩展至超过11,000个2025年韩国公平交易委员会品牌记录，并以韩元显示加盟费、培训费、保证金、其他费用和合计。','仅保留品牌、公司及行业匹配的官方API金额、基准年份和来源。未核实的门店数、平均销售额、特许权使用费和装修明细不作添加。','大目录更新改用更合适的设备存储，失败时保留原数据。'],
    hi: ['2025 के KFTC सूची में 11,000 से अधिक ब्रांड एवं फ्रेंचाइज़, शिक्षा, जमा, अन्य लागत व कुल राशि KRW में जोड़ी गई।','केवल ठीक मिलान वाली आधिकारिक API राशियाँ, स्रोत और आधार वर्ष दिखाए गए। अप्राप्त स्टोर संख्या, औसत बिक्री, रॉयल्टी और इंटीरियर विवरण नहीं जोड़े गए।','साप्ताहिक बड़े कैटलॉग को उपयुक्त डिवाइस स्टोरेज में सहेजते हैं, विफलता पर पुराना डेटा सुरक्षित रहता है'],
  },
}, {
  versionCode: 1, version: '0.1.0', date: '2026-11-06',
  items: {
    th: ['เปิดตัวรุ่นทดสอบเกาหลี: ค้นหาแฟรนไชส์ เปรียบเทียบ จัดเก็บรายการโปรด หางบเหมาะ และอ่านขั้นตอนเปิดร้านในเกาหลี', 'ข้อมูลจากระบบข้อมูลแฟรนไชส์ของคณะกรรมการการแข่งขันเกาหลี (KFTC) แสดงที่มา วันที่เก็บ และวันอ้างอิงของแต่ละแบรนด์', 'เข้าสู่ระบบด้วย Google, บทแนะนำบนหน้าจอจริง, เมนูประกาศ/อัปเดต/ข้อเสนอแนะ/แนะนำแอป และ 5 ภาษา'],
    en: ['First Korean test build: find franchises, compare, save favorites, match a budget and read Korea-specific start-up guides.', 'Brand records come from the Korea Fair Trade Commission franchise information system, with source and collection/reference dates.', 'Google sign-in, an on-screen first-run tutorial, notices/updates/feedback/about menus and five languages.'],
    ko: ['첫 한국 테스트 버전: 프랜차이즈 검색·비교·저장, 예산 찾기, 한국 창업 안내를 실행할 수 있어요.', '공정거래위원회 가맹사업정보제공시스템의 실제 브랜드 목록을 출처·수집일·기준일과 함께 보여 줘요.', 'Google 로그인, 실제 화면 위 첫 실행 둘러보기, 공지·업데이트·피드백·앱 소개 메뉴, 5개 언어를 제공해요.'],
    zh: ['首个韩国测试版：搜索、对比和收藏特许经营品牌，按预算查找并阅读韩国创业指南。', '实际品牌记录来自韩国公平交易委员会特许经营信息系统，记录来源、采集日期和基准日期。', 'Google 登录、基于真实界面的首次教程、公告/更新/反馈/应用介绍菜单以及五种语言。'],
    hi: ['पहला कोरियाई परीक्षण संस्करण: फ्रेंचाइज़ खोजें, तुलना करें, सहेजें, बजट मिलाएँ और कोरिया स्टार्ट-अप गाइड पढ़ें।', 'वास्तविक ब्रांड रिकॉर्ड कोरिया फेयर ट्रेड आयोग की फ्रेंचाइज़ सूचना प्रणाली से हैं, स्रोत और संग्रह/संदर्भ तिथि के साथ।', 'Google साइन-इन, वास्तविक स्क्रीन पर पहला ट्यूटोरियल, सूचना/अपडेट/फीडबैक/ऐप परिचय मेनू और पाँच भाषाएँ।'],
  },
}];
export const latest = () => CHANGELOG[0];
export const entryFor = (code) => CHANGELOG.find((e) => e.versionCode === code) || null;
