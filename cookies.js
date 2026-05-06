function parseCookies(req) {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  const parts = header.split(";");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

function serializeCookie(name, value, options = {}) {
  const opts = {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    ...options,
  };
  let cookie = `${name}=${encodeURIComponent(value)}`;
  if (opts.maxAge != null) cookie += `; Max-Age=${opts.maxAge}`;
  if (opts.expires) cookie += `; Expires=${opts.expires.toUTCString()}`;
  if (opts.path) cookie += `; Path=${opts.path}`;
  if (opts.httpOnly) cookie += "; HttpOnly";
  if (opts.secure) cookie += "; Secure";
  if (opts.sameSite) cookie += `; SameSite=${opts.sameSite}`;
  return cookie;
}

module.exports = { parseCookies, serializeCookie };

