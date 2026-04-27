'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/components/FirebaseProvider';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, updateDoc, doc, deleteDoc, where, orderBy, limit } from 'firebase/firestore';
import { Navbar } from '@/components/Navbar';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Trash2, Ban, Flag, ExternalLink, ChevronRight, Search, Loader2, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminPage() {
  const { user, profile } = useUser();
  const [posts, setPosts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simple admin check - in production you'd use a role field
  const isAdmin = profile?.role === 'ADMIN' || user?.email === 'oliverjs090@gmail.com';

  useEffect(() => {
    if (!isAdmin) return;

    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Restricted Access</h1>
          <p className="text-slate-500">This area is reserved for UniformHub moderators.</p>
          <Link href="/" className="mt-6 inline-block text-indigo-600 font-bold hover:underline">Return Home</Link>
        </div>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
     if (confirm('Delete this listing?')) {
        await deleteDoc(doc(db, 'posts', id));
     }
  };

  const handleBan = async (uid: string) => {
    if (confirm('Ban this user?')) {
        await updateDoc(doc(db, 'users', uid), { status: 'BANNED' });
        alert('User status updated');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-12">
        <header className="mb-10 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-900 rounded-2xl shadow-xl">
                 <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                 <h1 className="text-2xl font-black text-slate-900 tracking-tight italic">Moderator Ops</h1>
                 <p className="text-slate-400 text-sm font-medium tracking-tight">Management console for UniformHub</p>
              </div>
           </div>
           <div className="flex gap-4">
              <div className="bg-white px-6 py-2 rounded-xl border border-slate-200 text-center">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Reports</p>
                 <p className="text-xl font-black text-slate-900">0</p>
              </div>
              <div className="bg-white px-6 py-2 rounded-xl border border-slate-200 text-center">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Items</p>
                 <p className="text-xl font-black text-slate-900">{posts.length}</p>
              </div>
           </div>
        </header>

        <div className="grid grid-cols-1 gap-6">
           <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <h2 className="font-bold text-slate-900">Live Item Management</h2>
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input 
                     type="text" 
                     placeholder="Search listings..." 
                     className="bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:ring-1 focus:ring-slate-900" 
                   />
                 </div>
              </div>
              
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b border-slate-100">
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Item / Seller</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">School</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Added</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {posts.map(post => (
                         <tr key={post.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <Link href={`/posts/${post.id}`} className="block transition-transform hover:scale-105 active:scale-95">
                                     <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 relative flex items-center justify-center border border-slate-200">
                                        {post.photoUrls?.[0] ? (
                                          <Image 
                                            src={post.photoUrls[0]} 
                                            alt={post.title} 
                                            fill 
                                            className="object-cover"
                                            referrerPolicy="no-referrer"
                                          />
                                        ) : (
                                          <ImageIcon className="w-5 h-5 text-slate-300" />
                                        )}
                                     </div>
                                  </Link>
                                  <div>
                                     <p className="text-sm font-bold text-slate-900 line-clamp-1">{post.title}</p>
                                     <p className="text-[10px] text-slate-400 font-medium">{post.ownerName}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <span className="text-[10px] font-bold py-1 px-2 bg-indigo-50 text-indigo-700 rounded-md">
                                  {post.school || 'Unspecified'}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-500">
                               {post.createdAt?.toDate()?.toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex justify-end gap-2">
                                  <Link href={`/posts/${post.id}`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                     <ExternalLink className="w-4 h-4" />
                                  </Link>
                                  <button onClick={() => handleDelete(post.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleBan(post.ownerId)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                                     <Ban className="w-4 h-4" />
                                  </button>
                               </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              {loading && (
                <div className="flex items-center justify-center p-12">
                   <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                </div>
              )}
           </div>
        </div>
      </main>
    </div>
  );
}
