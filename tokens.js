const crypto = require("crypto");
const { base64urlEncode, base64urlDecodeToString, safeEqual, nowUnix } = require("../utils");

function getSecret() {
  const secret = process.env.GYM_TRACKER_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("Missing/weak GYM_TRACKER_SECRET (min 16 chars).");
  }
  return secret;
}

function sign(data) {
  const secret = getSecret();
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

function createToken(payload, ttlSeconds = 60 * 60 * 24 * 30) {
  const exp = nowUnix() + ttlSeconds;
  const body = base64urlEncode(JSON.stringify({ ...payload, exp }));
  const sig = sign(body);
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = String(token).split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = sign(body);
  if (!safeEqual(sig, expected)) return null;
  let parsed;
  try {
    parsed = JSON.parse(base64urlDecodeToString(body));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  if (!parsed.exp || nowUnix() > parsed.exp) return null;
  return parsed;
}

module.exports = { createToken, verifyToken };

