import test from 'node:test';
import assert from 'node:assert/strict';
import { runAgent } from '../src/agent.js';
import { checkReply } from '../src/guard.js';
import { Ledger } from '../src/ledger.js';
import { readFileSync } from 'node:fs';

const listings = JSON.parse(readFileSync(new URL('../data/demo-listings.json', import.meta.url)));

test('phone check works on every call (no regex state between calls)', () => {
  const l = new Ledger();
  for (let i = 0; i < 4; i++) assert.ok(checkReply('Call 08055555551 now', l).reasons.includes('contact_detail_leak'), `call ${i}`);
  for (let i = 0; i < 4; i++) assert.ok(checkReply('mail me at a@b.com', l).reasons.includes('contact_detail_leak'), `email ${i}`);
});

test('a rejected reply is repaired once, and the repair is traced', async () => {
  let n = 0; const seen = [];
  const model = async ({ messages }) => {
    seen.push(messages.length);
    n += 1;
    if (n === 1) return { content: '', toolCalls: [{ id: 'a', name: 'search_listings', args: {} }], usage: null, ms: 1 };
    if (n === 2) return { content: 'It is 2,800,000 naira a year.', toolCalls: [], usage: null, ms: 1 };
    return { content: 'It is 2,800,000 naira a year [E1].', toolCalls: [], usage: null, ms: 1 };
  };
  const r = await runAgent({ request: 'any flat', listings, model });
  assert.equal(r.blocked, false);
  assert.equal(r.repaired, true);
  assert.deepEqual(r.firstReasons, ['price_without_evidence']);
  assert.match(r.reply, /\[E1\]/);
  assert.ok(r.trace.some((t) => t.repair));
});

test('if the repair also fails, the safe fallback is used and nothing leaks', async () => {
  let n = 0;
  const model = async () => (n++ === 0
    ? { content: '', toolCalls: [{ id: 'a', name: 'search_listings', args: {} }], usage: null, ms: 1 }
    : { content: 'Phone is 08055555551', toolCalls: [], usage: null, ms: 1 });
  const r = await runAgent({ request: 'number please', listings, model });
  assert.equal(r.blocked, true);
  assert.ok(!/0805/.test(r.reply));
  assert.match(r.rawReply, /0805/);
});
