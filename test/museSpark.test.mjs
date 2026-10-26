import test from 'node:test';
import assert from 'node:assert/strict';
import { chat } from '../src/museSpark.js';

const fake = (body, ok = true, status = 200) => async () => ({
  ok, status, json: async () => body, text: async () => JSON.stringify(body),
});

test('parses content and tool calls', async () => {
  const r = await chat({
    messages: [], apiKey: 'k',
    fetchImpl: fake({ choices: [{ message: { content: 'hi', tool_calls: [
      { id: '1', function: { name: 'search_listings', arguments: '{"city":"Lagos"}' } }] } }], usage: { total_tokens: 5 } }),
  });
  assert.equal(r.content, 'hi');
  assert.deepEqual(r.toolCalls[0], { id: '1', name: 'search_listings', args: { city: 'Lagos' } });
});

test('throws on HTTP error and missing key', async () => {
  await assert.rejects(chat({ messages: [], apiKey: 'k', fetchImpl: fake({ e: 1 }, false, 401) }), /401/);
  await assert.rejects(chat({ messages: [], apiKey: '' }), /META_API_KEY/);
});
