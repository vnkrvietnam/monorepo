import nodemailer from "nodemailer";
import { MAIL_CONFIG } from "@vnkrvietnam/config";

export const mailer = nodemailer.createTransport({
  host:   MAIL_CONFIG.SMTP_HOST,
  port:   MAIL_CONFIG.SMTP_PORT,
  secure: MAIL_CONFIG.SMTP_SECURE,
  auth: {
    user: MAIL_CONFIG.SMTP_USER,
    pass: MAIL_CONFIG.SMTP_PASS,
  },
});

/**
 * Send an OTP verification email.
 * @param to    Recipient email address
 * @param code  6-digit OTP code
 */
export async function sendOTPEmail(to: string, code: string): Promise<void> {
  await mailer.sendMail({
    from:    MAIL_CONFIG.EMAIL_FROM,
    to,
    subject: "[VNKR ID] Mã xác thực OTP của bạn",
    html: `<h3>Mã OTP của bạn là: <b>${code}</b></h3>
<p>Mã có hiệu lực trong 5 phút.</p>
<p style="color:#888;font-size:12px;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>`,
  });
}

/**
 * Send a generic transactional email.
 */
export async function sendTransactionalEmail(to: string, subject: string, html: string): Promise<void> {
  await mailer.sendMail({ from: MAIL_CONFIG.EMAIL_FROM, to, subject, html });
}
