async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { "content-type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: "BAD_RESPONSE", raw: text };
  }
  if (!res.ok) {
    const err = new Error(data?.error || "REQUEST_FAILED");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function byId(id) {
  return document.getElementById(id);
}

function fmtDateTimeLocal(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function ensureAuthedOrRedirect() {
  try {
    await api("/api/me");
  } catch {
    location.href = "/login";
  }
}

async function logout() {
  await api("/api/auth/logout", { method: "POST", body: "{}" });
  location.href = "/";
}

window.GymApp = { api, byId, fmtDateTimeLocal, ensureAuthedOrRedirect, logout };

