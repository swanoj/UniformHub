'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/components/FirebaseProvider';

export function useRequireAuth() {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (loading || user) return;

    const query = searchParams.toString();
    const targetPath = query ? `${pathname}?${query}` : pathname;
    router.replace(`/login?redirect=${encodeURIComponent(targetPath)}`);
  }, [loading, pathname, router, searchParams, user]);

  return {
    isCheckingAuth: loading || !user,
    user,
  };
}
