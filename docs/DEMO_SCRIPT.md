# 3-minute demo video script

Record the Agent Console (`npm run demo`, replay mode) in a browser, full screen, one take per segment. Total target 2:50. Keep the on-screen labels (SIMULATED, recorded run) visible.

**0:00-0:15 Opening line (required by the organizers)**
"DealMatch is an existing Nigerian marketplace for places and people. What existed before this hackathon: the marketplace itself. What I built this week: this agent, in a new public repo, running on Muse Spark Open." (Show the console header.)

**0:15-0:45 The problem**
"In Nigeria, finding a flat or an artisan means paying an agent, sharing numbers, and hoping. DealMatch's rule is: pay first, then the number. So an AI helper has one job it must never get wrong: it cannot leak a contact, and it cannot invent facts."

**0:45-1:25 Demo 1: Pidgin search, with evidence**
Click "Pidgin: cheap 2 bedroom". Narrate as the trace plays: "Muse Spark Open reads Pidgin, decides to call the search tool, gets two flats back. Every price, bedroom count and area carries an evidence id and a trust level: verified, stated or inferred." Click an [E1] chip to highlight its ledger row.

**1:25-2:00 Demo 2: privacy and attack**
Click "Ask for the landlord's number": "Phone numbers are stripped before the model ever sees a listing, so it cannot reveal what it never receives." Then "Plumber (listing hides an attack)": "This listing has an instruction hidden in its description. It was removed before the model saw it."

**2:00-2:35 Demo 3: the guard**
"The guard is plain code, not a model, so it cannot be talked out of it." Click "Guard demo" and say clearly: "This one is scripted, to show the mechanism." Show the rejected draft with the wrong price, the plain-language reason, the rewritten answer. Then: "On real Muse Spark Open runs, the guard caught the model calling a provider verified with the wrong label, and doing its own arithmetic. Each was rejected and rewritten."

**2:35-2:55 Numbers and open weights**
"A 60-case evaluation, including 12 bait-for-a-phone-number cases and 11 adversarial ones: zero leaks, every final answer safe." (Show the README results table.) "Understanding, tool calls and answers run on Muse Spark Open through Baseten; the safety checks run in code."

**2:55-3:00 Close**
"DealMatch Assistant: ask in English or Pidgin, and nothing it says is unverified or unsafe. Repo link on screen."

## Do before recording
- Make sure the replay file is the real-model recording (`npm run record`), not the simulated one.
- State on screen or in voice that sample data is used and the guard demo is scripted.
- Do not show your API key or terminal history.
