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
