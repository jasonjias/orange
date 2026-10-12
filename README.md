<img src="public/orange.png" width="88" alt="Orange">

# Orange Company Brain

**Google for your company, where your clearance decides what you find and what you can do.**

Built in one day for the Snowflake / TechEquity AI "Company Brain" hackathon (Oct 12, 2026), HydraDB track.

One brain holds the whole company. Every person has an agent. The agent searches the brain **as its owner**, so HydraDB only returns what that person is cleared for. Tools are gated by the same rule, and every action is written back into the brain.

## The idea

Most company AI search either indexes everything and hopes the prompt keeps secrets, or indexes only what is public. Real companies run on **need-to-know**.

Here, access is enforced in **retrieval**, not by prompting. The model never receives a document the asker cannot see, so there is nothing in its context to leak.

A person sees a document only if both locks open:

```
person.level >= doc.level   AND   (doc.project is null  OR  doc.project in person.disclosures)
```

Levels: 0 contractor/public, 1 employee, 2 manager, 3 exec.

## The fake company: Orange

| Person | Role | Level | Disclosed on |
|---|---|---|---|
| Steve | CEO | 3 | clementine, strawberry, navel |
| Dana | VP Watch | 2 | clementine, strawberry |
| Morgan | VP OrangeOS | 2 | navel |
| Priya | Brand lead | 2 | none |
| Riley | Watch engineer | 1 | clementine, strawberry |
| Bob | OrangeOS engineer | 1 | navel |
| Sam | Intern, Watch | 1 | none |
| Casey | Display vendor liaison (contractor) | 0 | clementine |

Internal tools: **Pulp** (bugs), **Peel** (wiki), **Zest** (chat), **Grove** (org chart), **Press** (CI), **Seed** (disclosures).

The hidden payoff: Strawberry's notes say "OrangeOS 9.2 on track". Navel's notes say 9.2 slipped 3 weeks. Only Steve can see both, so only Steve's agent catches that Strawberry is at risk.

## What you can try

| As | Do | What happens |
|---|---|---|
| Sam | Ask about Clementine | Nothing disclosed. Told who to ask |
| Bob | File a bug on Strawberry | Blocked by the server, sources withheld |
| Riley | File the same bug | Done. Ticket is written back to HydraDB and shows up in later answers |
| Anyone | Click an orange node in the brain graph | Read that source. Locked nodes stay locked |
| Bob vs Steve | View Riley's timeline | Bob sees hidden-task count, Steve sees everything |
| Steve | "What's at risk across all projects?" | Catches the 9.2 slip hitting Strawberry |

## How it works

| Piece | How |
|---|---|
| Brain | One HydraDB database. Each doc is ingested as `app_knowledge` with its own `acl` (the emails allowed to see it) |
| Search | Every query carries the asker's email as `acl`. HydraDB filters before any text reaches the LLM |
| Agent | Claude (`claude -p --model sonnet`), given only the chunks the asker may see |
| Tools | Checked server-side with the same rule. A blocked call never runs, whatever the model says |
| Write-back | Filed bugs are ingested into HydraDB with the right `acl` and added to the timeline |
| UI | Vanilla JS. Org chart doubles as a persona switcher (no auth) |

## Run it

Needs Node 20+, a HydraDB API key, and the `claude` CLI logged in.

```bash
cat > .env <<'EOF'
HYDRA_DB_API_KEY=your_key
HYDRA_DB=company_brain
EOF
node ingest.mjs     # load data/orange.json into HydraDB (indexing takes ~20-40 s)
node server.mjs     # http://localhost:3000
```

Reset the demo (clears the timeline and deletes bugs filed during demos):

```bash
node reset.mjs
```

## API

| Endpoint | Returns |
|---|---|
| `POST /api/ask {as, message}` | `{answer, action, sources, withheld}` |
| `GET /api/brain?as=<id>` | Hub, 5 categories, each source marked visible or "Restricted" |
| `GET /api/doc?as=<id>&id=<doc>` | Full source if visible, else 403 with no details |
| `GET /api/timeline?as=<viewer>&of=<person>` | That person's actions the viewer may see, plus a hidden count |
| `GET /api/org` | People, projects, tools |

## Files

| File | What |
|---|---|
| `data/orange.json` | The whole fake company: people, projects, tools, docs |
| `lib.mjs` | Config, HydraDB client, access rule |
| `ingest.mjs` | Loads the brain into HydraDB |
| `reset.mjs`, `fix-acl.mjs` | Demo reset, force-update stored acls |
| `server.mjs` | API, agent, tool gating, write-back |
| `public/` | UI |
