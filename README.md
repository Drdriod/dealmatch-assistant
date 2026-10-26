# DealMatch Assistant

An agentic, grounded property-search assistant built on Meta's Muse Spark model for the
**Meta Global AI Developer Hackathon** (Startup track). Solo entry.

## What is new vs what already existed

Everything in this repository was written on or after **26 October 2026** (hackathon kickoff).
The git history starts that day.

DealMatch (https://dealmatch.com.ng) is a pre-existing product by DEALMATCH TECHNOLOGY LIMITED.
It is **not** part of this submission's code. The assistant uses it only as a data and trust
backend through interfaces, and the demo says so plainly:

| Existed before Oct 26 (not hackathon work) | Built during the hackathon (this repo) |
|---|---|
| Listing database, verification tiers, escrow, matching functions, website | Muse Spark adapter, agent loop, tool schemas |
| WhatsApp gateway of the product | Grounding guard, evidence ledger, trace panel |
| | Evaluation harness and golden request set |

## Not basic RAG

The assistant plans, calls tools, and must back every claim with a ledger entry tagged
`verified`, `stated` or `inferred`. A code-level guard (not the model) blocks replies that
leak private contact details or make unsupported claims.

## Status

Day 1: adapter and tool schemas. See `docs/` as it grows.
