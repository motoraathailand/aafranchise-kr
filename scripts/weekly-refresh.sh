#!/usr/bin/env bash
# 주간 브랜드 데이터 갱신 — 한 번에 실행(무인). 사용: bash scripts/weekly-refresh.sh [--dry-run] [--no-scrape] [--no-push]
# 로그: data/cache/weekly-refresh.log. 자세한 설명은 scripts/weekly-refresh.mjs 머리말과 README.
set -uo pipefail
cd "$(dirname "$0")/.."
export PATH="/home/box/tools/node-v20.20.2-linux-x64/bin:$PATH"
mkdir -p data/cache
node scripts/weekly-refresh.mjs "$@" 2>&1 | tee -a data/cache/weekly-refresh.log
exit "${PIPESTATUS[0]}"
