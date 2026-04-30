import { AppError } from "../common/errors/AppError.js";

export const allowRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user?.role) {
      return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("Forbidden", 403, "FORBIDDEN"));
    }

    return next();
  };
