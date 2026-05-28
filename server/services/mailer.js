import nodemailer from 'nodemailer';
import { config } from '../config.js';

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  if (config.smtp.host && config.smtp.user && config.smtp.pass) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
  } else {
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
  }
  return transporter;
}

export async function sendOtpEmail({ to, subject, otp, reason }) {
  const info = await getTransporter().sendMail({
    from: config.smtp.from,
    to,
    subject,
    text: `Code OTP Cohésion fraternelle: ${otp}\nMotif: ${reason}\nExpiration: ${config.otpExpiresMinutes} minutes.`,
  });
  return info;
}
