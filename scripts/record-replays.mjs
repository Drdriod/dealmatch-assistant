// Records the console's replay file. With a key set (LLM_PROVIDER + its key) the non-scripted
// presets are recorded from the real model; scripted presets always use the simulated stand-in.
// `node scripts/record-replays.mjs --simulated` records everything from the stand-in (no key needed).
import { readFileSync, writeFileSync } from 'node:fs';
import { runAgent } from '../src/agent.js';
import { chat, resolveProvider } from '../src/museSpark.js';
import { simulatedModel } from '../src/simulated.js';

const read = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url)));
const listings = read('demo-listings.json'), providers = read('demo-providers.json'), presets = read('presets.json');
const simulatedOnly = process.argv.includes('--simulated');
const provider = simulatedOnly ? null : resolveProvider();
if (provider && !provider.apiKey) { console.error(`${provider.keyEnv} is not set. Use --simulated for the no-key version.`); process.exit(1); }

const trim = (t) => (t.reasoning ? { ...t, reasoning: t.reasoning.slice(0, 700) } : t);
const out = [];
for (const p of presets) {
  const sim = simulatedOnly || p.scripted;
  const model = sim ? simulatedModel({ blunder: !!p.blunder }) : chat;
  const request = p.modelRequest ?? p.request;
  const r = await runAgent({ request, listings, providers, model });
  out.push({ ...p, source: sim ? 'simulated' : provider.model, recordedAt: new Date().toISOString(),
    result: { reply: r.reply, rawReply: r.rawReply, blocked: r.blocked, repaired: !!r.repaired, firstReasons: r.firstReasons ?? null, ledger: r.ledger, trace: r.trace.map(trim) } });
  console.log(`${p.id} ${sim ? 'simulated' : provider.model}  blocked=${r.blocked} repaired=${!!r.repaired}`);
}
writeFileSync(new URL('../data/replays.json', import.meta.url), JSON.stringify({ recordedAt: new Date().toISOString(), items: out }, null, 1));
console.log('saved data/replays.json');
