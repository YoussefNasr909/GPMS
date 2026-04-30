import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../common/errors/AppError.js";
import { prisma } from "../loaders/dbLoader.js";
import { ACCOUNT_STATUSES } from "../common/constants/accountStatuses.js";

export async function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, env.jwtSecret);

    if (!payload || typeof payload !== "object" || !payload.id) {
      return next(new AppError("Invalid token", 401, "INVALID_TOKEN"));
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, role: true, isEmailVerified: true, accountStatus: true },
    });

    if (!user) {
      return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    }

    if (!user.isEmailVerified) {
      return next(new AppError("Email not verified", 403, "EMAIL_NOT_VERIFIED"));
    }

    if (user.accountStatus === ACCOUNT_STATUSES.INACTIVE) {
      return next(new AppError("This account is inactive. Please contact an administrator.", 403, "ACCOUNT_INACTIVE"));
    }

    if (user.accountStatus === ACCOUNT_STATUSES.SUSPENDED) {
      return next(
        new AppError("This account has been suspended. Please contact an administrator.", 403, "ACCOUNT_SUSPENDED"),
      );
    }

    req.user = { id: user.id, role: user.role, accountStatus: user.accountStatus };
    return next();
  } catch (e) {
    return next(new AppError("Invalid token", 401, "INVALID_TOKEN"));
  }
}
