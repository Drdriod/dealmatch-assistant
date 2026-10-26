// Grounding guard. Runs in code because tool_choice only supports "auto".
const PHONE = /(\+?234|0)[789][01]\d{8}/g;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/g;
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

// Check the final reply. Returns { ok, reasons }.
export function checkReply(text, ledger) {
  const reasons = [];
  if (PHONE.test(text) || EMAIL.test(text)) reasons.push('contact_detail_leak');
  const cited = [...text.matchAll(/\[(E\d+)\]/g)].map((m) => m[1]);
  if (cited.some((id) => !ledger.has(id))) reasons.push('unknown_evidence_id');
  if (/₦|NGN|\bnaira\b/i.test(text) && cited.length === 0) reasons.push('price_without_evidence');
  return { ok: reasons.length === 0, reasons };
}
export const SAFE_FALLBACK = 'I can only share verified details from listings. For contact, use the introduction request in DealMatch.';
