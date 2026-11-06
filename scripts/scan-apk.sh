#!/usr/bin/env bash
# noads APK 에 광고 SDK/권한/설정이 하나도 없는지 확인(AA 공통 규칙: 정식 출시 전 광고 0). 사용: bash scripts/scan-apk.sh <apk>
set -euo pipefail
APK="${1:-android/app/build/outputs/apk/noads/debug/app-noads-debug.apk}"
T=$(mktemp -d); unzip -q "$APK" -d "$T"; bad=0
if grep -a -l -i "com/google/android/gms/ads\|com.google.android.gms.ads\|admob\|doubleclick" "$T"/classes*.dex >/dev/null 2>&1; then echo "FAIL: ad SDK classes in dex"; bad=1; fi
if grep -r -l -i "admob\|doubleclick\|googleads" "$T/assets" >/dev/null 2>&1; then echo "FAIL: ad strings in assets"; bad=1; fi
AAPT=$(ls /home/box/android-sdk/build-tools/*/aapt2 | tail -1)
if "$AAPT" dump badging "$APK" | grep -q "AD_ID"; then echo "FAIL: AD_ID permission"; bad=1; fi
if "$AAPT" dump xmltree --file AndroidManifest.xml "$APK" | grep -qi "APPLICATION_ID\|admob"; then echo "FAIL: AdMob app id in manifest"; bad=1; fi
rm -rf "$T"; [ $bad = 0 ] && echo "OK: no ad SDK, no AD_ID, no AdMob id/config in $APK"; exit $bad
