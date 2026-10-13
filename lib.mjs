// Shared helpers: config, HydraDB client, Orange data, disclosure rules.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.dirname(fileURLToPath(import.meta.url));

// Local dev reads .env; on Vercel the env vars come from project settings.
const ENV_FILE = path.join(ROOT, ".env");
if (fs.existsSync(ENV_FILE)) {
  for (const line of fs.readFileSync(ENV_FILE, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

export const DB = process.env.HYDRA_DB || "company_brain";
export const ORANGE = JSON.parse(fs.readFileSync(path.join(ROOT, "data/orange.json"), "utf8"));
export const email = (id) => `${id}@${ORANGE.domain}`;
export const person = (id) => ORANGE.people.find((p) => p.id === id);

// Access rule: person.level >= doc.level AND (doc.project is null OR person is disclosed on it).
export const CATEGORIES = [
  { id: "contacts", label: "Contacts" },
  { id: "disclosures", label: "Disclosures" },
  { id: "tools", label: "Tools" },
  { id: "documents", label: "Documents" },
  { id: "branding", label: "Branding" },
];

export function canSeeDoc(personId, { level = 0, project = null } = {}) {
  const p = person(personId);
  if (!p) return false;
  return p.level >= (level || 0) && (!project || p.disclosures.includes(project));
}

// Emails of everyone who can see the doc. undefined = open (all 8 people can see it, no acl).
export function aclFor(doc) {
  const d = { level: doc.level || 0, project: doc.project || null };
  const ids = ORANGE.people.filter((p) => canSeeDoc(p.id, d)).map((p) => p.id);
  if (ids.length === ORANGE.people.length) return undefined;
  return ids.map(email);
}

// Project-only check (compat).
export function canSee(personId, project) {
  return !project || person(personId).disclosures.includes(project);
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
    additional_metadata: { project: d.project || "open", author: d.author || "", category: d.category || "documents", level: d.level || 0 },
  };
  const acl = aclFor(d);
  if (acl) item.acl = acl;
  return item;
}

export async function ingest(items) {
  return hydra("POST", "/context/ingest", null, {
    form: { database: DB, type: "knowledge", upsert: "true", app_knowledge: JSON.stringify(items) },
  });
}
