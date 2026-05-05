'use client';

import type { AuthProvider } from 'firebase/auth';
import { getRedirectResult, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function shouldUseRedirectAuth() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export async function signInWithProvider(provider: AuthProvider) {
  if (shouldUseRedirectAuth()) {
    await signInWithRedirect(auth, provider);
    return null;
  }

  return signInWithPopup(auth, provider);
}

export function getProviderRedirectResult() {
  return getRedirectResult(auth);
}
