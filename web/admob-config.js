// AdMob IDs of fr (잠정 이름) — THE ONLY PLACE they are written (한 곳에만 둠). 양도 시 이 파일만 인수자의 AdMob 값으로 바꾸면 됨.
//  · android/app/build.gradle 이 번들된 사본(assets/public/admob-config.js)에서 appId / testAppId 를 정규식으로 읽어 AndroidManifest 의 APPLICATION_ID 로 넣음
//    → appId / testAppId 는 한 줄에 'ca-app-pub-…~…' 홑따옴표 문자열로 유지할 것.
//  · 지금은 fr 용 AdMob 앱이 아직 없음 → appId 도 구글 공식 테스트 ID. release 빌드는 appId 가 테스트 ID 와 같으면 gradle 이 막음(안전장치).
//  · 배너 전용(소유자 규칙): 광고 단위는 적응형 배너 하나뿐.
export default {
  publisher: '',                                         // TODO: 실제 AdMob 게시자 ID(pub-…) — app-ads.txt 가 필요하면 사용
  appId: 'ca-app-pub-3940256099942544~3347511713',       // TODO: AdMob 에서 fr 앱을 만든 뒤 실제 앱 ID 로 교체 (지금은 테스트 ID)
  testAppId: 'ca-app-pub-3940256099942544~3347511713',   // 구글 공식 테스트 앱 ID (debug 매니페스트)
  test: { banner: 'ca-app-pub-3940256099942544/9214589741' },
  units: { banner: '' },                                 // TODO: 실제 배너 단위 ID (release + 광고 허용일 때만 사용)
};
