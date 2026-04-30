import { randomBytes } from "crypto";

import {
  loginService,
  meService,
  registerService,
  sendVerificationService,
  verifyEmailService,
  getGoogleAuthUrl,
  getGithubAuthUrl,
  googleCallbackService,
  githubCallbackService,
  forgotPasswordService,
  verifyResetCodeService,
  resetPasswordService,
  oauthCompleteService,
} from "./auth.service.js";

import { env } from "../../config/env.js";
import { AppError } from "../../common/errors/AppError.js";

function wantsJson(req) {
  const accept = String(req.headers.accept ?? "");
  return accept.includes("application/json") || req.query.json === "1";
}

function redirectToFrontendWithToken(res, token) {
  const base = env.frontendUrl?.replace(/\/+$/, "");
  const url = `${base}/oauth/callback#token=${encodeURIComponent(token)}`;
  return res.redirect(url);
}

// -------- OAuth state (CSRF protection) --------
// We store a short-lived random `state` in an httpOnly cookie, and also send the same
// `state` to Google/GitHub. On callback, both must match.
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OAUTH_COOKIE_PATH = "/api/v1/auth";

function makeState() {
  return randomBytes(32).toString("hex");
}

function oauthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    maxAge: OAUTH_STATE_TTL_MS,
    path: OAUTH_COOKIE_PATH,
  };
}
const OAUTH_FLOW_TTL_MS = 10 * 60 * 1000;
function oauthFlowCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    maxAge: OAUTH_FLOW_TTL_MS,
    path: OAUTH_COOKIE_PATH, // same as your state cookie path
  };
}

function redirectToFrontendError(res, provider, code, message) {
  const base = env.frontendUrl?.replace(/\/+$/, "");
  const url =
    `${base}/oauth/callback` +
    `#error=${encodeURIComponent(code)}` +
    `&provider=${encodeURIComponent(provider)}` +
    `&message=${encodeURIComponent(message || "")}`;
  return res.redirect(url);
}

function getSafeOAuthFrontendError(err) {
  if (err instanceof AppError) {
    return {
      code: err.code || "OAUTH_FAILED",
      message: err.message || "OAuth failed",
    };
  }

  return {
    code: "OAUTH_FAILED",
    message: "Something went wrong during sign in. Please try again.",
  };
}

function validateOAuthState(req, res, cookieName, provider) {
  const expected = req.cookies?.[cookieName]
  const received = String(req.query.state ?? "")

  // Clear cookie to prevent replay even if it's wrong
  res.clearCookie(cookieName, { path: OAUTH_COOKIE_PATH })

  if (!expected || !received || received !== expected) {
    // ✅ If frontend exists and not requesting JSON -> redirect to nice UI
    if (env.frontendUrl && !wantsJson(req)) {
      return redirectToFrontendError(
        res,
        provider,
        "OAUTH_STATE_MISMATCH",
        "Security check failed (state mismatch). Please try again."
      )
    }

    // fallback JSON
    res.status(400).json({
      ok: false,
      code: "OAUTH_STATE_MISMATCH",
      message: "Invalid OAuth state. Please try again.",
    })
    return false
  }

  return true
}


export async function register(req, res) {
  const {
    firstName,
    lastName,
    email,
    phone,
    academicId,
    department,
    academicYear,
    preferredTrack,
    password,
  } = req.validated.body;

  const result = await registerService({
    firstName,
    lastName,
    email,
    phone,
    academicId,
    department,
    academicYear,
    preferredTrack,
    password,
  });

  res.status(201).json({ ok: true, data: result });
}

export async function login(req, res) {
  const { email, password, rememberMe } = req.validated.body;
  const result = await loginService({ email, password, rememberMe });
  res.json({ ok: true, data: result });
}

export async function me(req, res) {
  const user = await meService(req.user.id);
  res.json({ ok: true, data: user });
}

export async function oauthComplete(req, res) {
  const { phone, academicId, department, academicYear, preferredTrack, password } =
    req.validated.body;

  const user = await oauthCompleteService(req.user.id, {
    phone,
    academicId,
    department,
    academicYear,
    preferredTrack,
    password,
  });

  res.json({ ok: true, data: user });
}

export async function sendVerification(req, res) {
  const { email } = req.validated.body;
  const result = await sendVerificationService({ email });
  res.json({ ok: true, data: result });
}

export async function verifyEmail(req, res) {
  const { email, code } = req.validated.body;
  const result = await verifyEmailService({ email, code });
  res.json({ ok: true, data: result });
}

export async function forgotPassword(req, res) {
  const { email } = req.validated.body;
  const result = await forgotPasswordService({ email });
  res.json({ ok: true, data: result });
}

export async function verifyResetCode(req, res) {
  const { email, code } = req.validated.body;
  const result = await verifyResetCodeService({ email, code });
  res.json({ ok: true, data: result });
}

export async function resetPassword(req, res) {
  const { email, code, password } = req.validated.body;
  const result = await resetPasswordService({ email, code, password });
  res.json({ ok: true, data: result });
}

// -------- OAuth endpoints --------

// Google start
export async function googleAuth(req, res) {
  const flow = (req.query.flow === "register" ? "register" : "login");

  const state = makeState();
  res.cookie("oauth_state_google", state, oauthCookieOptions());
  res.cookie("oauth_flow_google", flow, oauthFlowCookieOptions());

  const url = getGoogleAuthUrl(state);
  res.redirect(url);
}


// Google callback
export async function googleCallback(req, res) {
  if (!validateOAuthState(req, res, "oauth_state_google", "google")) return;


  const flow = req.cookies?.oauth_flow_google || "login";
  res.clearCookie("oauth_flow_google", { path: OAUTH_COOKIE_PATH });

  try {
    const code = req.query.code;
    const result = await googleCallbackService(code, flow); // pass flow

    if (!env.frontendUrl || wantsJson(req)) {
      return res.json({ ok: true, data: result });
    }

    const base = env.frontendUrl?.replace(/\/+$/, "");
    const extra = result.isNewUser ? "&new=1" : "";
    return res.redirect(`${base}/oauth/callback#token=${encodeURIComponent(result.token)}${extra}`);
  } catch (err) {
    const { code, message } = getSafeOAuthFrontendError(err);
    if (!env.frontendUrl || wantsJson(req)) throw err;
    return redirectToFrontendError(res, "google", code, message);
  }
}


// GitHub start
export async function githubAuth(req, res) {
  const flow = (req.query.flow === "register" ? "register" : "login");

  const state = makeState();
  res.cookie("oauth_state_github", state, oauthCookieOptions());
  res.cookie("oauth_flow_github", flow, oauthFlowCookieOptions());

  const url = getGithubAuthUrl(state);
  res.redirect(url);
}


// GitHub callback
export async function githubCallback(req, res) {
  if (!validateOAuthState(req, res, "oauth_state_github", "github")) return;


  const flow = req.cookies?.oauth_flow_github || "login";
  res.clearCookie("oauth_flow_github", { path: OAUTH_COOKIE_PATH });

  try {
    const code = req.query.code;
    const result = await githubCallbackService(code, flow); // pass flow

    if (!env.frontendUrl || wantsJson(req)) {
      return res.json({ ok: true, data: result });
    }

    const base = env.frontendUrl?.replace(/\/+$/, "");
    const extra = result.isNewUser ? "&new=1" : "";
    return res.redirect(`${base}/oauth/callback#token=${encodeURIComponent(result.token)}${extra}`);
  } catch (err) {
    const { code, message } = getSafeOAuthFrontendError(err);
    if (!env.frontendUrl || wantsJson(req)) throw err;
    return redirectToFrontendError(res, "github", code, message);
  }
}
