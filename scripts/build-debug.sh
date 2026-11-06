#!/usr/bin/env bash
# 디버그 APK 빌드. 사용: bash scripts/build-debug.sh [noads|ads]   (기본 noads = 광고 코드 없음 → 모든 테스트 빌드)
# 결과: android/app/build/outputs/apk/<variant>/debug/app-<variant>-debug.apk
set -euo pipefail
cd "$(dirname "$0")/.."
V="${1:-noads}"
export JAVA_HOME="${JAVA_HOME:-/home/box/tools/jdk-21.0.13+9}"
export ANDROID_HOME="${ANDROID_HOME:-/home/box/android-sdk}"
export PATH="/home/box/tools/node-v20.20.2-linux-x64/bin:$JAVA_HOME/bin:$PATH"
node scripts/build-app.mjs "$V"
CAP="$(echo "${V:0:1}" | tr a-z A-Z)${V:1}"
(cd android && ./gradlew --no-daemon "assemble${CAP}Debug")
ls -la "android/app/build/outputs/apk/${V}/debug/"*.apk
