'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/components/FirebaseProvider';
import { Navbar } from '@/components/Navbar';
import { collection, query, orderBy, limit, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Bell, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function NotificationsPage() {
  const { user } = useUser();
  const { isCheckingAuth } = useRequireAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, `users/${user.uid}/notifications`),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, snap => {
      setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, `users/${user.uid}/notifications`, id), { read: true });
  };
  
  const handleNotificationClick = (notif: any) => {
    markAsRead(notif.id);
    if (notif.type === 'COMMENT' || notif.type === 'LIKE') {
      router.push(`/posts/${notif.referenceId}`);
    } else if (notif.type === 'JOIN_REQUEST') {
      router.push(`/communities/${notif.referenceId}/settings`);
    }
  };

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 py-8">
        <h1 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
          <Bell className="w-6 h-6 text-indigo-600" />
          Notifications
        </h1>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {notifications.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {notifications.map(notif => (
                <div 
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-4 ${!notif.read ? 'bg-indigo-50/20' : ''}`}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-slate-200 mt-1">
                    {notif.actorPhotoUrl ? (
                      <Image src={notif.actorPhotoUrl} alt="Actor" width={48} height={48} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="w-full h-full p-2.5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                     <p className="text-base text-slate-800 leading-snug">
                       <span className="font-bold">{notif.actorName}</span> {notif.message}
                     </p>
                     <p className="text-xs font-bold text-slate-400 mt-1.5 uppercase tracking-wider">
                        {notif.createdAt?.toDate ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                     </p>
                  </div>
                  {!notif.read && <div className="w-3 h-3 bg-indigo-600 rounded-full mt-2 shrink-0 shadow-sm" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Bell className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-lg font-bold text-slate-900 mb-1">No notifications yet</p>
              <p className="text-sm">When you get updates, they&apos;ll show up here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
