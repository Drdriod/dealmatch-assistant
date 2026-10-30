# 3-minute demo video: script and shot list

Target length 2:45 (hard limit 3:00). Record the Agent Console (`npm run demo`) in a clean browser window at 85% zoom, light theme. Keep the on-screen labels (recorded run, SIMULATED, scripted) visible.

On-screen text for the first 10 seconds (lower third):
"Existing: DealMatch marketplace  |  New this week: this AI agent"

| Time | On screen | You say |
|---|---|---|
| 0:00 | Console header + lower-third | "DealMatch is a Nigerian marketplace that already existed. This week I built something new on top of it: an AI agent running on Meta's Muse Spark Open." |
| 0:12 | Same | "The hard part: an assistant that finds you a flat or an electrician must never leak the owner's phone number, and never make up a fact. So I built it so it physically can't." |
| 0:30 | Click "Pidgin: cheap 2 bedroom"; trace plays | "I ask in Pidgin. Watch the right side. The model decides to search, gets two flats back, and answers in Pidgin." |
| 0:50 | Click an [E1] tag; table row highlights | "Every price, bedroom count and area has a tag. Click it and you see where the fact came from, and whether it's verified, stated or inferred. This flat is verified. This one is only inferred, and the assistant says so." |
| 1:20 | Click "Ask for the landlord's number" | "Now I ask for the landlord's number. It refuses and points to the protected request. It can't hand it over, because phone numbers are removed before the model ever sees a listing." |
| 1:40 | Click "Plumber (listing hides an attack)"; point at the red "Attack blocked" step | "This listing hides an instruction meant to trick the AI. It's stripped out before the model sees it." |
| 2:00 | Click "Guard demo" (scripted); show the red draft, the reason, the fixed answer | "Even so, AI makes mistakes, so every answer passes a checker that is plain code, not AI. This example is scripted: the draft says 3.2 million, the evidence says 2.8. The guard rejects it, tells the model why, and the rewrite is correct. On real runs it caught the model doing its own arithmetic and mislabelling a provider as verified." |
| 2:30 | README results table | "I tested 69 questions, a dozen of them tricks to extract a phone number. Zero leaks." |
| 2:40 | Console + repo link | "Understanding and answering run on Muse Spark Open. The safety checks are code. Sample data, public repo. DealMatch Assistant: ask in English or Pidgin, and nothing unsafe gets through." |

## Notes
- Say clearly that the guard demo is scripted and the listings are sample data. Judges rewarded that kind of label in the organizers' answers.
- Open "Model reasoning (excerpt)" once on camera at about 0:40 for two seconds. It shows the model really chooses its tools.
- Do not show your API key, terminal history or other browser tabs.
- For X: if the platform limits your upload length, cut a 2:00 version (drop the plumber segment) and put the full video on YouTube (unlisted is fine) in the reply.


---

## FINAL ONE-TAKE VERSION: Uyo first, Lagos as the bonus (about 2:15)

The number 69 and "zero leaks" come from eval run 5 (results/latest-baseten.json).

1. [Header on screen] "DealMatch is a Nigerian marketplace that already existed. What I built this week is new: this AI assistant, running on Meta's Muse Spark Open. I built it around Uyo, a city I know well, and it works in other cities too."
2. "The hard part: an assistant that helps people find a flat or an electrician must never leak the owner's phone number, and never make up a fact."
3. Click "Pidgin: self-contain in Uyo". "I ask in Pidgin. Muse Spark Open reads it, searches the listings, and answers in Pidgin. Every price and bedroom count has a tag." Click an E1 tag. "Click one, and the table shows where it came from, and whether it's verified, stated or inferred."
4. Click "Ask for the landlord's number (Uyo flat)". "Now I ask for the landlord's number. It refuses. Phone numbers are removed before the model ever sees a listing, so it can't reveal what it never receives."
5. Click "Plumber in Uyo (listing hides an attack)". "This listing hides an instruction meant to trick the AI. It's stripped out before the model sees it."
6. Click "Guard demo". "Even so, AI makes mistakes, so every answer goes through a checker that's plain code. This example is scripted: the draft says 1.6 million, the evidence says 1.2. The guard rejects it, the model rewrites it, and the answer is correct."
7. Click "Pidgin: cheap 2 bedroom" under "Also works in Lagos". "And it's not just Uyo. Same assistant, same guard, in Lagos."
8. "I tested 69 questions across Uyo and Lagos, including tricks to get a phone number. Zero leaks. The model reads, searches and writes; the safety checks are code. It all runs on sample data, and the code is public. DealMatch Assistant: ask in English or Pidgin, and nothing unsafe gets through."

## X post text
Can an AI find you a flat in Uyo, or Lagos, without ever leaking the landlord's number? I built one this week on Meta's Muse Spark Open. It speaks English and Pidgin, labels every fact verified, stated or inferred, and a code-based guard rejects wrong answers. In my 69-question test: zero leaks. Code: https://github.com/Drdriod/dealmatch-assistant
