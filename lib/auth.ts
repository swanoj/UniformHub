'use client';

import type { AuthProvider, UserCredential } from 'firebase/auth';
import { getRedirectResult, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function shouldUseRedirectAuth() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export async function signInWithProvider(provider: AuthProvider): Promise<UserCredential | null> {
  if (shouldUseRedirectAuth()) {
    await signInWithRedirect(auth, provider);
    return null;
  }

  try {
    return await signInWithPopup(auth, provider);
  } catch (error: any) {
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request') {
      await signInWithRedirect(auth, provider);
      return null;
    }

    throw error;
  }
}

export function getProviderRedirectResult() {
  return getRedirectResult(auth);
}
