// Initial Korean release. Items are ordered [th, en, ko, zh, hi].
export const CHANGELOG = [{
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
