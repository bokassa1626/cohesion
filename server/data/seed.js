import bcrypt from 'bcryptjs';
import { encrypt } from '../utils/crypto.js';
import {
  INITIAL_ROLES,
  INITIAL_MEMBERS,
  INITIAL_CHATS,
  INITIAL_POSTS,
  INITIAL_STORIES,
  INITIAL_EVENTS,
  INITIAL_FINANCES,
  INITIAL_GALLERY,
  INITIAL_SITE_SETTINGS,
  SECURITY_LOGS,
} from '../../src/mockData.js';
import { config } from '../config.js';

export async function createSeedData() {
  const members = await Promise.all(INITIAL_MEMBERS.map(async (member) => {
    const plainPassword = member.email === config.superAdmin.email
      ? config.superAdmin.password
      : member.password || 'password123';

    return {
      ...member,
      phone: encrypt(member.phone),
      address: encrypt(member.address),
      password: undefined,
      passwordHash: await bcrypt.hash(plainPassword, 12),
      emailVerified: member.email === config.superAdmin.email,
      failedLoginCount: 0,
      activeSessions: [],
      notificationPreferences: {
        push: true,
        email: true,
        sms: false,
      },
    };
  }));

  return {
    roles: INITIAL_ROLES,
    members,
    chats: INITIAL_CHATS,
    posts: INITIAL_POSTS,
    stories: INITIAL_STORIES,
    gallery: INITIAL_GALLERY,
    events: INITIAL_EVENTS,
    finances: INITIAL_FINANCES,
    settings: INITIAL_SITE_SETTINGS,
    documents: [],
    announcements: [],
    categories: [
      { id: 'cat-annonce', name: 'Annonce', archived: false },
      { id: 'cat-event', name: 'Événement', archived: false },
      { id: 'cat-finance', name: 'Finance', archived: false },
    ],
    projects: [
      { id: 'proj-1', title: 'Projet Orphelinat', status: 'En cours', budget: 1500, archived: false },
    ],
    notifications: [],
    activityLogs: SECURITY_LOGS,
    sessions: [],
    passwordResets: [],
    emailVerifications: [],
    backups: [],
  };
}
