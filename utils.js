const crypto = require("crypto");

function base64urlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecodeToString(input) {
  const b64 = String(input).replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "===".slice((b64.length + 3) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function nowUnix() {
  return Math.floor(Date.now() / 1000);
}

function newId(prefix = "") {
  const id = crypto.randomBytes(16).toString("hex");
  return prefix ? `${prefix}_${id}` : id;
}

function toNumberOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

module.exports = {
  base64urlEncode,
  base64urlDecodeToString,
  safeEqual,
  nowUnix,
  newId,
  toNumberOrNull,
};

