// Vercel function: every /api/* path is rewritten here with the original path in ?__p (see vercel.json).
import { handleApi } from "../app.mjs";

export default async function handler(req, res) {
  const url = new URL(req.url, "http://x");
  const pathname = "/api/" + (url.searchParams.get("__p") || url.pathname.replace(/^\/api\/?/, "").replace(/^index$/, ""));
  url.searchParams.delete("__p");
  return handleApi(req, res, pathname, url.searchParams);
}
