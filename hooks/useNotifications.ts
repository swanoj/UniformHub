import { useEffect, useState } from 'react';
import { messaging, db } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useUser } from '@/components/FirebaseProvider';

export function useNotifications() {
  const { user } = useUser();
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window === 'undefined' || !messaging || !user) return;
    const msg = messaging; // Capture to narrow type

    const requestPermission = async () => {
      try {
        const status = await Notification.requestPermission();
        setPermission(status);

        if (status === 'granted') {
          const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
          if (!vapidKey) {
            console.warn('NEXT_PUBLIC_FIREBASE_VAPID_KEY is not defined. FCM registration skipped.');
            return;
          }

          let swRegistration = null;
          if ('serviceWorker' in navigator) {
            swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          }

          const token = await getToken(msg, { 
            vapidKey: vapidKey,
            serviceWorkerRegistration: swRegistration || undefined
          });

          if (token) {
            console.log('FCM Token:', token);
            await updateDoc(doc(db, 'users', user.uid), {
              fcmTokens: arrayUnion(token)
            });
          }
        }
      } catch (error) {
        console.error('An error occurred while retrieving token:', error);
      }
    };

    requestPermission();

    const unsubscribe = onMessage(msg, (payload) => {
      console.log('Message received. ', payload);
      if (payload.notification) {
         new Notification(payload.notification.title || 'New Message', {
           body: payload.notification.body,
           icon: '/favicon.ico'
         });
      }
    });

    return () => unsubscribe();
  }, [user]);

  return { permission };
}
