import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const LISTINGS_COLLECTION = 'posts';
const BATCH_SIZE = 500;

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function parseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is missing. Add it to .env.local before running wipe:listings.');
  }

  const normalized = raw.replace(/\\n/g, '\n');

  if (normalized.startsWith('{')) {
    return JSON.parse(normalized);
  }

  return JSON.parse(Buffer.from(normalized, 'base64').toString('utf8'));
}

async function deleteBatch(db) {
  const snapshot = await db.collection(LISTINGS_COLLECTION).limit(BATCH_SIZE).get();
  if (snapshot.empty) return 0;

  const batch = db.batch();
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
  }
  await batch.commit();

  return snapshot.size;
}

async function main() {
  const cwd = process.cwd();
  loadEnvFile(path.join(cwd, '.env.local'));
  loadEnvFile(path.join(cwd, '.env'));

  if (!getApps().length) {
    initializeApp({
      credential: cert(parseServiceAccount()),
    });
  }

  const db = getFirestore();
  let deletedTotal = 0;

  while (true) {
    const deleted = await deleteBatch(db);
    deletedTotal += deleted;
    if (deleted === 0) break;
    console.log(`Deleted ${deletedTotal} listing document(s) so far...`);
  }

  console.log(`Wipe complete. Deleted ${deletedTotal} listing document(s) from "${LISTINGS_COLLECTION}".`);
}

main().catch((error) => {
  console.error('Failed to wipe listings:', error);
  process.exit(1);
});
