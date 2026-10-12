# Devpost copy

## Project name

Pick one:

1. **Orange Company Brain**
2. **Need to Know**

## Elevator pitch (under 200 characters)

Google for your company. Each person's AI agent searches one shared brain, but HydraDB filters by their clearance first, so it can't leak what it never saw.

## Inspiration

Most company AI search has a hole. It either indexes everything and hopes the prompt keeps secrets, or it only indexes what is public and is useless. Real companies run on need-to-know: you know a project exists only if someone told you.

Jason, the builder, spent 5.5 years at Apple in pre-release qualification and integration, where need-to-know disclosure is daily life. An intern should find out who owns a project. An engineer on another team should not be able to file a bug on it. A CEO should see across all of it. We wanted an AI that behaves the same way.

## What it does

Orange Company Brain is "Google for your company, where your clearance decides what you find and what you can do."

- One brain holds the whole company: contacts, disclosures, tools, documents, branding.
- Every person has an agent. It acts with its owner's identity.
- Two locks decide what a person sees: **level** (contractor, employee, manager, exec) and **project disclosure** (were you let in on that project).
- The agent can also act: file a bug, rerun a build, draft an exec update. Tools are gated by the same locks.
- Every action is written back into the brain as a new source, and shown in a per-person timeline that is filtered by who is looking.

| Who | What happens |
|---|---|
| Sam, intern | Asks about a hidden project. Gets "not disclosed, ask Dana". |
| Casey, contractor | Can read the one project she is disclosed on, but not the employee time off policy. |
| Bob, engineer | Tries to file a bug on a project he is not disclosed on. The server blocks it. |
| Riley, engineer | Files the bug. It is saved to the brain and reuses her past defaults. |
| Steve, CEO | Sees across projects and catches a release slip that makes another project's "on track" wrong. |

**The key design point: access is enforced in retrieval, not by prompting the model to keep secrets.** The model only ever receives documents the asker is allowed to see. There is no secret in its context to coax out, so no clever prompt can leak one.

## How we built it

| Piece | How |
|---|---|
| Database | **HydraDB**, one database for the whole company. |
| Ingestion | Each document goes in as `app_knowledge` with its own `acl` (the people allowed to see it), computed from level and project. |
| Query | Every search carries the asker's identity as `acl`. HydraDB filters before any text reaches the LLM. |
| Tools | Gated server-side by the same rule. A blocked tool call never runs, whatever the model says. |
| Write-back | A filed bug is ingested into HydraDB as a new source with the right `acl`, so the next question finds it. |
| Memory | Past actions feed defaults, so Riley's next ticket reuses P2 and Watch firmware. |
| Graph | Declared relations between sources build the hub graph: a hub with 5 spokes, lit or greyed by who is viewing. |
| App | Node server, vanilla JS UI, a persona switcher in place of login. |
| Agent LLM | Claude. |

Access rule: a person sees a document only if their level is at least the document's level, **and** the document has no project or the person is disclosed on that project.

## Challenges

- Making "blocked" mean blocked. Tool gating had to live in the server, not in the prompt.
- Showing what was withheld without leaking it: the agent can say "N sources withheld" and who owns the project, but not the content or even the titles.
- Indexing delay after ingest (about 20 to 40 seconds) when we write actions back.
- Two independent locks (level and project) that had to compose cleanly into a single `acl` list.
- Designing fake company data where the interesting insight only exists across two walled-off projects.

## Accomplishments

- A cross-project contradiction that only the person with the full view can find. The agent catches it, and no one else's can.
- The same rule governs search, tools, the graph view, and the timeline.
- A full read, act, remember loop on one database, in a day.
- A demo where the intern and the contractor behave as inverses, which shows level and disclosure really are separate.

## What we learned

- Put the permission check in the retrieval layer. Everything above it gets simpler and safer.
- Auditability comes almost free when actions are written back as sources.
- Need-to-know is a product feature, not just a compliance cost: the same data gives different, correct answers to different people.
- Keep the AI as an implementation detail. The product is the clearance model.

## What's next

- Port onto digohq/app-starter so real org roles and SSO set each person's HydraDB acl, replacing the persona switcher.
- Connectors for real tools: Jira, Confluence, Slack, Drive.
- Disclosure requests: ask the owner for access, with approval and expiry.
- Audit view for security teams: who asked what, what was withheld.
- Revocation that takes effect immediately across the graph.

## Built with

HydraDB, Claude, Node.js, JavaScript, HTML, CSS, REST API
