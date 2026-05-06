const { readJson, json } = require("../http");
const { requireAuth } = require("../auth/middleware");
const { workoutsRepo } = require("../repos/workouts");

const workoutsRoutes = {
  async listOrCreate(req, res, url) {
    const user = await requireAuth(req, res);
    if (!user) return;

    if (req.method === "GET") {
      const from = url.searchParams.get("from") || undefined;
      const to = url.searchParams.get("to") || undefined;
      const limit = url.searchParams.get("limit") || undefined;
      const workouts = await workoutsRepo.listByUser(user.id, { from, to, limit });
      return json(res, 200, { workouts });
    }

    if (req.method === "POST") {
      const body = await readJson(req);
      try {
        const workout = await workoutsRepo.create(user.id, body);
        return json(res, 201, { workout });
      } catch (err) {
        if (err && err.code === "VALIDATION") return json(res, 400, { error: "VALIDATION" });
        throw err;
      }
    }

    return json(res, 405, { error: "METHOD_NOT_ALLOWED" });
  },

  async updateOrDelete(req, res, id) {
    const user = await requireAuth(req, res);
    if (!user) return;

    if (req.method === "PUT") {
      const body = await readJson(req);
      try {
        const workout = await workoutsRepo.update(user.id, id, body);
        if (!workout) return json(res, 404, { error: "NOT_FOUND" });
        return json(res, 200, { workout });
      } catch (err) {
        if (err && err.code === "VALIDATION") return json(res, 400, { error: "VALIDATION" });
        throw err;
      }
    }

    if (req.method === "DELETE") {
      const ok = await workoutsRepo.delete(user.id, id);
      if (!ok) return json(res, 404, { error: "NOT_FOUND" });
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { error: "METHOD_NOT_ALLOWED" });
  },
};

module.exports = { workoutsRoutes };

