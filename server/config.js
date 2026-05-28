import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173',
  clientOrigins: (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173,http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret-before-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  encryptionKey: process.env.DATA_ENCRYPTION_KEY || 'change-this-32-byte-key-in-prod!!',
  otpExpiresMinutes: Number(process.env.OTP_EXPIRES_MINUTES || 10),
  captchaBypassToken: process.env.CAPTCHA_BYPASS_TOKEN || 'COHESION-DEV-CAPTCHA',
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'Cohesion fraternelle <noreply@cohesion.local>',
  },
  superAdmin: {
    email: 'bokassantwali@gmail.com',
    password: '20262026',
  },
};
