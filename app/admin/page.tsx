'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/components/FirebaseProvider';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  where,
  getDoc,
  getDocs,
  getCountFromServer
} from 'firebase/firestore';
import AdminTable from '@/components/AdminTable';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useRequireAuth';

type TabType = 'listings' | 'users' | 'reports' | 'threads';

export default function AdminPage() {
  const { user } = useUser();
  const { isCheckingAuth } = useRequireAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('listings');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [listings, setListings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [participantEmailMap, setParticipantEmailMap] = useState<Record<string, string>>({});
  const [threadMessageCounts, setThreadMessageCounts] = useState<Record<string, number>>({});

  const [filterFlagged, setFilterFlagged] = useState(false);

  // 1. Mandatory Admin Gate
  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().isAdmin === true) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("Error checking admin status:", err);
        setIsAdmin(false);
      }
      setLoading(false);
    }
    checkAdmin();
  }, [user]);

  // 2. Data Fetching Logic
  useEffect(() => {
    if (!isAdmin) return;

    // Listings Subscription
    const listingsQuery = filterFlagged 
      ? query(collection(db, 'posts'), where('status', '==', 'FLAGGED'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'posts'), orderBy('createdAt', 'desc'));

    const unsubListings = onSnapshot(listingsQuery, (snapshot) => {
      setListings(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Users Subscription
    const unsubUsers = onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc')), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Reports Subscription
    const unsubReports = onSnapshot(query(collection(db, 'reports'), orderBy('reportedAt', 'desc')), (snapshot) => {
      setReports(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Threads Subscription
    const unsubThreads = onSnapshot(query(collection(db, 'threads'), orderBy('lastMessageAt', 'desc')), (snapshot) => {
      setThreads(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubListings();
      unsubUsers();
      unsubReports();
      unsubThreads();
    };
  }, [isAdmin, filterFlagged]);

  useEffect(() => {
    if (!isAdmin || activeTab !== 'threads' || threads.length === 0) return;
    let cancelled = false;

    const hydrateThreadMetadata = async () => {
      const allParticipantIds = Array.from(
        new Set(
          threads.flatMap((thread: any) =>
            Array.isArray(thread.participantIds) ? thread.participantIds : [],
          ),
        ),
      );

      const emailPairs = await Promise.all(
        allParticipantIds.map(async (uid) => {
          try {
            const userSnap = await getDoc(doc(db, 'users', uid));
            if (!userSnap.exists()) return [uid, 'Unknown user'] as const;
            const data = userSnap.data();
            return [uid, data.email || data.displayName || uid] as const;
          } catch {
            return [uid, 'Unknown user'] as const;
          }
        }),
      );

      const countPairs = await Promise.all(
        threads.map(async (thread: any) => {
          try {
            const countSnap = await getCountFromServer(collection(db, 'threads', thread.id, 'messages'));
            return [thread.id, countSnap.data().count] as const;
          } catch {
            return [thread.id, 0] as const;
          }
        }),
      );

      if (cancelled) return;
      setParticipantEmailMap(Object.fromEntries(emailPairs));
      setThreadMessageCounts(Object.fromEntries(countPairs));
    };

    hydrateThreadMetadata();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, activeTab, threads]);

  // 3. Actions
  const handleRemoveListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to remove this listing?')) return;
    await updateDoc(doc(db, 'posts', listingId), {
      status: 'REMOVED',
      removedBy: user?.uid,
      removedAt: serverTimestamp()
    });
  };

  const handleToggleBan = async (userId: string, currentBanned: boolean) => {
    const action = currentBanned ? 're-enable' : 'disable';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    await updateDoc(doc(db, 'users', userId), {
      isBanned: !currentBanned,
      bannedBy: !currentBanned ? user?.uid : null,
      bannedAt: !currentBanned ? serverTimestamp() : null
    });
  };

  const handleUpdateReport = async (reportId: string, status: 'actioned' | 'dismissed') => {
    await updateDoc(doc(db, 'reports', reportId), {
      status,
      actionedAt: serverTimestamp(),
      actionedBy: user?.uid
    });
  };

  const handleArchiveThread = async (threadId: string) => {
    if (!confirm('Archive this thread? It will be hidden from users.')) return;
    await updateDoc(doc(db, 'threads', threadId), {
      archived: true,
      archivedAt: serverTimestamp(),
      archivedBy: user?.uid
    });
  };

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">403</h1>
          <p className="text-slate-600 mb-8 font-medium">Access Denied: Administrative privileges required.</p>
          <Link 
            href="/" 
            className="inline-block bg-slate-900 text-white px-8 py-3 rounded-full font-semibold hover:bg-slate-800 transition-colors shadow-lg"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold tracking-tight">Admin Dashboard</h1>
            <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              Exit Dashboard
            </Link>
          </div>
          
          {/* Tabs Nav */}
          <nav className="flex space-x-8 overflow-x-auto no-scrollbar">
            {['listings', 'users', 'reports', 'threads'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as TabType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab 
                    ? 'border-slate-900 text-slate-900 scale-105' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Listings Tab */}
        {activeTab === 'listings' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Marketplace Listings</h2>
              <button 
                onClick={() => setFilterFlagged(!filterFlagged)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border-2 ${
                  filterFlagged 
                    ? 'bg-red-50 border-red-200 text-red-600 shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {filterFlagged ? 'Show All Listings' : 'Show Only FLAGGED'}
              </button>
            </div>
            <AdminTable 
              data={listings}
              columns={[
                {
                  header: 'Item',
                  render: (p) => (
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
                        {p.photoUrls?.[0] ? (
                          <img src={p.photoUrls[0]} alt={p.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-[10px] text-slate-400">No Image</div>
                        )}
                      </div>
                      <span className="font-semibold text-slate-900 truncate max-w-[150px]">{p.title}</span>
                    </div>
                  )
                },
                {
                  header: 'Seller',
                  render: (p) => (
                    <div className="text-xs leading-tight">
                      <div className="font-medium text-slate-900">{p.ownerName}</div>
                      <div className="text-slate-400">{p.ownerEmail || 'No email'}</div>
                    </div>
                  )
                },
                { header: 'School', render: (p) => p.school || 'N/A' },
                { header: 'Price', render: (p) => `$${p.price}` },
                { header: 'Qty', render: (p) => p.quantity || 1 },
                { 
                  header: 'Status', 
                  render: (p) => (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                      p.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                      p.status === 'FLAGGED' ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {p.status}
                    </span>
                  )
                },
                {
                  header: 'Actions',
                  render: (p) => (
                    p.status !== 'REMOVED' ? (
                      <button 
                        onClick={() => handleRemoveListing(p.id)}
                        className="text-red-600 hover:text-red-800 font-bold text-xs"
                      >
                        Remove
                      </button>
                    ) : (
                      <span className="text-slate-300 text-xs italic">Removed</span>
                    )
                  )
                }
              ]}
            />
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-2xl font-bold">App Users</h2>
            <AdminTable 
              data={users}
              columns={[
                {
                   header: 'User',
                   render: (u) => (
                     <div className="flex items-center gap-3">
                       <div className="h-10 w-10 rounded-full bg-slate-200 border border-slate-300 overflow-hidden relative">
                         {u.photoURL ? <img src={u.photoURL} alt="" className="h-full w-full object-cover" /> : <div className="bg-slate-300 h-full w-full" />}
                       </div>
                       <span className="font-semibold">{u.displayName || 'Anonymous'}</span>
                     </div>
                   )
                },
                { header: 'Email', render: (u) => u.email },
                { header: 'Joined', render: (u) => u.createdAt?.toDate().toLocaleDateString() || 'N/A' },
                { 
                  header: 'Banned', 
                  render: (u) => (
                    u.isBanned ? (
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-black italic">BANNED</span>
                    ) : (
                      <span className="text-emerald-500 font-bold text-[10px]">ACTIVE</span>
                    )
                  )
                },
                {
                  header: 'Actions',
                  render: (u) => (
                    <button 
                      onClick={() => handleToggleBan(u.id, !!u.isBanned)}
                      className={`text-xs font-black uppercase tracking-tight ${u.isBanned ? 'text-emerald-600' : 'text-red-600'}`}
                    >
                      {u.isBanned ? 'Re-enable' : 'Disable'}
                    </button>
                  )
                }
              ]}
            />
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-2xl font-bold">Safety Reports</h2>
            <AdminTable 
              data={reports}
              columns={[
                { header: 'Reported At', render: (r) => r.reportedAt?.toDate().toLocaleString() || 'N/A' },
                { header: 'Reporter', render: (r) => r.reporterEmail },
                { 
                  header: 'Post', 
                  render: (r) => (
                    <Link href={`/posts/${r.postId}`} className="text-blue-600 hover:underline font-medium">View Listing</Link>
                  ) 
                },
                { header: 'Reason', render: (r) => r.reason },
                { 
                  header: 'Status', 
                  render: (r) => (
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      r.status === 'open' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {r.status || 'open'}
                    </span>
                  )
                },
                {
                  header: 'Actions',
                  render: (r) => (
                    r.status === 'open' && (
                      <div className="flex gap-4">
                        <button onClick={() => handleUpdateReport(r.id, 'actioned')} className="text-emerald-600 text-xs font-bold">Mark Actioned</button>
                        <button onClick={() => handleUpdateReport(r.id, 'dismissed')} className="text-slate-400 text-xs font-medium">Dismiss</button>
                      </div>
                    )
                  )
                }
              ]}
            />
          </div>
        )}

        {/* Threads Tab */}
        {activeTab === 'threads' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-2xl font-bold mb-6">Message Threads</h2>
            <AdminTable
              data={threads}
              columns={[
                {
                  header: 'Participants',
                  render: (t) => {
                    const ids = Array.isArray(t.participantIds) ? t.participantIds : [];
                    if (ids.length === 0) return 'No participants';
                    return ids
                      .map((uid: string) => participantEmailMap[uid] || uid)
                      .join(', ');
                  }
                },
                { header: 'Last Message', render: (t) => t.lastMessageText || '—' },
                {
                  header: 'Updated',
                  render: (t) => t.lastMessageAt?.toDate?.().toLocaleString?.() || 'N/A'
                },
                {
                  header: 'Messages',
                  render: (t) => threadMessageCounts[t.id] ?? 0
                },
                {
                  header: 'View',
                  render: (t) => (
                    <Link href={`/chat/${t.id}`} className="text-blue-600 hover:underline font-medium">
                      Open
                    </Link>
                  )
                },
                {
                  header: 'Actions',
                  render: (t) => (
                    t.archived ? (
                      <span className="text-slate-400 text-xs italic">Archived</span>
                    ) : (
                      <button
                        onClick={() => handleArchiveThread(t.id)}
                        className="text-red-600 hover:text-red-800 font-bold text-xs"
                      >
                        Archive
                      </button>
                    )
                  )
                }
              ]}
            />
          </div>
        )}

      </main>
    </div>
  );
}
