import express from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { readDb, updateDb } from '../data/store.js';
import { authenticate, signToken } from '../middleware/auth.js';
import { loginLimiter, verifyCaptcha } from '../middleware/security.js';
import { encrypt, publicUser, randomOtp } from '../utils/crypto.js';
import { sendOtpEmail } from '../services/mailer.js';

export const authRouter = express.Router();

function requestContext(req) {
  return {
    ip: req.ip,
    device: req.headers['user-agent'] || 'Unknown device',
    timestamp: new Date().toISOString(),
  };
}

async function createSession(db, user, req) {
  const session = {
    id: randomUUID(),
    userId: user.id,
    ip: req.ip,
    device: req.headers['user-agent'] || 'Unknown device',
    active: true,
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
  };
  db.sessions.unshift(session);
  user.activeSessions = [session.id, ...(user.activeSessions || [])].slice(0, 8);
  return session;
}

authRouter.post('/register', verifyCaptcha, async (req, res) => {
  const payload = req.body;
  const email = String(payload.email || '').toLowerCase().trim();
  if (!email || !payload.password || !payload.fullName) {
    return res.status(400).json({ message: 'Nom complet, email et mot de passe requis.' });
  }

  let registrationOtp;
  const result = await updateDb(async (db) => {
    if (db.members.some((member) => member.email.toLowerCase() === email)) return null;
    const user = {
      id: `m-${Date.now()}`,
      fullName: payload.fullName,
      email,
      phone: encrypt(payload.phone),
      passwordHash: await bcrypt.hash(payload.password, 12),
      avatar: payload.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      banner: payload.banner || 'linear-gradient(135deg, #0b2f64 0%, #1e40af 100%)',
      profession: payload.profession || '',
      gender: payload.gender || payload.sexe || '',
      address: encrypt(payload.address || ''),
      bio: payload.bio || '',
      birthDate: payload.birthDate || '',
      role: 'Membre Standard',
      status: 'online',
      xp: 100,
      level: 1,
      badges: ['Nouveau'],
      isBlocked: false,
      mfaEnabled: false,
      emailVerified: false,
      joinedAt: new Date().toISOString().split('T')[0],
      failedLoginCount: 0,
      activeSessions: [],
      notificationPreferences: { push: true, email: true, sms: false },
    };
    const otp = randomOtp();
    registrationOtp = otp;
    user.emailOtpHash = await bcrypt.hash(otp, 10);
    user.emailOtpExpiresAt = new Date(Date.now() + config.otpExpiresMinutes * 60000).toISOString();
    db.members.push(user);
    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      type: 'USER_REGISTERED',
      email,
      details: 'Nouveau compte créé, vérification email en attente.',
      ...requestContext(req),
    });
    await sendOtpEmail({ to: email, subject: 'Vérification email Cohésion fraternelle', otp, reason: 'Vérification email' });
    return publicUser(user);
  });

  if (!result) return res.status(409).json({ message: 'Cet email existe déjà.' });
  return res.status(201).json({
    user: result,
    message: 'Compte créé. OTP de vérification envoyé.',
    devOtp: config.env === 'production' ? undefined : registrationOtp,
  });
});

authRouter.post('/login', loginLimiter, verifyCaptcha, async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const password = String(req.body.password || '');
  const db = await readDb();
  const user = db.members.find((member) => member.email.toLowerCase() === email);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    await updateDb((nextDb) => {
      const found = nextDb.members.find((member) => member.email.toLowerCase() === email);
      if (found) found.failedLoginCount = (found.failedLoginCount || 0) + 1;
      nextDb.activityLogs.unshift({
        id: `log-${Date.now()}`,
        type: 'SUSPECT_ATTEMPT',
        email,
        details: 'Échec de connexion : identifiants incorrects.',
        ...requestContext(req),
      });
    });
    return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
  }

  if (user.isBlocked) return res.status(423).json({ message: 'Compte suspendu.' });

  if (!user.emailVerified && user.emailOtpHash) {
    return res.status(403).json({ message: 'Veuillez valider le code OTP reçu à l’inscription avant de vous connecter.' });
  }

  const login = await updateDb(async (nextDb) => {
    const nextUser = nextDb.members.find((member) => member.id === user.id);
    nextUser.failedLoginCount = 0;
    const session = await createSession(nextDb, nextUser, req);
    nextDb.activityLogs.unshift({
      id: `log-${Date.now()}`,
      type: 'SUCCESS_LOGIN',
      email,
      details: `Connexion réussie (${nextUser.role}).`,
      ...requestContext(req),
    });
    return { token: signToken(nextUser, session.id), user: publicUser(nextUser), session };
  });

  return res.json(login);
});

authRouter.post('/verify-registration-otp', async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const otp = String(req.body.otp || '');
  const db = await readDb();
  const user = db.members.find((member) => member.email.toLowerCase() === email);
  const expiresAt = user?.emailOtpExpiresAt ? new Date(user.emailOtpExpiresAt).getTime() : 0;

  if (!user || Date.now() > expiresAt || !(await bcrypt.compare(otp, user.emailOtpHash || ''))) {
    return res.status(401).json({ message: 'OTP d’inscription invalide ou expiré.' });
  }

  const verifiedUser = await updateDb((nextDb) => {
    const nextUser = nextDb.members.find((member) => member.id === user.id);
    nextUser.emailVerified = true;
    nextUser.emailOtpHash = undefined;
    nextUser.emailOtpExpiresAt = undefined;
    nextDb.activityLogs.unshift({
      id: `log-${Date.now()}`,
      type: 'REGISTRATION_2FA_VERIFIED',
      email,
      details: 'Double authentification validée à l’inscription.',
      ...requestContext(req),
    });
    return publicUser(nextUser);
  });

  return res.json({ user: verifiedUser, message: 'Inscription vérifiée. Vous pouvez vous connecter.' });
});

authRouter.post('/verify-otp', async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const otp = String(req.body.otp || '');
  const db = await readDb();
  const user = db.members.find((member) => member.email.toLowerCase() === email);
  const expiresAt = user?.pendingLoginOtpExpiresAt ? new Date(user.pendingLoginOtpExpiresAt).getTime() : 0;
  if (!user || Date.now() > expiresAt || !(await bcrypt.compare(otp, user.pendingLoginOtpHash || ''))) {
    return res.status(401).json({ message: 'OTP invalide ou expiré.' });
  }

  const login = await updateDb(async (nextDb) => {
    const nextUser = nextDb.members.find((member) => member.id === user.id);
    nextUser.pendingLoginOtpHash = undefined;
    nextUser.pendingLoginOtpExpiresAt = undefined;
    const session = await createSession(nextDb, nextUser, req);
    nextDb.activityLogs.unshift({
      id: `log-${Date.now()}`,
      type: 'MFA_VERIFIED',
      email,
      details: 'Validation double facteur réussie.',
      ...requestContext(req),
    });
    return { token: signToken(nextUser, session.id), user: publicUser(nextUser), session };
  });

  return res.json(login);
});

authRouter.post('/forgot-password', verifyCaptcha, async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const otp = randomOtp();
  await updateDb(async (db) => {
    const user = db.members.find((member) => member.email.toLowerCase() === email);
    if (user) {
      user.resetOtpHash = await bcrypt.hash(otp, 10);
      user.resetOtpExpiresAt = new Date(Date.now() + config.otpExpiresMinutes * 60000).toISOString();
      db.activityLogs.unshift({
        id: `log-${Date.now()}`,
        type: 'PASSWORD_RESET_REQUESTED',
        email,
        details: 'OTP de récupération généré.',
        ...requestContext(req),
      });
      await sendOtpEmail({ to: email, subject: 'Récupération mot de passe', otp, reason: 'Mot de passe oublié' });
    }
  });
  return res.json({ message: 'Si le compte existe, un OTP a été envoyé.', devOtp: config.env === 'production' ? undefined : otp });
});

authRouter.post('/reset-password', async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const otp = String(req.body.otp || '');
  const newPassword = String(req.body.password || '');
  if (newPassword.length < 8) return res.status(400).json({ message: 'Mot de passe trop court.' });

  const ok = await updateDb(async (db) => {
    const user = db.members.find((member) => member.email.toLowerCase() === email);
    const expiresAt = user?.resetOtpExpiresAt ? new Date(user.resetOtpExpiresAt).getTime() : 0;
    if (!user || Date.now() > expiresAt || !(await bcrypt.compare(otp, user.resetOtpHash || ''))) return false;
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.resetOtpHash = undefined;
    user.resetOtpExpiresAt = undefined;
    user.activeSessions = [];
    db.sessions.forEach((session) => {
      if (session.userId === user.id) session.active = false;
    });
    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      type: 'PASSWORD_RESET_DONE',
      email,
      details: 'Mot de passe réinitialisé et sessions révoquées.',
      ...requestContext(req),
    });
    return true;
  });
  if (!ok) return res.status(401).json({ message: 'OTP invalide ou expiré.' });
  return res.json({ message: 'Mot de passe mis à jour.' });
});

authRouter.post('/logout', authenticate, async (req, res) => {
  await updateDb((db) => {
    const session = db.sessions.find((item) => item.id === req.auth.sessionId);
    if (session) session.active = false;
    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      type: 'USER_LOGOUT',
      email: req.user.email,
      details: 'Déconnexion utilisateur.',
      ...requestContext(req),
    });
  });
  return res.json({ message: 'Déconnexion réussie.' });
});

authRouter.get('/me', authenticate, (req, res) => {
  res.json({ user: req.publicUser });
});
