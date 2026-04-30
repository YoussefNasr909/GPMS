import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";

import {
  loginSchema,
  registerSchema,
  sendVerificationSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  verifyResetCodeSchema,
  resetPasswordSchema,
  oauthCompleteSchema,
} from "./auth.schema.js";

import {
  login,
  me,
  register,
  sendVerification,
  verifyEmail,
  googleAuth,
  googleCallback,
  githubAuth,
  githubCallback,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  oauthComplete,
} from "./auth.controller.js";
import {
  registerLimiter,
  loginLimiter,
  forgotPasswordLimiter,
  otpLimiter,
  oauthCompleteLimiter,
} from "../../middlewares/rateLimit.middleware.js";

const router = Router();

// local auth
// local auth
router.post("/register", registerLimiter, validate(registerSchema), register);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.get("/me", auth, me);

router.post("/send-verification", otpLimiter, validate(sendVerificationSchema), sendVerification);
router.post("/verify-email", otpLimiter, validate(verifyEmailSchema), verifyEmail);

// password reset
router.post("/forgot-password", forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/verify-reset-code", otpLimiter, validate(verifyResetCodeSchema), verifyResetCode);
router.post("/reset-password", otpLimiter, validate(resetPasswordSchema), resetPassword);

// oauth complete (needs auth + validate)
router.post("/oauth-complete", oauthCompleteLimiter, auth, validate(oauthCompleteSchema), oauthComplete);


// oauth routes (no validate)
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

router.get("/github", githubAuth);
router.get("/github/callback", githubCallback);

export default router;
