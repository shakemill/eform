import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";

function stripQuotes(s: string): string {
  const t = s.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1);
  }
  return t;
}

/**
 * True when SMTP env vars are set (preferred mail transport for this app).
 */
export function smtpConfigured(): boolean {
  return Boolean(
    process.env.MAIL_HOST?.trim() &&
      process.env.MAIL_USERNAME?.trim() &&
      process.env.MAIL_PASSWORD?.trim(),
  );
}

/**
 * From header for SMTP and NextAuth Email provider: `"Name" <addr@>`.
 */
export function mailFromAddress(): string {
  const addr =
    process.env.MAIL_FROM_ADDRESS?.trim() ??
    process.env.RESEND_FROM_EMAIL?.trim() ??
    "onboarding@resend.dev";
  const rawName = process.env.MAIL_FROM_NAME?.trim();
  if (!rawName) return addr;
  const name = stripQuotes(rawName);
  return `${name} <${addr}>`;
}

function createTransport() {
  const host = process.env.MAIL_HOST?.trim();
  const user = process.env.MAIL_USERNAME?.trim();
  const pass = process.env.MAIL_PASSWORD?.trim();
  if (!host || !user || !pass) {
    throw new Error("SMTP incomplet (MAIL_HOST, MAIL_USERNAME, MAIL_PASSWORD)");
  }

  const port = Number(process.env.MAIL_PORT ?? "465");
  const enc = (process.env.MAIL_ENCRYPTION ?? "ssl").toLowerCase();
  const secure = enc === "ssl" || port === 465;

  if (enc === "tls" && port === 587) {
    return nodemailer.createTransport({
      host,
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

/**
 * Send HTML email via configured SMTP.
 */
export async function sendSmtpMail(options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  attachments?: Mail.Attachment[];
}): Promise<void> {
  if (!smtpConfigured()) {
    throw new Error("SMTP non configuré");
  }
  const transport = createTransport();
  const from = options.from ?? mailFromAddress();
  await transport.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments,
  });
}
