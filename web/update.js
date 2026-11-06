// 업데이트 안내 로직 (순수 함수 + 서버/Play 확인). UI 는 app.js. AAAi public/update-prompt.js 의 decide() 를 가져와 단순화.
//  · 현재 versionCode: 네이티브 AABuild.  · 최신/최소: 서버 /api/config 의 latestVersionCode / minVersionCode 와 Play In-App Updates 중 큰 값.
//  · 최소 버전보다 낮으면 강제(나중에 없음). 그 외엔 "나중에"를 누르면 그 버전은 24시간 숨김.
//  · 새로 바뀐 점: 업데이트 후 첫 실행에 한 번(마지막으로 본 versionCode 저장). 처음 설치에서는 보이지 않음(메뉴 "업데이트"에서 확인).
export const SNOOZE_MS = 24 * 3600 * 1000;
const nat = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : 0; };

export function decide(o) {
  const current = nat(o.current), latest = Math.max(nat(o.serverLatest), nat(o.playAvailable)), min = nat(o.serverMin), now = o.now || Date.now();
  if (!current) return { show: false, reason: 'unknown-current', latest, forced: false };
  const forced = min > current;
  if (!forced && latest <= current) return { show: false, reason: 'up-to-date', latest, forced: false };
  const sn = o.snooze;
  if (!forced && sn && nat(sn.code) >= latest && Number(sn.until) > now) return { show: false, reason: 'snoozed', latest, forced: false };
  return { show: true, reason: forced ? 'forced' : 'newer', latest: Math.max(latest, min), forced };
}
// 처음 설치(last=0)에서는 팝업 없이 현재 버전을 기록만, 업데이트(last<current)면 보여 줌
export function changelogDecision(last, current) {
  const l = nat(last), c = nat(current);
  if (!c) return { show: false, record: false };
  if (!l) return { show: false, record: true };
  if (l < c) return { show: true, record: true };
  return { show: false, record: false };
}
