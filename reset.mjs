// Reset demo state: clear the timeline and delete bugs filed during demos (HydraDB ids starting "pulp-4").
import fs from "node:fs";
import path from "node:path";
import { ROOT, DB, hydra } from "./lib.mjs";

const tl = path.join(ROOT, "state/timeline.json");
if (fs.existsSync(tl)) { fs.unlinkSync(tl); console.log("deleted state/timeline.json"); } else console.log("no timeline to delete");

const list = await hydra("POST", "/context/list", { database: DB, type: "knowledge" });
const ids = (list.sources || []).map((s) => s.id).filter((id) => id.startsWith("pulp-4"));
if (ids.length) {
  const res = await hydra("DELETE", "/context", { database: DB, type: "knowledge", ids });
  console.log(`deleted ${res.deleted_count ?? ids.length} sources: ${ids.join(", ")}`);
} else console.log("no pulp-4* sources in HydraDB");
