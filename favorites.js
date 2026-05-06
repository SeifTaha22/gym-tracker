const { readJson, json } = require("./http");
const { requireAuth } = require("./middleware");
const { readJsonFile, writeJsonFileAtomic } = require("./storage");
const { newId } = require("./utils");

const FAVORITES_FILE = "favorites.json";

async function readAll() {
  const data = await readJsonFile(FAVORITES_FILE, { favorites: [] });
  if (!data.favorites) data.favorites = [];
  return data;
}

async function writeAll(data) {
  await writeJsonFileAtomic(FAVORITES_FILE, data);
}

const favoritesRepo = {
  async listByUser(userId) {
    const data = await readAll();
    return data.favorites.filter((f) => f.userId === userId);
  },

  async create(userId, body) {
    const name = String(body?.name || "").trim();
    if (!name) throw Object.assign(new Error("Validation failed"), { code: "VALIDATION" });
    const data = await readAll();
    const favorite = {
      id: newId("fav"),
      userId,
      name,
      notes: String(body?.notes || "").trim(),
      exercises: Array.isArray(body?.exercises) ? body.exercises : [],
      createdAt: new Date().toISOString(),
    };
    data.favorites.push(favorite);
    await writeAll(data);
    return favorite;
  },

  async delete(userId, id) {
    const data = await readAll();
    const idx = data.favorites.findIndex((f) => f.id === id && f.userId === userId);
    if (idx === -1) return false;
    data.favorites.splice(idx, 1);
    await writeAll(data);
    return true;
  },
};

const favoritesRoutes = {
  async listOrCreate(req, res) {
    const user = await requireAuth(req, res);
    if (!user) return;

    if (req.method === "GET") {
      const favorites = await favoritesRepo.listByUser(user.id);
      return json(res, 200, { favorites });
    }

    if (req.method === "POST") {
      const body = await readJson(req);
      try {
        const favorite = await favoritesRepo.create(user.id, body);
        return json(res, 201, { favorite });
      } catch (err) {
        if (err && err.code === "VALIDATION") return json(res, 400, { error: "VALIDATION" });
        throw err;
      }
    }

    return json(res, 405, { error: "METHOD_NOT_ALLOWED" });
  },

  async delete(req, res, id) {
    const user = await requireAuth(req, res);
    if (!user) return;
    if (req.method !== "DELETE") return json(res, 405, { error: "METHOD_NOT_ALLOWED" });
    const ok = await favoritesRepo.delete(user.id, id);
    if (!ok) return json(res, 404, { error: "NOT_FOUND" });
    return json(res, 200, { ok: true });
  },
};

module.exports = { favoritesRoutes };

