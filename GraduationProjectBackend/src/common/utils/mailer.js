import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

function smtpConfigured() {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
}

export function createTransporter() {
  if (!smtpConfigured()) {
    throw new Error("SMTP is not configured");
  }

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: Number(env.smtpPort) === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
}

// ---------- Email UI helpers ----------

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Modern, email-safe HTML builder:
 * - Table-based layout
 * - Responsive tweaks
 * - Dark mode support
 * - Digits as "chips" for a premium code look
 * - Optional CTA button (safe to omit)
 */
function buildEmailHtml({
  preheader,
  title,
  subtitle,
  code,
  codeLabel,
  expiresText,
  footerNote,

  // Optional CTA
  ctaText,
  ctaUrl,
}) {
  const safePreheader = escapeHtml(preheader);
  const safeTitle = escapeHtml(title);
  const safeSubtitle = escapeHtml(subtitle);
  const safeCodeLabel = escapeHtml(codeLabel);
  const safeExpires = escapeHtml(expiresText);
  const safeFooter = escapeHtml(footerNote);

  const brandName = escapeHtml(env.mailBrand ?? "GPMS");
  const accent = escapeHtml(env.mailAccent ?? "#4f46e5"); // indigo-ish
  const appName = escapeHtml(env.mailAppName ?? brandName);

  const supportText = escapeHtml(env.mailSupportText ?? "Need help?");
  const supportUrl = escapeHtml(env.mailSupportUrl ?? "");

  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const rawCode = String(code ?? "").trim();

  // Premium "chip" code UI that still works across clients
  const codeDigits = rawCode
    .split("")
    .map((ch) => {
      const d = escapeHtml(ch);
      return `
        <span class="code-chip" style="
          display:inline-block;
          min-width:40px;
          padding:12px 0;
          margin:0 6px;
          border-radius:12px;
          background:#f3f4f6;
          border:1px solid #e5e7eb;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
          font-size:22px;
          line-height:24px;
          font-weight:900;
          color:#0f172a;
          text-align:center;
        ">${d}</span>
      `.trim();
    })
    .join("");

  const hasCta = Boolean(ctaText && ctaUrl);
  const safeCtaText = escapeHtml(ctaText);
  const safeCtaUrl = escapeHtml(ctaUrl);

  // Bulletproof button
  const ctaButtonHtml = hasCta
    ? `
      <tr>
        <td class="px" style="padding:0 32px 26px 32px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
            <tr>
              <td style="border-radius:14px; background:${accent};">
                <a href="${safeCtaUrl}" target="_blank" style="
                  display:inline-block;
                  padding:14px 18px;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                  font-size:14px;
                  font-weight:900;
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:14px;
                ">
                  ${safeCtaText} →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `.trim()
    : "";

  const supportLineHtml = supportUrl
    ? ` ${supportText} <a href="${supportUrl}" target="_blank" style="color:${accent}; text-decoration:none; font-weight:800;">Contact support</a>.`
    : "";

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>${safeTitle}</title>

    <style>
      /* Some clients respect this, others ignore; layout is inline */
      @media (max-width: 640px) {
        .container { width: 100% !important; }
        .px { padding-left: 18px !important; padding-right: 18px !important; }
        .hero-title { font-size: 22px !important; line-height: 30px !important; }
        .subtitle { font-size: 14px !important; line-height: 22px !important; }
        .code-wrap { padding: 14px !important; }
        .code-chip { min-width: 34px !important; margin: 0 4px !important; }
      }

      @media (prefers-color-scheme: dark) {
        body, .page-bg { background: #0b1220 !important; }
        .card { background: #0f172a !important; border-color: rgba(255,255,255,0.12) !important; }
        .muted { color: rgba(255,255,255,0.72) !important; }
        .title { color: #ffffff !important; }
        .hairline { border-color: rgba(255,255,255,0.12) !important; }
        .code-wrap { background: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.14) !important; }
        .code-chip { background: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.16) !important; color: #ffffff !important; }
      }
    </style>
  </head>

  <body class="page-bg" style="margin:0; padding:0; background:#f5f7fb;">
    <!-- Preheader -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
      ${safePreheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f7fb; padding:26px 0;">
      <tr>
        <td align="center" style="padding:0 14px;">
          <table role="presentation" class="container" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:640px;">

            <!-- Top bar -->
            <tr>
              <td style="padding:0 0 12px 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="
                      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                      font-size:13px;
                      color:#6b7280;">
                      <span style="
                        display:inline-block;
                        padding:10px 12px;
                        border-radius:999px;
                        background:rgba(79,70,229,0.10);
                        color:${accent};
                        font-weight:900;
                        letter-spacing:0.02em;">
                        ${brandName}
                      </span>
                    </td>
                    <td align="right" style="
                      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                      font-size:13px;
                      color:#9ca3af;">
                      ${escapeHtml(dateStr)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Accent strip -->
            <tr>
              <td style="height:6px; background:${accent}; border-radius:999px;"></td>
            </tr>

            <!-- Card -->
            <tr>
              <td class="card" style="
                background:#ffffff;
                border-radius:18px;
                border:1px solid rgba(17,24,39,0.06);
                box-shadow:0 18px 45px rgba(2,6,23,0.10);
                overflow:hidden;
              ">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">

                  <!-- Hero -->
                  <tr>
                    <td class="px" style="padding:30px 32px 10px 32px;">
                      <div class="title hero-title" style="
                        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                        font-size:26px;
                        line-height:34px;
                        font-weight:900;
                        color:#0f172a;
                        letter-spacing:-0.02em;">
                        ${safeTitle}
                      </div>

                      <div class="muted subtitle" style="
                        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                        font-size:15px;
                        line-height:24px;
                        color:#475569;
                        margin-top:10px;">
                        ${safeSubtitle}
                      </div>
                    </td>
                  </tr>

                  <!-- Divider -->
                  <tr>
                    <td class="px" style="padding:14px 32px 0 32px;">
                      <div class="hairline" style="border-top:1px solid rgba(15,23,42,0.08);"></div>
                    </td>
                  </tr>

                  <!-- Code label -->
                  <tr>
                    <td class="px" style="padding:18px 32px 10px 32px;">
                      <div class="muted" style="
                        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                        font-size:12px;
                        color:#64748b;
                        font-weight:900;
                        letter-spacing:0.10em;">
                        ${safeCodeLabel}
                      </div>
                    </td>
                  </tr>

                  <!-- Code box -->
                  <tr>
                    <td class="px" style="padding:0 32px 14px 32px;">
                      <div class="code-wrap" style="
                        background:#f8fafc;
                        border:1px solid rgba(15,23,42,0.10);
                        border-radius:16px;
                        padding:18px 14px;
                        text-align:center;
                      ">
                        <div style="white-space:nowrap;">
                          ${codeDigits}
                        </div>

                        <!-- Fallback raw code (some clients may collapse spans) -->
                        <div class="muted" style="
                          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
                          font-size:14px;
                          color:#64748b;
                          margin-top:12px;
                          letter-spacing:0.18em;
                        ">
                          ${escapeHtml(rawCode)}
                        </div>

                        <div class="muted" style="
                          font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                          font-size:12px;
                          line-height:18px;
                          color:#64748b;
                          margin-top:10px;">
                          ${safeExpires}
                        </div>
                      </div>
                    </td>
                  </tr>

                  ${ctaButtonHtml}

                  <!-- Tips -->
                  <tr>
                    <td class="px" style="padding:0 32px 26px 32px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="
                            background: rgba(79,70,229,0.06);
                            border:1px solid rgba(79,70,229,0.14);
                            border-radius:14px;
                            padding:14px 14px;
                            font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                            font-size:13px;
                            line-height:20px;
                            color:#475569;">
                            <strong style="color:#0f172a;">Tip:</strong> Copy the code and paste it into ${appName}.
                            If you didn’t request this, you can ignore this email.${supportLineHtml}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:14px 6px 0 6px;">
                <div class="muted" style="
                  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                  font-size:12px;
                  line-height:18px;
                  color:#94a3b8;
                  text-align:center;">
                  ${safeFooter}<br />
                  <span style="color:#a0a8b5;">This is an automated message — please do not reply.</span>
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

function buildEmailText({ title, subtitle, code, expiresText, footerNote }) {
  return [
    title,
    "",
    subtitle,
    "",
    `Code: ${code}`,
    expiresText,
    "",
    footerNote,
    "Automated message — do not reply.",
  ].join("\n");
}

async function sendMailSafe({ to, subject, html, text }) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: env.mailFrom,
    to,
    subject,
    html,
    text,
  });
}

// ---------- Emails ----------

export async function sendVerificationEmail({ to, code }) {
  if (!smtpConfigured()) {
    if (env.nodeEnv !== "production") {
      console.log(`[DEV][EMAIL] Verification code for ${to}: ${code}`);
      return;
    }
    throw new Error("SMTP is not configured");
  }

  const html = buildEmailHtml({
    preheader: "Use this code to verify your email.",
    title: "Verify your email",
    subtitle: "Enter the 6-digit code below to complete your email verification.",
    code,
    codeLabel: "VERIFICATION CODE",
    expiresText: `Expires in ${env.verificationCodeTtlMin} minutes.`,
    footerNote: "GPMS Security",

    // Optional CTA (uncomment if you have a URL)
    // ctaText: "Open app",
    // ctaUrl: env.appUrl,
  });

  const text = buildEmailText({
    title: "Verify your email",
    subtitle: "Enter the 6-digit code below to complete your email verification.",
    code,
    expiresText: `Expires in ${env.verificationCodeTtlMin} minutes.`,
    footerNote: "GPMS Security",
  });

  await sendMailSafe({
    to,
    subject: "Your verification code",
    html,
    text,
  });
}

export async function sendPasswordResetEmail({ to, code }) {
  if (!smtpConfigured()) {
    if (env.nodeEnv !== "production") {
      console.log(`[DEV][EMAIL] Password reset code for ${to}: ${code}`);
      return;
    }
    throw new Error("SMTP is not configured");
  }

  const html = buildEmailHtml({
    preheader: "Use this code to reset your password.",
    title: "Reset your password",
    subtitle:
      "We received a request to reset your password. Enter the code below to continue.",
    code,
    codeLabel: "PASSWORD RESET CODE",
    expiresText: `Expires in ${env.passwordResetTtlMin} minutes.`,
    footerNote:
      "If you didn’t request a password reset, you can safely ignore this email.",

    // Optional CTA (uncomment if you have a URL)
    // ctaText: "Reset password",
    // ctaUrl: `${env.appUrl}/reset-password`,
  });

  const text = buildEmailText({
    title: "Reset your password",
    subtitle:
      "We received a request to reset your password. Enter the code below to continue.",
    code,
    expiresText: `Expires in ${env.passwordResetTtlMin} minutes.`,
    footerNote:
      "If you didn’t request a password reset, you can safely ignore this email.",
  });

  await sendMailSafe({
    to,
    subject: "Password reset code",
    html,
    text,
  });
}

export async function sendTeamInvitationEmail({ to, teamName, leaderName, inviteCode }) {
  if (!smtpConfigured()) {
    if (env.nodeEnv !== "production") {
      console.log(`[DEV][EMAIL] Team invitation for ${to}: ${teamName} (${inviteCode})`);
      return;
    }
    throw new Error("SMTP is not configured");
  }

  const safeTeamName = String(teamName ?? "GPMS Team");
  const safeLeaderName = String(leaderName ?? "A team leader");

  const html = buildEmailHtml({
    preheader: `You've been invited to join ${safeTeamName}.`,
    title: "You've been invited to a team",
    subtitle: `${safeLeaderName} invited you to join ${safeTeamName} in GPMS. Use the invite code below or open the app to respond.`,
    code: inviteCode,
    codeLabel: "TEAM INVITE CODE",
    expiresText: "This invite stays available until the team is full or the invitation is withdrawn.",
    footerNote: "GPMS Team Collaboration",
  });

  const text = [
    "You've been invited to a team",
    "",
    `${safeLeaderName} invited you to join ${safeTeamName} in GPMS.`,
    "",
    `Invite code: ${inviteCode}`,
    "This invite stays available until the team is full or the invitation is withdrawn.",
    "",
    "GPMS Team Collaboration",
  ].join("\n");

  await sendMailSafe({
    to,
    subject: `Team invitation: ${safeTeamName}`,
    html,
    text,
  });
}
