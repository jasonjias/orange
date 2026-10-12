# Devpost form: paste-ready

## 1. About the project (paste everything between the lines)

---

## Inspiration

Most company AI search has a hole. It either indexes everything and hopes the prompt keeps the secrets, or it only indexes what is public and is useless.

Real companies run on **need-to-know**: you only know a project exists if someone let you in. I spent 5.5 years at Apple in pre-release qualification, where disclosure is daily life. An intern should be able to find out who owns a project. An engineer on another team should not be able to file a bug on it. The CEO should see across all of it. I wanted an AI that behaves the same way.

## What it does

**Google for your company, where your clearance decides what you find and what you can do.**

- One brain holds the whole company: contacts, disclosures, tools, documents, branding.
- Every person has an agent that acts with its owner's identity.
- Two locks decide what a person sees: **level** (contractor, employee, manager, exec) and **project disclosure**.
- Agents can act: file a bug, rerun a build, draft an exec update. Tools are gated by the same locks.
- Every action is written back into the brain and shown in a timeline that is filtered by who is looking.

| Who | What happens |
|---|---|
| Sam, intern | Asks about a hidden project. Gets "not disclosed, ask Dana." |
| Casey, contractor | Reads the one project they are disclosed on, but not the employee time-off policy. |
| Bob, engineer | Tries to file a bug on a project he is not disclosed on. The server blocks it. |
| Riley, engineer | Files the bug. It lands in the brain and the next question finds it. |
| Steve, CEO | Sees across projects and catches a release slip that makes another team's "on track" wrong. |

## How we built it

The access rule, in one line:

$$\text{see}(p, d) \iff \text{level}(p) \ge \text{level}(d) \;\wedge\; \big(\text{project}(d) = \varnothing \;\vee\; \text{project}(d) \in \text{disclosures}(p)\big)$$

| Piece | How |
|---|---|
| Database | **HydraDB**, one database for the whole company |
| Ingest | Each document goes in as `app_knowledge` with its own `acl`, computed from the rule above |
| Query | Every search carries the asker's identity as `acl`. HydraDB filters **before** any text reaches the LLM |
| Tools | Gated server-side by the same rule. A blocked call never runs, whatever the model says |
| Write-back | A filed bug is ingested into HydraDB with the right `acl`, so it becomes searchable |
| Agent | Claude, given only the documents the asker may see |
| App | Node server, vanilla JS UI, a persona switcher in place of login |

**The key design point: access is enforced in retrieval, not by asking the model to keep secrets.** The model never receives a document the asker cannot see, so there is nothing in its context to leak.

## Challenges we ran into

- **Making "blocked" mean blocked.** Tool gating had to live in the server, not the prompt.
- **Showing what was withheld without leaking it.** The agent can say "3 sources withheld, owner is Dana", but not the titles or content.
- **Indexing delay.** Written-back actions take 20 to 40 seconds to become searchable.
- **Two independent locks** (level and project) that had to compose into one `acl` list.
- **Designing the fake company** so the most interesting insight only exists across two walled-off projects.

## What we learned

- Put the permission check in the retrieval layer. Everything above it gets simpler and safer.
- Auditability comes almost free when every action is written back as a source.
- Need-to-know is a product feature, not just a compliance cost: the same data gives different, correct answers to different people.
- Keep the AI an implementation detail. The product is the clearance model.

## What's next

- Real identity (SSO) in place of the persona switcher
- Connectors for Jira, Confluence, Slack, Drive
- Disclosure requests with owner approval and expiry
- An audit view: who asked what, and what was withheld

---

## 2. Built with (tags, one per box)

hydradb · claude · anthropic · node.js · javascript · html5 · css3 · rest-api

## 3. "Try it out" links

- GitHub repo: the repo has no remote yet. Push it public, then paste the URL.
- Leave a live demo link out unless you deploy it (the agent runs `claude -p` locally).

## 4. Image gallery (3:2, e.g. 1500x1000, 5 MB max)

1. Org chart with the persona switcher
2. Bob blocked: "N sources withheld, owner Dana"
3. Riley's full answer plus the filed Pulp bug
4. Riley's timeline as Bob (hidden items) next to the same timeline as Steve (all items)
5. Steve catching the OrangeOS 9.2 slip hitting Strawberry
6. HydraDB dashboard graph

Thumbnail / logo: `public/orange.png`

## 5. Video demo link

YouTube or Vimeo URL, after the 10:00 PM final cut.
