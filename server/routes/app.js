import express from 'express';
import QRCode from 'qrcode';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { backupDb, readDb, updateDb } from '../data/store.js';
import { publicUser } from '../utils/crypto.js';
import { emitRealtime } from '../services/realtime.js';

export const appRouter = express.Router();

const resources = {
  members: { key: 'members', permission: 'manageMembers' },
  posts: { key: 'posts', permission: 'writePosts' },
  announcements: { key: 'announcements', permission: 'writePosts' },
  events: { key: 'events', permission: 'manageEvents' },
  documents: { key: 'documents', permission: 'writePosts' },
  messages: { key: 'chats', permission: 'moderateContent' },
  roles: { key: 'roles', permission: 'manageRoles' },
  permissions: { key: 'roles', permission: 'manageRoles' },
  categories: { key: 'categories', permission: 'moderateContent' },
  finances: { key: 'finances', permission: 'viewFinances' },
  projects: { key: 'projects', permission: 'manageEvents' },
};

function sanitizeDb(db) {
  return {
    roles: db.roles,
    members: db.members.map(publicUser),
    chats: db.chats,
    posts: db.posts,
    stories: db.stories,
    events: db.events,
    finances: db.finances,
    documents: db.documents,
    announcements: db.announcements,
    categories: db.categories,
    projects: db.projects,
    notifications: db.notifications,
    logs: db.activityLogs,
    sessions: db.sessions,
  };
}

function getCollection(db, key) {
  if (key === 'finances') return db.finances.cotisations;
  return db[key];
}

function setCollection(db, key, collection) {
  if (key === 'finances') db.finances.cotisations = collection;
  else db[key] = collection;
}

function ensureResource(req, res, next) {
  const resource = resources[req.params.resource];
  if (!resource) return res.status(404).json({ message: 'Ressource inconnue.' });
  req.resource = resource;
  return next();
}

appRouter.get('/health', (req, res) => {
  res.json({ ok: true, name: 'Cohésion fraternelle API', time: new Date().toISOString() });
});

appRouter.use(authenticate);

appRouter.get('/bootstrap', async (req, res) => {
  const db = await readDb();
  res.json(sanitizeDb(db));
});

appRouter.get('/dashboard', requirePermission('viewDashboard'), async (req, res) => {
  const db = await readDb();
  const activeMembers = db.members.filter((member) => member.status === 'online').length;
  const paid = db.finances.cotisations.filter((item) => item.status === 'Payé').length;
  res.json({
    kpis: {
      totalMembers: db.members.length,
      activeMembers,
      posts: db.posts.length,
      events: db.events.length,
      participationRate: Math.round((paid / Math.max(db.members.length, 1)) * 100),
      balance: db.finances.stats.balance,
    },
    recentActivities: db.activityLogs.slice(0, 8),
    recentPosts: db.posts.slice(0, 5),
    newMembers: db.members.slice(-5).map(publicUser),
    monthlyStats: [
      { month: 'Jan', membres: 24, finances: 1200 },
      { month: 'Fév', membres: 32, finances: 1850 },
      { month: 'Mar', membres: 41, finances: 2400 },
      { month: 'Avr', membres: 55, finances: 3100 },
      { month: 'Mai', membres: db.members.length, finances: db.finances.stats.totalRecettes },
    ],
  });
});

appRouter.put('/profile', async (req, res) => {
  const allowedFields = [
    'fullName',
    'phone',
    'avatar',
    'banner',
    'profession',
    'gender',
    'address',
    'bio',
    'birthDate',
    'status',
    'notificationPreferences',
  ];

  const user = await updateDb((db) => {
    const member = db.members.find((item) => item.id === req.user.id);
    if (!member) return null;
    allowedFields.forEach((field) => {
      if (Object.hasOwn(req.body, field)) member[field] = req.body[field];
    });
    member.updatedAt = new Date().toISOString();
    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      type: 'PROFILE_UPDATED',
      email: req.user.email,
      details: 'Profil utilisateur mis à jour.',
      ip: req.ip,
      device: req.headers['user-agent'] || 'Unknown device',
      timestamp: new Date().toISOString(),
    });
    return publicUser(member);
  });

  if (!user) return res.status(404).json({ message: 'Profil introuvable.' });
  emitRealtime('profile:updated', { user });
  return res.json({ user });
});

appRouter.get('/crud/:resource', ensureResource, async (req, res) => {
  const db = await readDb();
  const data = getCollection(db, req.resource.key) || [];
  res.json({ data: req.resource.key === 'members' ? data.map(publicUser) : data });
});

appRouter.post('/crud/:resource', ensureResource, async (req, res, next) => {
  return requirePermission(req.resource.permission)(req, res, async () => {
    const item = await updateDb((db) => {
      const collection = getCollection(db, req.resource.key) || [];
      const created = {
        id: req.body.id || `${req.params.resource}-${Date.now()}`,
        archived: false,
        createdAt: new Date().toISOString(),
        ...req.body,
      };
      collection.push(created);
      setCollection(db, req.resource.key, collection);
      db.activityLogs.unshift({
        id: `log-${Date.now()}`,
        type: 'CRUD_CREATE',
        email: req.user.email,
        details: `Création ${req.params.resource}: ${created.id}`,
        ip: req.ip,
        device: req.headers['user-agent'] || 'Unknown device',
        timestamp: new Date().toISOString(),
      });
      return created;
    });
    emitRealtime('crud:created', { resource: req.params.resource, item });
    res.status(201).json({ item });
  })(req, res, next);
});

appRouter.put('/crud/:resource/:id', ensureResource, async (req, res, next) => {
  return requirePermission(req.resource.permission)(req, res, async () => {
    const item = await updateDb((db) => {
      const collection = getCollection(db, req.resource.key) || [];
      const index = collection.findIndex((entry) => entry.id === req.params.id || entry.name === req.params.id);
      if (index < 0) return null;
      collection[index] = { ...collection[index], ...req.body, updatedAt: new Date().toISOString() };
      setCollection(db, req.resource.key, collection);
      return collection[index];
    });
    if (!item) return res.status(404).json({ message: 'Élément introuvable.' });
    emitRealtime('crud:updated', { resource: req.params.resource, item });
    return res.json({ item });
  })(req, res, next);
});

appRouter.delete('/crud/:resource/:id', ensureResource, async (req, res, next) => {
  return requirePermission(req.resource.permission)(req, res, async () => {
    const item = await updateDb((db) => {
      const collection = getCollection(db, req.resource.key) || [];
      const index = collection.findIndex((entry) => entry.id === req.params.id || entry.name === req.params.id);
      if (index < 0) return null;
      collection[index] = { ...collection[index], archived: true, archivedAt: new Date().toISOString() };
      setCollection(db, req.resource.key, collection);
      return collection[index];
    });
    if (!item) return res.status(404).json({ message: 'Élément introuvable.' });
    emitRealtime('crud:archived', { resource: req.params.resource, item });
    return res.json({ item });
  })(req, res, next);
});

appRouter.post('/crud/:resource/:id/restore', ensureResource, async (req, res, next) => {
  return requirePermission(req.resource.permission)(req, res, async () => {
    const item = await updateDb((db) => {
      const collection = getCollection(db, req.resource.key) || [];
      const index = collection.findIndex((entry) => entry.id === req.params.id || entry.name === req.params.id);
      if (index < 0) return null;
      collection[index] = { ...collection[index], archived: false, restoredAt: new Date().toISOString() };
      setCollection(db, req.resource.key, collection);
      return collection[index];
    });
    if (!item) return res.status(404).json({ message: 'Élément introuvable.' });
    return res.json({ item });
  })(req, res, next);
});

appRouter.post('/chat/:chatId/messages', async (req, res) => {
  const message = await updateDb((db) => {
    const chat = db.chats.find((item) => item.id === req.params.chatId);
    if (!chat) return null;
    const nextMessage = {
      id: `msg-${Date.now()}`,
      senderId: req.user.id,
      senderName: req.user.fullName,
      content: req.body.content || '',
      file: req.body.file || null,
      replyTo: req.body.replyTo || null,
      reactions: {},
      readBy: [req.user.id],
      temporaryUntil: req.body.temporarySeconds
        ? new Date(Date.now() + Number(req.body.temporarySeconds) * 1000).toISOString()
        : null,
      timestamp: new Date().toISOString(),
      editedAt: null,
      deletedAt: null,
    };
    chat.messages.push(nextMessage);
    return nextMessage;
  });
  if (!message) return res.status(404).json({ message: 'Salon introuvable.' });
  emitRealtime('chat:message', { chatId: req.params.chatId, message }, req.params.chatId);
  return res.status(201).json({ message });
});

appRouter.post('/events/:id/rsvp', async (req, res) => {
  const event = await updateDb((db) => {
    const found = db.events.find((item) => item.id === req.params.id);
    if (!found) return null;
    const registered = found.participants.includes(req.user.id);
    found.participants = registered
      ? found.participants.filter((id) => id !== req.user.id)
      : [...found.participants, req.user.id];
    return found;
  });
  if (!event) return res.status(404).json({ message: 'Événement introuvable.' });
  return res.json({ event });
});

appRouter.get('/events/:id/qr', async (req, res) => {
  const token = `event:${req.params.id}:user:${req.user.id}`;
  const qr = await QRCode.toDataURL(token);
  res.json({ token, qr });
});

appRouter.post('/events/:id/presence', requirePermission('manageEvents'), async (req, res) => {
  const presence = {
    id: `presence-${Date.now()}`,
    eventId: req.params.id,
    token: req.body.token,
    scannedBy: req.user.id,
    scannedAt: new Date().toISOString(),
  };
  await updateDb((db) => {
    db.activityLogs.unshift({
      id: presence.id,
      type: 'EVENT_PRESENCE',
      email: req.user.email,
      details: `Présence validée pour ${req.params.id}.`,
      ip: req.ip,
      device: req.headers['user-agent'] || 'Unknown device',
      timestamp: presence.scannedAt,
    });
  });
  res.json({ presence });
});

appRouter.post('/payments/mobile-money', async (req, res) => {
  const receipt = await updateDb((db) => {
    const cotisation = db.finances.cotisations.find((item) => item.id === req.body.cotisationId);
    if (!cotisation) return null;
    cotisation.status = 'Payé';
    cotisation.gateway = req.body.gateway || 'Mobile Money';
    cotisation.date = new Date().toISOString().split('T')[0];
    cotisation.transactionId = `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;
    db.finances.stats.totalRecettes += Number(cotisation.amount || 0);
    db.finances.stats.balance += Number(cotisation.amount || 0);
    return cotisation;
  });
  if (!receipt) return res.status(404).json({ message: 'Cotisation introuvable.' });
  res.json({ receipt });
});

appRouter.post('/notifications', requirePermission('moderateContent'), async (req, res) => {
  const notification = await updateDb((db) => {
    const item = {
      id: `notif-${Date.now()}`,
      title: req.body.title,
      body: req.body.body,
      channels: req.body.channels || ['push'],
      targetRole: req.body.targetRole || 'all',
      createdAt: new Date().toISOString(),
      readBy: [],
    };
    db.notifications.unshift(item);
    return item;
  });
  emitRealtime('notification:new', notification);
  res.status(201).json({ notification });
});

appRouter.get('/search', async (req, res) => {
  const q = String(req.query.q || '').toLowerCase();
  const db = await readDb();
  const contains = (value) => JSON.stringify(value).toLowerCase().includes(q);
  res.json({
    members: db.members.map(publicUser).filter(contains),
    posts: db.posts.filter(contains),
    events: db.events.filter(contains),
    documents: db.documents.filter(contains),
    projects: db.projects.filter(contains),
  });
});

appRouter.post('/ai/assistant', async (req, res) => {
  const text = String(req.body.prompt || '').toLowerCase();
  let answer = "Je peux aider à modérer, résumer, traduire et suggérer des contenus communautaires.";
  if (/(spam|casino|crypto|arnaque)/i.test(text)) {
    answer = 'Modération IA: contenu suspect détecté. Recommandation: bloquer ou envoyer en revue modérateur.';
  } else if (text.includes('résum') || text.includes('compte rendu')) {
    answer = 'Résumé IA: décisions principales, actions assignées, points financiers et prochaines échéances ont été synthétisés.';
  } else if (text.includes('trad')) {
    answer = 'Traduction IA: le texte peut être traduit automatiquement en français, anglais ou langue communautaire configurée.';
  } else if (text.includes('suggest')) {
    answer = 'Suggestion IA: publier une annonce courte, ajouter un rappel événement et notifier les membres inactifs.';
  }
  res.json({ answer, confidence: 0.86 });
});

appRouter.post('/backups', requirePermission('manageBackups'), async (req, res) => {
  const backup = await backupDb(req.body.label || 'manual');
  await updateDb((db) => {
    db.backups.unshift(backup);
  });
  res.status(201).json({ backup });
});
