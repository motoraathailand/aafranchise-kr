import fs from 'node:fs';
import { LIST, parseBrandList, politeFetch } from './lib.mjs';
const limit=Number(process.env.FTC_LIMIT||300);
const html=await politeFetch(`${LIST}?pageUnit=${limit}&pageIndex=1`,{cache:'data/cache',...(process.argv.includes('--refresh')||process.env.FTC_FORCE==='1'?{}:{})});
const rows=parseBrandList(html);if(rows.length<Math.min(limit,100))throw new Error(`KFTC returned only ${rows.length} usable rows`);
fs.mkdirSync('data/cache',{recursive:true});fs.writeFileSync('data/cache/latest-list.html',html);
fs.writeFileSync('data/cache/listing-meta.json',JSON.stringify({fetchedAt:new Date().toISOString(),listedAt:new Date().toISOString().slice(0,10)}));
console.log(`KFTC public catalog: ${rows.length} rows cached; unknown fee fields omitted.`);
