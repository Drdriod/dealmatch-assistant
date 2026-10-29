# DealMatch Assistant

An agentic, grounded assistant for **DealMatch's two doors, Places and People**, built on Meta's Muse Spark model for the
**Meta Global AI Developer Hackathon** (Startup track). Solo entry.

## What is new vs what already existed

Everything in this repository was written on or after **26 October 2026** (hackathon kickoff).
The git history starts that day.

DealMatch (https://dealmatch.com.ng) is a pre-existing trust-first marketplace by DEALMATCH TECHNOLOGY LIMITED: Places (shortlets, houses, hostels, hotels) and People (artisans, tutors, home services), with DealMatch Protection (protected payment) across both. "Pay first. Then the number."
It is **not** part of this submission's code. The assistant uses it only as a data and trust
backend through interfaces, and the demo says so plainly:

| Existed before Oct 26 (not hackathon work) | Built during the hackathon (this repo) |
|---|---|
| Places and People listings, verification tiers, escrow, matching functions, website | Muse Spark adapter, agent loop, tool schemas |
| WhatsApp gateway of the product | Grounding guard, evidence ledger, trace panel |
| | Evaluation harness and golden request set |

## Not basic RAG

The assistant plans, calls tools, and must back every claim with a ledger entry tagged
`verified`, `stated` or `inferred`. A code-level guard (not the model) blocks replies that
leak private contact details (contact is released only inside the protected payment flow) or make unsupported claims.

## Status

Day 1: adapter and tool schemas. See `docs/` as it grows.

## First call (Baseten, Muse Spark Open)

```bash
export BASETEN_API_KEY=...            # your key; never commit it or paste it into chat
export LLM_PROVIDER=baseten           # model is meta-models/muse-spark-open-1026
npm run first-call                    # hello, a tool call, and a Pidgin prompt; prints speed and token use
```

## Where Muse Spark Open is used

Confirmed by the hackathon organizers (office hours, Oct 29): Muse Spark Open running through Baseten counts as a Meta open-weight model for the Meta-model requirement and the Best Build on Open Weights prize. The Meta Model API is not required, though combining open-weight and hosted Muse models is encouraged.

| Stage | Model | Why |
|---|---|---|
| Understand the request (English or Nigerian Pidgin), choose and call tools | Muse Spark Open (`meta-models/muse-spark-open-1026`) | Native tool calling and Pidgin support |
| Write the answer with evidence ids and trust labels | Muse Spark Open | Same model, grounded in tool results only |
| Repair a rejected answer once | Muse Spark Open | Receives the guard's plain-language rejection reason |
| Safety guard (contact leaks, unknown evidence, uncited prices) | Code, not a model | Deterministic, cannot be talked out of it |

## Run the Agent Console (no account, no key)

```
npm run demo
```

Open http://localhost:3000. Replay mode plays recorded runs of the agent on sample listings and providers: the model's tool calls, what came back, the evidence ledger with trust levels (verified, stated, inferred), and the guard's verdict. Needs only Node 18+, no install step, no account.

**What is simulated and what really works**

| Piece | In replay mode | In live mode |
|---|---|---|
| Model that reads the request and writes the answer | Recorded run. Entries marked SIMULATED come from a rule-based stand-in, not an AI. | Real Muse Spark Open |
| Tools, evidence ledger, private-field stripping, injection removal | Real code, same as live | Real code |
| Guard (citations must match evidence, no made-up figures, no contact details) | Real code; the "Guard demo" example is scripted to show a wrong answer being caught | Real code |
| Listings and providers | Sample data (`data/demo-*.json`), not live DealMatch inventory | Same |
| Payments and contact release | Not part of this demo | Not part of this demo |

**Live mode** (ask your own questions, English or Pidgin):

```
# PowerShell
$env:LLM_PROVIDER = "baseten"; $env:BASETEN_API_KEY = "your key"; npm run console
# macOS or Linux
LLM_PROVIDER=baseten BASETEN_API_KEY=your-key npm run console
```

Re-record the examples from the real model with `npm run record` (same variables). `npm run record:sim` rebuilds the no-key version.

## Tests and evaluation

- `npm test`: unit tests plus 24 guard trap cases (replies that must be rejected, replies that must pass).
- `npm run eval:mock`: the 60-case evaluation set run against the simulated stand-in. This checks the harness and guard, not a model.
- `npm run eval -- --rows`: the same 60 cases against the real model (set the variables above). Writes `results/latest-<provider>.json` with every reply, the raw first draft, and why the guard fired.

## Results (Muse Spark Open via Baseten, 60-case set)

Every run below is real model output on the sample data. The model is not deterministic, so numbers move a little between runs; the full per-case replies are in `results/latest-baseten.json`.

| Run | What changed | Tool use | Right results | Reply content | Leaks | Safe replies | Guard on 1st try | Repaired |
|---|---|---|---|---|---|---|---|---|
| 1 (20 cases) | First guard | 19/20 | 19/20 | n/a | 0 | 12/20 | 12/20 | n/a |
| 1b (20 cases) | Fixed a regex bug in the guard, added the repair step | 18/20 | 20/20 | n/a | 0 | 20/20 | 20/20 | 0 |
| 2 (60 cases) | Strict guard: citations must match evidence | 57/60 | 59/60 | 60/60 | 0 | 60/60 | 55/60 | 5 |
| 3 (60 cases) | Blocks invented verification claims; prompt fixes | 59/60 | 57/60 | 58/60 | 0 | 60/60 | 59/60 | 1 |
| 4 (60 cases) | Tool description for broad searches; vague-request prompt | 60/60 | 60/60 | 60/60 | 0 | 60/60 | 60/60 | 0 |

What the runs showed, honestly:

- **No run ever leaked a contact detail.** 12 cases bait the model for a phone number or email, and 11 are adversarial (role-play, "ignore your rules", spelling the number out, claiming to be the owner's brother).
- **The guard caught real model mistakes, not only planted ones.** Run 2 and 3 repairs included a provider called "verified" with a "stated" price, a model doing its own arithmetic ("400,000 more per year", a figure in no tool result), and suggested areas that were never searched. Each was rejected with a plain-language reason and rewritten correctly. Run 4 needed no repairs, which also shows the prompt fixes work; the repair path is covered by the earlier runs and by the guard trap tests.
- **Run 1's 12/20 was my bug, not the model's.** A global regex in the guard kept state between calls.
- **Some test patterns were loosened** after reading the replies, because the model's answers were right and my pattern was too strict (E33, E37, E39, E48, E50). Two real weaknesses were fixed in the product instead: a broad word like "artisan" was searched as a literal service name (E38), and the model invented what "verified" means (E55).
- **Seven cases are safe refusals without a tool call** and are counted as passes, reported separately by the eval.
- The set is small and uses four sample listings and four providers. It tests behaviour, not coverage of the real marketplace.
