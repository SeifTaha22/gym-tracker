const { json } = require("../http");
const { parseCookies } = require("./cookies");
const { verifyToken } = require("./tokens");
const { usersRepo } = require("../repos/users");

async function getAuthedUser(req) {
  const cookies = parseCookies(req);
  const token = cookies.auth;
  const payload = verifyToken(token);
  if (!payload || !payload.userId) return null;
  const user = await usersRepo.getById(payload.userId);
  if (!user) return null;
  return user;
}

async function requireAuth(req, res) {
  const user = await getAuthedUser(req);
  if (!user) {
    json(res, 401, { error: "UNAUTHORIZED" });
    return null;
  }
  return user;
}

module.exports = { getAuthedUser, requireAuth };

