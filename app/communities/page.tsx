'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUser } from '@/components/FirebaseProvider';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { Users, Shield, Lock, Search, PlusCircle, Globe } from 'lucide-react';
import Image from 'next/image';

export default function CommunitiesPage() {
  const { user } = useUser();
  const router = useRouter();
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchCommunities() {
      try {
        const q = query(
          collection(db, 'communities'),
          orderBy('memberCount', 'desc')
        );
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCommunities(list);
      } catch (error) {
        console.error("Error fetching communities", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCommunities();
  }, []);

  const filteredCommunities = communities.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col">
      <Navbar />
      <div className="flex-1 flex max-w-[1920px] w-full mx-auto">
        
        {/* Left Sidebar */}
        <aside className="w-[360px] bg-white border-r border-slate-200 hidden lg:flex flex-col h-[calc(100vh-56px)] sticky top-14">
          <div className="p-4 border-b border-slate-200">
            <h1 className="text-2xl font-black text-slate-900 leading-tight mb-4">Communities</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search groups & pages"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
              />
            </div>
          </div>
          
          <div className="p-4">
            {user && (
              <Link href="/communities/create" className="w-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold transition-colors">
                <PlusCircle className="w-5 h-5" />
                Create New Community
              </Link>
            )}
          </div>
        </aside>

        {/* Main Feed area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
           <div className="max-w-4xl mx-auto flex flex-col gap-6">
              
              <div className="bg-white p-6 justify-between rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center mb-4">
                 <div>
                    <h2 className="text-xl font-bold text-slate-900">Discover Communities</h2>
                    <p className="text-sm text-slate-500">Join groups, teams, and schools to buy, sell, and connect safely.</p>
                 </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : filteredCommunities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCommunities.map(community => (
                    <Link key={community.id} href={`/communities/${community.id}`} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                      <div className="h-24 bg-slate-200 w-full relative">
                        {community.coverPhotoUrl ? (
                          <Image src={community.coverPhotoUrl} alt={community.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                         <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{community.name}</h3>
                         <p className="text-sm text-slate-600 mt-1 line-clamp-2 flex-1">{community.description}</p>
                         
                         <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-tighter">
                            <span className="flex items-center gap-1.5">
                              {community.privacy === 'PUBLIC' ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                              {community.privacy}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5" />
                              {community.memberCount || 1} Member{community.memberCount !== 1 && 's'}
                            </span>
                         </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900">No communities found</h3>
                  <p className="text-slate-500 text-sm mt-1">Try adjusting your search or create a new community.</p>
                </div>
              )}
           </div>
        </main>

      </div>
    </div>
  );
}
