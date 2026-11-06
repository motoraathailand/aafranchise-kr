// 패키지 이름 변경(Play 업로드 전에만!): node scripts/set-package.mjs com.motoraa.새이름
// brand.json · android/app/build.gradle(namespace/applicationId) · 자바 패키지 폴더/선언 · capacitor.config.json 을 함께 바꾸고 brand 를 다시 적용.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, renameSync, rmSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const next = process.argv[2];
if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(next || '')) { console.error('usage: node scripts/set-package.mjs com.company.app'); process.exit(1); }
const brandPath = join(root, 'brand.json'); const brand = JSON.parse(readFileSync(brandPath, 'utf8')); const prev = brand.packageId;
if (prev === next) { console.log('already', next); process.exit(0); }
brand.packageId = next; writeFileSync(brandPath, JSON.stringify(brand, null, 2) + '\n');
const gradle = join(root, 'android/app/build.gradle');
writeFileSync(gradle, readFileSync(gradle, 'utf8').replaceAll(`"${prev}"`, `"${next}"`));
const javaRoot = join(root, 'android/app/src/main/java'); const from = join(javaRoot, ...prev.split('.')); const to = join(javaRoot, ...next.split('.'));
mkdirSync(to, { recursive: true });
for (const f of readdirSync(from)) { const s = readFileSync(join(from, f), 'utf8').replaceAll(`package ${prev};`, `package ${next};`).replaceAll(`${prev}.`, `${next}.`); writeFileSync(join(to, f), s); }
rmSync(from, { recursive: true, force: true });
// 빈 상위 폴더 정리
let d = dirname(from); while (d.startsWith(javaRoot) && d !== javaRoot && readdirSync(d).length === 0) { rmSync(d, { recursive: true }); d = dirname(d); }
const manifest = join(root, 'android/app/src/main/AndroidManifest.xml'); writeFileSync(manifest, readFileSync(manifest, 'utf8').replaceAll(prev, next));
execSync('node scripts/apply-brand.mjs', { cwd: root, stdio: 'inherit' });
console.log(`package: ${prev} -> ${next}\nGoogle OAuth Android 클라이언트·AdMob 앱·Play 앱을 새 패키지로 다시 만들어야 합니다(HANDOVER.md).`);
