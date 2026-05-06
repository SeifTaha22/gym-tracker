const { readJsonFile, writeJsonFileAtomic } = require("./storage");
const { newId } = require("./utils");

const FILE = "users.json";

async function readAll() {
  const data = await readJsonFile(FILE, { users: [] });
  if (!data.users) data.users = [];
  return data;
}

async function writeAll(data) {
  await writeJsonFileAtomic(FILE, data);
}

const usersRepo = {
  async getById(id) {
    const data = await readAll();
    return data.users.find((u) => u.id === id) || null;
  },

  async getByEmail(email) {
    const e = String(email || "").trim().toLowerCase();
    const data = await readAll();
    return data.users.find((u) => u.email === e) || null;
  },

  async create({ email, passwordHash, name }) {
    const e = String(email || "").trim().toLowerCase();
    const data = await readAll();
    if (data.users.some((u) => u.email === e)) {
      throw Object.assign(new Error("Email already used"), { code: "EMAIL_TAKEN" });
    }
    const user = {
      id: newId("usr"),
      email: e,
      passwordHash,
      name: String(name || "").trim() || "مستخدم",
      createdAt: new Date().toISOString(),
    };
    data.users.push(user);
    await writeAll(data);
    return user;
  },
};

module.exports = { usersRepo };

