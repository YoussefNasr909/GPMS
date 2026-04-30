import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../loaders/dbLoader.js";
import { env } from "../../config/env.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../../common/utils/mailer.js";
import { ACCOUNT_STATUSES } from "../../common/constants/accountStatuses.js";

import { AppError } from "../../common/errors/AppError.js";

/**
 * IMPORTANT NOTES:
 * - Prisma User fields used:
 *   passwordHash, isEmailVerified, emailVerificationCodeHash, emailVerificationExpiresAt
 * - Throws AppError so global errorHandler returns proper status and JSON
 */

// -------------------- helpers --------------------

function httpError(status, code, message) {
  return new AppError(message, status, code);
}

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function sanitizeUser(user) {
  if (!user) return null;

  // Remove sensitive fields
  // eslint-disable-next-line no-unused-vars
  const {
    passwordHash,
    emailVerificationCodeHash,
    emailVerificationExpiresAt,
    passwordResetCodeHash,
passwordResetExpiresAt,

    ...safe
  } = user;

  return safe;
}

function generateOtp6() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function makeJwtToken(userId, rememberMe = false) {
  if (!env.jwtSecret) {
    throw new Error("JWT secret is missing (env.jwtSecret)");
  }

  const expiresIn = rememberMe ? "30d" : "1d";

  return jwt.sign({ id: String(userId) }, env.jwtSecret, { expiresIn });
}

function assertAccountCanAccess(user) {
  if (!user) return;

  if (user.accountStatus === ACCOUNT_STATUSES.INACTIVE) {
    throw httpError(403, "ACCOUNT_INACTIVE", "This account is inactive. Please contact an administrator.");
  }

  if (user.accountStatus === ACCOUNT_STATUSES.SUSPENDED) {
    throw httpError(403, "ACCOUNT_SUSPENDED", "This account has been suspended. Please contact an administrator.");
  }
}

// -------------------- services --------------------

/**
 * REGISTER
 * - creates user
 * - hashes password into user.passwordHash
 * - creates & stores OTP hash + expiry (emailVerificationCodeHash)
 * - sends verification email (if SMTP configured)
 */
export async function registerService(payload) {
  const email = normalizeEmail(payload.email);

  if (!payload.firstName || !payload.lastName) {
    throw httpError(400, "VALIDATION_ERROR", "First name and last name are required");
  }
  if (!email) {
    throw httpError(400, "VALIDATION_ERROR", "Email is required");
  }
  if (!payload.password || payload.password.length < 6) {
    throw httpError(400, "VALIDATION_ERROR", "Password must be at least 6 characters");
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    throw httpError(409, "EMAIL_ALREADY_EXISTS", "This email is already registered");
  }

  const existsAcademicId = await prisma.user.findUnique({
    where: { academicId: payload.academicId },
    select: { id: true },
  });
  if (existsAcademicId) {
    throw httpError(409, "ACADEMIC_ID_EXISTS", "Academic ID already exists");
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);

  const user = await prisma.user.create({
    data: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email,
      phone: payload.phone ?? null,
      role: "STUDENT",
      accountStatus: ACCOUNT_STATUSES.ACTIVE,
      academicId: payload.academicId,
      department: payload.department,
      academicYear: payload.academicYear,
      preferredTrack: payload.preferredTrack,

      passwordHash,
      isEmailVerified: false,
    },
  });

  // OTP -> store HASH (NOT plaintext)
  const code = generateOtp6();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + (env.verificationCodeTtlMin ?? 10) * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationCodeHash: codeHash,
      emailVerificationExpiresAt: expiresAt,
    },
  });

  let emailSent = true;
  try {
    await sendVerificationEmail({ to: email, code });
  } catch (err) {
    emailSent = false;
    console.error("SEND_VERIFICATION_EMAIL_FAILED:", err?.message ?? err);
  }

  const token = makeJwtToken(user.id, true);

  return {
    token,
    user: sanitizeUser(user),
    emailSent,
  };
}

/**
 * SEND VERIFICATION (OTP) - Resend code
 */
export async function sendVerificationService({ email }) {
  const normalized = normalizeEmail(email);
  if (!normalized) throw httpError(400, "VALIDATION_ERROR", "Email is required");

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) throw httpError(404, "USER_NOT_FOUND", "User not found");

  if (user.isEmailVerified) {
    return { sent: true, message: "Email already verified" };
  }

  const code = generateOtp6();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + (env.verificationCodeTtlMin ?? 10) * 60 * 1000);

  await prisma.user.update({
    where: { email: normalized },
    data: {
      emailVerificationCodeHash: codeHash,
      emailVerificationExpiresAt: expiresAt,
    },
  });

  let emailSent = true;
  try {
    await sendVerificationEmail({ to: normalized, code });
  } catch (err) {
    emailSent = false;
    console.error("SEND_VERIFICATION_EMAIL_FAILED:", err?.message ?? err);
  }

  return { sent: emailSent, message: emailSent ? undefined : "Email could not be sent" };
}

/**
 * VERIFY EMAIL (OTP)
 */
export async function verifyEmailService({ email, code }) {
  const normalized = normalizeEmail(email);
  const otp = String(code ?? "").trim();

  if (!normalized || !otp) {
    throw httpError(400, "VALIDATION_ERROR", "Email and code are required");
  }

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) throw httpError(404, "USER_NOT_FOUND", "User not found");

  if (user.isEmailVerified) return { verified: true };

  if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
    throw httpError(400, "CODE_EXPIRED", "Code expired. Please request a new one.");
  }

  if (!user.emailVerificationCodeHash) {
    throw httpError(400, "INVALID_CODE", "Invalid verification code");
  }

  const ok = await bcrypt.compare(otp, user.emailVerificationCodeHash);
  if (!ok) throw httpError(400, "INVALID_CODE", "Invalid verification code");

  await prisma.user.update({
    where: { email: normalized },
    data: {
      isEmailVerified: true,
      emailVerificationCodeHash: null,
      emailVerificationExpiresAt: null,
    },
  });

  return { verified: true };
}
// -------------------- Password reset --------------------

function validateStrongPasswordOrThrow(password) {
  const p = String(password ?? "");
  if (p.length < 8) throw httpError(400, "VALIDATION_ERROR", "Password must be at least 8 characters");
  if (!/[A-Z]/.test(p))
    throw httpError(400, "VALIDATION_ERROR", "Password must contain at least one uppercase letter");
  if (!/\d/.test(p)) throw httpError(400, "VALIDATION_ERROR", "Password must contain at least one number");
  if (!/[^A-Za-z0-9]/.test(p))
    throw httpError(400, "VALIDATION_ERROR", "Password must contain at least one special character");
}

/**
 * FORGOT PASSWORD
 * - generates 6-digit code
 * - stores hash + expiry in user.passwordResetCodeHash/passwordResetExpiresAt
 * - sends email (if SMTP configured; else logs in dev)
 */
export async function forgotPasswordService({ email }) {
  const normalized = normalizeEmail(email);
  if (!normalized) throw httpError(400, "VALIDATION_ERROR", "Email is required");

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) throw httpError(404, "USER_NOT_FOUND", "User not found");

  const code = generateOtp6();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + (env.passwordResetTtlMin ?? 10) * 60 * 1000);

  await prisma.user.update({
    where: { email: normalized },
    data: {
      passwordResetCodeHash: codeHash,
      passwordResetExpiresAt: expiresAt,
    },
  });

  let emailSent = true;
  try {
    await sendPasswordResetEmail({ to: normalized, code });
  } catch (err) {
    emailSent = false;
    console.error("SEND_PASSWORD_RESET_EMAIL_FAILED:", err?.message ?? err);
  }

  return { sent: emailSent };
}

/**
 * VERIFY RESET CODE
 */
export async function verifyResetCodeService({ email, code }) {
  const normalized = normalizeEmail(email);
  const otp = String(code ?? "").trim();

  if (!normalized || !otp) {
    throw httpError(400, "VALIDATION_ERROR", "Email and code are required");
  }

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) throw httpError(404, "USER_NOT_FOUND", "User not found");

  if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
    throw httpError(400, "CODE_EXPIRED", "Code expired. Please request a new one.");
  }

  if (!user.passwordResetCodeHash) {
    throw httpError(400, "INVALID_CODE", "Invalid reset code");
  }

  const ok = await bcrypt.compare(otp, user.passwordResetCodeHash);
  if (!ok) throw httpError(400, "INVALID_CODE", "Invalid reset code");

  return { valid: true };
}

/**
 * RESET PASSWORD
 * - verify code
 * - set new passwordHash
 * - clear reset code fields
 */
export async function resetPasswordService({ email, code, password }) {
  const normalized = normalizeEmail(email);
  const otp = String(code ?? "").trim();

  if (!normalized || !otp || !password) {
    throw httpError(400, "VALIDATION_ERROR", "Email, code, and password are required");
  }

  validateStrongPasswordOrThrow(password);

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) throw httpError(404, "USER_NOT_FOUND", "User not found");

  if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
    throw httpError(400, "CODE_EXPIRED", "Code expired. Please request a new one.");
  }

  if (!user.passwordResetCodeHash) {
    throw httpError(400, "INVALID_CODE", "Invalid reset code");
  }

  const ok = await bcrypt.compare(otp, user.passwordResetCodeHash);
  if (!ok) throw httpError(400, "INVALID_CODE", "Invalid reset code");

  const passwordHash = await bcrypt.hash(String(password), 10);

  await prisma.user.update({
    where: { email: normalized },
    data: {
      passwordHash,
      passwordResetCodeHash: null,
      passwordResetExpiresAt: null,
    },
  });

  return { reset: true };
}

/**
 * LOGIN
 * IMPORTANT:
 * - Use 400 for INVALID_CREDENTIALS so frontend does not redirect on 401.
 */
export async function loginService({ email, password, rememberMe }) {
  const normalized = normalizeEmail(email);

  if (!normalized || !password) {
    throw httpError(400, "VALIDATION_ERROR", "Email and password are required");
  }

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) {
    throw httpError(400, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  // OAuth-only accounts may have passwordHash = null
  if (!user.passwordHash) {
    throw httpError(
      400,
      "NO_PASSWORD",
      "This account doesn’t have a password set. Reset password or sign in with Google/GitHub."
    );
  }

  const passOk = await bcrypt.compare(password, user.passwordHash);
  if (!passOk) {
    throw httpError(400, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  assertAccountCanAccess(user);

  if (!user.isEmailVerified) {
    throw httpError(403, "EMAIL_NOT_VERIFIED", "Email not verified");
  }

  const token = makeJwtToken(user.id, Boolean(rememberMe));

  return {
    token,
    user: sanitizeUser(user),
  };
}

/**
 * ME
 */
export async function meService(userId) {
  const id = String(userId ?? "").trim(); // ✅ Prisma id is String (cuid)
  if (!id) throw httpError(400, "VALIDATION_ERROR", "Invalid user id");

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw httpError(404, "USER_NOT_FOUND", "User not found");

  return sanitizeUser(user);
}
export async function oauthCompleteService(userId, payload) {
  const id = String(userId ?? "").trim();
  if (!id) throw httpError(400, "VALIDATION_ERROR", "Invalid user id");

  // academicId unique check
  const existing = await prisma.user.findUnique({
    where: { academicId: payload.academicId },
    select: { id: true },
  });

  if (existing && existing.id !== id) {
    throw httpError(409, "ACADEMIC_ID_EXISTS", "Academic ID already exists");
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);

  const updated = await prisma.user.update({
    where: { id },
    data: {
      phone: payload.phone,
      academicId: payload.academicId,
      department: payload.department,
      academicYear: payload.academicYear,
      preferredTrack: payload.preferredTrack,
      passwordHash,
    },
  });

  return sanitizeUser(updated);
}

// -------------------- OAuth helpers --------------------

export function getGoogleAuthUrl(state) {
  if (!env.googleClientId || !env.googleClientSecret || !env.googleRedirectUri) {
    throw httpError(500, "OAUTH_NOT_CONFIGURED", "Google OAuth is not configured");
  }

  const params = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: env.googleRedirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  if (state) params.set("state", String(state));

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function getGithubAuthUrl(state) {
  if (!env.githubClientId || !env.githubClientSecret || !env.githubRedirectUri) {
    throw httpError(500, "OAUTH_NOT_CONFIGURED", "GitHub OAuth is not configured");
  }

  const params = new URLSearchParams({
    client_id: env.githubClientId,
    redirect_uri: env.githubRedirectUri,
    scope: "read:user user:email",
  });

  if (state) params.set("state", String(state));

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}


async function googleExchangeCodeForToken(code) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: String(code ?? ""),
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      redirect_uri: env.googleRedirectUri,
      grant_type: "authorization_code",
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw httpError(400, "OAUTH_ERROR", json?.error_description ?? "Google OAuth failed");
  }

  return json.access_token;
}

async function googleFetchProfile(accessToken) {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const json = await res.json();
  if (!res.ok) throw httpError(400, "OAUTH_ERROR", "Failed to fetch Google profile");

  return json;
}

export async function googleCallbackService(code, flow = "login") {
  if (!code) throw httpError(400, "OAUTH_ERROR", "Missing code");

  const accessToken = await googleExchangeCodeForToken(code);
  const profile = await googleFetchProfile(accessToken);

  const email = normalizeEmail(profile.email);
  if (!email) throw httpError(400, "OAUTH_ERROR", "Google account has no email");

  const googleId = String(profile.sub ?? "").trim();
  if (!googleId) throw httpError(400, "OAUTH_ERROR", "Google account has no id");

  const firstName = profile.given_name ?? "Google";
  const lastName = profile.family_name ?? "User";
  const avatarUrl = profile.picture ?? null;

  const existing = await prisma.user.findUnique({ where: { email } });

  // ✅ LOGIN: must exist
  if (flow === "login") {
    if (!existing) {
      throw httpError(
        401,
        "OAUTH_NOT_REGISTERED",
        "This account is not registered. Please register first."
      );
    }

    assertAccountCanAccess(existing);

    const user = await prisma.user.update({
      where: { email },
      data: {
        isEmailVerified: true,
        googleId,
        avatarUrl,
        firstName,
        lastName,
      },
    });

    const token = makeJwtToken(user.id, true);
    return { token, user: sanitizeUser(user), isNewUser: false };
  }

  // ✅ REGISTER: must NOT exist
  if (existing) {
    throw httpError(
      409,
      "EMAIL_ALREADY_EXISTS",
      "This email is already registered. Please login instead."
    );
  }

  const user = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      googleId,
      avatarUrl,
      passwordHash: null,
      isEmailVerified: true,
      role: "STUDENT",
      accountStatus: ACCOUNT_STATUSES.ACTIVE,

      // placeholder until oauth-complete overwrites it
      academicId: `OAUTH-GOOGLE-${googleId}`,

      phone: null,
      department: null,
      academicYear: null,
      preferredTrack: null,
    },
  });

  const token = makeJwtToken(user.id, true);
  return { token, user: sanitizeUser(user), isNewUser: true };
}




async function githubExchangeCodeForToken(code) {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: env.githubClientId,
      client_secret: env.githubClientSecret,
      redirect_uri: env.githubRedirectUri,
      code: String(code ?? ""),
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw httpError(400, "OAUTH_ERROR", json?.error_description ?? "GitHub OAuth failed");
  }

  return json.access_token;
}

async function githubFetchUser(accessToken) {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });

  const json = await res.json();
  if (!res.ok) throw httpError(400, "OAUTH_ERROR", "Failed to fetch GitHub user");

  return json;
}

async function githubFetchEmails(accessToken) {
  const res = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });

  const json = await res.json();
  if (!res.ok) throw httpError(400, "OAUTH_ERROR", "Failed to fetch GitHub emails");

  return Array.isArray(json) ? json : [];
}

export async function githubCallbackService(code, flow = "login") {
  if (!code) throw httpError(400, "OAUTH_ERROR", "Missing code");

  const accessToken = await githubExchangeCodeForToken(code);
  const ghUser = await githubFetchUser(accessToken);
  const emails = await githubFetchEmails(accessToken);

  const primary = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified);
  const email = normalizeEmail(primary?.email);

  if (!email) {
    throw httpError(400, "OAUTH_ERROR", "No verified email found on GitHub account");
  }

  const githubId = String(ghUser?.id ?? "").trim();
  if (!githubId) throw httpError(400, "OAUTH_ERROR", "GitHub account has no id");

  const name = String(ghUser?.name ?? "").trim();
  const [firstName, ...rest] = name ? name.split(" ") : ["GitHub", "User"];
  const lastName = rest.join(" ") || "User";
  const avatarUrl = ghUser?.avatar_url ?? null;

  const existing = await prisma.user.findUnique({ where: { email } });

  // ✅ LOGIN: must exist
  if (flow === "login") {
    if (!existing) {
      throw httpError(
        401,
        "OAUTH_NOT_REGISTERED",
        "This account is not registered. Please register first."
      );
    }

    assertAccountCanAccess(existing);

    const user = await prisma.user.update({
      where: { email },
      data: {
        isEmailVerified: true,
        githubId,
        avatarUrl,
        firstName,
        lastName,
      },
    });

    const token = makeJwtToken(user.id, true);
    return { token, user: sanitizeUser(user), isNewUser: false };
  }

  // ✅ REGISTER: must NOT exist
  if (existing) {
    throw httpError(
      409,
      "EMAIL_ALREADY_EXISTS",
      "This email is already registered. Please login instead."
    );
  }

  const user = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      githubId,
      avatarUrl,
      passwordHash: null,
      isEmailVerified: true,
      role: "STUDENT",
      accountStatus: ACCOUNT_STATUSES.ACTIVE,

      academicId: `OAUTH-GITHUB-${githubId}`,

      phone: null,
      department: null,
      academicYear: null,
      preferredTrack: null,
    },
  });

  const token = makeJwtToken(user.id, true);
  return { token, user: sanitizeUser(user), isNewUser: true };
}

