'use client';

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, Messaging } from 'firebase/messaging';
import firebaseAppletConfig from '@/firebase-applet-config.json';

const firebaseConfig = {
  ...firebaseAppletConfig,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId || 'sniperform-ads-dashboard',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

// Use initializeFirestore with long polling as it's generally required for AI Studio preview environment
// Ensure the databaseId is and falls back to (default) if missing
const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, databaseId);

export const storage = getStorage(app);
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

// Connectivity check with detailed logging
async function testConnection() {
  console.log(`[Firebase] Testing connection to database: ${databaseId}...`);
  try {
    // Explicitly testing a get from server to bypass cache
    await getDocFromServer(doc(db, '_health_check_', 'ping'));
    console.log("[Firebase] Connection successful.");
  } catch (error: any) {
    console.error("[Firebase] Connection test failed:", error.code, error.message);
    if (error?.message?.includes('the client is offline') || error.code === 'unavailable') {
      console.error("CRITICAL: Firestore is unreachable. This may be due to browser restrictions, proxy issues, or incorrect config.");
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}
