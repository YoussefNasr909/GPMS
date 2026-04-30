import { AppError } from "../common/errors/AppError.js";

export const validate =
  (schema) =>
  (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const msg = result.error.issues?.[0]?.message ?? "Validation error";
      return next(new AppError(msg, 422, "VALIDATION_ERROR"));
    }

    req.validated = result.data;
    next();
  };
//what does this file do? It defines a middleware function validate that uses Zod schemas to validate incoming HTTP request data (body, query, params). If validation fails, it throws a validation error; otherwise, it attaches the validated data to the request object and proceeds to the next middleware.