'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUser } from '@/components/FirebaseProvider';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, ChevronRight, Inbox as InboxIcon, User, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBlocks } from '@/hooks/useBlocks';

export default function InboxPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [fetchedThreads, setFetchedThreads] = useState<any[]>([]);
  const { blockedUserIds, loading: blocksLoading } = useBlocks(user?.uid);

  useEffect(() => {
    if (!user) return;

    const threadsRef = collection(db, 'threads');
    const q = query(
      threadsRef,
      where('participantIds', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const threadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFetchedThreads(threadsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const threads = useMemo(() => {
    return fetchedThreads.filter(thread => {
      if (thread.archived) return false;
      const otherUserIds = thread.participantIds.filter((id: string) => id !== user?.uid);
      return !otherUserIds.some((id: string) => blockedUserIds.includes(id));
    });
  }, [fetchedThreads, blockedUserIds, user?.uid]);

  const handleDelete = async (e: React.MouseEvent, threadId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    
    try {
      await deleteDoc(doc(db, 'threads', threadId));
    } catch (error) {
      console.error('Error deleting thread', error);
      alert('Failed to delete thread. Try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <header className="mb-10 flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
            <MessageSquare className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Messages</h1>
            <p className="text-slate-400 text-sm italic font-medium">Coordinate your school pickup arrangements</p>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {threads.length > 0 ? (
                threads.map((thread) => {
                  const otherName = thread.sellerId === user?.uid ? thread.buyerName : thread.sellerName;
                  const lastAt = thread.lastMessageAt?.toDate ? thread.lastMessageAt.toDate() : new Date();

                  return (
                    <motion.div
                      key={thread.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <Link 
                        href={`/chat/${thread.id}`}
                        className="group flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all relative"
                      >
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden font-bold text-slate-400">
                           {otherName?.[0]}
                        </div>

                        <div className="flex-1 min-w-0 pr-8">
                          <div className="flex justify-between items-center mb-0.5">
                            <div className="flex items-center gap-2">
                               <h3 className="font-bold text-slate-800 text-base">{otherName}</h3>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {formatDistanceToNow(lastAt, { addSuffix: false }).replace('about ', '')}
                            </span>
                          </div>
                          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5">{thread.postTitle}</p>
                          <div className="flex justify-between items-center">
                            <p className="text-sm truncate font-medium text-slate-500">
                              {thread.lastMessageText || 'No messages yet...'}
                            </p>
                          </div>
                        </div>

                        <button 
                          onClick={(e) => handleDelete(e, thread.id)}
                          className="absolute right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Delete thread"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Link>
                    </motion.div>
                  );
                })
              ) : (
                <div className="py-24 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100">
                  <InboxIcon className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">Your inbox is clear</h3>
                  <p className="text-slate-400 text-xs italic">Found gear you need? Start a conversation with a seller!</p>
                  <Link href="/" className="inline-block mt-8 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest px-6 py-2 rounded-lg hover:bg-indigo-100 transition-all">Go Browsing</Link>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
