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

export async function chat({ messages, tools, fetchImpl = fetch, provider = resolveProvider() }) {
  if (!provider.apiKey) throw new Error(`${provider.keyEnv} is not set`);
  if (!provider.model) throw new Error(`Set LLM_MODEL for provider ${provider.name}`);
  const started = Date.now();
  const res = await fetchImpl(`${provider.base}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${provider.apiKey}` },
    body: JSON.stringify({ model: provider.model, messages, ...(tools?.length ? { tools, tool_choice: 'auto' } : {}) }),
  });
  if (!res.ok) throw new Error(`${provider.name} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const msg = data.choices?.[0]?.message ?? {};
  return {
    content: msg.content ?? '',
    toolCalls: (msg.tool_calls ?? []).map((c) => ({ id: c.id, name: c.function?.name, args: safeJson(c.function?.arguments) })),
    usage: data.usage ?? null,
    provider: provider.name,
    ms: Date.now() - started,
  };
}

function safeJson(s) {
  try { return JSON.parse(s || '{}'); } catch { return {}; }
}
