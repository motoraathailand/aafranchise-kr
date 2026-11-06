// web/ → www/ 복사 후 `npx cap sync android` + post-sync (번들형 UI: APK 안에 화면이 들어감, 서버 URL 로드 없음).
//  사용: node scripts/build-app.mjs [noads|ads] [--no-sync]
//   noads (기본) : 개발·내부·비공개 테스트용. 광고 코드가 하나도 없음 — ads.js 는 아무것도 안 하는 스텁, ads-bridge.js·admob-config.js 는 번들에서 제외.
//   ads          : 정식 출시 후 공개 빌드(배너 전용). 광고 설정은 web/admob-config.js 한 곳.
import { cpSync, rmSync, mkdirSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const variant = process.argv.includes('ads') ? 'ads' : 'noads';
execSync('node scripts/apply-brand.mjs', { cwd: root, stdio: 'inherit' }); // brand.json → web/brand.js, capacitor.config.json, 안드로이드 이름
const www = join(root, 'www');
rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });
cpSync(join(root, 'web'), www, { recursive: true });
if (!existsSync(join(www, 'index.html'))) throw new Error('web/index.html missing');
// 공통 motion 파일은 /workspace/shared/motion 과 바이트 동일해야 함(있을 때만 확인)
for (const f of ['motion.css', 'motion.js']) {
  const shared = join('/workspace/shared/motion', f);
  if (existsSync(shared) && !readFileSync(shared).equals(readFileSync(join(www, f)))) throw new Error(f + ' differs from /workspace/shared/motion/' + f);
}
if (variant === 'noads') {
  cpSync(join(root, 'scripts/ads-stub.js'), join(www, 'ads.js'));
  rmSync(join(www, 'ads-bridge.js'), { force: true }); rmSync(join(www, 'admob-config.js'), { force: true });
  const left = readdirSync(www).filter((f) => f.endsWith('.js')).filter((f) => /admob|gms\.ads/i.test(readFileSync(join(www, f), 'utf8')));
  if (left.length) throw new Error('noads bundle still mentions AdMob in: ' + left.join(', '));
}
{ // Google 로그인 설정 여부(google-services.json 존재)를 번들에 기록
  const gs = join(root, 'android/app/google-services.json'); const on = existsSync(gs) && readFileSync(gs, 'utf8').trim().length > 2;
  const cf = join(www, 'config.js'); writeFileSync(cf, readFileSync(cf, 'utf8').replace('configured: false', `configured: ${on}`)); console.log('auth.configured =', on);
}
writeFileSync(join(www, 'build-variant.txt'), variant + '\n');
console.log(`variant=${variant}; copied web/ -> www/ (${readdirSync(www).length} entries)`);
if (!process.argv.includes('--no-sync')) {
  execSync('npx cap sync android', { cwd: root, stdio: 'inherit' });
  execSync(`node scripts/post-sync.mjs ${variant}`, { cwd: root, stdio: 'inherit' });
}
