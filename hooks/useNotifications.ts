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

          if (messaging) {
            const token = await getToken(messaging, { vapidKey });

            if (token) {
              console.log('FCM Token:', token);
              // Store token in user profile for targeting
              await updateDoc(doc(db, 'users', user.uid), {
                fcmTokens: arrayUnion(token)
              });
            }
          }
        }
      } catch (error) {
        console.error('An error occurred while retrieving token:', error);
      }
    };

    requestPermission();

    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        // Handle foreground message if needed
        if (payload.notification) {
           new Notification(payload.notification.title || 'New Message', {
             body: payload.notification.body,
             icon: '/favicon.ico'
           });
        }
      });

      return () => unsubscribe();
    }
  }, [user]);

  return { permission };
}
