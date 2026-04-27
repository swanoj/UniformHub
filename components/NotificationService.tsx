'use client';

import { useNotifications } from '@/hooks/useNotifications';

export function NotificationService() {
  useNotifications();
  return null;
}
