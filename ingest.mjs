// Load Orange's docs and tools into HydraDB, each tagged with its acl.
import { ORANGE, DB, hydra, ingest, toKnowledge, aclFor } from "./lib.mjs";

const docs = ORANGE.docs.map(toKnowledge);
const tools = ORANGE.tools.map((t) => {
  const item = toKnowledge({
    id: `tool-${t.id.replace(/\./g, "-")}`,
    type: "custom",
    title: `Tool: ${t.name} (${t.id})`,
    date: "2026-10-01",
    project: t.requires === "exec" ? "exec" : null,
    text: `${t.name}. ${t.description} Access: ${t.requires === "project" ? "only on projects you are disclosed on" : t.requires === "exec" ? "exec only" : "everyone"}.`,
  });
  return item;
});

const items = [...docs, ...tools];
console.log(`Ingesting ${items.length} sources into ${DB}...`);
for (const i of items) console.log(`  ${i.id.padEnd(28)} acl=${i.acl ? i.acl.map((e) => e.split("@")[0]).join(",") : "open"}`);
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
