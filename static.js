const fs = require("fs/promises");
const path = require("path");

const PUBLIC_DIR = path.join(__dirname, "..", "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};

function safeJoinPublic(relPath) {
  const cleaned = relPath.replace(/\\/g, "/");
  const abs = path.join(PUBLIC_DIR, cleaned);
  const normalized = path.normalize(abs);
  if (!normalized.startsWith(PUBLIC_DIR)) return null;
  return normalized;
}

async function serveStatic(req, res, relPath) {
  const abs = safeJoinPublic(relPath);
  if (!abs) {
    res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
    res.end("Bad path");
    return;
  }

  try {
    const ext = path.extname(abs).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";
    const body = await fs.readFile(abs);
    res.writeHead(200, {
      "content-type": contentType,
      "cache-control": ext === ".html" ? "no-store" : "public, max-age=3600",
      "x-content-type-options": "nosniff",
    });
    res.end(body);
  } catch (err) {
    if (err && err.code === "ENOENT") {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    throw err;
  }
}

module.exports = { serveStatic, PUBLIC_DIR };

