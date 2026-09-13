import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import session from "express-session";
import cors from "cors";
import cookieParser from "cookie-parser";
import { assertAuthConfig, config, SESSION_COOKIE_NAME } from "./config.js";
import authRoutes from "./routes/auth.js";
import workspaceRoutes from "./routes/workspace.js";
import shareRoutes from "./routes/share.js";
import proxyRoutes from "./routes/proxy.js";

assertAuthConfig();

const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(here, "../../public");

app.set("trust proxy", 1);
app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(
  session({
    name: SESSION_COOKIE_NAME,
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, name: "OpenPostman" });
});

app.use("/auth", authRoutes);
app.use("/api", workspaceRoutes);
app.use("/api", shareRoutes);
app.use("/api", proxyRoutes);

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/auth")) {
      next();
      return;
    }
    res.sendFile(path.join(publicDir, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

export default app;

if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`[openpostman] server listening on http://localhost:${config.port}`);
  });
}
