// noads 빌드(기본·모든 테스트 빌드)용 광고 자리: 광고 SDK·요청·슬롯이 전혀 없음. 화면 코드는 같은 이름으로 호출하지만 아무 일도 하지 않음.
// 정식 출시 후 공개 빌드(ads 변형)에서만 web/ads.js 가 번들됨(node scripts/build-app.mjs ads).
export const AD_SCREENS = new Set();
export async function init() {}
export function setScreen() {}
export function setOverlay() {}
export function setTyping() {}
export const state = () => ({ mode: 'off', policy: 'none', screen: '', overlay: false, typing: false });
