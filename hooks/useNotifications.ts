import { useEffect, useState } from 'react';
import { getSupportedMessaging, db } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useUser } from '@/components/FirebaseProvider';

export function useNotifications() {
  const { user } = useUser();
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window === 'undefined' || !user) return;

    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    const setup = async () => {
      try {
        const msg = await getSupportedMessaging();
        if (!msg || cancelled) {
          console.warn('[Notifications] FCM not supported in this browser/context.');
          return;
        }

        const status = await Notification.requestPermission();
        if (cancelled) return;
        setPermission(status);

        if (status === 'granted') {
          const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
          if (!vapidKey) {
            console.warn('NEXT_PUBLIC_FIREBASE_VAPID_KEY is not defined. FCM registration skipped.');
            return;
          }

          let swRegistration: ServiceWorkerRegistration | null = null;
          if ('serviceWorker' in navigator) {
            try {
              swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            } catch (swError) {
              console.warn('[Notifications] Service worker registration failed:', swError);
            }
          }
          if (cancelled) return;

          try {
            const token = await getToken(msg, {
              vapidKey: vapidKey,
              serviceWorkerRegistration: swRegistration || undefined,
            });

            if (token && !cancelled) {
              console.log('FCM Token:', token);
              await updateDoc(doc(db, 'users', user.uid), {
                fcmTokens: arrayUnion(token),
              });
            }
          } catch (tokenError) {
            console.warn('[Notifications] Could not retrieve FCM token:', tokenError);
          }
        }

        try {
          unsubscribe = onMessage(msg, (payload) => {
            console.log('Message received. ', payload);
            if (payload.notification) {
              new Notification(payload.notification.title || 'New Message', {
                body: payload.notification.body,
                icon: '/favicon.ico',
              });
            }
          });
        } catch (onMessageError) {
          console.warn('[Notifications] Could not register foreground message listener:', onMessageError);
        }
      } catch (err) {
        console.warn('[Notifications] Setup failed:', err);
      }
    };

    setup();

    return () => {
      cancelled = true;
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch {
          // noop
        }
      }
    };
  }, [user]);

  return { permission };
}
