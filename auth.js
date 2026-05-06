const { readJson, json } = require("./http");
const { usersRepo } = require("./users");
const { hashPassword, verifyPassword } = require("./passwords");
const { createToken } = require("./tokens");
const { serializeCookie } = require("./cookies");

function publicUser(user) {
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}

const authRoutes = {
  async register(req, res) {
    if (req.method !== "POST") return json(res, 405, { error: "METHOD_NOT_ALLOWED" });
    const body = await readJson(req);
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const name = String(body?.name || "").trim();

    if (!email || !email.includes("@")) return json(res, 400, { error: "INVALID_EMAIL" });

    let passwordHash;
    try {
      passwordHash = hashPassword(password);
    } catch {
      return json(res, 400, { error: "WEAK_PASSWORD", message: "كلمة المرور يجب أن تكون 8 أحرف أو أكثر." });
    }

    let user;
    try {
      user = await usersRepo.create({ email, passwordHash, name });
    } catch (err) {
      if (err && err.code === "EMAIL_TAKEN") return json(res, 409, { error: "EMAIL_TAKEN" });
      throw err;
    }

    const token = createToken({ userId: user.id });
    const cookie = serializeCookie("auth", token, { maxAge: 60 * 60 * 24 * 30 });
    return json(res, 201, { user: publicUser(user) }, { "set-cookie": cookie });
  },

  async login(req, res) {
    if (req.method !== "POST") return json(res, 405, { error: "METHOD_NOT_ALLOWED" });
    const body = await readJson(req);
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const user = await usersRepo.getByEmail(email);
    if (!user) return json(res, 401, { error: "INVALID_CREDENTIALS" });
    if (!verifyPassword(password, user.passwordHash)) return json(res, 401, { error: "INVALID_CREDENTIALS" });

    const token = createToken({ userId: user.id });
    const cookie = serializeCookie("auth", token, { maxAge: 60 * 60 * 24 * 30 });
    return json(res, 200, { user: publicUser(user) }, { "set-cookie": cookie });
  },

  async logout(req, res) {
    if (req.method !== "POST") return json(res, 405, { error: "METHOD_NOT_ALLOWED" });
    const cookie = serializeCookie("auth", "", { maxAge: 0 });
    return json(res, 200, { ok: true }, { "set-cookie": cookie });
  },
};

module.exports = { authRoutes };

