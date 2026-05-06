const { json } = require("../http");
const { requireAuth } = require("../auth/middleware");

const userRoutes = {
  async me(req, res) {
    if (req.method !== "GET") return json(res, 405, { error: "METHOD_NOT_ALLOWED" });
    const user = await requireAuth(req, res);
    if (!user) return;
    return json(res, 200, {
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    });
  },
};

module.exports = { userRoutes };

