'use client';

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, OAuthProvider, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging';
import firebaseAppletConfig from '@/firebase-applet-config.json';

const TARGET_FIRESTORE_DATABASE_ID = 'ai-studio-763f001b-7206-4556-b5c7-087611c74887';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseAppletConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId || 'sniperform-ads-dashboard',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || firebaseAppletConfig.appId,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || firebaseAppletConfig.measurementId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
export const firestoreDatabaseId = TARGET_FIRESTORE_DATABASE_ID;

appleProvider.addScope('email');
appleProvider.addScope('name');

export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firestoreDatabaseId,
);

export const storage = getStorage(app);
export let messaging: Messaging | null = null;

export async function getSupportedMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;

  try {
    const supported = await isSupported();
    if (!supported) return null;

    messaging = messaging || getMessaging(app);
    return messaging;
  } catch (e: unknown) {
    console.warn('[Firebase] Messaging unavailable in this context:', e instanceof Error ? e.message : e);
    return null;
  }
}

async function testConnection() {
  console.log(`[Firebase] Testing connection to database: ${firestoreDatabaseId}...`);
  try {
    await getDocFromServer(doc(db, '_health_check_', 'ping'));
    console.log('[Firebase] Connection successful.');
  } catch (error: any) {
    console.error('[Firebase] Connection test failed:', error.code, error.message);
    if (error?.message?.includes('the client is offline') || error.code === 'unavailable') {
      console.error('CRITICAL: Firestore is unreachable. This may be due to browser restrictions, proxy issues, or incorrect config.');
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}
