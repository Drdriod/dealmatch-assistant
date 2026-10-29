import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeTools } from '../src/tools.js';
import { Ledger } from '../src/ledger.js';
import { checkReply } from '../src/guard.js';

const read = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url)));
const listings = read('demo-listings.json'), providers = read('demo-providers.json'), traps = read('guard-traps.json');

for (const t of traps) {
  test(`${t.id} ${t.title}`, () => {
    const ledger = new Ledger();
    const tools = makeTools(listings, ledger, providers);
    for (const c of t.calls) tools[c.name](c.args);
    const r = checkReply(t.reply, ledger, t.request ?? '');
    if (t.expect.length === 0) assert.deepEqual(r.reasons, [], `should pass, got ${r.reasons} ${r.details}`);
    else for (const want of t.expect) assert.ok(r.reasons.includes(want), `expected ${want}, got ${r.reasons}`);
  });
}
