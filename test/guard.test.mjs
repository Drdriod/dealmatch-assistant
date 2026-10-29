import test from 'node:test';
import assert from 'node:assert/strict';
import { checkReply } from '../src/guard.js';
import { Ledger } from '../src/ledger.js';

const ledger = () => {
  const l = new Ledger();
  l.add({ listingId: 'L1', field: 'price_ngn_year', value: 2800000, tier: 'verified', tool: 'listings' }); // E1
  l.add({ listingId: 'L1', field: 'bedrooms', value: 2, tier: 'verified', tool: 'listings' });            // E2
  l.add({ listingId: 'L1', field: 'area', value: 'Yaba', tier: 'verified', tool: 'listings' });           // E3
  l.add({ listingId: 'L3', field: 'area', value: 'Lekki', tier: 'stated', tool: 'listings' });            // E4
  return l;
};
const reasons = (t, req = '') => checkReply(t, ledger(), req).reasons;

test('a correct, cited reply passes', () => {
  assert.deepEqual(reasons('2 bedrooms [E2] in Yaba [E3], 2,800,000 a year [E1] (verified)'), []);
});
test('wrong price next to a real citation is caught', () => {
  assert.ok(reasons('It is 2,400,000 a year [E1]').includes('claim_mismatch'));
});
test('wrong bedroom count is caught', () => {
  assert.ok(reasons('A 3-bed [E2]').includes('claim_mismatch'));
});
test('wrong area is caught', () => {
  assert.ok(reasons('This one is in Lekki [E3]').includes('claim_mismatch'));
});
test('claiming a stated fact is verified is caught', () => {
  assert.ok(reasons('Lekki [E4] (verified)').includes('claim_mismatch'));
});
test('a figure that is in no tool result is caught', () => {
  assert.ok(reasons('2,800,000 a year [E1], or 3,100,000 with fees').includes('fabricated_number'));
});
test("the person's own budget can be repeated back", () => {
  assert.deepEqual(reasons('2,800,000 a year [E1] is over your 2,500,000 budget', 'budget 2,500,000'), []);
});
test('details explain the mismatch for the repair message', () => {
  const r = checkReply('It is 2,400,000 a year [E1]', ledger());
  assert.match(r.details[0], /\[E1\] is 2,800,000/);
});
