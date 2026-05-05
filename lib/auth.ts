'use client';

import type { AuthProvider, UserCredential } from 'firebase/auth';
import { getRedirectResult, signInWithRedirect } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function shouldUseRedirectAuth() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export async function signInWithProvider(provider: AuthProvider): Promise<UserCredential | null> {
  await signInWithRedirect(auth, provider);
  return null;
}

export function getProviderRedirectResult() {
  return getRedirectResult(auth);
}
