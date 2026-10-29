import test from 'node:test';
import assert from 'node:assert/strict';
import { chat, resolveProvider } from '../src/museSpark.js';

const fake = (body, ok = true, status = 200) => async () => ({
  ok, status, json: async () => body, text: async () => JSON.stringify(body),
});
const p = { name: 'meta', base: 'http://x', model: 'm', apiKey: 'k', keyEnv: 'META_API_KEY' };

test('parses content and tool calls', async () => {
  const r = await chat({
    messages: [], provider: p,
    fetchImpl: fake({ choices: [{ message: { content: 'hi', tool_calls: [
      { id: '1', function: { name: 'search_listings', arguments: '{"city":"Lagos"}' } }] } }], usage: { total_tokens: 5 } }),
  });
  assert.equal(r.content, 'hi');
  assert.deepEqual(r.toolCalls[0], { id: '1', name: 'search_listings', args: { city: 'Lagos' } });
});

test('throws on HTTP error, missing key and missing model', async () => {
  await assert.rejects(chat({ messages: [], provider: p, fetchImpl: fake({ e: 1 }, false, 401) }), /401/);
  await assert.rejects(chat({ messages: [], provider: { ...p, apiKey: '' } }), /META_API_KEY/);
  await assert.rejects(chat({ messages: [], provider: { ...p, model: '' } }), /LLM_MODEL/);
});

test('provider selection by environment', () => {
  assert.equal(resolveProvider({}).name, 'meta');
  const b = resolveProvider({ LLM_PROVIDER: 'baseten', BASETEN_API_KEY: 'x' });
  assert.equal(b.base, 'https://inference.baseten.co/v1');
  assert.equal(b.model, 'meta-models/muse-spark-open-1026');
  assert.equal(resolveProvider({ LLM_PROVIDER: 'fireworks', LLM_MODEL: 'm' }).model, 'm');
  assert.throws(() => resolveProvider({ LLM_PROVIDER: 'nope' }), /Unknown/);
});

test('keeps reasoning separate from the answer and strips think tags', async () => {
  const r = await chat({ messages: [], provider: p, fetchImpl: fake({ choices: [{ finish_reason: 'stop', message: { content: '<think>x</think>Hello', reasoning_content: 'thinking...' } }] }) });
  assert.equal(r.content, 'Hello');
  assert.equal(r.reasoning, 'thinking...');
});

test('retries with a bigger budget when reasoning used it all and the answer is empty', async () => {
  const sent = [];
  const replies = [
    { choices: [{ finish_reason: 'length', message: { content: '', reasoning_content: 'long thought' } }] },
    { choices: [{ finish_reason: 'stop', message: { content: 'Done', reasoning_content: 'long thought' } }] },
  ];
  const f = async (_u, init) => { sent.push(JSON.parse(init.body).max_tokens); const b = replies.shift(); return { ok: true, status: 200, json: async () => b, text: async () => '' }; };
  const r = await chat({ messages: [], provider: p, fetchImpl: f, maxTokens: 100 });
  assert.equal(r.content, 'Done');
  assert.deepEqual(sent, [100, 200]);
});

test('backs off and retries on rate limit', async () => {
  let n = 0;
  const f = async () => (n++ === 0
    ? { ok: false, status: 429, text: async () => 'slow down', json: async () => ({}) }
    : { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: 'ok' } }] }), text: async () => '' });
  const r = await chat({ messages: [], provider: p, fetchImpl: f });
  assert.equal(r.content, 'ok');
});
