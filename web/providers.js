// 기기에서 AI 공급자를 직접 호출(앱 서버 없음). 키는 보안 저장소에서만 읽음. 질문·답변 내용은 로그로 남기지 않음.
// req.text === true 면 JSON 강제 없이 일반 글로 답함(채팅). 기본은 JSON.
// 이미지는 {mime,b64} 배열. Gemini = inline_data(한 요청에 여러 장), OpenAI 호환(OpenRouter·Groq) = image_url data URI.
import { PROVIDERS, MODELS, isFreeOpenRouter, ref } from './models.js';

export class ProviderError extends Error {
  constructor(message, status, retryAfterSec) { super(message); this.status = status; this.retryAfterSec = retryAfterSec; }
}
export class AiFailure extends Error {
  // code: 'no_key' | 'bad_key' | 'all_failed' | 'aborted'
  constructor(code, attempts) { super(code); this.code = code; this.attempts = attempts || []; }
}
const cooldown = new Map();
export const resetCooldowns = () => cooldown.clear();
const cooling = (k, now) => (cooldown.get(k) || 0) > now;

async function postJson(url, headers, body, fetchFn, timeoutMs, outer) {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), timeoutMs);
  const onAbort = () => ctrl.abort(); if (outer) outer.addEventListener('abort', onAbort);
  try {
    const res = await fetchFn(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), signal: ctrl.signal });
    const text = await res.text(); let json = null; try { json = JSON.parse(text); } catch {}
    if (!res.ok) {
      let ra = parseFloat(res.headers && res.headers.get && res.headers.get('retry-after'));
      if (!Number.isFinite(ra) && res.status === 429 && json && json.error && Array.isArray(json.error.details)) {
        const ri = json.error.details.find((d) => d && d.retryDelay); const sec = ri ? parseFloat(String(ri.retryDelay)) : NaN;
        if (Number.isFinite(sec)) ra = sec;
        if (/PerDay/i.test(JSON.stringify(json.error.details))) ra = Math.max(Number.isFinite(ra) ? ra : 0, 3600);
      }
      throw new ProviderError(`HTTP ${res.status}`, res.status, Number.isFinite(ra) ? ra : undefined);
    }
    if (json && json.error && !json.choices && !json.candidates) throw new ProviderError(`HTTP ${json.error.code || 502}`, Number(json.error.code) || 502);
    return json;
  } catch (e) {
    if (e instanceof ProviderError) throw e;
    if (outer && outer.aborted) throw new AiFailure('aborted');
    if (e && e.name === 'AbortError') throw new ProviderError('timeout', 0);
    throw new ProviderError('network', 0);
  } finally { clearTimeout(t); if (outer) outer.removeEventListener('abort', onAbort); }
}

const contentText = (c) => (typeof c === 'string' ? c : Array.isArray(c) ? c.map((x) => (typeof x === 'string' ? x : x && x.type === 'text' ? x.text || '' : '')).join('') : '');

async function callGemini(P, key, m, { system, user, images, maxOut, text: text_ }, fetchFn, signal) {
  const parts = [{ text: user }, ...(images || []).map((im) => ({ inline_data: { mime_type: im.mime || 'image/jpeg', data: im.b64 } }))];
  const json = await postJson(`${P.baseUrl}/models/${encodeURIComponent(m.id)}:generateContent`, { 'x-goog-api-key': key }, {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts }],
    generationConfig: { ...(text_ ? {} : { responseMimeType: 'application/json' }), maxOutputTokens: Math.min(maxOut || 4000, m.maxOut || 8000), temperature: 0.2, ...(m.thinking ? { thinkingConfig: { thinkingLevel: m.thinking } } : {}) },
  }, fetchFn, m.timeoutMs, signal);
  const cand = json && json.candidates && json.candidates[0];
  const text = ((cand && cand.content && cand.content.parts) || []).filter((x) => x.text && !x.thought).map((x) => x.text).join('').trim();
  if (!text) throw new ProviderError('empty', 502);
  return text;
}

async function callOpenAI(P, key, m, { system, user, images, maxOut, text: text_ }, fetchFn, signal) {
  const content = [{ type: 'text', text: user }, ...(images || []).map((im) => ({ type: 'image_url', image_url: { url: `data:${im.mime || 'image/jpeg'};base64,${im.b64}` } }))];
  const messages = [{ role: 'system', content: system }, { role: 'user', content: images && images.length ? content : user }];
  const send = (extra) => postJson(`${P.baseUrl}/chat/completions`, { Authorization: `Bearer ${key}` }, { ...extra, model: m.id, messages, temperature: 0.2, [P.maxTokensField || 'max_tokens']: Math.min(maxOut || 3000, m.maxOut || 4000) }, fetchFn, m.timeoutMs, signal);
  const extras = { ...(m.extra || {}), ...(m.json && !text_ ? { response_format: { type: 'json_object' } } : {}) };
  let json;
  try { json = await send(extras); }
  catch (e) { if (Object.keys(extras).length && (e.status === 400 || e.status === 422)) json = await send({}); else throw e; }
  const ch = json && json.choices && json.choices[0];
  const text = contentText(ch && ch.message && ch.message.content).replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  if (!text) throw new ProviderError('empty', 502);
  return text;
}

export async function callModel(m, key, req, fetchFn = fetch, signal) {
  const P = PROVIDERS[m.provider];
  if (!P || !key) throw new ProviderError('no key', 0);
  if (m.provider === 'openrouter' && !isFreeOpenRouter(m.id)) throw new ProviderError('non-free refused', 400);
  return P.type === 'gemini' ? callGemini(P, key, m, req, fetchFn, signal) : callOpenAI(P, key, m, req, fetchFn, signal);
}

// 후보 순서: models.js 의 MODELS(고정). 키가 없는 공급자는 건너뜀.
export const buildChain = (keys) => MODELS.filter((m) => keys && keys[m.provider]);

// run(model, key) → 결과(throw 하면 다음 후보). 성공하면 { value, model, fallback, attempts }. 전부 실패하면 AiFailure.
export async function runChain({ keys, run, signal, now = () => Date.now(), sleepFn = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
  const chain = buildChain(keys);
  if (!chain.length) throw new AiFailure('no_key');
  const attempts = []; let tried = 0, badKeyOnly = true; const primary = MODELS[0];
  for (const m of chain) {
    if (signal && signal.aborted) throw new AiFailure('aborted', attempts);
    if (tried >= 4) break;
    if (cooling('m|' + ref(m), now()) || cooling('p|' + m.provider, now())) continue;
    tried++;
    try {
      let value;
      for (let tryNo = 0; ; tryNo++) { // 일시 오류(시간 초과·5xx)면 같은 모델로 한 번만 다시(m.retry) — 곧바로 낮은 품질 모델로 내려가지 않게
        try { value = await run(m, keys[m.provider]); break; }
        catch (e) { const st0 = e instanceof ProviderError ? e.status : -1; if (tryNo < (m.retry || 0) && (st0 === 0 || st0 >= 500) && !(signal && signal.aborted)) { await sleepFn(800); continue; } throw e; }
      }
      attempts.push({ provider: m.provider, ok: true });
      return { value, model: m, fallback: ref(m) !== ref(primary), attempts };
    } catch (e) {
      if (e instanceof AiFailure && e.code === 'aborted') throw e;
      const st = e instanceof ProviderError ? e.status : 0;
      attempts.push({ provider: m.provider, ok: false, status: st });
      if (st !== 401 && st !== 403) badKeyOnly = false;
      if (st === 401 || st === 403) cooldown.set('p|' + m.provider, now() + 10 * 60000);
      else if (st === 429) cooldown.set('m|' + ref(m), now() + Math.min((e.retryAfterSec != null ? e.retryAfterSec : 60), 6 * 3600) * 1000);
      else if (st === 400 || st === 404) cooldown.set('m|' + ref(m), now() + 10 * 60000);
      else cooldown.set('m|' + ref(m), now() + 20000);
    }
  }
  throw new AiFailure(attempts.length && badKeyOnly ? 'bad_key' : 'all_failed', attempts);
}

// 키 테스트: 읽기 전용 목록 호출(생성 호출 없음, 한도 소모 없음). 'ok' | 'bad' | 'net'
export async function testKey(provider, key, fetchFn = fetch) {
  const P = PROVIDERS[provider]; if (!P || !key) return 'bad';
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const url = provider === 'gemini' ? `${P.baseUrl}/models?pageSize=1` : provider === 'groq' ? `${P.baseUrl}/models` : `${P.baseUrl}/auth/key`;
    const headers = provider === 'gemini' ? { 'x-goog-api-key': key } : { Authorization: `Bearer ${key}` };
    const r = await fetchFn(url, { headers, signal: ctrl.signal });
    if (r.ok) return 'ok';
    if (r.status === 400 || r.status === 401 || r.status === 403) return 'bad';
    return 'net';
  } catch { return 'net'; } finally { clearTimeout(t); }
}
