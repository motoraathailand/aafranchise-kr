// AI 채팅의 "먼저 걸러서(filter-first) 근거를 붙이는" 부분 + 프롬프트 + 호출. 서버 없음: 기기에서 공급자를 직접 호출(키는 secure.js).
// 순서: ① 질문에서 예산·업종·브랜드 이름을 뽑음 ② 로컬 brands.json 에서 후보 ≤12개로 좁힘 ③ 그 후보(+관련 절차 카드)만 컨텍스트로 AI 에 전달 ④ 답에서 [id] 를 뽑아 상세 링크로.
import * as D from './data.js';
import { GUIDES, guideText } from './guides.js';
import { runChain, callModel, AiFailure, ProviderError } from './providers.js';
import { LIMITS } from './models.js';

const norm = (s) => String(s || '').toLowerCase().normalize('NFKC').replace(/[\s\-_.'’"]+/g, '');

// ---- 예산 추출: ₩50,000,000 / 5,000만원 / 1억원 ----
// Number × Korean/Chinese/Thai/English unit. Compound Korean units win over 천 alone.
const UNIT = { '천만': 1e7, '억만': 1e12, '만': 1e4, '억': 1e8, '천': 1e3, '万': 1e4, '亿': 1e8, '千': 1e3, k: 1e3, thousand: 1e3, m: 1e6, mn: 1e6, million: 1e6, 'พัน': 1e3, 'หมื่น': 1e4, 'แสน': 1e5, 'ล้าน': 1e6 };
export function parseBudget(text) {
  const s = String(text || '').toLowerCase().replace(/(\d),(?=\d{3}\b)/g, '$1');
  const money = /(krw|won|원|₩|韩元|वॉन|预算|बजट|budget|งบ|예산|invest|ลงทุน|투자|under|below|within|ไม่เกิน|이하|미만|ภายใน|around|about|ประมาณ|약)/.test(s);
  const re = /(\d+(?:\.\d+)?)\s*(thousand|million|mn|k|m|천만|억만|천|만|억|万|亿|千|พัน|หมื่น|แสน|ล้าน)?(?![a-z])/g;
  let m; const found = [];
  while ((m = re.exec(s))) {
    let n = parseFloat(m[1]); const u = m[2];
    if (u) n *= UNIT[u]; else if (!money || n < 1000) continue;
    if (n >= 1000 && n <= 5e8) found.push(Math.round(n));
  }
  return found.length ? found[0] : null;
}
const GROUP_WORDS = {
  food: ['food', 'restaurant', 'noodle', 'steak', 'snack', 'bakery', 'อาหาร', 'ร้านอาหาร', 'ก๋วยเตี๋ยว', 'ปิ้งย่าง', 'ขนม', 'เบเกอรี่', '음식', '식당', '요리', '푸드', '국수', '餐', '美食', '面', 'खाना', 'रेस्तरां'],
  beverage: ['beverage', 'drink', 'coffee', 'cafe', 'café', 'tea', 'bubble', 'juice', 'เครื่องดื่ม', 'กาแฟ', 'ชา', 'น้ำ', '음료', '커피', '카페', '차', '饮', '咖啡', '茶', 'पेय', 'कॉफ़ी', 'चाय'],
  education: ['education', 'tutor', 'school', 'course', 'kids', 'การศึกษา', 'กวดวิชา', 'โรงเรียน', 'เรียน', '교육', '학원', '어린이', '教育', '培训', '儿童', 'शिक्षा', 'कोचिंग'],
  service: ['service', 'laundry', 'cleaning', 'repair', 'car', 'logistic', 'บริการ', 'ซัก', 'ล้างรถ', 'ซ่อม', '서비스', '세탁', '세차', '服务', '洗衣', '洗车', 'सेवा', 'लॉन्ड्री'],
  store: ['store', 'retail', 'shop', 'convenience', 'mart', 'ร้านค้า', 'ค้าปลีก', 'สะดวกซื้อ', '소매', '편의점', '매장', '상점', '零售', '便利店', '商店', 'खुदरा', 'दुकान'],
  beauty: ['beauty', 'spa', 'salon', 'nail', 'massage', 'hair', 'ความงาม', 'สปา', 'ทำผม', 'นวด', 'เสริมสวย', '미용', '뷰티', '마사지', '네일', '美容', '美甲', '按摩', 'ब्यूटी', 'स्पा'],
};
export function detectGroups(text) { const s = String(text || '').toLowerCase(); return Object.entries(GROUP_WORDS).filter(([, ws]) => ws.some((w) => s.includes(w))).map(([g]) => g); }
const CHEAP = ['cheap', 'cheapest', 'low cost', 'lowest', 'affordable', 'small', 'ถูก', 'ต้นทุนต่ำ', 'ลงทุนน้อย', '저렴', '싼', '적은', '소자본', '便宜', '低成本', '小本', 'सस्ता', 'कम लागत'];
export const wantsCheap = (text) => { const s = String(text || '').toLowerCase(); return CHEAP.some((w) => s.includes(w)); };
export function matchGuides(text, max = 3) {
  const s = String(text || '').toLowerCase();
  const scored = GUIDES.map((g) => ({ g, n: g.tags.filter((t) => s.includes(t.toLowerCase())).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
  return scored.slice(0, max).map((x) => x.g);
}
export function mentionedBrands(text) {
  const q = norm(text); if (q.length < 2) return [];
  const out = [];
  for (const b of D.all()) {
    for (const n of [b.name.ko, b.name.en]) { const k = norm(n); if (k.length >= 3 && q.includes(k)) { out.push(b); break; } }
    if (out.length >= 6) break;
  }
  return out;
}

// ---- 후보 좁히기 ----
export function retrieve({ question, history = [], ctxBrandId = null, max = LIMITS.maxBrandsInContext }) {
  const recentText = [...history.filter((h) => h.role === 'user').slice(-2).map((h) => h.text), question].join(' \n ');
  const budget = parseBudget(question) ?? parseBudget(recentText);
  const groups = detectGroups(question).length ? detectGroups(question) : detectGroups(recentText);
  const named = mentionedBrands(question);
  const ctx = ctxBrandId ? D.byId(ctxBrandId) : null;
  const cheap = wantsCheap(question);
  let pool = D.all();
  if (groups.length) pool = pool.filter((b) => groups.includes(b.group));
  if (budget) pool = pool.filter((b) => { const c = D.entryCost(b); return c != null && c <= budget; });
  // 정렬: 저렴 요청이면 싼 순, 아니면 지점 수(검증된 규모) → 예산 안에서 높은 금액
  pool = [...pool].sort((a, b) => cheap ? (D.entryCost(a) - D.entryCost(b)) : ((b.branches ?? -1) - (a.branches ?? -1)) || ((D.entryCost(b) ?? 0) - (D.entryCost(a) ?? 0)));
  const picked = []; const seen = new Set();
  const add = (b) => { if (b && !seen.has(b.id) && picked.length < max) { seen.add(b.id); picked.push(b); } };
  if (ctx) add(ctx); named.forEach(add);
  const anySignal = !!(groups.length || budget || named.length || ctx || cheap);
  if (anySignal) pool.forEach(add);
  return { brands: picked, budget, groups, named: named.map((b) => b.id), cheap, guides: matchGuides(question), signal: anySignal, poolSize: pool.length };
}

// ---- 컨텍스트 직렬화(짧게) ----
const money = (r) => (r && r.min != null ? (r.max != null && r.max !== r.min ? `${r.min}-${r.max}` : `${r.min}`) : null);
const pct = (f) => (!f ? null : f.none ? 'none' : f.pct != null ? `${f.pct}${f.pctMax ? '-' + f.pctMax : ''}%${f.per ? '/' + f.per : ''}` : (f.raw || null));
export function brandRow(b) {
  const parts = [`[${b.id}] ${b.name.en || b.name.ko}${b.name.ko && b.name.en ? ' / ' + b.name.ko : ''}`, `group=${b.group}`, b.category && b.category.ko ? `type=${b.category.ko}` : null];
  const f = (k, v) => (v == null || v === '' ? null : `${k}=${v}`);
  parts.push(f('franchise_fee_KRW', money(b.franchiseFee)), f('total_investment_KRW', money(b.totalInvestment)), f('working_capital_KRW', b.workingCapital && b.workingCapital.min != null ? money(b.workingCapital) + (b.workingCapital.per ? '/' + b.workingCapital.per : '') : null),
    f('royalty', pct(b.royalty)), f('marketing_fee', pct(b.marketingFee)), f('deposit_KRW', money(b.deposit)), f('contract_years', b.contract && b.contract.years ? (b.contract.years.min === b.contract.years.max ? b.contract.years.min : `${b.contract.years.min}-${b.contract.years.max}`) : (b.contract ? b.contract.raw : null)),
    f('payback_months', b.payback && b.payback.months ? (b.payback.months.min === b.payback.months.max ? b.payback.months.min : `${b.payback.months.min}-${b.payback.months.max}`) : (b.payback ? b.payback.raw : null)),
    f('branches', b.branches), f('first_registration', b.franchiseSinceYear), f('as_of', b.sources && b.sources[0] && b.sources[0].asof));
  return parts.filter(Boolean).join(' | ');
}
const clip = (s, n) => String(s || '').replace(/\s+/g, ' ').slice(0, n);
export function brandDetail(b) { // 질문이 특정 브랜드(상세에서 연 경우)일 때만 추가 설명 포함
  return `${brandRow(b)}\n  about: ${clip(b.description || b.products, 420)}\n  support: ${clip((b.support || []).join('; '), 360)}\n  requirements: ${clip((b.requirements || []).join('; '), 220)}`;
}
export function guideBlock(g, lang) {
  const facts = g.facts.map((f) => `- ${guideText({ x: f.l }, 'x', 'en')}: ${guideText({ x: f.v }, 'x', 'en')} ${f.chk ? `(checked ${f.chk})` : '(UNVERIFIED)'}`).join('\n');
  return `## ${guideText(g, 'title', 'en')}\n${guideText(g, 'sum', 'en')}\n${facts}`;
}
export function overview() {
  const gc = D.groupCounts(); const costs = D.all().map(D.entryCost).filter((x) => x != null).sort((a, b) => a - b);
  const q = (p) => costs[Math.floor((costs.length - 1) * p)];
  return `Dataset: ${D.count()} Korea-based franchise brands. Per group: ${Object.entries(gc).map(([k, v]) => `${k}=${v}`).join(', ')}. Entry cost (KRW, brands with a figure): n=${costs.length}, min=${costs[0]}, p25=${q(0.25)}, median=${q(0.5)}, p75=${q(0.75)}, max=${costs[costs.length - 1]}.`;
}
const LANG_NAME = { th: 'Thai', en: 'English', ko: 'Korean', zh: 'Simplified Chinese', hi: 'Hindi' };
export function systemPrompt(lang) {
  return `You are the research assistant inside a mobile app about franchise businesses in Korea. Reply in ${LANG_NAME[lang] || 'English'}.
Rules:
- Use ONLY the DATA and GUIDE blocks below. Do not use outside knowledge for brand facts, fees or legal numbers. If a value is missing, say it is not listed and suggest asking the brand directly.
- Never invent brands, prices, royalties or laws. Amounts are in Korean won (KRW). Mention the as_of date when you quote figures.
- When you mention a brand, put its id in square brackets right after its name, exactly as in DATA, e.g. Brand Name [kr20160628].
- GUIDE items marked UNVERIFIED must be described as "unverified, confirm with the official source or a lawyer". Items "checked <date>" are still reference only.
- Be concise: at most about 180 words, short bullets, no tables, no markdown headings.
- If DATA is empty or does not answer the question, ask ONE short clarifying question (budget, type of business, or city) instead of guessing.
- This is general information, not financial or legal advice. Add one short caution line only when you recommend brands or give legal figures.`;
}
export function buildUser({ question, history = [], r, lang }) {
  const hist = history.slice(-LIMITS.maxHistoryTurns).map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${clip(h.text, 500)}`).join('\n');
  const rows = r.brands.map((b, i) => (i === 0 && r.ctxFocus ? brandDetail(b) : brandRow(b))).join('\n');
  const data = rows ? `DATA (${r.brands.length} brands, filtered locally${r.budget ? `, entry cost <= ${r.budget} KRW` : ''}${r.groups.length ? `, groups=${r.groups.join('/')}` : ''}):\n${rows}` : `DATA: no brand rows matched the question.\n${overview()}`;
  const guides = r.guides.length ? `\n\nGUIDE:\n${r.guides.map((g) => guideBlock(g, lang)).join('\n')}` : '';
  return `${data}${guides}\n\n${hist ? `Conversation so far:\n${hist}\n\n` : ''}User question: ${clip(question, 800)}`;
}
export const extractIds = (text) => [...new Set([...String(text || '').matchAll(/\bkr\d{4,20}\b/g)].map((m) => m[0]))].filter((id) => D.byId(id));
export const stripIds = (text) => String(text || '').replace(/\s*\[(?:kr\d{4,20}(?:\s*[,;]\s*)?)+\]/g, '').replace(/\[(kr\d{4,20})\]/g, '').replace(/[ \t]+\n/g, '\n').trim();

// 질문 → 답. 반환 { text, ids, fallback, retrieved } 또는 AiFailure/ProviderError throw
export async function ask({ keys, question, history = [], lang, ctxBrandId = null, fetchFn = fetch, signal }) {
  const r = retrieve({ question, history, ctxBrandId }); r.ctxFocus = !!ctxBrandId && r.brands[0] && r.brands[0].id === ctxBrandId;
  const system = systemPrompt(lang), user = buildUser({ question, history, r, lang });
  const res = await runChain({ keys, signal, run: (m, key) => callModel(m, key, { system, user, maxOut: 1800, text: true }, fetchFn, signal) });
  const raw = String(res.value || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  const ids = extractIds(raw); const shown = ids.length ? ids : r.brands.slice(0, 0).map((b) => b.id);
  return { text: stripIds(raw), ids: shown, fallback: res.fallback, retrieved: r.brands.length, budget: r.budget };
}
export { AiFailure, ProviderError };
