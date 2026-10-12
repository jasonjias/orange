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
- `server.mjs` + `public/index.html`: agent API and UI (in progress).

## Demo order (~4 min)
1. Structure: HydraDB dashboard graph + our org chart.
2. Sam asks about Clementine: nothing. Bob asks about Strawberry: blocked, "N sources withheld", owner Dana.
3. Riley asks: full answer. Riley files a Pulp bug (action). Asks again, new ticket shows up.
4. Riley's timeline viewed as Bob (hidden tasks) vs Steve (all).
5. Steve: "What's at risk across all projects?" Catches the 9.2 slip hitting Strawberry.
