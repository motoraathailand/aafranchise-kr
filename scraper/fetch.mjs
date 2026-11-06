import { collectOfficial } from './api-catalog.mjs';
try { await collectOfficial(); }
catch(e){console.error(e.message);if(process.env.DATA_GO_KR_REQUIRED==='1')process.exitCode=1;}
