import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { decodeEntities, decodeCatalog } from '../web/text-entities.js';
import { decodeEntities as collect, decodeTextDeep } from '../scraper/text-entities.mjs';
import { clean } from '../scraper/lib.mjs';
test('named and numeric entities decode in collector and deep objects { a:[value] }', () => {
 const value = "1&#39;s &middot; Bistro &amp; café &rsquo;arte&rsquo;";
 assert.equal(collect(value), "1's · Bistro & café ’arte’");
 assert.equal(decodeTextDeep({ a: [value] }).a[0], "1's · Bistro & café ’arte’");
 assert.equal(decodeEntities("&#x2019; &#39; &middot;"), "’ ' ·");
 assert.equal(decodeEntities('A&R cafe &unknown;'), 'A&R cafe &unknown;');
 assert.equal(decodeEntities('&lt;script&gt;alert(1)&lt;/script&gt;'), '<script>alert(1)</script>');
 assert.equal(decodeEntities('&#0; &#x110000;'), '&#0; &#x110000;');
});
test('raw HTML parsing keeps all supported entity types clean',()=>assert.equal(clean("1&#39;s&middot;&rsquo;"),"1's·’"));
test('deep display indexing decodes text but not IDs', () => {
 const result = decodeCatalog({ meta:{}, brands:[{id:'kr20210309',name:{ko:'1&#39;s 카츠곳간'},category:{ko:'돈&middot;가스'}}] });
 assert.equal(result.brands[0].id,'kr20210309');assert.equal(result.brands[0].name.ko,"1's 카츠곳간");assert.equal(result.brands[0].category.ko,'돈·가스');
});
test('catalogue has no entities in any text field', () => {
 const root = JSON.parse(fs.readFileSync('web/data/brands.json'));
 const re=/&(?:#(?:\d+|x[\da-f]+)|[a-z][\da-z]+);/i;
 const walk=(v)=>{if(typeof v==='string')assert.equal(re.test(v),false,v);else if(v&&typeof v==='object')for(const x of Object.values(v))walk(x);};walk(root);
 assert.equal(root.brands.find(b=>b.id==='kr20210309').name.ko,"1's 카츠곳간");
});
test('report flow has actual local hiding boundary and a matching icon per response',()=>{
 const ai=fs.readFileSync('web/screens-ai.js','utf8'),store=fs.readFileSync('web/store.js','utf8');
 assert.match(ai,/icon: 'flag', label: t\('aiReport'\)/);assert.match(ai,/native\.openExternal\(mailto\)/);
 assert.match(ai,/msg\.text/);assert.match(ai,/ctx\.versionLabel\(\)/);assert.match(store,/S\.chat\.splice\(i, 1\)/);
 assert.doesNotMatch(store,/fetch\(|XMLHttpRequest|navigator\.sendBeacon/);
});

test('old text-only cache is superseded by minor force catalog; hidden state survives reload', async () => {
  const storage=new Map(); globalThis.localStorage={getItem:(k)=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:(k)=>storage.delete(k)};
  const S=await import('../web/store.js'); S.load(); S.pushChat({role:'user',text:'keep user'}); S.pushChat({role:'bot',text:'hide me'}); S.pushChat({role:'bot',text:'keep answer'});
  assert.equal(S.hideChat(0),false); assert.equal(S.hideChat(999),false); assert.equal(S.hideChat(1),true);
  S.load(); assert.deepEqual(S.chat().map(m=>m.text),['keep user','keep answer']);
  const D=await import('../web/data.js'); const b=await (await import('node:fs/promises')).readFile('web/data/brands.json','utf8');const bundled=JSON.parse(b);const old=structuredClone(bundled);bundled.meta.version=2026110701;old.meta.version=20261107;old.brands[0].name.ko='Coffee &amp; Tea';
  storage.set('frkr.data.remote',JSON.stringify(old));await D.load(async()=>({ok:true,json:async()=>bundled}));assert.equal(D.source(),'bundled');assert.equal(D.meta().version,bundled.meta.version);
  const displayed=structuredClone(bundled);displayed.meta.version=2026110702;displayed.brands[0].name.ko='Coffee &amp; Tea';storage.set('frkr.data.remote',JSON.stringify(displayed));
  await D.load(async()=>({ok:true,json:async()=>bundled}));assert.equal(D.source(),'remote');assert.equal(D.all()[0].name.ko,'Coffee & Tea');
});
