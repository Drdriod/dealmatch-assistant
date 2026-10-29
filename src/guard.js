// Grounding guard. Runs in code because tool_choice only supports "auto".
// No /g flag: a global regex keeps its position between .test() calls and can miss the next match.
const PHONE = /(\+?234|0)[789][01]\d{8}/;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/;
const INJECTION = /ignore (all )?(previous|prior) (rules|instructions)|reveal .*(phone|number)|system prompt/i;

// Flag listing text that tries to instruct the model; the text is still shown but marked as data.
export function sanitizeToolResult(result) {
  let flagged = 0;
  const walk = (v) => {
    if (typeof v === 'string' && INJECTION.test(v)) { flagged += 1; return '[listing text removed: contained instructions]'; }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  return { result: walk(result), flagged };
}

const MONEY = /\d{1,3}(?:,\d{3})+|\d{4,}/g;
// Places a person might mention; combined with the areas found in tool results.
const KNOWN_AREAS = ['yaba','surulere','lekki','ikeja','ikoyi','ajah','victoria island','maryland','gbagada','ikorodu','festac','wuse','gwarinpa','maitama','garki','jabi'];
const num = (t) => Number(String(t).replace(/,/g, ''));
const TIER_WORD = /^[\s(\-\u2014:*]*(verified|stated|inferred)\b/i;

// Check the final reply against the evidence ledger. Returns { ok, reasons, details }.
// `requestText` is what the person typed: numbers they said themselves (a budget) may be repeated back.
export function checkReply(text, ledger, requestText = '') {
  const reasons = [], details = [];
  const add = (r, d) => { if (!reasons.includes(r)) reasons.push(r); if (d) details.push(d); };

  if (PHONE.test(text) || EMAIL.test(text)) add('contact_detail_leak');

  const cites = [...text.matchAll(/\[(E\d+)\]/g)];
  if (cites.some((m) => !ledger.has(m[1]))) add('unknown_evidence_id');
  if (/\u20a6|NGN|\bnaira\b/i.test(text) && cites.length === 0) add('price_without_evidence');

  // Each citation must say what its evidence says.
  const areas = new Set([...KNOWN_AREAS, ...ledger.entries.filter((e) => e.field === 'area').map((e) => String(e.value).toLowerCase())]);
  const mismatched = new Set();
  let prevEnd = 0;
  for (const m of cites) {
    const e = ledger.get(m[1]);
    const lineStart = text.lastIndexOf('\n', m.index) + 1;
    const before = text.slice(Math.max(prevEnd, lineStart, m.index - 70), m.index);
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 30).split(/[\n\[]/)[0];
    prevEnd = m.index + m[0].length;
    if (!e) continue;
    if (e.field === 'price_ngn_year' || e.field === 'starting_price_ngn') {
      const nums = [...before.matchAll(MONEY)].map((x) => num(x[0]));
      if (nums.length && nums[nums.length - 1] !== e.value) mismatched.add(nums[nums.length - 1]), add('claim_mismatch', `[${e.id}] is ${e.value.toLocaleString('en-US')}, but the reply says ${nums[nums.length - 1].toLocaleString('en-US')} next to it`);
    } else if (e.field === 'bedrooms') {
      const b = [...before.matchAll(/(\d+)\s*-?\s*(?:bed|bedroom)/gi)];
      if (b.length && Number(b[b.length - 1][1]) !== e.value) add('claim_mismatch', `[${e.id}] is ${e.value} bedroom(s), but the reply says ${b[b.length - 1][1]} next to it`);
    } else if (e.field === 'area') {
      const mentioned = [...areas].filter((a) => before.toLowerCase().includes(a));
      if (mentioned.length && !mentioned.includes(String(e.value).toLowerCase())) add('claim_mismatch', `[${e.id}] is ${e.value}, but the reply says ${mentioned[0]} next to it`);
    }
    const t = TIER_WORD.exec(after)?.[1]?.toLowerCase();
    if (t && t !== e.tier) add('claim_mismatch', `[${e.id}] is ${e.tier}, but the reply calls it ${t}`);
  }
  // Every figure must come from a tool result (or from the person's own message).
  const known = new Set(ledger.entries.filter((e) => typeof e.value === 'number').map((e) => e.value));
  const said = new Set((requestText.match(MONEY) ?? []).map(num));
  for (const m of text.matchAll(MONEY)) {
    const v = num(m[0]);
    if (PHONE.test(m[0]) || known.has(v) || said.has(v) || mismatched.has(v)) continue;
    add('fabricated_number', `${m[0]} is not in any tool result`);
  }

  return { ok: reasons.length === 0, reasons, details };
}
const REASON_TEXT = {
  contact_detail_leak: 'it contained a phone number or email, which are never shared before a protected payment',
  unknown_evidence_id: 'it cited an evidence id that does not exist',
  price_without_evidence: 'it stated a price without citing evidence like [E3] next to it',
  fabricated_number: 'it contained a figure that is not in any tool result',
  claim_mismatch: 'a citation did not match what its evidence says',
};
// Plain-language feedback sent back to the model so it can fix its own reply once.
export const repairInstruction = (reasons, details = []) =>
  `Your reply was rejected by the safety check because ${reasons.map((r) => REASON_TEXT[r] ?? r).join(' and ')}. ` +
  (details.length ? `Specifically: ${details.join('; ')}. ` : '') +
  'Write it again. Use only facts from the tool results, put the evidence id in square brackets right after each price, bedroom count or area, exactly like [E3], make each figure match its evidence, and never include phone numbers or emails.';

export const SAFE_FALLBACK = 'I can only share verified details from listings. For contact, use the introduction request in DealMatch.';
