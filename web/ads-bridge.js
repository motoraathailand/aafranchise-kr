// AdMob 다리(ADS 변형에만 포함 — noads 빌드에서는 이 파일이 지워짐). 하단 적응형 배너 하나만(전면·앱 시작·보상형 금지).
const P = () => (globalThis.Capacitor && globalThis.Capacitor.Plugins) || {};
// ---- AdMob 배너 (하단 적응형 배너 하나, 네이티브 뷰). debug = 구글 테스트 단위만 ----
let adsInit = null, bnCreated = false, bnHidden = false, bnBusy = null, sizeCb = null, failCb = null, wired = false;
async function adsReady(testing) {
  if (adsInit) return adsInit;
  adsInit = (async () => {
    const A = P().AdMob; if (!A) throw new Error('no AdMob');
    await A.initialize({ initializeForTesting: !!testing });
    try { const info = await A.requestConsentInfo(); if (info && info.isConsentFormAvailable && info.status === 'REQUIRED') await A.showConsentForm(); } catch {}
    if (!wired) { wired = true;
      await A.addListener('bannerAdSizeChanged', (i) => { if (sizeCb) sizeCb(Math.max(0, Math.round(Number(i && i.height) || 0))); });
      await A.addListener('bannerAdFailedToLoad', () => { bnCreated = false; bnHidden = false; if (failCb) failCb(); });
    }
  })().catch((e) => { adsInit = null; throw e; });
  return adsInit;
}
export const banner = {
  onSize(a, b) { sizeCb = a; failCb = b; },
  async show(unitId, testing) {
    if (bnBusy) return bnBusy;
    bnBusy = (async () => {
      await adsReady(testing); const A = P().AdMob;
      if (bnCreated && bnHidden) { await A.resumeBanner(); bnHidden = false; return true; }
      if (bnCreated) return true;
      await A.showBanner({ adId: unitId, adSize: 'ADAPTIVE_BANNER', position: 'BOTTOM_CENTER', margin: 0, isTesting: !!testing });
      bnCreated = true; bnHidden = false; return true;
    })().finally(() => { bnBusy = null; });
    return bnBusy;
  },
  async hide() { if (bnBusy) { try { await bnBusy; } catch {} } if (!bnCreated || bnHidden) return false; try { await P().AdMob.hideBanner(); bnHidden = true; return true; } catch { return false; } },
};
