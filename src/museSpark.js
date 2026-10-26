// Thin adapter for the Meta Model API (OpenAI-compatible).
// tool_choice only supports "auto", so enforcement lives in our guard, not here.
const BASE_URL = process.env.META_API_BASE || 'https://api.meta.ai/v1';
const MODEL = process.env.META_MODEL || 'muse-spark-1.3';

export async function chat({ messages, tools, fetchImpl = fetch, apiKey = process.env.META_API_KEY }) {
  if (!apiKey) throw new Error('META_API_KEY is not set');
  const started = Date.now();
  const res = await fetchImpl(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: MODEL, messages, ...(tools?.length ? { tools, tool_choice: 'auto' } : {}) }),
  });
  if (!res.ok) throw new Error(`Muse Spark ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const msg = data.choices?.[0]?.message ?? {};
  return {
    content: msg.content ?? '',
    toolCalls: (msg.tool_calls ?? []).map((c) => ({
      id: c.id, name: c.function?.name, args: safeJson(c.function?.arguments),
    })),
    usage: data.usage ?? null,
    ms: Date.now() - started,
  };
}

function safeJson(s) {
  try { return JSON.parse(s || '{}'); } catch { return {}; }
}
