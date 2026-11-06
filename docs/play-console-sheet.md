# AA Franchise – Google Play Console fill sheet (closed testing, first upload)

> ## ⚠️ PENDING FOR NEXT PATCH (owner decision 2026-11-04 12:27 Asia/Bangkok: Google sign-in is BACK and REQUIRED; this reverses the 2026-11-03 "no login" decision) — read this first
> Do NOT upload to Play until the owner says **"패치해"**. The AAB to upload for that patch is **`/workspace/fr/dist/aafranchise-0.1.8-9-noads-release.aab`** (0.1.8, versionCode 9, sha256 `082798907be331d1035ae76679a1a00b729424aee1aa663633904f0ab8630f43`). Upload-signed release APK: `aafranchise-0.1.8-9-noads-release-upload-signed.apk` (sha256 `095184522752a13e28b146054e82d17d8de07ff34534572c03b65a588a55d29f`); same build re-signed with the Firebase-registered debug key for sideload testing: `aafranchise-0.1.8-9-noads-release-debugkey-sideload.apk` (sha256 `06e4dfa98ca25b12d57893dd0117923b4b2b8d1d2d3912a471b99c7ab7ab6960`). **The 0.1.7 AAB (versionCode 8, "no login") is obsolete and was never uploaded: do NOT upload it.** Everything below that mentions Google sign-in is valid again (the 0.1.7 "no sign-in" override was removed). Play Console items for this patch:
> 1. **App content > App access:** **login required** — keep "All or some functionality is restricted" with the Google sign-in instructions and the review account `motor00thailand@gmail.com` (section 2.2 below, unchanged; the app shows a Google sign-in gate at start and is not usable without signing in). Keep the `motor00thailand` account.
> 2. **App content > Data safety:** the login-era values stay: **Name, Email address, User IDs** (Firebase Authentication / Google sign-in) + approximate location (IP at sign-in), collected = yes, shared = no; account creation method **OAuth (Google sign-in)**; **Delete account URL** `https://motoraathailand.github.io/aafranchise-site/delete.html`; deletion = in-app Settings > Account > Delete my account + that URL (section 2.6 below, unchanged). Nothing to change in the Console for this versus the 0.1.5/0.1.6 declaration.
> 3. **Store listing text:** the live listing still has the login text, so keep it (the temporary no-login drafts were reverted in `dist/play/*/listing.txt`, `store-listing.md`, `release-notes.txt`). Add a release note if wanted: "Google sign-in again; brand data now refreshes automatically about once a week when online." / Thai: ข้อมูลแบรนด์อัปเดตอัตโนมัติประมาณสัปดาห์ละครั้งเมื่อมีอินเทอร์เน็ต.
> 4. **Privacy policy page** (site `privacy.html`, policy date 2026-11-04) again describes Google sign-in (Firebase Authentication: name, email, account id), account deletion, and the brand-data files `data/meta.json` + `data/brands.json`; the Play privacy URL stays the same.
> 5. **Firebase / Google Auth (section 0) is required again.** `google-services.json` (backup `/home/box/secrets/aafranchise/google-services.json`, git-ignored) is back in the build. It currently registers only the **debug** SHA-1 `8D:9A:20:1F:...:8A:BD`. Before testers can sign in on a Play/upload-signed build, register in Firebase `aa-franchise` > Project settings > com.motoraa.aafranchise: **upload key SHA-1 `6D:CD:66:C1:07:52:A8:F8:DB:DF:C7:3F:A0:63:6F:DF:F4:FE:CB:39`**, **SHA-256 `8D:59:98:8F:8A:3E:42:76:F5:E0:3C:43:D7:00:DC:1E:32:FF:D8:0A:EE:01:10:D1:2E:01:44:0E:4D:84:A9:FE`**, and, after the first upload of this patch, the **Play App Signing** SHA-1/SHA-256 (Play Console > App signing). Then re-download `google-services.json` and rebuild if the file changes. Google Auth Audience must be "In production".
> 6. **Update popup:** after the 0.1.8 build is installable from Play, raise `latestVersionCode` in the site's `docs/app/version.json` (`src/app/version.json`) to **9** (currently **6**; intentionally NOT changed yet).
> 7. **Weekly remote brand-data refresh is included in 0.1.8** (as in the withdrawn 0.1.7): the app reads `https://motoraathailand.github.io/aafranchise-site/data/meta.json` and, when newer, `.../data/brands.json` (public static files from GitHub Pages, at most once a day, no personal data sent). Data safety answers stay the same. The 0.1.8 build already bundles brand data v20261104 (698 brands); refreshed weekly by the site repo's GitHub Actions workflow `Weekly brand data refresh` (no bot needed). If the patch is built later, first copy the live `data/brands.json` into `web/data/brands.json`. Manual fallback: `bash scripts/weekly-refresh.sh` (~30 min).
> 8. **AI ask (BYOK) is unchanged:** the user's own Gemini/Groq/OpenRouter key is stored only on the phone (Android Keystore) and is sent only to the AI provider; signing in does not sync or upload the key.

App **AA Franchise – เปิดร้านดี** · package `com.motoraa.aafranchise` · release **0.1.5 (versionCode 6)**, no-ads closed-test flavor · prepared Mon 2 Nov 2026 (Asia/Bangkok) · **nothing has been uploaded to Play yet; no Play Console step has been done.**

**For the browser operator.** Every code block is copy-paste exact. Order follows `/workspace/shared/tester-funnel.md` "Play Console order" and the AA Calc sheet. Never write a password into any file or chat; credentials only from the vault.

**Accounts.** Play Console: developer account **motoraathailand** (operator name Pornnarai Tananchai). Review-access account for Play reviewers: **motor00thailand** (a Google account that can sign in to the app, see 2.2). Do not use any other account.

## 0. Before you start: two things only the owner/operator can do (Google sign-in is required in this app)
1. **Firebase project `aa-franchise` > Project settings > Your apps > com.motoraa.aafranchise > Add fingerprint.** Add these SHA-1/SHA-256 (currently only the debug key is registered, so sign-in will fail on the signed release APK/AAB build until you add them):
   - Upload key (this build, also the signed release APK on Drive): SHA-1 `6D:CD:66:C1:07:52:A8:F8:DB:DF:C7:3F:A0:63:6F:DF:F4:FE:CB:39`; SHA-256 `8D:59:98:8F:8A:3E:42:76:F5:E0:3C:43:D7:00:DC:1E:32:FF:D8:0A:EE:01:10:D1:2E:01:44:0E:4D:84:A9:FE`
   - **Play App Signing key:** appears only after the first upload: Play Console > Test and release > Setup > App signing > "App signing key certificate" SHA-1 and SHA-256. Add both to Firebase the same day (this is the key testers who install from Play actually get). Then download the new `google-services.json`; if sign-in still fails on a Play-installed build, replace `/workspace/fr/android/app/google-services.json` (and the backup in `/home/box/secrets/aafranchise/`) and ship a new build with a higher versionCode.
2. **Google Cloud console (project aa-franchise) > Google Auth platform > Audience:** publishing status must be **In production** (basic scopes only: name, email, profile; no verification needed). If it says "Testing", only listed test users can sign in and every tester outside the list would be blocked; in that case at least add `motor00thailand@gmail.com` as a test user and publish before sharing the join page. This could not be checked from the box (no console access).

## Files you need
| What | Path |
|---|---|
| Upload bundle (AAB, signed with the new AA Franchise upload key) | `/workspace/fr/dist/aafranchise-0.1.5-6-noads-release.aab` (sha256 `9d1021cfbbdfb829bc58477ae692553d711af3b245441fe4a2d4e92a40bf85df`) |
| Signed release APK for sideload tests (not for Play) | `/workspace/fr/dist/aafranchise-0.1.5-6-noads-release-upload-signed.apk` (sha256 `0c3666dd468376d2ead4fa1368a2eaaf61be06a6793fa9825aff8eeaaa40957d`; on Drive, link in the report) |
| App icon 512x512 (32-bit PNG) | `/workspace/fr/dist/play/icon-512.png` |
| Feature graphic 1024x500 | `/workspace/fr/dist/play/th/feature-graphic.png`, `/workspace/fr/dist/play/en-US/feature-graphic.png` |
| Phone screenshots 1080x1920 (7 per language) | `/workspace/fr/dist/play/th/screenshots/01..07-*.png`, `/workspace/fr/dist/play/en-US/screenshots/` |
| Listing text (also `listing.txt` in each locale folder) | `/workspace/fr/docs/store-listing.md` |
| Release notes block | `/workspace/fr/dist/play/release-notes.txt` |
| Promo video (Thai, 1080x1920, 25 s; optional YouTube) | `/workspace/fr/dist/promo/aafranchise-promo-th.mp4` |
| Upload keystore + passwords (never print) | `/workspace/fr/keystore/` and backup `/home/box/secrets/aafranchise/` (mode 600) |

Facts for the answers: Google sign-in required (Firebase Authentication, name + email + user id); no analytics or crash SDK; **the closed-test AAB contains no ad code** (checked: no AdMob classes, no AD_ID permission, no ad ids). Permissions in the APK: INTERNET, ACCESS_NETWORK_STATE (+ Google/Firebase internals READ_GSERVICES, DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION). Franchise data (697 brands) is bundled in the app (from ThaiFranchiseCenter public pages). Optional AI chat uses the user's own Gemini/Groq/OpenRouter key, stored only on the phone. Account can be deleted in-app (Settings) and via https://motoraathailand.github.io/aafranchise-site/delete.html.

## 1. Create app (Console > All apps > Create app)
| Field | Value |
|---|---|
| App name | `AA Franchise – เปิดร้านดี` |
| Default language | **Thai – th** |
| App or game | **App** |
| Free or paid | **Free** (cannot be changed later) |
| Declarations | tick *Developer Program Policies* and *US export laws* |
Create app. Copy the numeric app id from the URL into HANDOVER notes later.

## 2. App content (Policy and programs > App content)
### 2.1 Privacy policy
```
https://motoraathailand.github.io/aafranchise-site/privacy.html
```
(live, 5 languages, effective 2026-11-02, operator Pornnarai Tananchai, contact motoraathailand@gmail.com)

### 2.2 App access
- Answer: **All or some functionality is restricted** > **Add new instructions**.
- Name: `Google sign-in`
- Username: `motor00thailand@gmail.com` (the review account; its password must come from the vault, never from this file)
- Password: type it from the vault in the Console form only. If Console wants a password field, note that the account uses Google sign-in, so the password is the Google password; if there is any 2-step prompt, reviewers cannot pass it, so confirm that account has no 2-step prompt on new devices or add a note.
- Any other information:
```
The app requires sign-in with a Google account (Google Sign-In button on the first screen, one tap). After signing in, every feature is open: search 697 franchise brands, details, compare, budget finder, guides. The AI chat is optional and needs the reviewer's own AI key (Gemini); everything else works without it. The app is available in Thailand only.
```

### 2.3 Ads
- "Does your app contain ads?" → **No** for this closed-test build (the AAB has no ad SDK). When the ads flavor ships after launch (banner only), change to **Yes** the same day, and redo 2.7 and 2.6. (AA Calc declared Yes for its no-ads test; the owner's instruction for this app is "no ads in this build", so No is the truthful answer.)

### 2.4 Content rating (Start questionnaire)
- Email: `motoraathailand@gmail.com`
- Category: **Utility, Productivity, Communication or Other** (alternative if offered and clearly closer: *Reference, News or Educational*)
| Question | Answer |
|---|---|
| Violence / blood / gore, sexual content, profanity, controlled substances, fear/horror, gambling, discrimination | No to all |
| Users can interact with or exchange content with other users | **No** (AI chat is between the user and an AI provider, not other users) |
| Shares the user's location with other users | **No** |
| Shares personal information with other users | **No** |
| Digital purchases / in-app purchases | **No** |
| Contains ads (if asked) | **No** (this build) |
| Unrestricted internet access or a web browser | **No** (links open in the phone's own browser) |
| Generative AI / chatbot features (if the form asks) | **Yes**: optional AI question-and-answer chat using the user's own API key |
Save and Submit; expect a low age rating.

### 2.5 Target audience and content
- Target age groups: **18 and over** only (franchise investment information). Leave every younger group unticked.
- Appeals to children: **No**. Not a Families app.

### 2.6 Data safety (this build: no ads)
| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all user data encrypted in transit? | **Yes** (HTTPS only) |
| Account creation methods | **OAuth** (Google sign-in) |
| Delete account URL | `https://motoraathailand.github.io/aafranchise-site/delete.html` |
| Do you provide a way to request that data is deleted? | **Yes** (in-app Settings > delete account, plus the URL above) |
| Committed to Play Families Policy | **No** |
| Independent security review | **No** |
Data types to tick (Firebase Authentication / Google sign-in; see https://firebase.google.com/docs/android/play-data-disclosure). For each: **Collected = Yes, Shared = No** (Firebase/Google act as our service provider), **Required**, **Ephemeral = No**, purposes as listed:
| Category > type | Purposes |
|---|---|
| Personal info > **Name** | App functionality; Account management |
| Personal info > **Email address** | App functionality; Account management |
| Personal info > **User IDs** | App functionality; Account management |
| Location > **Approximate location** (IP address Firebase logs for abuse prevention at sign-in) | Fraud prevention, security, and compliance |
**Do not tick:** precise location, contacts, messages, photos, files, financial info, health, web history, device IDs/advertising ID, crash logs/diagnostics (no such SDK in this build), app interactions/analytics. AI chat: the user's question goes to the AI provider the user chose with their own key, started by the user; we do not collect it, and the privacy policy explains it. If the Console reviewer disagrees, add "Messages > Other in-app messages" shared = Yes (user-initiated), purposes App functionality, and update the policy to match.
Preview should say: data collected: personal info (name, email address, user IDs), approximate location; data shared: none; encrypted in transit; users can request deletion. Save + submit. **Keep policy and this form identical.**

### 2.7 Advertising ID
- "Does your app use advertising ID?" → **No** (this build). Switch to Yes (purposes: Advertising or marketing, Analytics, Fraud prevention/security/compliance) together with 2.3 when the ads build ships.

### 2.8 Other declarations
| Form | Answer |
|---|---|
| Government apps | No |
| Financial features | **None of these**. The app shows public franchise cost information only: no payments, loans, investing or trading, and it says it is not financial advice. |
| Health | No health features |
| News apps | No |
| Generative AI (if a card appears) | Yes, optional AI chat; users can send feedback from Menu > Send feedback (confirm this satisfies "report offensive AI output" before launch) |
| Permissions declarations | none needed |

### 2.9 App category and store settings (Grow > Store presence > Store settings)
| Field | Value |
|---|---|
| App category | **Business** (App). Alternative: Education. Tags (up to 5, closest in the list): Business, Entrepreneurship, Reference. |
| Email address (public) | `motoraathailand@gmail.com` |
| Website | `https://motoraathailand.github.io/aafranchise-site/` (the intro page) |
| Phone | empty |
Save.

## 3. Main store listing (Grow > Store presence > Main store listing), default **Thai**
Full copy-paste text with checked counts is in `/workspace/fr/docs/store-listing.md` (Thai title 25, short 64, full 1765; en-US title 30, short 79, full 2060). Add English through *Manage translations > Add your own translations*.
- Icon (once): `/workspace/fr/dist/play/icon-512.png`
- Per language: feature graphic + 7 phone screenshots (paths in store-listing.md; Thai first, in file order).
- Promo video YouTube URL: empty. Tablet/Chromebook/Wear/TV graphics: not needed.
Save after each language.

## 4. Closed testing (Test and release > Testing > Closed testing)
1. **Create track** `Closed test`.
2. **Countries/regions:** **Thailand only** (owner rule: Thailand-only app; also set production to Thailand later).
3. **Testers** tab: add the Google Group **`motoraa-testers@googlegroups.com`** (shared group). Do NOT use an email list. Add the review account `motor00thailand@gmail.com` as an extra tester **only** if you want to test it from Play yourself. Feedback email `motoraathailand@gmail.com`. Save. (Group must be "anyone can join": https://groups.google.com/g/motoraa-testers.)
4. **Releases** tab > **Create new release**:
   - Play App Signing: **Continue** (Google manages the app-signing key; ours is the upload key).
   - **App bundles > Upload** `/workspace/fr/dist/aafranchise-0.1.5-6-noads-release.aab`. Wait for "uploaded".
   - Release name: leave `6 (0.1.5)`.
   - Release notes: paste `/workspace/fr/dist/play/release-notes.txt` exactly (blocks `<th>` and `<en-US>`; each under 500 chars).
   - Next, fix red errors; warnings (e.g. no native debug symbols) may be ignored.
5. **Save > Publishing overview > Send N changes for review** (Managed publishing off). Result mails to motoraathailand@gmail.com.
6. **Same day, after upload:** App signing page > copy the App signing key SHA-1 and SHA-256 > add both to Firebase `aa-franchise` (section 0.1). Without this, sign-in fails for testers who install from Play.

## 5. After you press send (owner/bot, not the operator)
- When Console shows the test as available (Closed testing > Testers > *Copy link*; should be `https://play.google.com/apps/testing/com.motoraa.aafranchise`): set `"optInLive": true` in `/workspace/aafranchise-site/config/site.json`, run `node scripts/build.mjs`, `node tests/site.test.mjs`, then commit and push to `main`. Steps 3-4 on the join page unlock.
- `latestVersionCode` in https://motoraathailand.github.io/aafranchise-site/app/version.json is already **6** (0.1.5 is the first Play build, so no update popup). Raise it only after a newer build is installable from Play; add notices there to broadcast to testers (no app update needed).
- Production needs **12 testers opted in for 14 days**. Share the join page https://motoraathailand.github.io/aafranchise-site/join.html (shared group first). Facebook recruiting posts (Thai) are separate and need the owner's approval.
- For launch: build the **ads** flavor (`node scripts/build-app.mjs ads`, banner only), set 2.3 and 2.7 to Yes, update 2.6 (Device or other IDs, Approximate location, App interactions, Crash logs, Diagnostics as in the AA Calc sheet), and update the listing line "Free" to mention banner ads.

## 6. Pre-flight checklist
- [ ] Firebase: upload SHA-1/SHA-256 added; OAuth audience = In production (section 0)
- [ ] Logged in as motoraathailand; app name `AA Franchise – เปิดร้านดี`; Thai default; App; Free
- [ ] Privacy URL saved; App access = Google sign-in instructions with review account; Ads = No; Content rating submitted; Target age 18+; Data safety saved incl. delete URL; Advertising ID = No; Government No; Financial none; Health none; Category Business + contact + website
- [ ] Thai + English listings (title/short/full, icon, feature graphic, 7 screenshots each)
- [ ] Closed track: **Thailand only**, group `motoraa-testers@googlegroups.com`, AAB 0.1.5 (6), release notes th + en-US, sent for review
- [ ] After upload: Play App Signing SHA-1/SHA-256 added to Firebase
- [ ] Nothing posted to social media, no tester messaged by the operator
