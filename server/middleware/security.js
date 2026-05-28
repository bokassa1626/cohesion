import rateLimit from 'express-rate-limit';
import { config } from '../config.js';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives. Réessayez dans quelques minutes.' },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 180,
  standardHeaders: true,
  legacyHeaders: false,
});

export function verifyCaptcha(req, res, next) {
  const token = req.body.captchaToken || req.headers['x-captcha-token'];
  if (config.env !== 'production' && !token) return next();
  if (token === config.captchaBypassToken) return next();
  return res.status(400).json({ message: 'Captcha invalide.' });
}
