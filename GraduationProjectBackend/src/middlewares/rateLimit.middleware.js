import rateLimit, { ipKeyGenerator } from "express-rate-limit";

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function ipEmailKey(req) {
  // Works for login/forgot/register where email is in body
  const ip = ipKeyGenerator(req);
  const email = normalizeEmail(req.body?.email);
  return email ? `${ip}:${email}` : String(ip);
}

function makeLimiter({
  windowMs,
  max,
  code,
  message,
  keyGenerator,
  skipSuccessfulRequests = false,
}) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true, // adds RateLimit-* headers
    legacyHeaders: false,
    keyGenerator: keyGenerator || ((req) => ipKeyGenerator(req)),
    skipSuccessfulRequests,
   handler: (req, res, next, options) => {
  const resetTime = req.rateLimit?.resetTime || options.resetTime;
  const retryAfterSec = resetTime
    ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
    : Math.ceil(windowMs / 1000);

  res.set("Retry-After", String(retryAfterSec));

  return res.status(options.statusCode).json({
    ok: false,
    code: code || "RATE_LIMITED",
    message: message || "Too many requests. Please wait and try again.",
    retryAfterSec,
  });
}

 
  });
}

// ✅ Recommended limits (tweak as you like)
export const registerLimiter = makeLimiter({
  windowMs: 30 * 60 * 1000, // 30 min
  max: 5,
  code: "RATE_LIMIT_REGISTER",
  message: "Too many registration attempts. Please try again later.",
  keyGenerator: ipEmailKey,
});

const isProd = process.env.NODE_ENV === "production";

export const loginLimiter = makeLimiter({
  windowMs: isProd ? 15 * 60 * 1000 : 60 * 1000, // ✅ 1 min in dev
  max: isProd ? 10 : 5,
  code: "RATE_LIMIT_LOGIN",
  message: "Too many login attempts.",
  keyGenerator: ipEmailKey,
  skipSuccessfulRequests: true,
});


export const forgotPasswordLimiter = makeLimiter({
  windowMs: 30 * 60 * 1000, // 30 min
  max: 5,
  code: "RATE_LIMIT_FORGOT_PASSWORD",
  message: "Too many password reset requests. Please try again later.",
  keyGenerator: ipEmailKey,
});

export const otpLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  code: "RATE_LIMIT_OTP",
  message: "Too many verification attempts. Please wait and try again.",
  keyGenerator: ipEmailKey,
});

export const oauthCompleteLimiter = makeLimiter({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 10,
  code: "RATE_LIMIT_PROFILE",
  message: "Too many requests. Please slow down.",
});
