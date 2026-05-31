import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSeedData } from './seed.js';
import { INITIAL_GALLERY, INITIAL_SITE_SETTINGS } from '../../src/mockData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../data');
const dataFile = path.join(dataDir, 'db.json');

let cache;

function normalizeDb(db) {
  return {
    ...db,
    gallery: Array.isArray(db.gallery) ? db.gallery : INITIAL_GALLERY,
    settings: db.settings ? { ...INITIAL_SITE_SETTINGS, ...db.settings } : INITIAL_SITE_SETTINGS,
    documents: Array.isArray(db.documents) ? db.documents : [],
    announcements: Array.isArray(db.announcements) ? db.announcements : [],
    categories: Array.isArray(db.categories) ? db.categories : [],
    projects: Array.isArray(db.projects) ? db.projects : [],
    notifications: Array.isArray(db.notifications) ? db.notifications : [],
    activityLogs: Array.isArray(db.activityLogs) ? db.activityLogs : [],
    sessions: Array.isArray(db.sessions) ? db.sessions : [],
    passwordResets: Array.isArray(db.passwordResets) ? db.passwordResets : [],
    emailVerifications: Array.isArray(db.emailVerifications) ? db.emailVerifications : [],
    backups: Array.isArray(db.backups) ? db.backups : [],
  };
}

async function ensureDataFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    const seed = await createSeedData();
    await fs.writeFile(dataFile, JSON.stringify(seed, null, 2));
  }
}

export async function readDb() {
  if (cache) return structuredClone(cache);
  await ensureDataFile();
  cache = normalizeDb(JSON.parse(await fs.readFile(dataFile, 'utf8')));
  return structuredClone(cache);
}

export async function writeDb(nextDb) {
  cache = normalizeDb(structuredClone(nextDb));
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(cache, null, 2));
  return structuredClone(cache);
}

export async function updateDb(mutator) {
  const db = await readDb();
  const result = await mutator(db);
  await writeDb(db);
  return result;
}

export async function backupDb(label = 'manual') {
  const db = await readDb();
  const backupsDir = path.join(dataDir, 'backups');
  await fs.mkdir(backupsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${label}-${stamp}.json`;
  await fs.writeFile(path.join(backupsDir, filename), JSON.stringify(db, null, 2));
  return { filename, createdAt: new Date().toISOString() };
}
