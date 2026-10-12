// Orange company brain: per-person agents over one HydraDB brain.
// POST /api/ask {as, message} -> {answer, sources, withheld, action}
// GET  /api/timeline?as=<viewer>&of=<person> -> {items, hidden}
// GET  /api/org -> people, projects, tools
// GET  /api/brain?as=<id> -> hub + 5 categories with per-viewer visibility
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import * as lib from "./lib.mjs";
const { ROOT, DB, ORANGE, email, person, canSee, hydra, ingest, toKnowledge } = lib;
// v2 rule: level AND project disclosure. Falls back to project-only if lib is older.
const canSeeDoc = (id, doc) => (lib.canSeeDoc ? lib.canSeeDoc(id, doc) : canSee(id, doc.project));

const PORT = Number(process.env.PORT || 3000);
const STATE = path.join(ROOT, "state");
const TIMELINE = path.join(STATE, "timeline.json");
fs.mkdirSync(STATE, { recursive: true });

// Seed history so timelines are not empty on first load.
const SEED_TIMELINE = [
  { who: "riley", when: "2026-10-03T10:12:00", project: "clementine", tool: "pulp.file_bug", summary: "Filed PULP-388: Clementine display flicker at low brightness (P1, Display team)" },
  { who: "riley", when: "2026-10-08T16:40:00", project: "strawberry", tool: "press.rerun_build", summary: "Reran Strawberry nightly build: failed on test_calibration_curve" },
  { who: "riley", when: "2026-10-09T09:05:00", project: "strawberry", tool: "pulp.file_bug", summary: "Filed PULP-401: Strawberry calibration unit tests failing (P2, Watch firmware)" },
  { who: "riley", when: "2026-10-10T11:30:00", project: null, tool: "grove.who_owns", summary: "Looked up who owns OrangeOS builds: Bob Smith" },
  { who: "bob", when: "2026-10-07T14:22:00", project: "navel", tool: "pulp.file_bug", summary: "Filed PULP-395: Navel memory regression on Orange Watch (P0, OrangeOS performance)" },
  { who: "bob", when: "2026-10-09T17:10:00", project: "navel", tool: "press.rerun_build", summary: "Reran Navel build with memory fix attempt 1: memory still 1.3x budget" },
  { who: "dana", when: "2026-10-06T15:00:00", project: "clementine", tool: null, summary: "Ran Clementine weekly sync: yield 61%, decision point Nov 15" },
  { who: "steve", when: "2026-10-05T08:00:00", project: "exec", tool: "exec.weekly_update", summary: "Drafted Q4 board prep notes" },
];
const loadTimeline = () => (fs.existsSync(TIMELINE) ? JSON.parse(fs.readFileSync(TIMELINE, "utf8")) : SEED_TIMELINE);
const saveTimeline = (t) => fs.writeFileSync(TIMELINE, JSON.stringify(t, null, 1));

let nextBug = 412;

// ---------- brain search ----------
async function search(as, query, max = 25) {
  const base = { database: DB, query, type: "knowledge", query_by: "hybrid", mode: "fast", max_results: max };
  const [mine, all] = await Promise.all([
    hydra("POST", "/query", { ...base, acl: [email(as)] }),
    hydra("POST", "/query", base), // unfiltered, used only to count what was withheld
  ]);
  const seen = new Set((mine.chunks || []).map((c) => c.id));
  const withheld = new Set((all.chunks || []).map((c) => c.id).filter((id) => !seen.has(id)));
  return { chunks: mine.chunks || [], withheld: withheld.size };
}

// ---------- LLM (local claude CLI) ----------
function llm(prompt) {
  return new Promise((resolve, reject) => {
    const p = spawn("claude", ["-p", "--model", "sonnet", "--tools", "", "--no-session-persistence", "--setting-sources", ""], {
      cwd: STATE,
      env: process.env,
    });
    let out = "", err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => (code === 0 ? resolve(out.trim()) : reject(new Error(err || `claude exited ${code}`))));
    p.stdin.end(prompt);
  });
}

function parseJson(text) {
  const m = text.match(/\{[\s\S]*\}/);
  try { return JSON.parse(m ? m[0] : text); } catch { return { answer: text }; }
}

// ---------- tools, enforced server-side ----------
function toolAllowed(as, tool, project) {
  const t = ORANGE.tools.find((x) => x.id === tool);
  if (!t) return { ok: false, why: `Unknown tool ${tool}` };
  const me = person(as);
  const needLevel = t.requires_level ?? (t.requires === "exec" ? 3 : 0);
  const needProject = t.requires_project ?? t.requires === "project";
  if (me.level !== undefined && me.level < needLevel) {
    const names = ["contractor", "employee", "manager", "exec"];
    return { ok: false, why: `${t.name} needs ${names[needLevel]} level (L${needLevel}). You are L${me.level}.` };
  }
  if (needProject) {
    if (!project) return { ok: false, why: "Which project?" };
    if (!canSee(as, project)) {
      const pr = ORANGE.projects.find((p) => p.id === project);
      return { ok: false, why: `You aren't disclosed on ${pr ? pr.name : project}. Owner: ${pr ? person(pr.owner).name : "unknown"}.` };
    }
  }
  return { ok: true };
}

async function runTool(as, action) {
  const { tool, args = {} } = action;
  const project = args.project ? String(args.project).toLowerCase() : null;
  const gate = toolAllowed(as, tool, project);
  if (!gate.ok) return { tool, status: "blocked", result: gate.why };

  const now = new Date();
  let summary, result;
  if (tool === "pulp.file_bug") {
    const id = `PULP-${nextBug++}`;
    const sev = args.severity || "P2";
    const team = args.assignee_team || "Triage";
    result = `${id} filed: ${args.title} (${sev}, ${team})`;
    summary = `Filed ${id}: ${args.title} (${sev}, ${team})`;
    // Write the ticket back into the brain, gated to the project's disclosure group.
    await ingest([toKnowledge({
      id: id.toLowerCase(), type: "ticket", category: "documents", level: 0, project, author: as, date: now.toISOString().slice(0, 10),
      title: `${id}: ${args.title}`,
      text: `Severity ${sev}. Assigned: ${team}. Reporter: ${person(as).name}. Filed ${now.toISOString().slice(0, 10)}. ${args.details || ""}`,
    })]);
  } else if (tool === "press.rerun_build") {
    const outcome = { strawberry: "failed: test_calibration_curve (3/412 tests)", clementine: "passed (1,208 tests)", navel: "failed: memory budget check, 1.3x" }[project] || "passed";
    result = `Press build for ${project}: ${outcome}`;
    summary = `Reran ${project} build: ${outcome}`;
  } else if (tool === "exec.weekly_update") {
    result = "Draft ready (see answer).";
    summary = "Drafted the exec weekly update";
  } else {
    result = "Done.";
    summary = `Used ${tool}`;
  }
  const t = loadTimeline();
  t.push({ who: as, when: now.toISOString().slice(0, 19), project, tool, summary });
  saveTimeline(t);
  return { tool, status: "done", result };
}

// ---------- the agent ----------
async function ask(as, message) {
  const me = person(as);
  if (!me) throw new Error(`Unknown person ${as}`);
  const { chunks, withheld } = await search(as, message);
  const context = chunks.map((c, i) => `[${i + 1}] ${c.source_title}\n${c.chunk_content}`).join("\n\n");
  const myActions = loadTimeline().filter((x) => x.who === as).slice(-8).map((x) => `- ${x.when.slice(0, 10)}: ${x.summary}`).join("\n");
  const tools = ORANGE.tools.map((t) => `- ${t.id}: ${t.description}`).join("\n");

  const prompt = `You are the personal work agent for ${me.name} (${me.title}, ${me.role || "employee"}, level L${me.level ?? "?"}, ${me.team} team) at Orange, today ${new Date().toISOString().slice(0, 10)}.
You answer using ONLY the company brain context below. That context is already filtered to what ${me.name.split(" ")[0]} is disclosed on.
If the context does not contain something, say you can't see it. Never guess details of projects not in the context.
If a codename is mentioned but you have no details, say they aren't disclosed on it and name the owner if the org chart says who it is.
Cross-check sources: if two sources disagree (for example one says a release is on track and another says it slipped), call it out as a risk and name both sources. Prefer the most recent source.
Be concise: 2-6 sentences or a short list. Plain words. No em dashes.

Tools you can request (the system enforces access, not you):
${tools}

${me.name.split(" ")[0]}'s recent actions (use these as defaults, e.g. same severity/team as last time, and say so):
${myActions || "(none)"}

Company brain context:
${context || "(nothing found)"}

User says: ${message}

Reply with ONLY a JSON object:
{"answer": "...", "action": null or {"tool": "<tool id>", "args": {"project": "<project id lowercase>", "title": "...", "severity": "P0-P3", "assignee_team": "...", "details": "..."}}}
Request an action only if the user asks you to do something. When you request one, describe what you are doing in one sentence; do not predict whether it will be allowed. If they ask to act on a project, request it even if you can't see that project; the system will decide.`;

  const out = parseJson(await llm(prompt));
  let action = null;
  if (out.action && out.action.tool) action = await runTool(as, out.action);
  // The model writes before enforcement runs, so the server's verdict replaces its answer on a block.
  if (action && action.status === "blocked") out.answer = `Blocked. ${action.result}` + (/disclosed/.test(action.result) ? " Ask the owner to request disclosure for you in Seed." : " Ask your manager.");
  const sources = [...new Map(chunks.map((c) => [c.id, c.source_title])).entries()].map(([id, title]) => ({ id, title }));
  return { as, answer: out.answer || "", action, sources, withheld };
}

const CATEGORIES = [
  ["contacts", "Contacts"], ["disclosures", "Disclosures"], ["tools", "Tools"], ["documents", "Documents"], ["branding", "Branding"],
];
function brain(viewer) {
  const filed = loadTimeline().filter((x) => x.tool === "pulp.file_bug" && /PULP-4[1-9]\d/.test(x.summary));
  const extra = filed.map((x) => ({ id: x.summary.match(/PULP-\d+/)[0].toLowerCase(), category: "documents", title: x.summary.replace(/^Filed /, ""), project: x.project, level: 0 }));
  const docs = [...ORANGE.docs, ...extra];
  return {
    hub: `${ORANGE.company} Company Brain`,
    viewer,
    categories: CATEGORIES.map(([id, label]) => ({
      id, label,
      sources: docs.filter((d) => (d.category || "documents") === id).map((d) => {
        const visible = canSeeDoc(viewer, { level: d.level ?? 0, project: d.project });
        return { id: d.id, title: visible ? d.title : "Restricted", project: d.project, level: d.level ?? 0, visible };
      }),
    })),
  };
}

function timeline(viewer, of) {
  const items = loadTimeline().filter((x) => x.who === of).sort((a, b) => a.when.localeCompare(b.when));
  const visible = items.filter((x) => canSee(viewer, x.project));
  return { of, viewer, items: visible, hidden: items.length - visible.length };
}

// ---------- http ----------
const send = (res, code, body, type = "application/json") => {
  res.writeHead(code, { "Content-Type": type });
  res.end(type === "application/json" ? JSON.stringify(body) : body);
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  try {
    if (req.method === "POST" && url.pathname === "/api/ask") {
      let raw = "";
      for await (const c of req) raw += c;
      const { as, message } = JSON.parse(raw);
      const t = Date.now();
      const out = await ask(as, message);
      console.log(`[ask] ${as} "${message.slice(0, 60)}" -> ${out.action ? out.action.status + " " + out.action.tool : "no action"}, withheld=${out.withheld}, ${Date.now() - t}ms`);
      return send(res, 200, out);
    }
    if (url.pathname === "/api/brain") return send(res, 200, brain(url.searchParams.get("as") || "steve"));
    if (url.pathname === "/api/timeline") return send(res, 200, timeline(url.searchParams.get("as"), url.searchParams.get("of")));
    if (url.pathname === "/api/org") {
      return send(res, 200, { company: ORANGE.company, people: ORANGE.people, projects: ORANGE.projects, tools: ORANGE.tools });
    }
    const file = path.join(ROOT, "public", url.pathname === "/" ? "index.html" : url.pathname);
    if (file.startsWith(path.join(ROOT, "public")) && fs.existsSync(file)) {
      const type = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" }[path.extname(file)] || "application/octet-stream";
      return send(res, 200, fs.readFileSync(file), type);
    }
    send(res, 404, { error: "not found" });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: String(e.message || e) });
  }
}).listen(PORT, () => console.log(`Orange brain on http://localhost:${PORT} (db ${DB})`));
