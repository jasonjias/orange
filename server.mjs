// Local dev server: static files from public/ plus the API in app.mjs.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { ROOT, DB } from "./lib.mjs";
import { handleApi } from "./app.mjs";

const PORT = Number(process.env.PORT || 3000);
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png" };

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname.startsWith("/api/")) return handleApi(req, res, url.pathname, url.searchParams);
  const file = path.join(ROOT, "public", url.pathname === "/" ? "index.html" : url.pathname);
  if (file.startsWith(path.join(ROOT, "public")) && fs.existsSync(file) && fs.statSync(file).isFile()) {
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    return res.end(fs.readFileSync(file));
  }
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
}).listen(PORT, () => console.log(`Orange brain on http://localhost:${PORT} (db ${DB})`));
