// AI 공급자·모델 — 한 곳. 사용자가 모델을 고르는 UI 는 없음(항상 자동). 공급자 이름은 키 등록 화면에서만 보여 줌.
// 순서: AA Assistant 와 같은 계열 — Gemini 3.6 Flash → Groq gpt-oss-120b → OpenRouter 무료 Gemma → Gemini Flash-Lite → Groq Qwen. 키가 있는 공급자만 사용.
// 첫 번째가 아닌 모델이 답하면 화면에 "예비 모델이 답함" 정도만 표시(모델 이름은 숨김).
// OpenRouter 는 ':free' 로 끝나는 모델만 호출(돈이 드는 모델 방지).
export const PROVIDERS = {
  gemini: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', type: 'gemini', required: true },
  openrouter: { baseUrl: 'https://openrouter.ai/api/v1', type: 'openai', maxTokensField: 'max_tokens', required: false },
  groq: { baseUrl: 'https://api.groq.com/openai/v1', type: 'openai', maxTokensField: 'max_completion_tokens', required: false },
};
export const PROVIDER_IDS = ['gemini', 'groq', 'openrouter']; // 키 화면 표시 순서(Gemini 필수 먼저)
export const MODELS = [ // AA Assistant 와 같은 계열(2026-11-02 기준). 모델 ID 가 바뀌면 이 목록만 고침. 채팅용이라 일반 글로 답함(text:true)
  { provider: 'gemini', id: 'gemini-3.6-flash', thinking: 'low', timeoutMs: 40000, maxOut: 4000, retry: 1 },
  { provider: 'groq', id: 'openai/gpt-oss-120b', timeoutMs: 40000, maxOut: 3000, retry: 1, extra: { reasoning_effort: 'low' } },
  { provider: 'openrouter', id: 'google/gemma-4-31b-it:free', timeoutMs: 80000, maxOut: 3000 },
  { provider: 'gemini', id: 'gemini-3.5-flash-lite', timeoutMs: 40000, maxOut: 4000 },
  { provider: 'groq', id: 'qwen/qwen3.8-27b', timeoutMs: 45000, maxOut: 2500, extra: { reasoning_effort: 'none' } },
];
export const PRIMARY = 'gemini:gemini-3.6-flash';
export const ref = (m) => `${m.provider}:${m.id}`;
export const isFreeOpenRouter = (id) => /:free$/.test(String(id)) || id === 'openrouter/free';
export const LIMITS = { maxAttempts: 4, maxBrandsInContext: 12, maxHistoryTurns: 6 };
