// Upsert does not replace a stored acl, so force it with PATCH /context/{id}/metadata.
import { ORANGE, DB, hydra, aclFor } from "./lib.mjs";
const { collections } = await hydra("GET", `/databases/collections?database=${DB}`);
const collection = collections[0];
let n = 0;
for (const d of ORANGE.docs) {
  const acl = aclFor(d);
  if (!acl) continue;
  const r = await hydra("PATCH", `/context/${encodeURIComponent(d.id)}/metadata`, {
    database: DB, collection, acl,
    additional_metadata: { project: d.project || "open", category: d.category, level: d.level },
  });
  n++;
  console.log(d.id.padEnd(26), acl.map((e) => e.split("@")[0]).join(","), r.acl_updated ?? "");
}
console.log(`patched ${n}`);
