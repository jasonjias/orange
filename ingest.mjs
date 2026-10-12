// Load Orange's brain into HydraDB: hub -> 5 category sources -> every doc, each doc tagged with its acl.
import { ORANGE, DB, CATEGORIES, hydra, ingest, toKnowledge } from "./lib.mjs";

const HUB = "brain-hub";
const catText = {
  contacts: "Contacts: the org chart and team pages. Who works where and who to ask.",
  disclosures: "Disclosures: the Seed disclosure policy and the per-project rosters of who is disclosed.",
  tools: "Tools: Orange's internal tools (Pulp, Press, Grove, Seed, Zest, Peel) and who may use them.",
  documents: "Documents: wiki pages, policies, meeting notes, Pulp tickets, board notes and manager-only material.",
  branding: "Branding: the brand guide, public product pages and launch messaging.",
};

// Old tool sources that may carry stale acls: remove, then re-create below.
const OLD = ["tool-pulp-file_bug", "tool-press-rerun_build", "tool-exec-weekly_update", "tool-grove-who_owns"];
try {
  await hydra("DELETE", "/context", { database: DB, type: "knowledge", ids: OLD });
  console.log("deleted old tool sources");
} catch (e) { console.log("old tool delete skipped:", e.message.slice(0, 120)); }

const withRel = (item, ids) => ({ ...item, relations: { ids } });
const hub = withRel(toKnowledge({
  id: HUB, type: "knowledge_base", category: "documents", level: 0, project: null, date: "2026-10-12", title: "Orange Company Brain",
  text: "Orange Company Brain: one brain for Orange. Five spokes: contacts, disclosures, tools, documents, branding. What you find depends on your level and the projects you are disclosed on.",
}), CATEGORIES.map((c) => `cat-${c.id}`));
const cats = CATEGORIES.map((c) => withRel(toKnowledge({
  id: `cat-${c.id}`, type: "knowledge_base", category: c.id, level: 0, project: null, date: "2026-10-12", title: `Orange Company Brain: ${c.label}`, text: catText[c.id],
}), [HUB]));
const docs = ORANGE.docs.map((d) => withRel(toKnowledge(d), [`cat-${d.category}`]));

const items = [hub, ...cats, ...docs];
console.log(`Ingesting ${items.length} sources into ${DB}...`);
console.log("id".padEnd(28) + "category".padEnd(13) + "acl");
for (const i of items) {
  const m = i.additional_metadata;
  console.log(i.id.padEnd(28) + String(m.category).padEnd(13) + (i.acl ? i.acl.map((e) => e.split("@")[0]).join(",") : "open"));
}
const res = await ingest(items);
console.log(`ok=${res.success_count} failed=${res.failed_count}`);
for (const r of res.results || []) if (r.error) console.log("  ERR", r.id, r.error);

const ids = items.map((i) => i.id);
for (let n = 0; n < 60; n++) {
  const st = await hydra("GET", `/context/status?database=${DB}&${ids.map((i) => `ids=${encodeURIComponent(i)}`).join("&")}`);
  const counts = {};
  for (const s of st.statuses || []) counts[s.indexing_status] = (counts[s.indexing_status] || 0) + 1;
  console.log(new Date().toLocaleTimeString(), JSON.stringify(counts));
  const ready = (st.statuses || []).filter((s) => ["graph_creation", "completed"].includes(s.indexing_status)).length;
  if (ready === ids.length) break;
  if ((st.statuses || []).some((s) => ["errored", "failed"].includes(s.indexing_status))) {
    console.log(JSON.stringify(st.statuses.filter((s) => ["errored", "failed"].includes(s.indexing_status)), null, 1).slice(0, 1500));
    break;
  }
  await new Promise((r) => setTimeout(r, 5000));
}
