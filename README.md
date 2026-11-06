# AA 프랜차이즈 - 쉽게하는창업 (Korea)

**0.1.1 (versionCode 2) · `com.motoraa.franchisekr` · South Korea only.** Capacitor 7, plain HTML/CSS/JS. Dedicated Firebase project and signing key. Google sign-in through Firebase Authentication is required. No operator server; bundled public data, BYOK AI and free hosting.

Site and weekly data: [aafranchise-kr-site](https://github.com/motoraathailand/aafranchise-kr-site).

## Features
11,166 KFTC 2025 brands; 10,621 precisely matched startup-cost records; search, favorites, comparison, KRW budget filtering (only if verified costs exist), five UI languages with Korean default, coaching tutorial with skip/replay, notices, update/changelog prompts, feedback and app information. On-device key storage: Gemini key required for AI, Groq/OpenRouter optional. All AI keys stay on the device and go only to the selected provider.

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
The bundled catalog uses **all 11,166 valid 2025 official KFTC brand-list records** (API 15125467), with franchise fees, education fees, deposits, other startup costs and component-total amounts for **10,621 records** where brand company, sector and industry category match in amount API 15110265. Both official Swagger tables were verified. Amounts are **thousand KRW in the source and converted to KRW won**. `smtnAmt` is the API's startup-amount components total, not a separately established interior fee; full real-world opening budgets are never inferred. No store count, mean sales, royalty or payback is supplied by the approved brand list.

 `brandMnno` is the official brand management number. `registrationNo` in the schema holds the non-personal `jnghdqrtrsMnno` headquarters-management identifier, **not a disclosure registration number**. `firstRegistrationAt` is labeled **franchise-business start**, not disclosure registration date. Repeated identical information rows for separate headquarters are distinct brands. The FTDA interior API is unavailable and not queried. Exactly matching category conflicts are conservatively left without costs, retaining the brand itself; no amount is guessed.

Collector: `scraper/api-catalog.mjs` / `enrich-api.mjs`, site equivalent under `tools/scraper/`, read a user-supplied `DATA_GO_KR_SERVICE_KEY` from environment/Actions secret. Both APIs are fetched once per weekly run, using identifying UA, 1.6s+ jitter delay, paging-completeness checks, and immediate allowlisted field sanitization. No key or representative/business/corporate registration identifiers enter the cache or commits. If no key is available locally the prior good dataset remains; the scheduled workflow requires the secret and fails safe.

The app checks `meta.json` at 4s after start and at resume (max once per 24h), downloads only a higher version, and applies validated data next start. Approved full catalogs use IndexedDB, avoiding small localStorage UTF-16 quotas; a failed/suspect update keeps the current bundled copy in place. Weekly site data: Monday 10:00 Bangkok, `force` manual run, Node checks before push, heartbeat `checkedAt` if unchanged. 0.1.1 bundles the exact expanded data for reliable offline use.

## Known verification boundaries
- 39 Node tests passed. Headless Korean browser flows and UI screenshots were inspected; these use mocked authentication and are not a native installation or a real Google login.
- This box lacks usable KVM, so the Play Android emulator cannot start. Native installation, native Google sign-in and native screenshots remain outstanding on a physical/authorized test device.
- No Play listing, tester signup or app release was made. Korea only.
