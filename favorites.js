const { readJson, json } = require("../http");
const { requireAuth } = require("../auth/middleware");
const { favoritesRepo } = require("../repos/favorites");

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

