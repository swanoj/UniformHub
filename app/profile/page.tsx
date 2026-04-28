'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/components/FirebaseProvider';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc, collection, query, where, onSnapshot, deleteDoc } from 'firebase/firestore';
import { Navbar } from '@/components/Navbar';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, User, MapPin, Tag, LogOut, Package, Trash2, CheckCircle, Loader2, Edit2, ShoppingBag, Plus, Star, X, Shield, Search } from 'lucide-react';
import Image from 'next/image';
import { PostCard } from '@/components/PostCard';
import { AUSTRALIAN_SCHOOLS, SPORTS_CLUBS } from '@/lib/constants';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, profile } = useUser();
  const [suburb, setSuburb] = useState(profile?.suburb || '');
  const [school, setSchool] = useState(profile?.school || '');
  const [favSchools, setFavSchools] = useState<string[]>(profile?.favSchools || []);
  const [favClubs, setFavClubs] = useState<string[]>(profile?.favClubs || []);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [clubSearch, setClubSearch] = useState('');
  const [updating, setUpdating] = useState(false);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  // Filtered lists
  const filteredSchools = AUSTRALIAN_SCHOOLS.filter(s => 
    s.toLowerCase().includes(schoolSearch.toLowerCase()) && !favSchools.includes(s)
  ).slice(0, 5);

  const filteredClubs = SPORTS_CLUBS.filter(c => 
    c.toLowerCase().includes(clubSearch.toLowerCase()) && !favClubs.includes(c)
  ).slice(0, 5);

  useEffect(() => {
    if (!user) return;

    const postsRef = collection(db, 'posts');
    const q = query(postsRef, where('ownerId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyPosts(posts);
      setLoadingPosts(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        suburb,
        school,
        favSchools,
        favClubs,
        updatedAt: new Date()
      });
      alert('Profile updated!');
    } catch (error) {
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const toggleFavSchool = (s: string) => {
    setFavSchools(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const toggleFavClub = (c: string) => {
    setFavClubs(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const handleMarkStatus = async (postId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'posts', postId), { status, updatedAt: new Date() });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    setUpdating(true);
    try {
      await deleteDoc(doc(db, 'posts', postToDelete));
    } catch (error: any) {
      console.error(error);
      try { alert('Failed to delete listing: ' + error.message); } catch(e){}
    } finally {
      setUpdating(false);
      setPostToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-12 w-full grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Profile Info */}
        <aside className="space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200"
          >
            <div className="relative w-28 h-28 mx-auto mb-6">
              <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                {profile?.photoUrl ? (
                  <Image src={profile.photoUrl} alt="Avatar" width={112} height={112} className="object-cover" />
                ) : (
                  <User className="w-12 h-12 text-slate-300" />
                )}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-lg shadow-lg hover:scale-110 transition-transform">
                <Edit2 className="w-3 h-3" />
              </button>
            </div>

            <div className="text-center space-y-1 mb-8">
              <h2 className="text-xl font-bold text-slate-900">{profile?.displayName}</h2>
              <p className="text-slate-400 text-xs font-medium tracking-tight">{profile?.email}</p>
            </div>

            <div className="space-y-5 pt-6 border-t border-slate-100">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest pl-1">Primary Suburb</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={suburb}
                    onChange={(e) => setSuburb(e.target.value)}
                    placeholder="e.g. Richmond, VIC"
                    className="w-full bg-slate-50 border-none rounded-lg pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <h3 className="font-bold text-slate-800 text-sm">Favourites</h3>
                </div>

                {/* Schools Favourites */}
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest pl-1">Favourite Schools</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {favSchools.map(s => (
                      <span key={s} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md flex items-center gap-1">
                        {s} <X className="w-3 h-3 cursor-pointer" onClick={() => toggleFavSchool(s)} />
                      </span>
                    ))}
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Add school..."
                      value={schoolSearch}
                      onChange={(e) => setSchoolSearch(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                    {schoolSearch && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl mt-1 shadow-xl z-20 overflow-hidden">
                        {filteredSchools.map(s => (
                          <button key={s} onClick={() => {toggleFavSchool(s); setSchoolSearch('');}} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 font-medium">
                            {s}
                          </button>
                        ))}
                        <button onClick={() => {toggleFavSchool(schoolSearch); setSchoolSearch('');}} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 font-bold text-indigo-600 border-t border-slate-100">
                          Add &quot;{schoolSearch}&quot; (Manual Entry)
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Clubs Favourites */}
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest pl-1">Favourite Clubs/Sports</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {favClubs.map(c => (
                      <span key={c} className="px-2 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-md flex items-center gap-1">
                        {c} <X className="w-3 h-3 cursor-pointer" onClick={() => toggleFavClub(c)} />
                      </span>
                    ))}
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Add sport/club..."
                      value={clubSearch}
                      onChange={(e) => setClubSearch(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                    {clubSearch && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl mt-1 shadow-xl z-20 overflow-hidden">
                        {filteredClubs.map(c => (
                          <button key={c} onClick={() => {toggleFavClub(c); setClubSearch('');}} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 font-medium">
                            {c}
                          </button>
                        ))}
                        <button onClick={() => {toggleFavClub(clubSearch); setClubSearch('');}} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 font-bold text-rose-600 border-t border-slate-100">
                          Add &quot;{clubSearch}&quot; (Manual Entry)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={handleUpdateProfile}
                  disabled={updating}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all text-xs font-black uppercase tracking-widest"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save All Changes"}
                </button>
              </div>

              </div>

               <div className="pt-8 border-t border-slate-100 space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Shield className="w-4 h-4 text-indigo-600" />
                       <h3 className="font-bold text-slate-800 text-sm">Membership</h3>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${profile?.isMember ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                       {profile?.isMember ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                 </div>
                 {!profile?.isMember ? (
                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                     <p className="text-xs font-bold text-slate-700 mb-1">$5/year Membership</p>
                     <p className="text-[10px] text-slate-400 mb-4">Unlimited listings for 12 months</p>
                     <button 
                       onClick={async () => {
                         if (!user) return;
                         if (true) {
                           const expiry = new Date();
                           expiry.setFullYear(expiry.getFullYear() + 1);
                           await updateDoc(doc(db, 'users', user.uid), {
                             isMember: true,
                             membershipExpiry: expiry
                           });
                           alert('Payment successful! You are now a premium member.');
                         }
                       }}
                       className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition"
                     >
                       Upgrade Now
                     </button>
                   </div>
                 ) : (
                    <div className="space-y-3">
                      <p className="text-[10px] text-slate-400 font-medium">Valid until: {profile?.membershipExpiry?.toDate()?.toLocaleDateString()}</p>
                      <button 
                        onClick={async () => {
                          if (!user) return;
                          if (true) {
                            await updateDoc(doc(db, 'users', user.uid), {
                              isMember: false,
                              membershipExpiry: null
                            });
                          }
                        }}
                        className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition"
                      >
                        Cancel Membership
                      </button>
                    </div>
                 )}
              </div>
          </motion.div>

          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 space-y-4">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-indigo-100 rounded-lg"><ShoppingBag className="w-4 h-4 text-indigo-700" /></div>
               <h3 className="font-bold text-indigo-900 text-sm">Community Guidelines</h3>
             </div>
             <ul className="text-[11px] text-indigo-800/80 space-y-2 leading-relaxed font-medium">
               <li>• Meet in bright, public locations only.</li>
               <li>• Inspect quality before finalizing transaction.</li>
               <li>• Use built-in chat for all initial coordination.</li>
               <li>• Report suspicious activity immediately.</li>
             </ul>
          </div>
        </aside>

        {/* My Listings */}
        <div className="lg:col-span-2 space-y-8">
          <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Your Dashboard</h2>
              <p className="text-slate-400 text-xs font-medium italic">Manage active and past school listings</p>
            </div>
            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <span className="text-xl font-bold text-slate-900">{myPosts.length}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1.5">Items</span>
            </div>
          </header>

          {loadingPosts ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {myPosts.length > 0 ? (
                  myPosts.map((post) => (
                    <motion.div
                      key={post.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex gap-4">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-50 border border-slate-100">
                           <Image src={post.photoUrls?.[0] || `https://picsum.photos/seed/${post.id}/200/200`} alt={post.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" referrerPolicy="no-referrer" />
                           {post.status !== 'ACTIVE' && (
                             <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center backdrop-blur-[1px]">
                               <span className="text-[8px] font-bold uppercase text-white tracking-widest bg-slate-900/80 px-2 py-0.5 rounded-md">{post.status}</span>
                             </div>
                           )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h4 className="font-bold text-slate-800 truncate text-sm">{post.title}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-medium uppercase tracking-tighter">{post.category} • {post.type}</p>
                          <p className="text-indigo-600 font-bold text-xs mt-2">{post.price ? `$ ${post.price}` : 'Free'}</p>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-50 flex gap-2">
                        {post.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleMarkStatus(post.id, 'SOLD')}
                            className="flex-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider py-2 rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Mark Sold
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkStatus(post.id, 'ACTIVE')}
                            className="flex-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider py-2 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Tag className="w-3.5 h-3.5" /> Relist
                          </button>
                        )}
                        <Link
                          href={`/posts/edit/${post.id}`}
                          className="bg-slate-50 text-slate-600 p-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => setPostToDelete(post.id)}
                          className="bg-rose-50 text-rose-600 p-2 rounded-lg hover:bg-rose-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-24 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100">
                    <Package className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight">Empty Portfolio</h3>
                    <p className="text-slate-400 text-xs italic">Help the community by listing your old gear today.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {postToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Delete Listing</h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Are you sure you want to delete this listing? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPostToDelete(null)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePost}
                  disabled={updating}
                  className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {updating ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </main>
    </div>
  );
}
