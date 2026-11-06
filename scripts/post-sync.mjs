// `cap sync android` 직후 실행. AdMob 플러그인이 "ads" 변형에서만 존재하게 함(AA 공통 규칙: 정식 출시 전에는 광고 0).
//  - capacitor.build.gradle: implementation project(':capacitor-community-admob') → adsImplementation (cap sync 가 매번 다시 만들기 때문에 매번 고침)
//  - noads: capacitor.plugins.json 에서 AdMob 항목 제거
import fs from 'node:fs'; import path from 'node:path';
const variant = (process.argv[2] || 'noads').toLowerCase();
const app = path.resolve(import.meta.dirname, '..', 'android/app');
const g = path.join(app, 'capacitor.build.gradle'); let t = fs.readFileSync(g, 'utf8');
t = t.replace(/^(\s*)implementation project\(':capacitor-community-admob'\)/m, "$1adsImplementation project(':capacitor-community-admob')");
fs.writeFileSync(g, t);
const pj = path.join(app, 'src/main/assets/capacitor.plugins.json'); const plugins = JSON.parse(fs.readFileSync(pj, 'utf8'));
const out = variant === 'noads' ? plugins.filter((p) => !/admob/i.test(p.pkg + p.classpath)) : plugins;
fs.writeFileSync(pj, JSON.stringify(out, null, '\t') + '\n');
console.log(`post-sync (${variant}): admob only as adsImplementation; plugins.json has ${out.length} plugins${variant === 'noads' ? ' (AdMob removed)' : ''}`);
