const { StringDecoder } = require("string_decoder");

function readBody(req, maxBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const decoder = new StringDecoder("utf8");
    let total = 0;
    let buf = "";

    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(Object.assign(new Error("Body too large"), { code: "BODY_TOO_LARGE" }));
        req.destroy();
        return;
      }
      buf += decoder.write(chunk);
    });
    req.on("end", () => {
      buf += decoder.end();
      resolve(buf);
    });
    req.on("error", reject);
  });
}

async function readJson(req) {
  const raw = await readBody(req);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    throw Object.assign(new Error("Invalid JSON"), { code: "INVALID_JSON" });
  }
}

function json(res, statusCode, data, extraHeaders = {}) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...extraHeaders,
  });
  res.end(body);
}

module.exports = { readBody, readJson, json };

