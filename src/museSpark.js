// Adapter for Meta's models over any OpenAI-compatible endpoint.
// Meta Model API: Muse Spark. Baseten: Muse Spark Open (open weights). Fireworks: open-weight Meta models.
// tool_choice only supports "auto" on Meta's API, so enforcement lives in our guard, not here.
export const PROVIDERS = {
  meta: { base: 'https://api.meta.ai/v1', model: 'muse-spark-1.3', keyEnv: 'META_API_KEY' },
  baseten: { base: 'https://inference.baseten.co/v1', model: 'meta-models/muse-spark-open-1026', keyEnv: 'BASETEN_API_KEY' },
  fireworks: { base: 'https://api.fireworks.ai/inference/v1', model: '', keyEnv: 'FIREWORKS_API_KEY' },
};

export function resolveProvider(env = process.env) {
  const name = env.LLM_PROVIDER || 'meta';
  const p = PROVIDERS[name];
  if (!p) throw new Error(`Unknown LLM_PROVIDER "${name}"`);
  return { name, base: env.LLM_BASE_URL || p.base, model: env.LLM_MODEL || p.model, apiKey: env[p.keyEnv], keyEnv: p.keyEnv };
}

// Muse Spark Open always reasons. The reasoning comes back in `reasoning_content` and spends the same
// max_tokens budget as the answer, so a small budget can end with an empty answer (finish_reason "length").
// We keep reasoning separate (for the trace only, never shown to users) and retry once with a bigger budget.
const stripThink = (s) => String(s ?? '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();

export async function chat({ messages, tools, fetchImpl = fetch, provider = resolveProvider(), maxTokens }) {
  if (!provider.apiKey) throw new Error(`${provider.keyEnv} is not set`);
  if (!provider.model) throw new Error(`Set LLM_MODEL for provider ${provider.name}`);
  const started = Date.now();
  let budget = maxTokens ?? Number(process.env.LLM_MAX_TOKENS || 4096);
  for (let attempt = 0; ; attempt++) {
    const res = await fetchImpl(`${provider.base}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${provider.apiKey}` },
      body: JSON.stringify({ model: provider.model, messages, max_tokens: budget, ...(tools?.length ? { tools, tool_choice: 'auto' } : {}) }),
    });
    if (res.status === 429 && attempt < 3) { await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt)); continue; }
    if (!res.ok) throw new Error(`${provider.name} ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    const choice = data.choices?.[0] ?? {};
    const msg = choice.message ?? {};
    const toolCalls = (msg.tool_calls ?? []).map((c) => ({ id: c.id, name: c.function?.name, args: safeJson(c.function?.arguments) }));
    const content = stripThink(msg.content);
    if (!content && !toolCalls.length && choice.finish_reason === 'length' && attempt < 2) { budget *= 2; continue; }
    return {
      content,
      reasoning: String(msg.reasoning_content ?? msg.reasoning ?? ''),
      toolCalls,
      usage: data.usage ?? null,
      finish: choice.finish_reason ?? null,
      provider: provider.name,
      ms: Date.now() - started,
    };
  }
}

function safeJson(s) {
  try { return JSON.parse(s || '{}'); } catch { return {}; }
}
