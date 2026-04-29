'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUser } from '@/components/FirebaseProvider';
import { Navbar } from '@/components/Navbar';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { Send, User, ChevronLeft, Info, ShoppingBag, Search, MoreVertical, ShieldAlert } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

import { useBlocks } from '@/hooks/useBlocks';

export default function ChatPage() {
  const { threadId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [thread, setThread] = useState<any>(null);
  const [fetchedThreads, setFetchedThreads] = useState<any[]>([]);
  const { blockedUserIds, loading: blocksLoading } = useBlocks(user?.uid);
  const [messages, setMessages] = useState<any[]>([]);
  const [post, setPost] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all user threads for the left sidebar
  useEffect(() => {
    if (!user) return;
    const threadsRef = collection(db, 'threads');
    const q = query(
      threadsRef,
      where('participantIds', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFetchedThreads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const threads = React.useMemo(() => {
    return fetchedThreads.filter(t => {
      if (t.archived) return false;
      const otherUserIds = t.participantIds?.filter((id: string) => id !== user?.uid) || [];
      return !otherUserIds.some((id: string) => blockedUserIds.includes(id));
    });
  }, [fetchedThreads, blockedUserIds, user?.uid]);

  // Fetch current thread and messages
  useEffect(() => {
    if (!threadId || !user) return;

    const threadRef = doc(db, 'threads', threadId as string);
    const unsubscribeThread = onSnapshot(threadRef, (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as any;
        if (data.archived) {
          router.push('/inbox');
          return;
        }
        setThread(data);
        
        if (data?.postId) {
          getDoc(doc(db, 'posts', data.postId)).then(pSnap => {
            if (pSnap.exists()) setPost({ id: pSnap.id, ...pSnap.data() });
          });
        }
      } else {
        router.push('/inbox');
      }
      setLoading(false);
    });

    const messagesRef = collection(db, 'threads', threadId as string, 'messages');
    const qMsg = query(messagesRef, orderBy('createdAt', 'asc'));
    const unsubscribeMsgs = onSnapshot(qMsg, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => {
      unsubscribeThread();
      unsubscribeMsgs();
    };
  }, [threadId, user, router]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !threadId) return;

    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      await addDoc(collection(db, 'threads', threadId as string, 'messages'), {
        senderId: user.uid,
        text,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'threads', threadId as string), {
        lastMessageText: text,
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: user.uid
      });

      // Send Push Notification
      const otherUserId = thread.participantIds.find((id: string) => id !== user.uid);
      if (otherUserId) {
        const recipientDoc = await getDoc(doc(db, 'users', otherUserId));
        if (recipientDoc.exists()) {
          const recipientData = recipientDoc.data();
          const tokens = recipientData.fcmTokens;
          if (tokens && tokens.length > 0) {
            fetch('/api/notifications/send', {
              method: 'POST',
              body: JSON.stringify({
                tokens,
                title: `New message from ${user.displayName || 'UniformHub User'}`,
                body: text,
                data: { threadId, type: 'chat' }
              })
            }).catch(e => console.error('Notification failed', e));
          }
        }
      }
    } catch (error) {
      console.error("Error sending message", error);
    } finally {
      setSending(false);
    }
  };

  if ((loading || blocksLoading) && !threads.length) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  );

  const otherName = thread?.sellerId === user?.uid ? thread?.buyerName : thread?.sellerName;

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <Navbar />

      <main className="flex-1 flex overflow-hidden w-full">
        {/* Left Sidebar: Conversations List */}
        <aside className="hidden lg:flex w-90 border-r border-slate-200 flex-col bg-white shrink-0">
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-2xl font-black text-slate-900">Chats</h2>
              <button className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors">
                <MoreVertical className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search Messenger" 
                className="w-full bg-slate-100 border-none rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
            {threads.map((t) => {
              const active = t.id === threadId;
              const tOtherName = t.sellerId === user?.uid ? t.buyerName : t.sellerName;
              return (
                <button
                  key={t.id}
                  onClick={() => router.push(`/chat/${t.id}`)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${active ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'}`}
                >
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0 font-bold text-slate-400">
                    {tOtherName?.[0]}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-start">
                      <p className={`font-bold text-slate-900 truncate ${active ? 'text-indigo-900' : ''}`}>{tOtherName}</p>
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter shrink-0 pt-1">
                        {t.lastMessageAt?.toDate ? formatDistanceToNow(t.lastMessageAt.toDate(), { addSuffix: false }).replace('about ', '') : ''}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-indigo-500 truncate uppercase tracking-widest leading-none mb-1">{t.postTitle}</p>
                    <p className={`text-sm truncate ${active ? 'text-indigo-600 font-medium' : 'text-slate-500'}`}>
                      {t.lastMessageText || 'No messages yet...'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center: Main Chat Window */}
        <section className="flex-1 flex flex-col bg-slate-50 relative h-full">
           <header className="px-4 py-3 bg-white border-b border-slate-200 flex items-center gap-4 sticky top-0 z-20 shadow-sm">
             <button onClick={() => router.push('/inbox')} className="lg:hidden p-2 hover:bg-slate-100 rounded-full">
               <ChevronLeft className="w-6 h-6" />
             </button>
             <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 font-bold text-slate-500">
                {otherName?.[0]}
             </div>
             <div className="flex-1">
                <h3 className="font-black text-slate-900 leading-tight">{otherName}</h3>
                <p className="text-[10px] uppercase font-black text-indigo-500 tracking-widest">{thread?.postTitle}</p>
             </div>
           </header>

           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isMe = msg.senderId === user?.uid;
                const time = msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'h:mm a') : '...';
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-[15px] shadow-sm ${
                        isMe 
                          ? 'bg-indigo-600 text-white rounded-tr-sm' 
                          : 'bg-white text-slate-800 rounded-tl-sm border border-slate-200'
                      }`}>
                        <p className="leading-snug">{msg.text}</p>
                      </div>
                      <span className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest">{time}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
           </div>

           <div className="p-4 bg-white border-t border-slate-200">
             <form onSubmit={handleSendMessage} className="flex gap-2">
               <div className="flex-1 relative">
                 <input 
                   type="text" 
                   value={newMessage}
                   onChange={(e) => setNewMessage(e.target.value)}
                   placeholder="Type a message..." 
                   className="w-full bg-slate-100 border-none rounded-full py-3 px-5 text-sm focus:ring-2 focus:ring-indigo-500 font-medium pr-12 transition-all shadow-inner"
                 />
                 <button 
                   type="submit"
                   disabled={!newMessage.trim() || sending}
                   className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center disabled:opacity-30 transition-all hover:bg-indigo-700 active:scale-90"
                 >
                   <Send className="w-4 h-4 rotate-45 mr-0.5 mb-0.5" />
                 </button>
               </div>
             </form>
           </div>
        </section>

        {/* Right Sidebar: Context Details */}
        <aside className="hidden xl:flex w-80 border-l border-slate-200 flex-col bg-white overflow-y-auto">
           {post && (
             <div className="p-4 space-y-6">
                <div className="space-y-4">
                   <div className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm group">
                      <Image 
                        src={post.photoUrls?.[0] || `https://picsum.photos/seed/${post.id}/800/800`} 
                        alt={post.title} 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-700" 
                        referrerPolicy="no-referrer"
                      />
                   </div>
                   <div className="space-y-1">
                      <h4 className="text-lg font-black text-slate-900 leading-tight">{post.title}</h4>
                      <p className="text-xl font-black text-indigo-600">${post.price || '0.00'}</p>
                   </div>
                   <button 
                     onClick={() => router.push(`/posts/${post.id}`)}
                     className="w-full bg-slate-100 text-slate-900 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                    >
                     View Listing
                   </button>
                </div>

                <div className="h-[1px] bg-slate-100"></div>

                <div className="space-y-4">
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest">About this Seller</p>
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 font-bold overflow-hidden shadow-sm">
                         {post.ownerPhotoUrl ? (
                           <Image src={post.ownerPhotoUrl} alt={post.ownerName} width={48} height={48} className="object-cover" />
                         ) : (
                           <User className="w-6 h-6 text-slate-400" />
                         )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{post.ownerName}</p>
                        <p className="text-xs text-slate-500">Melbourne, VIC</p>
                      </div>
                   </div>
                   <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex items-center gap-2">
                     <ShieldAlert className="w-4 h-4 text-indigo-600" />
                     <p className="text-[10px] font-black text-indigo-700 uppercase tracking-tighter">Verified Community Member</p>
                   </div>
                </div>

                <div className="h-[1px] bg-slate-100"></div>

                <div className="space-y-3">
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">Safety Actions</p>
                   <div className="grid grid-cols-2 gap-2">
                      <button className="py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-white hover:border-indigo-200 transition-all">Report</button>
                      <button className="py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-white hover:border-indigo-200 transition-all">Archive</button>
                   </div>
                </div>
             </div>
           )}
        </aside>
      </main>
    </div>
  );
}
