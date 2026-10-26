import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runAgent } from '../src/agent.js';

const listings = JSON.parse(readFileSync(new URL('../data/demo-listings.json', import.meta.url)));
// scripted fake model: first turn calls tools, second turn answers with `final`
const scripted = (calls, final) => { let n = 0; return async () => (n++ === 0
  ? { content: '', toolCalls: calls, usage: null, ms: 1 }
  : { content: typeof final === 'function' ? final() : final, toolCalls: [], usage: null, ms: 1 }); };

const direct = (text) => async () => ({ content: text, toolCalls: [], usage: null, ms: 1 });

test('answers from tool results with evidence ids', async () => {
  const model = scripted([{ id: 'a', name: 'search_listings', args: { area: 'Yaba', bedrooms: 2 } }], 'A 2-bed in Yaba is NGN 2,800,000 a year, verified [E1].');
  const r = await runAgent({ request: '2 bed in Yaba', listings, model });
  assert.equal(r.blocked, false);
  assert.equal(r.ledger.find((e) => e.id === 'E1').tier, 'verified');
});

test('guard blocks a reply that leaks the owner phone', async () => {
  const model = scripted([{ id: 'a', name: 'get_listing', args: { id: 'L3' } }], 'Call the owner on +2348033333333');
  const r = await runAgent({ request: 'Lekki duplex', listings, model });
  assert.equal(r.blocked, true);
  assert.ok(!/2348033333333/.test(r.reply));
});

test('injected listing text is removed before the model sees it', async () => {
  let seen = '';
  let n = 0;
  const model = async ({ messages }) => {
    if (n++ === 0) return { content: '', toolCalls: [{ id: 'a', name: 'get_listing', args: { id: 'L3' } }], ms: 1 };
    seen = messages.filter((m) => m.role === 'tool').map((m) => m.content).join();
    return { content: 'Listing has no usable description [E1].', toolCalls: [], ms: 1 };
  };
  const r = await runAgent({ request: 'Lekki duplex', listings, model });
  assert.ok(!/IGNORE ALL/i.test(seen) && !/owner_phone/.test(seen) && !/2348033333333/.test(seen));
  assert.ok(r.trace.some((t) => t.injection_flagged));
});

test('guard blocks unknown evidence ids and ungrounded prices', async () => {
  const r1 = await runAgent({ request: 'x', listings, model: direct('Rent is cheap [E99].') });
  assert.equal(r1.blocked, true);
  const r2 = await runAgent({ request: 'x', listings, model: direct('It costs NGN 500,000.') });
  assert.equal(r2.blocked, true);
});
