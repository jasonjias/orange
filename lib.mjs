// Shared helpers: config, HydraDB client, Orange data, disclosure rules.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.dirname(fileURLToPath(import.meta.url));

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

export const DB = process.env.HYDRA_DB || "company_brain";
export const ORANGE = JSON.parse(fs.readFileSync(path.join(ROOT, "data/orange.json"), "utf8"));
export const email = (id) => `${id}@${ORANGE.domain}`;
export const person = (id) => ORANGE.people.find((p) => p.id === id);

// Disclosure groups expand to the emails of everyone disclosed on them.
// null group = open to everyone (no acl).
export function aclFor(group) {
  if (!group) return undefined;
  return ORANGE.people.filter((p) => p.disclosures.includes(group)).map((p) => email(p.id));
}

export function canSee(personId, group) {
  return !group || person(personId).disclosures.includes(group);
}

export async function hydra(method, route, body, { form } = {}) {
  const headers = { Authorization: `Bearer ${process.env.HYDRA_DB_API_KEY}`, "API-Version": "2" };
  let payload;
  if (form) {
    payload = new FormData();
    for (const [k, v] of Object.entries(form)) payload.append(k, v);
  } else if (body) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`https://api.hydradb.com${route}`, { method, headers, body: payload });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(`HydraDB ${method} ${route} ${res.status}: ${JSON.stringify(json.error || json).slice(0, 400)}`);
  }
  return json.data;
}

// A doc/action becomes an app_knowledge item with the right acl.
export function toKnowledge(d) {
  const item = {
    id: d.id,
    title: d.title,
    type: d.type,
    timestamp: `${d.date}T12:00:00Z`,
    content: { text: d.text },
    additional_metadata: { project: d.project || "open", author: d.author || "" },
  };
  const acl = aclFor(d.project);
  if (acl) item.acl = acl;
  return item;
}

export async function ingest(items) {
  return hydra("POST", "/context/ingest", null, {
    form: { database: DB, type: "knowledge", upsert: "true", app_knowledge: JSON.stringify(items) },
  });
}
