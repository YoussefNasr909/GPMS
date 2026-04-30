//what does this file do? It defines an error-handling middleware for an Express.js application that standardizes error responses based on whether the error is an instance of a custom AppError class or a generic server error.
//أي خطأ في أي مكان يتحول لرد API مفهوم للفرونت.

import { AppError } from "../common/errors/AppError.js";

export function errorHandler(err, req, res, next) {
  console.error("API Error:", err);
  const isAppError = err instanceof AppError;

  const status = isAppError ? err.statusCode : 500;

  const payload = {
    ok: false,
    code: isAppError ? err.code : "INTERNAL_ERROR",
    message: isAppError ? err.message : "Internal Server Error",
  };

  if (process.env.NODE_ENV !== "production") {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
}
