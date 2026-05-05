import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { FEATURES } from '@/lib/constants';

export default function CommunitiesLayout({ children }: { children: ReactNode }) {
  if (!FEATURES.communities) {
    notFound();
  }

  return children;
}
