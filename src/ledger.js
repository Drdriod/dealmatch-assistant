// Evidence ledger: every fact the assistant may state is recorded with its source and trust tier.
export const TIERS = ['verified', 'stated', 'inferred'];

export class Ledger {
  constructor() { this.entries = []; }
  add({ listingId, field, value, tier, tool }) {
    if (!TIERS.includes(tier)) throw new Error(`bad tier ${tier}`);
    const id = `E${this.entries.length + 1}`;
    this.entries.push({ id, listingId, field, value, tier, tool });
    return id;
  }
  has(id) { return this.entries.some((e) => e.id === id); }
  get(id) { return this.entries.find((e) => e.id === id); }
}
