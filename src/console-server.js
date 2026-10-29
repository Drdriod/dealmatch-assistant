// Agent Console server. No dependencies: `npm run console`, then open http://localhost:3000
// REPLAY mode (default, no account or key): plays recorded runs. LIVE mode: set LLM_PROVIDER and its key.
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { runAgent } from './agent.js';
import { chat, resolveProvider } from './museSpark.js';

const here = (p) => new URL(p, import.meta.url);
const read = (f) => JSON.parse(readFileSync(here(`../data/${f}`)));
const listings = read('demo-listings.json'), providers = read('demo-providers.json');
const replays = read('replays.json');

let provider = null;
if (!process.argv.includes('--replay')) { try { const p = resolveProvider(); if (p.apiKey) provider = p; } catch { /* stay in replay mode */ } }
const mode = provider ? 'live' : 'replay';
const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();

const hits = [];
const limited = () => { const now = Date.now(); while (hits.length && now - hits[0] > 60000) hits.shift(); hits.push(now); return hits.length > 20; };
const send = (res, code, body, type = 'application/json') => { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(typeof body === 'string' ? body : JSON.stringify(body)); };
const slim = (r, extra = {}) => ({ reply: r.reply, rawReply: r.rawReply, blocked: r.blocked, repaired: !!r.repaired, firstReasons: r.firstReasons ?? null, ledger: r.ledger, trace: r.trace, ...extra });

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) return send(res, 200, readFileSync(here('../public/index.html'), 'utf8'), 'text/html; charset=utf-8');
    if (req.method === 'GET' && req.url === '/api/config') return send(res, 200, {
      mode, model: provider?.model ?? null, recordedAt: replays.recordedAt,
      presets: replays.items.map(({ id, label, group, request, scripted, source }) => ({ id, label, group, request, scripted: !!scripted, source })) });
    if (req.method === 'POST' && req.url === '/api/chat') {
      let body = ''; for await (const c of req) { body += c; if (body.length > 4000) return send(res, 413, { error: 'too_long' }); }
      const { message = '', presetId } = JSON.parse(body || '{}');
      if (!message.trim() || message.length > 500) return send(res, 400, { error: 'bad_message' });
      const preset = replays.items.find((p) => p.id === presetId) ?? replays.items.find((p) => norm(p.request) === norm(message));
      // Scripted presets and every preset in replay mode play the recording.
      if (preset && (mode === 'replay' || preset.scripted)) return send(res, 200, { mode: 'replay', source: preset.source, recordedAt: preset.recordedAt, scripted: !!preset.scripted, request: preset.request, result: preset.result });
      if (mode === 'replay') return send(res, 200, { error: 'replay_only', message: 'Replay mode only has recorded conversations. Pick one of the examples, or set a model key to ask your own (see README).' });
      if (limited()) return send(res, 429, { error: 'slow_down' });
      const r = await runAgent({ request: message, listings, providers, model: chat });
      return send(res, 200, { mode: 'live', source: provider.model, request: message, result: slim(r) });
    }
    send(res, 404, { error: 'not_found' });
  } catch (e) { send(res, 500, { error: 'server_error', message: String(e.message).slice(0, 200) }); }
});
const port = Number(process.env.PORT || 3000);
server.listen(port, () => console.log(`Agent Console on http://localhost:${port}  (${mode.toUpperCase()} mode${provider ? `, ${provider.model}` : ', no key needed'})`));
