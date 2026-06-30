import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM ?? "no-reply@example.com";

const transporter = SMTP_HOST
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth:
        SMTP_USER && SMTP_PASS
          ? { user: SMTP_USER, pass: SMTP_PASS }
          : undefined,
    })
  : null;

export async function sendEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const { to, subject, text, html } = options;

  if (!transporter) {
    console.log("Email fallback: no SMTP configured. Email content:", {
      to,
      subject,
      text,
      html,
    });
    return;
  }

  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
}
