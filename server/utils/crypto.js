import crypto from 'node:crypto';
import { config } from '../config.js';

const algorithm = 'aes-256-gcm';

function key() {
  return crypto.createHash('sha256').update(config.encryptionKey).digest();
}

export function encrypt(value) {
  if (!value) return value;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decrypt(value) {
  if (!value || typeof value !== 'string' || !value.startsWith('enc:')) return value;
  const [, ivText, tagText, encryptedText] = value.split(':');
  const decipher = crypto.createDecipheriv(algorithm, key(), Buffer.from(ivText, 'base64'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

export function publicUser(user) {
  if (!user) return null;
  const safe = { ...user };
  delete safe.password;
  delete safe.passwordHash;
  delete safe.resetOtpHash;
  delete safe.emailOtpHash;
  delete safe.twoFactorSecret;
  delete safe.pendingLoginOtpHash;
  return {
    ...safe,
    phone: decrypt(safe.phone),
    address: decrypt(safe.address),
  };
}

export function randomOtp() {
  return crypto.randomInt(100000, 999999).toString();
}
