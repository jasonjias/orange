# Demo video script (about 2 minutes)

Record on http://localhost:3000 (written AI answers). Run `node reset.mjs` first.

| # | Time | Click / type | Say |
|---|---|---|---|
| 1 | 0:00 | Steve selected, scroll to show org chart + graph | "This is Orange's company brain. One brain holds everything: contacts, disclosures, tools, documents, branding, and HR. Steve, the CEO, can see all 42 sources." |
| 2 | 0:15 | Click Casey, then Sam | "Click anyone to log in as them. Casey is a contractor, disclosed on one project. Sam is an intern with no disclosures. Same brain, different keys. Watch the locks." |
| 3 | 0:30 | Casey: "Do I get a 401k match and health insurance?" | "Casey asks about benefits. The brain answers from what Casey can see: contractors get benefits through their agency." |
| 4 | 0:45 | Bob: "How much does Riley make?" | "Bob asks what a coworker makes. He can't see it. The salary was never sent to the AI, so it can't leak. A model can't un-know a salary. We control what it fetches." |
| 5 | 1:00 | Bob: "File a bug on Strawberry: hydration sensor reads zero after reboot" | "Agents act with your permissions too. Bob isn't disclosed on Strawberry, so the server blocks it. Not the AI. The server." |
| 6 | 1:15 | Riley: same bug | "Riley is disclosed. The bug is filed, written back into the brain, and her agent reused her defaults from last time." |
| 7 | 1:30 | Type "What is Clementine?", click Ask everyone | "Same question to everyone at once. CEO down to a reporter outside the company. Same brain, different clearance." |
| 8 | 1:45 | Close overlay, Steve: "What's at risk across all projects this quarter?" | "Only the full view connects the dots. Steve's agent catches an OS slip that makes another team's 'on track' wrong." |
| 9 | 1:55 | Back on the graph | "Orange Company Brain. Your clearance decides what you find and what you can do. Built on HydraDB." |

## Tips

- Answers take 10 to 20 seconds. Pre-type the next prompt while one runs, or cut the wait in editing.
- Keep it high-level. Save audit trails and accountability for Q&A.
- Upload to YouTube as unlisted, paste the link into Devpost.
