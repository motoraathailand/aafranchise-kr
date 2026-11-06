// 0.1.0: Google 로그인(Firebase Authentication) 복원 확인 — 소스·문자열·빌드 설정.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path';
import { RAW, ORDER } from '../web/i18n.js';
import { CONFIG } from '../web/config.js';
const root = path.resolve(import.meta.dirname, '..'); const rd = (p) => fs.readFileSync(path.join(root, p), 'utf8');
test('auth module + login i18n keys exist in all 5 languages', () => {
  assert.ok(fs.existsSync(path.join(root, 'web/auth.js')));
  for (const k of ['loginSub', 'loginBtn', 'loginWait', 'loginCancelled', 'loginNetwork', 'loginNotReady', 'loginFail', 'loginWhy', 'account', 'signOut', 'signOutBody', 'deleteAccount', 'deleteAccountBody', 'accountDeleted']) assert.equal(RAW[k].length, ORDER.length, k);
  assert.equal(CONFIG.auth.required, true);
});
test('login gate wired in app.js, settings has account + sign-out + delete', () => {
  const a = rd('web/app.js'); assert.match(a, /import \* as auth from '\.\/auth\.js'/); assert.match(a, /'login'/); assert.match(a, /afterLogin/);
  const s = rd('web/screens-settings.js'); for (const x of ['signout', 'delacct']) assert.ok(s.includes(x), x);
});
test('AI keys stay on device: auth.js and data.js never touch secure keys; no key is sent anywhere but providers', () => {
  assert.ok(!/secure|apiKey|getKey/.test(rd('web/auth.js')));
  assert.ok(!/localStorage\.setItem\('fr\.key|secure\./.test(rd('web/data.js')));
});
test('Firebase auth plugin + google-services wired in the Android build; version 0.1.0 / 1', () => {
  const pkg = JSON.parse(rd('package.json')); assert.ok(pkg.dependencies['@capacitor-firebase/authentication']); assert.equal(pkg.version, '0.1.0');
  assert.match(rd('android/build.gradle'), /com\.google\.gms:google-services/); assert.match(rd('android/app/build.gradle'), /com\.google\.gms\.google-services/);
  assert.match(rd('android/app/capacitor.build.gradle'), /capacitor-firebase-authentication/); assert.match(rd('capacitor.config.json'), /FirebaseAuthentication/);
  assert.match(rd('android/app/build.gradle'), /versionCode 1\s/); assert.match(rd('android/app/build.gradle'), /versionName "0\.1\.0"/);
});
test('remote data refresh kept', () => { assert.match(CONFIG.dataUrl, /brands\.json$/); assert.match(CONFIG.dataMetaUrl, /meta\.json$/); assert.match(rd('web/app.js'), /refreshRemote/); });
