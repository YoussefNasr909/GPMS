// what does this file do? It configures and sets up the Express.js application with essential middlewares
// for security, logging, request parsing, cookies, and CORS handling.
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import { corsOptions } from "../config/cors.js";

export function expressLoader(app) {
  app.disable("x-powered-by");

  app.use(helmet());
  app.use(morgan("dev"));
  app.use(
    express.json({
      limit: "2mb",
      verify: (req, res, buf) => {
        req.rawBody = buf.toString("utf8");
      },
    }),
  );
  app.use(express.urlencoded({ extended: true }));

  // Needed so we can read OAuth state cookies on callback
  app.use(cookieParser());

  app.use(cors(corsOptions));
}
