// brand.json → web/brand.js, capacitor.config.json(appName), Android 런처 이름(res/values*/strings.xml). 이름을 바꿀 때 brand.json 한 곳만 고치면 됨.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const brand = JSON.parse(readFileSync(join(root, 'brand.json'), 'utf8'));
const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/'/g, "\\'");
writeFileSync(join(root, 'web/brand.js'), `// 자동 생성(scripts/apply-brand.mjs) — brand.json 을 고치세요.\nexport const BRAND = ${JSON.stringify({ names: brand.names, packageId: brand.packageId, mainColor: brand.mainColor, nameStatus: brand.nameStatus, packageStatus: brand.packageStatus }, null, 2)};\n`);
const cap = JSON.parse(readFileSync(join(root, 'capacitor.config.json'), 'utf8'));
cap.appId = brand.packageId; cap.appName = brand.names.en; writeFileSync(join(root, 'capacitor.config.json'), JSON.stringify(cap, null, 2) + '\n');
const res = join(root, 'android/app/src/main/res');
for (const [lang, dir] of [['en', 'values'], ['th', 'values-th'], ['ko', 'values-ko'], ['zh', 'values-zh'], ['hi', 'values-hi']]) {
  mkdirSync(join(res, dir), { recursive: true });
  const n = xmlEsc(brand.names[lang]);
  const extra = lang === 'en' ? `    <string name="package_name">${brand.packageId}</string>\n    <string name="custom_url_scheme">${brand.packageId}</string>\n` : '';
  writeFileSync(join(res, dir, 'strings.xml'), `<?xml version='1.0' encoding='utf-8'?>\n<resources>\n    <string name="app_name">${n}</string>\n    <string name="title_activity_main">${n}</string>\n${extra}</resources>\n`);
}
console.log('brand applied:', brand.names.en, brand.packageId);
