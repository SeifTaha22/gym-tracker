const http = require("http");
const { URL } = require("url");
const path = require("path");

const { serveStatic } = require("./static");
const { json } = require("./http");
const { requireAuth, getAuthedUser } = require("./middleware");
const { authRoutes } = require("./auth");
const { userRoutes } = require("./user");
const { workoutsRoutes } = require("./workouts");
const { favoritesRoutes } = require("./favorites");

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

function notFound(res) {
  res.writeHead(404, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ error: "NOT_FOUND" }));
}

function methodNotAllowed(res) {
  res.writeHead(405, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ error: "METHOD_NOT_ALLOWED" }));
}

function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  // Static pages and assets
  if (pathname === "/") return serveStatic(req, res, "/index.html");
  if (pathname === "/login") return serveStatic(req, res, "/login.html");
  if (pathname === "/register") return serveStatic(req, res, "/register.html");
  if (pathname === "/app") return serveStatic(req, res, "/app.html");
  if (pathname === "/dashboard") return serveStatic(req, res, "/dashboard.html");

  if (pathname.startsWith("/public/")) {
    const rel = pathname.replace(/^\/public/, "");
    return serveStatic(req, res, rel);
  }

  // API
  if (pathname.startsWith("/api/")) {
    // Auth
    if (pathname === "/api/auth/register") return authRoutes.register(req, res);
    if (pathname === "/api/auth/login") return authRoutes.login(req, res);
    if (pathname === "/api/auth/logout") return authRoutes.logout(req, res);

    // User
    if (pathname === "/api/me") return userRoutes.me(req, res);

    // Workouts
    if (pathname === "/api/workouts") return workoutsRoutes.listOrCreate(req, res, url);
    if (pathname.startsWith("/api/workouts/")) {
      const id = pathname.split("/").pop();
      return workoutsRoutes.updateOrDelete(req, res, id);
    }

    // Favorites
    if (pathname === "/api/favorites") return favoritesRoutes.listOrCreate(req, res);
    if (pathname.startsWith("/api/favorites/")) {
      const id = pathname.split("/").pop();
      return favoritesRoutes.delete(req, res, id);
    }

    return notFound(res);
  }

  return notFound(res);
}

const server = http.createServer(async (req, res) => {
  try {
    await route(req, res);
  } catch (err) {
    res.writeHead(500, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "INTERNAL_SERVER_ERROR" }));
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Gym Tracker running on http://localhost:${PORT}`);
});

