const crypto = require("crypto");

function hashPassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    throw Object.assign(new Error("Weak password"), { code: "WEAK_PASSWORD" });
  }
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${derived.toString("base64")}`;
}

function verifyPassword(password, stored) {
  if (!stored || typeof stored !== "string") return false;
  const [algo, saltB64, hashB64] = stored.split("$");
  if (algo !== "scrypt" || !saltB64 || !hashB64) return false;
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  const derived = crypto.scryptSync(String(password), salt, expected.length);
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

module.exports = { hashPassword, verifyPassword };

