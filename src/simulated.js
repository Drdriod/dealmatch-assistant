// SIMULATED model. Not an AI: a rule-based stand-in that picks tools from keywords and writes
// a reply from tool results. It exists so the repo runs with no account or key (replay mode,
// tests, `npm run eval:mock`). Anything it produces is labeled SIMULATED in the console.
const AREAS = ['yaba', 'surulere', 'lekki', 'abuja', 'ikeja', 'ewet housing', 'aka road', 'osongama', 'ikot ekpene road'];
const CITIES = ['uyo', 'lagos'];
const cap = (s) => s.split(' ').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const money = (n) => n.toLocaleString('en-US');
const PIDGIN = /\b(abeg|dey|wey|na|una|wetin|pikin|fit)\b/i;
const PRIVATE_ASK = /(phone|number|whatsapp|call|contact|landlord|owner)/i;

export function simulatedModel({ blunder = false } = {}) {
  let step = 0, blundered = false;
  return async ({ messages }) => {
    const user = messages.find((m) => m.role === 'user').content;
    const low = user.toLowerCase();
    const repairing = messages.some((m) => m.role === 'user' && /rejected by the safety check/.test(m.content));
    const base = { usage: { total_tokens: 0 }, ms: 1, reasoning: '' };
    if (step++ === 0) {
      const area = AREAS.find((a) => low.includes(a));
      const city = CITIES.find((c) => new RegExp(`\\b${c}\\b`).test(low));
      const args = { ...(area ? { area: cap(area) } : {}), ...(city ? { city: cap(city) } : {}) };
      const calls = [];
      if (/flat|bed|duplex|self-contain|room|mansion|landlord|owner|house|shortlet|place|anything|listing/.test(low)) {
        const beds = /(\d)\s*-?\s*bed/.exec(low);
        const budget = /(\d+(?:\.\d+)?)\s*million/.exec(low);
        calls.push({ id: 'a', name: 'search_listings', args: { ...args, ...(beds ? { bedrooms: Number(beds[1]) } : {}), ...(budget ? { max_price_ngn_year: Math.round(Number(budget[1]) * 1e6) } : {}) } });
      }
      if (/electric|tutor|plumb|clean|light|fix|artisan|teach/.test(low)) {
        const service = ['electrician', 'tutor', 'plumber', 'cleaner'].find((s) => low.includes(s.slice(0, 5))) ?? (/light|fix/.test(low) ? 'electrician' : undefined);
        calls.push({ id: 'b', name: 'search_providers', args: service ? { ...args, service } : args });
      }
      return { ...base, content: '', toolCalls: calls };
    }
    const items = messages.filter((m) => m.role === 'tool').flatMap((m) => { try { return JSON.parse(m.content); } catch { return []; } })
      .filter((x) => x && x.evidence);
    const lines = items.map((x) => {
      const ev = x.evidence;
      if (ev.price_ngn_year) {
        let price = x.price_ngn_year;
        if (blunder && !blundered && !repairing) { price += 400000; blundered = true; } // scripted slip, to show the guard working
        return `- ${x.title}: ${money(price)} a year [${ev.price_ngn_year}], ${x.bedrooms} bedrooms [${ev.bedrooms}], ${x.area} [${ev.area}] (${x.trust})`;
      }
      return `- ${x.name}, ${x.service} [${ev.service}]: from ${money(x.starting_price_ngn)} NGN [${ev.starting_price_ngn}], ${x.area} [${ev.area}] (${x.trust})`;
    });
    const pidgin = PIDGIN.test(user);
    const refuse = PRIVATE_ASK.test(low)
      ? (pidgin ? 'I no fit share phone number. Contact go show after protected payment.\n\n' : "I can't share phone numbers. Contact details are released only after protected payment.\n\n") : '';
    if (!items.length) return { ...base, toolCalls: [], content: refuse + (pidgin ? 'I no see anything wey match that.' : 'I found nothing matching that in our listings.') };
    const close = pidgin ? 'You wan make I start protected request?' : 'Want to start a protected request?';
    return { ...base, toolCalls: [], content: `${refuse}${pidgin ? 'Dis one I see:' : 'Here is what I found:'}\n${lines.join('\n')}\n\n${close}` };
  };
}
