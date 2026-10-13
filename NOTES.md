# Hackathon notes (Oct 12 2026)

- Demo: 2 minutes, high-level. Drew 5-6 judge questions. Lesson: keep the pitch high-level, save the granular details (audit trails, accountability) for Q&A.
- What landed: role-based access control (RBAC) on a company brain. What the brain retrieves depends on who is asking. It answered the judges' security questions before they asked.
- Architecture line: frontier model + gated RAG, not one model that knows everything. A model can't un-know a salary; you can control what it fetches.
- Where it goes: brain as dispatcher to specialist agents (HR, Workday, payments, Jira, stocks, news). Hierarchical multi-agent system that mirrors the org chart. Disclosure tags on the data, not per agent.
- Submission: main entry = role-based company brain. Alternate angle = scaling out to departments and services (in DEVPOST.md "What's next").
