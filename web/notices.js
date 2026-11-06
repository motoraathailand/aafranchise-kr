// 공지사항: 앱 서버가 없으므로 기본은 앱 안의 환영 공지. CONFIG.remoteConfigUrl(정적 JSON, 예: GitHub Pages)이 있으면 그 notices 를 우선 사용 — 앱 업데이트 없이 공지 가능.
import { CONFIG } from './config.js';
export const BUILTIN = [
  {
    "id": "welcome-1",
    "at": "2026-11-06",
    "title": {
      "th": "ยินดีต้อนรับ",
      "en": "Welcome",
      "ko": "환영해요",
      "zh": "欢迎",
      "hi": "स्वागत है"
    },
    "body": {
      "th": "แอปค้นหาแฟรนไชส์ในเกาหลี ข้อมูลจากรายการเปิดเผยของ KFTC ยืนยันรายละเอียดล่าสุดกับแบรนด์ก่อนลงทุน",
      "en": "This is the Korean franchise guide. It preserves verified KFTC public listing fields and their dates. Confirm current figures and contracts with the brand before investing.",
      "ko": "한국 프랜차이즈 가이드예요. 공정위 공개 목록에서 확인한 항목과 날짜를 보존해요. 최신 비용·계약은 투자 전 본사에 확인하세요.",
      "zh": "这是韩国特许经营指南，保留韩国公平交易委员会公开列表中可核实的字段及日期。投资前请与品牌确认当前费用和合同。",
      "hi": "यह कोरियाई फ्रेंचाइज़ गाइड है। KFTC सूची के सत्यापित फ़ील्ड और तिथि सुरक्षित हैं। निवेश से पहले ब्रांड से वर्तमान शुल्क और अनुबंध की पुष्टि करें।"
    }
  }
];
let cache = null, remote = null;
export async function loadRemote(fetchFn = globalThis.fetch && globalThis.fetch.bind(globalThis)) {
  if (remote !== null) return remote;
  remote = {};
  const url = CONFIG.remoteConfigUrl; if (!url || !/^https:\/\//.test(url) || !fetchFn) return remote;
  try {
    const ctrl = new AbortController(); const tm = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetchFn(url, { cache: 'no-store', signal: ctrl.signal }); clearTimeout(tm);
    if (r.ok) { const j = await r.json(); if (j && typeof j === 'object') remote = j; }
  } catch {}
  return remote;
}
export async function load(fetchFn) {
  if (cache) return cache;
  const j = await loadRemote(fetchFn);
  const list = Array.isArray(j.notices) ? j.notices.filter((n) => n && n.id && n.title && n.body) : [];
  cache = list.length ? list : BUILTIN; return cache;
}
export const pick = (obj, lang) => (obj && (obj[lang] || obj.en || obj.th)) || '';
export const latestId = (list) => (list && list[0] ? String(list[0].id) : '');
