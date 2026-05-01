'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUser } from '@/components/FirebaseProvider';
import { auth, db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, updateDoc, doc, where, getDocs, deleteDoc } from 'firebase/firestore';
import { signOut, signInWithPopup, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { Search, PlusSquare, MessageSquare, User, LogOut, ShoppingBag, Database, Users, Bell, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

export function Navbar() {
  const { user } = useUser();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, `users/${user.uid}/notifications`),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubscribe = onSnapshot(q, snap => {
      setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/uniforms?q=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleLoginGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLoginApple = async () => {
    const provider = new OAuthProvider('apple.com');
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const markAsRead = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, `users/${user.uid}/notifications`, id), { read: true });
  };
  
  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete all listings? This cannot be undone.')) return;
    try {
      const q = query(collection(db, 'posts'));
      const snap = await getDocs(q);
      
      // Delete in chunks/sequentially to avoid overwhelming permissions if one fails
      let deletedCount = 0;
      for (const d of snap.docs) {
        try {
          await deleteDoc(doc(db, 'posts', d.id));
          deletedCount++;
        } catch (e) {
          console.warn("Could not delete post", d.id, e);
        }
      }
      
      alert(`Deleted ${deletedCount} listings. Feed will update.`);
      window.location.reload();
    } catch (error) {
      console.error("Failed to fetch/delete listings", error);
      alert("Error deleting listings, check console/permissions.");
    }
  };

  const handleNotificationClick = (notif: any) => {
    markAsRead(notif.id);
    setNotificationsOpen(false);
    if (notif.type === 'COMMENT' || notif.type === 'LIKE') {
      router.push(`/posts/${notif.referenceId}`);
    } else if (notif.type === 'JOIN_REQUEST') {
      router.push(`/communities/${notif.referenceId}/settings`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex h-14 items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-xl italic tracking-tighter">U</span>
            </div>
            <span className="hidden lg:block font-extrabold text-xl tracking-tight text-slate-900">UniformHub</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 ml-4 mr-auto">
            <Link href="/" className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all">Feed</Link>
            <Link href="/uniforms" className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all">Uniforms</Link>
            <Link href="/communities" className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all flex items-center gap-2">
              <Users className="w-4 h-4" />
              Communities
            </Link>
          </div>

          {/* Search bar - identical to FB marketplace expansion */}
          <div className="flex-1 flex justify-start items-center">
             <form onSubmit={handleSearch} className="relative w-full max-w-xl group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
               <input
                 type="text"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 placeholder="Search Uniforms"
                 className="w-full bg-slate-100 border-none rounded-full py-2.5 pl-12 pr-6 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium placeholder:text-slate-500"
               />
             </form>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1">
            <button onClick={handleClearAll} className="hidden sm:flex items-center gap-2 bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-1.5 rounded-full mr-2 transition-all border border-rose-200 shadow-sm">
               <Trash2 className="w-4 h-4" />
               <span className="text-[11px] font-black uppercase">Clear All</span>
            </button>
            <Link href="/debug/seed" className="hidden sm:flex items-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1.5 rounded-full mr-2 transition-all border border-orange-200 animate-pulse no-underline">
               <Database className="w-4 h-4" />
               <span className="text-[11px] font-black uppercase">Seed Demo</span>
            </Link>
            {user ? (
              <div className="flex items-center">
                 <Link href="/create" title="Create listing" className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                    <PlusSquare className="w-5.5 h-5.5" />
                 </Link>
                 <Link href="/inbox" title="Messages" className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-full transition-all relative">
                    <MessageSquare className="w-5.5 h-5.5" />
                    <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
                 </Link>
                 
                 {/* Notifications Dropdown */}
                 <div className="relative" ref={dropdownRef}>
                   <button 
                     onClick={() => setNotificationsOpen(!notificationsOpen)}
                     title="Notifications" 
                     className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-full transition-all relative"
                   >
                     <Bell className="w-5.5 h-5.5" />
                     <AnimatePresence>
                       {unreadCount > 0 && (
                         <motion.span 
                           initial={{ scale: 0 }} 
                           animate={{ scale: 1 }} 
                           exit={{ scale: 0 }}
                           className="absolute top-2 right-2 w-3 h-3 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center"
                         />
                       )}
                     </AnimatePresence>
                   </button>

                   <AnimatePresence>
                     {notificationsOpen && (
                       <motion.div 
                         initial={{ opacity: 0, y: 10, scale: 0.95 }}
                         animate={{ opacity: 1, y: 0, scale: 1 }}
                         exit={{ opacity: 0, y: 10, scale: 0.95 }}
                         transition={{ duration: 0.15 }}
                         className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50"
                       >
                         <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                           <h3 className="font-bold text-slate-900">Notifications</h3>
                           {unreadCount > 0 && (
                             <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                               {unreadCount} New
                             </span>
                           )}
                         </div>
                         <div className="max-h-[360px] overflow-y-auto">
                           {notifications.length > 0 ? (
                             notifications.map((notif) => (
                               <div 
                                 key={notif.id} 
                                 onClick={() => handleNotificationClick(notif)}
                                 className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${!notif.read ? 'bg-indigo-50/30' : ''}`}
                               >
                                 <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-slate-200">
                                   {notif.actorPhotoUrl ? (
                                     <Image src={notif.actorPhotoUrl} alt="Actor" width={40} height={40} className="object-cover w-full h-full" />
                                   ) : (
                                     <User className="w-full h-full p-2 text-slate-400" />
                                   )}
                                 </div>
                                 <div className="flex-1">
                                    <p className="text-sm text-slate-800 leading-snug">
                                      <span className="font-bold">{notif.actorName}</span> {notif.message}
                                    </p>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mt-1 tracking-wider">
                                       {notif.createdAt?.toDate ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                                    </p>
                                 </div>
                                 {!notif.read && <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 shrink-0" />}
                               </div>
                             ))
                           ) : (
                             <div className="p-8 text-center text-slate-500">
                               <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                               <p className="text-sm font-medium">No notifications yet</p>
                             </div>
                           )}
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>

                 <Link href="/profile" title="Account" className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-full transition-all overflow-hidden border border-transparent hover:border-slate-200">
                    {user.photoURL ? (
                      <Image src={user.photoURL} alt="User" width={28} height={28} className="rounded-full object-cover" />
                    ) : (
                      <User className="w-5.5 h-5.5" />
                    )}
                 </Link>
                 <div className="w-[1px] h-6 bg-slate-200 mx-1"></div>
                 <button
                   onClick={handleLogout}
                   title="Log out"
                   className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                 >
                   <LogOut className="w-5 h-5" />
                 </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLoginGoogle}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/10 active:scale-95"
                >
                  Google Login
                </button>
                {process.env.NEXT_PUBLIC_ENABLE_APPLE_LOGIN === 'true' ? (
                  <button
                    onClick={handleLoginApple}
                    className="bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                  >
                    Apple Login
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 font-medium px-2">Apple Sign-In coming soon</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
