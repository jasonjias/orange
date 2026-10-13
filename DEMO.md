# Demo script (4 minutes)

Pitch: **Google for your company, where your clearance decides what you find and what you can do.**

## Setup checklist

| Done | Step |
|---|---|
| [ ] | Server running: `node server.mjs` (port 3000) |
| [ ] | Reset state: `node reset.mjs` (clears filed bugs and timeline, restores the seed data) |
| [ ] | Browser tab 1: http://localhost:3000, view as **Steve** |
| [ ] | Browser tab 2: HydraDB dashboard, graph tab: https://dashboard.hydradb.com/graph |
| [ ] | Warm up: ask any one question as Steve so the first real answer is not cold |
| [ ] | Prompts below copied into a notes file, ready to paste |

Answers take 10 to 20 seconds. Say your line while you wait.

## Beats

| # | Time | View as | Prompt (paste exactly) |
|---|---|---|---|
| 1 | 0:00 | Steve | none |
| 2 | 0:35 | Steve | none |
| 3 | 1:00 | Sam | `What is Clementine?` |
| 4 | 1:30 | Casey | `What is Clementine?` then `What's our time off policy?` |
| 5 | 2:00 | Bob | `File a bug on Strawberry: calibration drift is still 4% after the new curve.` |
| 6 | 2:20 | Riley | same prompt as beat 5 |
| 7 | 3:10 | Steve | `What's at risk across all projects this quarter?` |

### 1. The brain (0:00)

- **Click:** view as Steve. Show the hub graph.
- **Audience sees:** one hub, "Orange Company Brain", with 6 areas: contacts, disclosures, tools, documents, branding, people & HR. Every source node is lit.
- **Data sources behind it:** org chart and team pages (contacts), disclosure policy and a Seed roster per project (disclosures), one page per tool (tools), wiki, meeting notes, Pulp tickets, board notes (documents), brand guide and launch messaging (branding).
- **Optional:** flip to the HydraDB dashboard graph tab to show the same sources live in the database.
- **Say:** "One brain for the whole company. Steve is the CEO, so everything is lit."

### 2. The org chart (0:35)

- **Click:** open the org chart panel.
- **Audience sees:** Steve (CEO), managers Dana, Morgan, Priya, engineers Riley and Bob, intern Sam, contractor Casey. Each has a level and a disclosure list.
- **Point out the two locks:**

| Lock | Question it asks | Example |
|---|---|---|
| Level | Is your level high enough for this document? | Board notes need L3. Managers only doc needs L2. |
| Project disclosure | Were you told about this project? | Clementine is open only to people disclosed on Clementine. |

- **Rule:** you see a document only if your level is high enough **and** you are disclosed on its project.
- **Say:** "Two locks. How senior you are, and whether you were let in on that project."

### 3. Sam, the intern (1:00)

- **Click:** view as Sam. Paste: `What is Clementine?`
- **Audience sees:** a plain "I don't know what Clementine is." No owner, no hint. The graph greys out the project nodes.
- **Say:** "Sam is new. She can find out who to ask, and nothing else."

### 4. Casey, the contractor (1:30)

- **Click:** view as Casey (level 0, disclosed on Clementine). Paste `What is Clementine?`, then `What's our time off policy?`
- **Audience sees:** Clementine works. The time off policy is restricted. Graph: Clementine nodes lit, employee-level documents grey.
- **Say:** "The inverse of the intern. Lowest level in the company, but let in on one project. Level and disclosure are separate locks."

### 5. Bob, blocked (2:00)

- **Click:** view as Bob (OrangeOS, not disclosed on Strawberry). Paste: `File a bug on Strawberry: calibration drift is still 4% after the new curve.`
- **Audience sees:** a red "Blocked" action. The reason comes from the server. Nothing is filed.
- **Say:** "That block did not come from the AI being polite. The server refused. The model never gets a vote."

### 6. Riley, allowed (2:20)

- **Click:** view as Riley. Paste the same prompt.
- **Audience sees:** a new ticket, **PULP-412**, filed. It used her defaults from memory: **P2, Watch firmware**, and the answer says so. The ticket shows up as a new source in the brain.
- **Then:** open Riley's timeline. View it as Bob: some tasks are hidden, with a count. View it as Steve: all of them.
- **Say:** "Same request, same words. Riley is disclosed, so it works, and the action is written back into the brain. Bob sees less of Riley's history than Steve does."

### 7. Steve, the dots (3:10)

- **Click:** view as Steve. Paste: `What's at risk across all projects this quarter?`
- **Audience sees:** the agent flags that **OrangeOS 9.2 slipped three weeks** (Navel sync). Strawberry ships on 9.2 and its notes still say "on track". It reports Strawberry at risk.
- **Say:** "Each team's notes are consistent. The conflict only exists across two projects, and only Steve is cleared to read both. Nobody else's agent could have caught it."

## Close (3:45)

"Google for your company, where your clearance decides what you find and what you can do. The filter runs inside retrieval, so there is nothing to talk the model out of."

## If something breaks

| Problem | Do this |
|---|---|
| Answer is slow (over 20 s) | Narrate the graph: which nodes are lit, which are grey, and why. Answer arrives when it arrives. |
| Answer is empty or odd | Re-send the same prompt once. If it fails again, move on and show the withheld count and graph instead. |
| Demo state is messy (extra tickets, wrong timeline) | Stop, run `node reset.mjs`, reload the page. |
| Server down | `node server.mjs` in a terminal, reload the page. |
| HydraDB dashboard will not load | Skip it. The in-app hub graph shows the same structure. |
| Beat 6 does not say P2 and Watch firmware | Reset, then re-run beat 6 first. The defaults come from Riley's past tickets. |
| Order matters | Always beat 5 then 6 on a fresh reset, so PULP-412 is the first new ticket. |
