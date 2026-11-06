# AA 프랜차이즈 - 쉽게하는창업 (Korea)

**0.1.0 (versionCode 1) · `com.motoraa.franchisekr` · South Korea only.** Capacitor 7, plain HTML/CSS/JS. Dedicated Firebase project and signing key. Google sign-in through Firebase Authentication is required. No operator server; bundled public data, BYOK AI and free hosting.

Site and weekly data: [aafranchise-kr-site](https://github.com/motoraathailand/aafranchise-kr-site).

## Features
300 real Korean franchise brands (KFTC public disclosure directory); search, favorites, comparison, KRW budget filtering (only if verified costs exist), five UI languages with Korean default, coaching tutorial with skip/replay, notices, update/changelog prompts, feedback and app information. On-device key storage: Gemini key required for AI, Groq/OpenRouter optional. All AI keys stay on the device and go only to the selected provider.

## Build / checks
```
npm ci
npm test
bash scripts/build-debug.sh noads
bash scripts/scan-apk.sh
```
`noads` removes advertising SDK, identifiers and permission. The generated APK is `android/app/build/outputs/apk/noads/debug/app-noads-debug.apk`. **Never upload to Play under this release workflow.** A separate conscious store-release decision and release signing setup would be required.

Node-side tests cover budget parsing, data integrity and validation, filtering, multilingual text/guides, authentication gate and Firebase structure, data-refresh protocol, tutorial and collector sanity. Python Playwright flows in `tests/` cover UI, fake-login/consent/logout, coach marks (including rotation), advertising absence and throttled data update. **These mocked flows are not real Google-account verification.**

## Firebase and signing
Firebase project `aa-franchise-kr`; Android package `com.motoraa.franchisekr`; only Google sign-in enabled. `android/app/google-services.json` is git-ignored. Local backup: `/home/box/secrets/aafranchise-kr/google-services.json`.

Dedicated RSA keystore: `/home/box/secrets/aafranchise-kr/aafranchise-kr.keystore`, alias `aafranchisekr`. Password files are kept next to it, mode 0600. Local `keystore/keystore.properties` wires both debug and release signing to this key and is git-ignored; **the passwords and `keystore.properties` must never be committed or printed**. SHA-1 and SHA-256 were registered in Firebase. Actual final APK fingerprint matches this keystore. Google OAuth behavior still needs a real account/device verification; no test user credentials are stored here.

## Data integrity and updates
First release uses **300 rows from KFTC's verified public disclosure list**: name, official parenthetical English when present, company, industry, registration number and initial registration date; links and fetched/as-of dates included. Representative names and business identifiers are not retained. The one damaged label `??돈까스` is documented and corrected to `쑝쑝돈까스` using the matching company’s official brand site, with that second source stored in the brand record; FTC’s original damaged spelling is retained in documentation without inventing any other fields. **Costs, royalties, store count, sales and payback are absent because the public directory did not verify them.** Never substitute category aggregates as brand-level amounts.

Collector scripts live under `scraper/`; site workflow uses its copies in `tools/scraper/`. Public directory only, identifying UA, 1.6 s+ jitter delay, cached responses, block/error stop. `robots.txt` responds with an error page so discovery beyond this public listing is not attempted. `DATA_GO_KR_SERVICE_KEY` is optional and user-owned only; seed `scraper/enrich-api.mjs` retrieves a known official endpoint but does not apply uncertain money mappings. Real fee/royalty fields need a valid key and official field table validation before release.

The app waits 4 s after start and checks after resume (max once per 24 h), first reads `meta.json`, downloads `brands.json` only for a higher version, validates it and applies on next start. Invalid/offline responses leave bundled or previously stored data unchanged. Weekly site workflow: Monday 10:00 Bangkok, manual `force`, checks before GitHub token push and heartbeat `checkedAt` without a version push if unchanged.

## Known verification boundaries
- 35 Node tests passed. Headless Korean browser flows and UI screenshots were inspected; these use mocked authentication and are not a native installation or a real Google login.
- This box lacks usable KVM, so the Play Android emulator cannot start. Native installation, native Google sign-in and native screenshots remain outstanding on a physical/authorized test device.
- No Play listing, tester signup or app release was made. Korea only.
