//what does this file do? It creates and configures the Express.js application, setting up routes, health checks, and error handling middleware.
import express from "express";
import path from "node:path";
import { expressLoader } from "./loaders/expressLoader.js";
import apiRouter from "./routes/index.js";
import { notFound } from "./middlewares/notFound.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";

export function createApp() {
  const app = express();

  expressLoader(app);

  app.get("/health", (req, res) => res.json({ ok: true }));
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

  app.use("/api/v1", apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
