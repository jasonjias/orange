# Orange Company Brain (hackathon, Oct 12 2026)

Snowflake / TechEquity Ai "Company Brain" hackathon. Devpost entry due 4:00 PM, final video 10:00 PM.
Must use HydraDB (prize track). Keep it simple, ship fast. No auth: a persona switcher fakes login.

## Pitch
"Google for your company, where your clearance decides what you find and what you can do."
One all-knowing brain (HydraDB). Each person has an agent. The agent searches the brain with its
owner's identity as `acl`, so HydraDB returns only what that person is disclosed on. Tools are gated
by the same disclosures. Every action is written back into the brain (memory + timeline).

## Fake company: Orange (data/orange.json)
| Person | Role | Disclosed on |
|---|---|---|
| Steve | CEO | clementine, strawberry, navel, exec (everything) |
| Dana | VP Watch | clementine, strawberry |
| Riley | Watch engineer | clementine, strawberry |
| Sam | new hire on Watch | none |
| Morgan | VP OrangeOS | navel |
| Bob | OrangeOS engineer | navel |
| Priya | Brand lead | none |

Tools: Pulp (bug tracker, the Jira), Peel (wiki), Zest (chat), Grove (org chart), Press (CI), Seed (disclosures).
Hidden payoff: Strawberry notes say "OrangeOS 9.2 on track"; Navel notes say 9.2 slipped 3 weeks.
Only Steve sees both, so only Steve's agent catches that Strawberry is at risk.

## HydraDB facts (verified)
- Base `https://api.hydradb.com`, headers `Authorization: Bearer $HYDRA_DB_API_KEY`, `API-Version: 2`.
- Database: `company_brain` (in `.env` as HYDRA_DB). Data lives in an auto collection; omit `collection`.
- Ingest: `POST /context/ingest` multipart, `type=knowledge`, `app_knowledge` = JSON array of
  `{id,title,type,timestamp,content:{text},additional_metadata,acl:[emails]}`. No acl = open.
- Query: `POST /query` JSON `{database, query, type:"knowledge", acl:[email]}`. Results in `chunks[]`
  (`id`, `chunk_content`, `source_title`). No acl on query = unfiltered (admin view).
- Indexing takes ~20-40 s after ingest before results appear.
- ACL verified: Bob gets navel only, Riley strawberry only, Steve both.

## Files
- `lib.mjs` config, HydraDB client, acl helpers. `ingest.mjs` loads data (`node ingest.mjs`).
- `server.mjs` (DONE, `node server.mjs`, port 3000). Agent LLM = local `claude -p --model sonnet`, ~10-20 s per ask.
  - `POST /api/ask {as:"riley", message}` -> `{answer, action:{tool,status:"done"|"blocked",result}|null, sources:[{id,title}], withheld:N}`
  - `GET /api/timeline?as=<viewer>&of=<person>` -> `{items:[{who,when,project,tool,summary}], hidden:N}`
  - `GET /api/org` -> `{company, people, projects, tools}`
  - State in `state/timeline.json` (delete it to reset the demo). Filed bugs are ingested back into HydraDB.
- `public/index.html`: UI (TODO). Static files under public/ are served by server.mjs.

## Demo order (~4 min)
1. Structure: HydraDB dashboard graph + our org chart.
2. Sam asks about Clementine: nothing. Bob asks about Strawberry: blocked, "N sources withheld", owner Dana.
3. Riley asks: full answer. Riley files a Pulp bug (action). Asks again, new ticket shows up.
4. Riley's timeline viewed as Bob (hidden tasks) vs Steve (all).
5. Steve: "What's at risk across all projects?" Catches the 9.2 slip hitting Strawberry.

## V2 CONTRACT (3:00 PM) — all parallel sessions build to this
Access rule: a person sees a doc iff `person.level >= doc.level` AND (`doc.project` is null OR `doc.project` in `person.disclosures`).
Levels: 0 contractor/public, 1 employee (engineer, intern), 2 manager, 3 exec.

People (data/orange.json `people[]`): `{id, name, title, role: ceo|manager|engineer|intern|contractor, team, level, manager, disclosures[]}`
- steve CEO Exec L3 [clementine,strawberry,navel] · dana manager Watch L2 [clementine,strawberry] · morgan manager OrangeOS L2 [navel]
- riley engineer Watch L1 [clementine,strawberry] · bob engineer OrangeOS L1 [navel] · sam intern Watch L1 [] · casey contractor Watch (display vendor liaison) L0 [clementine] · priya manager Marketing L2 []

Docs (`docs[]`): `{id, category, type, title, project|null, level, date, text}`.
`category` is one of the 5 brain spokes: `contacts | disclosures | tools | documents | branding`.
- contacts: org chart, team pages. disclosures: disclosure policy + one Seed roster per project (project-gated). tools: one doc per tool.
- documents: wiki, policies, meeting notes, Pulp tickets, board notes (L3), a manager-only doc (L2). branding: brand guide (L0), launch messaging (project-gated).

Tools (`tools[]`): `{id, name, requires_level, requires_project: bool, description}`.

lib.mjs exports (server.mjs depends on these): `ORANGE, DB, email, person, hydra, ingest, toKnowledge(doc), aclFor(doc)`, `canSeeDoc(personId, {level, project})`, `canSee(personId, project)` (project-only check, kept for compat).

Server endpoints (owned by main session): existing ones plus
- `GET /api/brain?as=<id>` -> `{hub:"Orange Company Brain", categories:[{id, label, sources:[{id,title,project,level,visible:bool}]}]}` (title shown as "Restricted" when not visible)
- `GET /api/org` people now include role and level.

File ownership: data agent = data/, lib.mjs, ingest.mjs, reset.mjs. UI agent = public/. Docs agent = DEMO.md, DEVPOST.md. Main session = server.mjs, CLAUDE.md.
