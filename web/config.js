// 앱 설정 — 한 곳. 이름·패키지·색은 ../brand.json (→ brand.js 자동 생성). 비밀값은 여기에 없음(앱 서버가 없고 API 키는 기기 보안 저장소에만).
// 양도 시 이 파일과 ads 설정 파일, brand.json 만 인수자 값으로 바꾸면 됨.
import { BRAND } from './brand.js';
export const CONFIG = {
  packageId: BRAND.packageId, // com.motoraa.aafranchise
  feedbackEmail: 'motoraathailand@gmail.com',
  testersGroupUrl: 'https://groups.google.com/g/motoraa-testers',
  siteUrl: 'https://motoraathailand.github.io/aafranchise-kr-site', // 앱 전용 GitHub Pages(소개·테스터 참여·개인정보 페이지, 저장소 aafranchise-kr-site)
  privacyUrl: 'https://motoraathailand.github.io/aafranchise-kr-site/privacy.html', // 개인정보처리방침 공개 주소(Play 등록용)
  operator: 'Pornnarai Tananchai',
  // 선택: 공지·최신 버전 정보를 주는 정적 JSON 주소(예: GitHub Pages). 비어 있으면 원격 조회 없음(앱 서버 없음).
  // 형식: { "latestVersionCode": 2, "minVersionCode": 1, "notices": [{ "id": "n1", "at": "2026-11-02", "title": { "en": "..", "th": "..", "ko": "..", "zh": "..", "hi": ".." }, "body": { "en": "..", "th": "..", "ko": "..", "zh": "..", "hi": ".." } }] }
  remoteConfigUrl: 'https://motoraathailand.github.io/aafranchise-kr-site/app/version.json', // 최신 버전(latestVersionCode)·공지(notices): 사이트 저장소의 app/version.json 만 고치면 앱 업데이트 없이 반영
  // 광고(ads 변형 전용·정식 출시 후): debug = 구글 테스트 단위, release = 실제 단위 준비 + 이 스위치가 true 일 때만. 테스트(noads) 빌드에는 광고 코드 자체가 없음(AA 공통 규칙 2026-11-02).
  adsInRelease: false,
  // 데이터: 번들된 data/brands.json 이 기본(오프라인 우선, 빌드 시점의 최신본). 원격 갱신 JSON(GitHub Pages 정적 파일)이 더 새 버전일 때만 받아 기기에 저장. 앱 서버 없음.
  dataUrl: 'https://motoraathailand.github.io/aafranchise-kr-site/data/brands.json', // 매주 갱신되는 브랜드 데이터(사이트 저장소 docs/data/, scripts/weekly-refresh.sh 가 게시). 앱은 하루 한 번까지 meta.json 으로 버전만 확인하고 새 버전이면 받음
  dataMetaUrl: 'https://motoraathailand.github.io/aafranchise-kr-site/data/meta.json', // 아주 작은 버전 표(version·count·generatedAt)
  // Google 로그인(Firebase Authentication, AA 공통 규칙: 로그인 필수). configured 는 build-app.mjs 가 android/app/google-services.json 이 있을 때만 true 로 바꿈.
  // false(Firebase 프로젝트 아직 없음)인 debug 빌드에서만 "로그인 없이 시험" 버튼이 보임 — release 는 gradle 이 막음.
  auth: { required: true, configured: false },
  keyLinks: {
    gemini: 'https://aistudio.google.com/apikey',
    groq: 'https://console.groq.com/keys',
    openrouter: 'https://openrouter.ai/keys',
  },
};
