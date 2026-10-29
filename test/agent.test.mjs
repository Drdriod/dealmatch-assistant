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

const providers = JSON.parse(readFileSync(new URL('../data/demo-providers.json', import.meta.url)));

test('People door: provider search is grounded and strips injected text and phone', async () => {
  let seen = '';
  let n = 0;
  const model = async ({ messages }) => {
    if (n++ === 0) return { content: '', toolCalls: [{ id: 'a', name: 'search_providers', args: { service: 'plumber' } }], ms: 1 };
    seen = messages.filter((m) => m.role === 'tool').map((m) => m.content).join();
    return { content: 'A verified plumber in Lekki starts from NGN 10,000 [E1].', toolCalls: [], ms: 1 };
  };
  const r = await runAgent({ request: 'plumber in Lekki', listings, providers, model });
  assert.equal(r.blocked, false);
  assert.ok(!/ignore previous/i.test(seen) && !/2348055555553/.test(seen) && !/phone/.test(seen));
  assert.ok(r.trace.some((t) => t.injection_flagged));
});

test('both doors in one request: place and person, parallel calls', async () => {
  let n = 0;
  const model = async () => (n++ === 0
    ? { content: '', toolCalls: [
        { id: 'a', name: 'search_listings', args: { area: 'Yaba', bedrooms: 2 } },
        { id: 'b', name: 'search_providers', args: { service: 'cleaner', area: 'Yaba' } }], ms: 1 }
    : { content: 'A 2-bed in Yaba is NGN 2,800,000 a year [E1]; a cleaner there starts at NGN 6,000 [E8], inferred.', toolCalls: [], ms: 1 });
  const r = await runAgent({ request: 'flat in Yaba and someone to clean it', listings, providers, model });
  assert.equal(r.blocked, false);
  assert.deepEqual(r.trace[0].toolCalls, ['search_listings', 'search_providers']);
});
