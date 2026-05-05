'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/components/FirebaseProvider';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc, collection, query, where, onSnapshot, deleteDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { Navbar } from '@/components/Navbar';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, User, MapPin, Tag, LogOut, Package, Trash2, CheckCircle, Loader2, Edit2, ShoppingBag, Plus, Star, X, Shield, Search } from 'lucide-react';
import Image from 'next/image';
import { PostCard } from '@/components/PostCard';
import { SPORT_TYPES } from '@/lib/constants';
import { useSchools } from '@/hooks/useSchools';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ListingGridSkeleton } from '@/components/Skeleton';
import { getCoordinates } from '@/lib/suburbs';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useRequireAuth';

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
};

export default function ProfilePage() {
  const { user, profile } = useUser();
  const { isCheckingAuth } = useRequireAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [suburb, setSuburb] = useState(profile?.suburb || '');
  const [homeSuburb, setHomeSuburb] = useState(profile?.homeSuburb || '');
  const [homePostcode, setHomePostcode] = useState(profile?.homePostcode || '');
  const [school, setSchool] = useState(profile?.school || '');
  const [sportType, setSportType] = useState(profile?.sportType || '');
  const [clubName, setClubName] = useState(profile?.clubName || '');
  const [favSchools, setFavSchools] = useState<string[]>(toStringArray(profile?.favSchools));
  const [favSports, setFavSports] = useState<string[]>(toStringArray(profile?.favSports || profile?.favClubs));
  const [schoolSearch, setSchoolSearch] = useState('');
  const [updating, setUpdating] = useState(false);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState('');
  const [profileError, setProfileError] = useState('');
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [postToMarkSold, setPostToMarkSold] = useState<any | null>(null);
  const [soldQty, setSoldQty] = useState(1);


  // Filtered lists
  const { schools: AUSTRALIAN_SCHOOLS } = useSchools();
  const filteredSchools = AUSTRALIAN_SCHOOLS.filter(s => 
    s.toLowerCase().includes(schoolSearch.toLowerCase()) && !favSchools.includes(s)
  ).slice(0, 5);
  const filteredSports = Object.keys(SPORT_TYPES).filter((sport) => !favSports.includes(sport));

  useEffect(() => {
    if (!user) return;

    const postsRef = collection(db, 'posts');
    const q = query(postsRef, where('ownerId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMyPosts(posts);
        setPostsError('');
        setLoadingPosts(false);
      },
      (error) => {
        console.error(error);
        setPostsError("Couldn't load your listings. Check your connection and try again.");
        setLoadingPosts(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    const normalizedHomePostcode = homePostcode.trim();
    const normalizedDisplayName = displayName.trim();
    const normalizedHomeSuburb = homeSuburb.trim();

    setProfileError('');

    if (!normalizedDisplayName || normalizedDisplayName.length > 50) {
      setProfileError('Display name is required and must be 50 characters or fewer.');
      return;
    }

    if (normalizedHomePostcode && !/^\d{4}$/.test(normalizedHomePostcode)) {
      setProfileError('Home postcode must be 4 digits.');
      return;
    }

    if (normalizedHomeSuburb && normalizedHomePostcode && !getCoordinates(normalizedHomeSuburb, normalizedHomePostcode)) {
      setProfileError('Suburb not recognised. Try a nearby suburb or check spelling.');
      return;
    }

    setUpdating(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: normalizedDisplayName,
        suburb,
        homeSuburb: normalizedHomeSuburb,
        homePostcode: normalizedHomePostcode,
        school,
        sportType,
        clubName,
        favSchools,
        favSports,
        favClubs: favSports,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error(error);
      setProfileError("Couldn't save profile. Try again.");
    } finally {
      setUpdating(false);
    }
  };

  const toggleFavSchool = (s: string) => {
    setFavSchools(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const toggleFavSport = (sport: string) => {
    setFavSports(prev => prev.includes(sport) ? prev.filter(x => x !== sport) : [...prev, sport]);
  };

  const handleMarkStatus = async (postId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'posts', postId), { status, updatedAt: new Date() });
    } catch (error) {
      console.error(error);
    }
  };

  const handleConfirmSold = async () => {
    if (!postToMarkSold || !user) return;
    setUpdating(true);
    try {
      const postRef = doc(db, 'posts', postToMarkSold.id);
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(postRef);
        if (!snapshot.exists()) {
          throw new Error('Listing no longer exists');
        }

        const currentQty = Number(snapshot.data().quantity || 1);
        const clampedSoldQty = Math.max(1, Math.min(soldQty, currentQty));
        const remaining = currentQty - clampedSoldQty;

        if (remaining <= 0) {
          transaction.delete(postRef);
        } else {
          transaction.update(postRef, {
            quantity: Math.max(0, remaining),
            status: 'ACTIVE',
            updatedAt: serverTimestamp(),
          });
        }
      });

      setPostToMarkSold(null);
      setSoldQty(1);
    } catch (error) {
      console.error(error);
      alert('Failed to update listing');
    } finally {
      setUpdating(false);
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

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-[#F8FAFC]" />;
  }

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
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest pl-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                  placeholder="Your name"
                  className="w-full bg-slate-50 border-none rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium placeholder:text-slate-300"
                />
              </div>

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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest pl-1">Home Suburb</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={homeSuburb}
                      onChange={(e) => setHomeSuburb(e.target.value)}
                      placeholder="e.g. St Kilda"
                      className="w-full bg-slate-50 border-none rounded-lg pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium placeholder:text-slate-300"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest pl-1">Postcode</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={homePostcode}
                    onChange={(e) => setHomePostcode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="3182"
                    className="w-full bg-slate-50 border-none rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <h3 className="font-bold text-slate-800 text-sm">Favourites</h3>
                </div>

                {favSchools.length === 0 && favSports.length === 0 && (
                  <EmptyState
                    icon="□"
                    heading="Save schools and sports you follow"
                    body="Add favourites to get personalised listings."
                    className="px-4 py-6"
                  />
                )}

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

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest pl-1">Favourite Sports</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {favSports.map((sport) => (
                      <span key={sport} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md flex items-center gap-1">
                        {sport} <X className="w-3 h-3 cursor-pointer" onClick={() => toggleFavSport(sport)} />
                      </span>
                    ))}
                  </div>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) toggleFavSport(e.target.value);
                    }}
                    className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Add sport...</option>
                    {filteredSports.map((sport) => (
                      <option key={sport} value={sport}>
                        {sport}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest pl-1">Primary Sport</label>
                      <select
                        value={sportType}
                        onChange={(e) => setSportType(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">Select sport type</option>
                        {Object.keys(SPORT_TYPES).map((sport) => (
                          <option key={sport} value={sport}>
                            {sport}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest pl-1">Club Name</label>
                      <input
                        type="text"
                        value={clubName}
                        onChange={(e) => setClubName(e.target.value)}
                        placeholder={sportType ? `${sportType} club name` : 'Enter club name'}
                        className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                {profileError && (
                  <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {profileError}
                  </p>
                )}
                <button
                  onClick={handleUpdateProfile}
                  disabled={updating}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all text-xs font-black uppercase tracking-widest"
                >
                  {updating ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : "Save All Changes"}
                </button>
              </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ListingGridSkeleton count={4} />
            </div>
          ) : postsError ? (
            <ErrorState heading="Couldn't load listings" body={postsError} />
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
                            onClick={() => {
                              if (post.quantity > 1) {
                                setPostToMarkSold(post);
                                setSoldQty(1);
                              } else {
                                handleMarkStatus(post.id, 'SOLD');
                              }
                            }}
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
                  <div className="col-span-full">
                    <EmptyState
                      icon="□"
                      heading="You haven't listed anything yet"
                      body="Sell your old uniforms in under a minute."
                      action={{ label: "Create your first listing", href: "/create" }}
                    />
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
      {/* Mark as Sold Modal */}
      {postToMarkSold && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-center text-slate-900 mb-2">How many sold?</h3>
              <p className="text-slate-500 text-center mb-8">
                You have {postToMarkSold.quantity} available. How many did you sell just now?
              </p>

              <div className="flex justify-center gap-4 mb-8">
                {[...Array(postToMarkSold.quantity)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setSoldQty(i + 1)}
                    className={`w-14 h-14 rounded-2xl font-bold text-xl transition-all ${
                      soldQty === i + 1 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' 
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setPostToMarkSold(null)}
                  className="flex-1 py-4 text-slate-500 font-semibold hover:bg-slate-50 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSold}
                  disabled={updating}
                  className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
