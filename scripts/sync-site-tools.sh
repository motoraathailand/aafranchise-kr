#!/usr/bin/env bash
# 주간 갱신 도구를 사이트 저장소(GitHub Actions 가 실행)의 tools/ 로 복사. 스크래퍼를 고친 뒤 실행하고 사이트 저장소에 커밋·푸시.
# 사용: bash scripts/sync-site-tools.sh [사이트 저장소 경로(기본 /workspace/aafranchise-site)]
set -euo pipefail
cd "$(dirname "$0")/.."
SITE="${1:-/workspace/aafranchise-site}"
mkdir -p "$SITE/tools/scraper" "$SITE/tools/web"
for f in fetch build-brands parse robots categories weekly-lib; do cp "scraper/$f.mjs" "$SITE/tools/scraper/$f.mjs"; done
cp web/data-validate.js "$SITE/tools/web/data-validate.js"
echo "synced scraper/*.mjs + web/data-validate.js -> $SITE/tools/ (tools/weekly-refresh.mjs and .github/workflows live only in the site repo)"
