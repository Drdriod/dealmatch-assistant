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
