import nodemailer from "nodemailer";

// Sends email in one of two ways:
//  1. Brevo's HTTPS API (BREVO_API_KEY). Use this on Render's free plan, which blocks
//     outbound SMTP ports 25, 465 and 587. Brevo's free plan allows 300 emails a day.
//  2. Any SMTP mailbox (SMTP_HOST, SMTP_USER, SMTP_PASS), for hosts that allow SMTP.
// With neither configured, emails are printed to the server log instead, so every
// flow still works locally.
let transporter = null;

const smtpConfigured = () => !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const configured = () => !!process.env.BREVO_API_KEY || smtpConfigured();

// "Palmadex 360 <noreply@example.com>" -> { name, email }
function parseFrom(value) {
  const m = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(value || "");
  return m ? { name: m[1].trim() || undefined, email: m[2].trim() } : { email: (value || "").trim() };
}

async function sendWithBrevo({ to, subject, html, text }) {
  const sender = parseFrom(process.env.MAIL_FROM);
  if (!sender.email) throw new Error("MAIL_FROM must be set to a sender address verified in Brevo");
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": process.env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender, to: [{ email: to }], subject, htmlContent: html, textContent: text }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Brevo responded ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

function getTransporter() {
  if (!smtpConfigured()) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

export const appUrl = (path = "") => `${(process.env.APP_URL || "http://localhost:5173").replace(/\/$/, "")}${path}`;

const escape = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Simple branded layout. `paragraphs` are plain text and get escaped.
export function renderEmail({ heading, paragraphs = [], action }) {
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px;line-height:1.55">${escape(p)}</p>`).join("");
  const button = action
    ? `<p style="margin:22px 0"><a href="${escape(action.url)}" style="background:#0077b3;color:#fff;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:600">${escape(action.label)}</a></p>
       <p style="font-size:12px;color:#6b7280;margin:0 0 14px">If the button does not work, copy this link into your browser:<br>${escape(action.url)}</p>`
    : "";
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;color:#111827">
      <p style="font-weight:700;color:#0077b3;margin:0 0 18px">Palmadex 360</p>
      <h2 style="margin:0 0 16px;font-size:20px">${escape(heading)}</h2>${body}${button}
      <p style="font-size:12px;color:#9ca3af;margin-top:24px">This is an automated message from Palmadex 360.</p>
    </div></div>`;
  const text = [heading, "", ...paragraphs, ...(action ? ["", `${action.label}: ${action.url}`] : [])].join("\n");
  return { html, text };
}

export async function sendMail({ to, subject, heading, paragraphs, action }) {
  if (!to) return { skipped: true };
  const { html, text } = renderEmail({ heading: heading || subject, paragraphs, action });
  const t = process.env.BREVO_API_KEY ? null : getTransporter();
  if (!process.env.BREVO_API_KEY && !t) {
    console.log(`\n[email not sent: no email service configured]\nTo: ${to}\nSubject: ${subject}\n${text}\n`);
    return { logged: true };
  }
  try {
    if (process.env.BREVO_API_KEY) await sendWithBrevo({ to, subject, html, text });
    else await t.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, html, text });
    return { sent: true };
  } catch (err) {
    // Email problems must never break the request that triggered them.
    console.error("EMAIL ERROR:", err.message);
    return { error: err.message };
  }
}

export const mailService = { sendMail, appUrl, isConfigured: configured };
