const { readJson, json } = require("./http");
const { requireAuth } = require("./middleware");
const { readJsonFile, writeJsonFileAtomic } = require("./storage");
const { newId } = require("./utils");

const WORKOUTS_FILE = "workouts.json";

async function readAll() {
  const data = await readJsonFile(WORKOUTS_FILE, { workouts: [] });
  if (!data.workouts) data.workouts = [];
  return data;
}

async function writeAll(data) {
  await writeJsonFileAtomic(WORKOUTS_FILE, data);
}

const workoutsRepo = {
  async listByUser(userId, { from, to, limit } = {}) {
    const data = await readAll();
    let results = data.workouts.filter((w) => w.userId === userId);
    if (from) results = results.filter((w) => w.date >= from);
    if (to) results = results.filter((w) => w.date <= to);
    results.sort((a, b) => (a.date < b.date ? 1 : -1));
    if (limit) results = results.slice(0, Number(limit));
    return results;
  },

  async create(userId, body) {
    const name = String(body?.name || "").trim();
    const date = String(body?.date || "").trim();
    if (!name || !date) throw Object.assign(new Error("Validation failed"), { code: "VALIDATION" });
    const data = await readAll();
    const workout = {
      id: newId("wkt"),
      userId,
      name,
      date,
      notes: String(body?.notes || "").trim(),
      exercises: Array.isArray(body?.exercises) ? body.exercises : [],
      createdAt: new Date().toISOString(),
    };
    data.workouts.push(workout);
    await writeAll(data);
    return workout;
  },

  async update(userId, id, body) {
    const data = await readAll();
    const idx = data.workouts.findIndex((w) => w.id === id && w.userId === userId);
    if (idx === -1) return null;
    const name = String(body?.name || "").trim();
    const date = String(body?.date || "").trim();
    if (!name || !date) throw Object.assign(new Error("Validation failed"), { code: "VALIDATION" });
    data.workouts[idx] = {
      ...data.workouts[idx],
      name,
      date,
      notes: String(body?.notes || "").trim(),
      exercises: Array.isArray(body?.exercises) ? body.exercises : data.workouts[idx].exercises,
    };
    await writeAll(data);
    return data.workouts[idx];
  },

  async delete(userId, id) {
    const data = await readAll();
    const idx = data.workouts.findIndex((w) => w.id === id && w.userId === userId);
    if (idx === -1) return false;
    data.workouts.splice(idx, 1);
    await writeAll(data);
    return true;
  },
};

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

