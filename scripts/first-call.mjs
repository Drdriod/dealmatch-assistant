// First real call to the model. Run it on YOUR machine, where the key lives:
//   BASETEN_API_KEY=... LLM_PROVIDER=baseten npm run first-call
// It never prints the key. It shows what comes back (shape, reasoning, tool calls, speed, tokens)
// so we know how to read Muse Spark Open before building on it.
import { resolveProvider } from '../src/museSpark.js';
import { toolSchemas } from '../src/tools.js';

const provider = resolveProvider({ LLM_PROVIDER: 'baseten', ...process.env });
if (!provider.apiKey) {
  console.error(`Set ${provider.keyEnv} first (do not paste it into chat or commit it).`);
  process.exit(1);
}
console.log(`provider=${provider.name} model=${provider.model}`);

async function call(label, body) {
  const t = Date.now();
  const res = await fetch(`${provider.base}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${provider.apiKey}` },
    body: JSON.stringify({ model: provider.model, ...body }),
  });
  const ms = Date.now() - t;
  const text = await res.text();
  if (!res.ok) { console.log(`\n[${label}] HTTP ${res.status} in ${ms}ms\n${text.slice(0, 400)}`); return; }
  const data = JSON.parse(text);
  const msg = data.choices?.[0]?.message ?? {};
  console.log(`\n[${label}] ${ms}ms  usage=${JSON.stringify(data.usage)}`);
  console.log('message keys:', Object.keys(msg).join(', '));
  if (msg.reasoning_content || msg.reasoning) console.log('reasoning (first 200 chars):', String(msg.reasoning_content ?? msg.reasoning).slice(0, 200));
  console.log('content:', String(msg.content ?? '').slice(0, 400));
  if (msg.tool_calls?.length) console.log('tool_calls:', JSON.stringify(msg.tool_calls.map((c) => ({ name: c.function?.name, args: c.function?.arguments }))));
}

await call('1 hello', { messages: [{ role: 'user', content: 'Say hello in one short sentence.' }], max_tokens: 200 });
await call('2 tool call', {
  messages: [
    { role: 'system', content: 'You help people find places and people on DealMatch. Use the tools.' },
    { role: 'user', content: 'I need a 2 bedroom flat in Yaba under 1.5 million a year.' },
  ],
  tools: toolSchemas,
  tool_choice: 'auto',
  max_tokens: 800,
});
await call('3 pidgin', {
  messages: [{ role: 'user', content: 'Abeg, I dey find person wey fit fix my generator for Ikeja. How I go take do am for here?' }],
  max_tokens: 600,
});
