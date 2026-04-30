import "dotenv/config";

const str = (v) => (typeof v === "string" ? v.trim() : v);
const csv = (v) =>
  (typeof v === "string" ? v : "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const env = {
  nodeEnv: str(process.env.NODE_ENV) ?? "development",
  port: Number(process.env.PORT ?? 4000),

  // ✅ Support multiple origins (comma-separated)
  corsOrigins:
    csv(process.env.CORS_ORIGINS).length > 0
      ? csv(process.env.CORS_ORIGINS)
      : [str(process.env.CORS_ORIGIN) ?? "http://localhost:3000"],

  // Backward-compat (older code used corsOrigin)
  corsOrigin:
    csv(process.env.CORS_ORIGINS).length > 0
      ? csv(process.env.CORS_ORIGINS)[0]
      : str(process.env.CORS_ORIGIN) ?? "http://localhost:3000",

  // ✅ Needed for OAuth redirect back to frontend
  frontendUrl: str(process.env.FRONTEND_URL) ?? null,

  databaseUrl: str(process.env.DATABASE_URL),

  jwtSecret: str(process.env.JWT_SECRET),
  jwtExpiresIn: str(process.env.JWT_EXPIRES_IN) ?? "1d",
  jwtRememberExpiresIn: str(process.env.JWT_REMEMBER_EXPIRES_IN) ?? "30d",

 smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 0),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",

  mailFrom: process.env.MAIL_FROM ?? "GPMS <no-reply@gpms.local>",
  verificationCodeTtlMin: Number(process.env.VERIFICATION_CODE_TTL_MIN ?? 10),
  passwordResetTtlMin: Number(process.env.PASSWORD_RESET_TTL_MIN ?? 10),

  apiUrl: str(process.env.API_URL),
mailBrand: process.env.MAIL_BRAND ?? "GPMS",

  // OAuth
  googleClientId: str(process.env.GOOGLE_CLIENT_ID),
  googleClientSecret: str(process.env.GOOGLE_CLIENT_SECRET),
  googleRedirectUri: str(process.env.GOOGLE_REDIRECT_URI),

  githubClientId: str(process.env.GITHUB_CLIENT_ID),
  githubClientSecret: str(process.env.GITHUB_CLIENT_SECRET),
  githubRedirectUri: str(process.env.GITHUB_REDIRECT_URI),

  githubAppId: str(process.env.GITHUB_APP_ID),
  githubAppName: str(process.env.GITHUB_APP_NAME),
  githubAppPrivateKey: str(process.env.GITHUB_APP_PRIVATE_KEY),
  githubAppClientId: str(process.env.GITHUB_APP_CLIENT_ID),
  githubAppClientSecret: str(process.env.GITHUB_APP_CLIENT_SECRET),
  githubAppWebhookSecret: str(process.env.GITHUB_APP_WEBHOOK_SECRET),
  githubAppInstallUrl: str(process.env.GITHUB_APP_INSTALL_URL),
  githubAppSetupCallbackUrl: str(process.env.GITHUB_APP_SETUP_CALLBACK_URL),
  githubIntegrationRedirectUri: str(process.env.GITHUB_INTEGRATION_REDIRECT_URI),
  githubTokenEncryptionSecret: str(process.env.GITHUB_TOKEN_ENCRYPTION_SECRET),
};

if (!env.databaseUrl) throw new Error("Missing DATABASE_URL in .env");
if (!env.jwtSecret) throw new Error("Missing JWT_SECRET in .env");
