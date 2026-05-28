import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { readDb } from '../data/store.js';
import { publicUser } from '../utils/crypto.js';

export function signToken(user, sessionId) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, sessionId },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
}

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Authentification requise.' });
    const payload = jwt.verify(token, config.jwtSecret);
    const db = await readDb();
    const user = db.members.find((member) => member.id === payload.sub);
    const session = db.sessions.find((item) => item.id === payload.sessionId && item.userId === payload.sub && item.active);
    if (!user || user.isBlocked || !session) {
      return res.status(401).json({ message: 'Session invalide ou compte suspendu.' });
    }
    req.auth = payload;
    req.user = user;
    req.publicUser = publicUser(user);
    return next();
  } catch {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
}

export function requirePermission(permission) {
  return async (req, res, next) => {
    const db = await readDb();
    const role = db.roles.find((item) => item.name === req.user.role);
    if (req.user.role === 'Super Admin' || role?.permissions?.[permission]) return next();
    return res.status(403).json({ message: `Permission requise: ${permission}` });
  };
}
