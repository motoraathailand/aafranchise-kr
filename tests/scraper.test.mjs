import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {parseBrandList, krwFromThousand, groupFor} from '../scraper/lib.mjs';
const rows=parseBrandList(fs.readFileSync('data/brand-list-300-full.html','utf8'));
test('official KFTC rows retain identifiers/category/company/registration, not private representative names',()=>{assert.ok(rows.length>=300);assert.equal(rows[4].nameKo,'메가엠지씨커피(MEGA MGC COFFEE)');assert.equal(rows[4].registrationNo,'20160628');assert.equal(rows[4].categoryKo,'커피');assert.equal(rows[4].firstRegisteredAt,'2016-07-13');});
test('money conversion contracts — thousand KRW to KRW exactly',()=>{assert.equal(krwFromThousand('1,250'),1250000);assert.equal(krwFromThousand('text'),null);});
for(const [n,c]of[['커피','beverage'],['한식','food'],['교육 (외국어)','education'],['편의점','store'],['이미용','beauty'],['세탁','service']])test('group '+n,()=>assert.equal(groupFor(n),c));

test('registration 20170517 spelling uses brand-official corroboration, no guesses',()=>{const b=parseBrandList('<table><tr><td>1</td><td>(주)에스에스피씨</td><td>??돈까스</td><td></td><td>20170517</td><td>2017.04.17</td><td>서양식</td></tr></table>');const x=SmakeBrand(b[0]);assert.equal(x.name.ko,'쑝쑝돈까스');assert.equal(x.sources[1].url,'https://sspc.co.kr/menu');});
