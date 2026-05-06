const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");

async function ensureDataDir() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
}

function filePath(name) {
  return path.join(DATA_DIR, name);
}

async function readJsonFile(name, fallback) {
  await ensureDataDir();
  const p = filePath(name);
  try {
    const raw = await fsp.readFile(p, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err && err.code === "ENOENT") return fallback;
    throw err;
  }
}

async function writeJsonFileAtomic(name, value) {
  await ensureDataDir();
  const p = filePath(name);
  const tmp = `${p}.tmp.${Date.now()}.${Math.random().toString(16).slice(2)}`;
  const raw = JSON.stringify(value, null, 2);
  await fsp.writeFile(tmp, raw, "utf8");
  await fsp.rename(tmp, p);
}

module.exports = { readJsonFile, writeJsonFileAtomic, DATA_DIR };

