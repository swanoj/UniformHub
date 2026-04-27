'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, serverTimestamp, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUser } from '@/components/FirebaseProvider';
import { Navbar } from '@/components/Navbar';
import Image from 'next/image';
import Link from 'next/link';
import { Globe, Lock, Users, ShieldCheck, MoreHorizontal, MessageSquare, Image as ImageIcon, Tag, Search, PlusSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CommunityPage() {
  const { communityId } = useParams();
  const { user, profile } = useUser();
  const router = useRouter();

  const [community, setCommunity] = useState<any>(null);
  const [memberStatus, setMemberStatus] = useState<any>(null); // null, {role, status}
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [membersList, setMembersList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'discussion' | 'members' | 'settings'>('discussion');
  
  // Dialog state
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  
  // Discussion post state
  const [newPostText, setNewPostText] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const commRef = doc(db, 'communities', communityId as string);
        const commSnap = await getDoc(commRef);
        
        if (!commSnap.exists()) {
          router.push('/communities');
          return;
        }
        setCommunity({ id: commSnap.id, ...commSnap.data() });

        let isMod = false;
        if (user) {
          const memberRef = doc(db, `communities/${communityId}/members`, user.uid);
          const memberSnap = await getDoc(memberRef);
          if (memberSnap.exists()) {
             const mData = memberSnap.data();
             setMemberStatus(mData);
             if (mData.role === 'ADMIN' || mData.role === 'MODERATOR') {
                 isMod = true;
             }
          }
        }
        
        // Load posts if public or if user is approved
        const isPublic = commSnap.data().privacy === 'PUBLIC';
        const q = query(
          collection(db, 'posts'),
          where('communityId', '==', communityId),
          where('status', '==', 'ACTIVE'),
          orderBy('createdAt', 'desc')
        );
        const postsSnap = await getDocs(q);
        setPosts(postsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        if (isMod) {
           const pendingQ = query(
             collection(db, 'posts'),
             where('communityId', '==', communityId),
             where('status', '==', 'PENDING_APPROVAL'),
             orderBy('createdAt', 'desc')
           );
           const pendingSnap = await getDocs(pendingQ);
           setPendingPosts(pendingSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
        
        // Load members list
        const membersRef = collection(db, `communities/${communityId}/members`);
        const membersSnap = await getDocs(membersRef);
        const membersData = membersSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        
        const userIds = membersData.map(m => m.userId);
        let profilesData: Record<string, any> = {};
        if (userIds.length > 0) {
          const usersQ = query(collection(db, 'users'), where('__name__', 'in', userIds.slice(0, 10)));
          const userSnap = await getDocs(usersQ);
          userSnap.docs.forEach(d => {
            profilesData[d.id] = d.data();
          });
        }

        const mergedMembers = membersData.map(m => ({
          ...m,
          profile: profilesData[m.userId] || null
        }));
        setMembersList(mergedMembers);
        
      } catch (error) {
        console.error("Error loading community", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [communityId, user, router]);

  const handleJoin = async () => {
    if (!user || joining || !community) return;
    setJoining(true);
    try {
      const status = community.requireMemberApproval ? 'PENDING' : 'APPROVED';
      const newMember = {
        userId: user.uid,
        role: 'MEMBER',
        status,
        joinedAt: serverTimestamp()
      };
      await setDoc(doc(db, `communities/${communityId}/members`, user.uid), newMember);
      setMemberStatus(newMember);
      setShowJoinDialog(false);
      
      // Notify the owner of the join request
      if (status === 'PENDING' && community.ownerId) {
        try {
          await addDoc(collection(db, `users/${community.ownerId}/notifications`), {
            userId: community.ownerId,
            type: 'JOIN_REQUEST',
            actorId: user.uid,
            actorName: profile?.displayName || 'Someone',
            actorPhotoUrl: profile?.photoUrl || user.photoURL || '',
            referenceId: community.id,
            message: `requested to join ${community.name}`,
            read: false,
            createdAt: serverTimestamp()
          });
        } catch (notifErr) {
          console.error("Failed to send notification", notifErr);
        }
      }
    } catch (e) {
      console.error(e);
      alert('Failed to join.');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!user || joining || !memberStatus) return;
    if (memberStatus.role === 'ADMIN') {
      alert("Admins cannot leave without transferring ownership first.");
      return;
    }
    
    setJoining(true);
    try {
      await deleteDoc(doc(db, `communities/${communityId}/members`, user.uid));
      setMemberStatus(null);
      setShowLeaveDialog(false);
    } catch (e) {
      console.error(e);
      alert('Failed to leave.');
    } finally {
      setJoining(false);
    }
  };

  const handleUpdateMember = async (targetUserId: string, newRole: string, newStatus: string) => {
    if (!communityId) return;
    try {
      await setDoc(doc(db, `communities/${communityId}/members`, targetUserId), {
        role: newRole,
        status: newStatus
      }, { merge: true });
      
      setMembersList(prev => prev.map(m => 
        m.userId === targetUserId 
          ? { ...m, role: newRole, status: newStatus }
          : m
      ));
    } catch (error) {
      console.error("Error updating member", error);
    }
  };

  const submitDiscussion = async () => {
    if (!user || !profile || !newPostText.trim() || posting) return;
    setPosting(true);
    try {
      const isPostAnnouncement = isAnnouncement && (memberStatus?.role === 'ADMIN' || memberStatus?.role === 'MODERATOR');
      const newPost = {
        ownerId: user.uid,
        ownerName: profile.displayName || 'Unknown User',
        ownerPhotoUrl: profile.photoUrl || user.photoURL || null,
        communityId: community.id,
        postType: isPostAnnouncement ? 'ANNOUNCEMENT' : 'DISCUSSION',
        title: isPostAnnouncement ? 'Announcement' : 'Discussion',
        description: newPostText.trim(),
        status: 'ACTIVE',
        likesCount: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'posts'), newPost);
      // Optimistically add to UI
      setPosts([{ id: docRef.id, ...newPost, createdAt: { toDate: () => new Date() } }, ...posts]);
      setNewPostText('');
      setIsAnnouncement(false);
    } catch (error) {
      console.error("Error posting discussion", error);
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#F0F2F5]"><Navbar /><div className="flex justify-center mt-20"><div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div></div></div>;
  }

  if (!community) return null;

  const canViewContent = community.privacy === 'PUBLIC' || (memberStatus && memberStatus.status === 'APPROVED');
  const canPost = memberStatus && memberStatus.status === 'APPROVED' && (!community.onlyAdminsCanPost || memberStatus.role === 'ADMIN');

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col">
      <Navbar />
      
      {/* Cover and Header */}
      <div className="bg-white border-b border-slate-200">
         <div className="max-w-[1096px] mx-auto">
            {/* Cover Photo Area */}
            <div className="h-[350px] w-full bg-slate-200 relative md:rounded-b-xl overflow-hidden shadow-sm">
               {community.coverPhoto ? (
                 <img src={community.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
               )}
            </div>

            {/* Header Info Area */}
            <div className="px-4 md:px-8 py-6 relative">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="flex-1">
                     <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-2">
                       {community.name}
                     </h1>
                     <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-500 uppercase tracking-tighter">
                        <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-md">
                          {community.privacy === 'PUBLIC' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          {community.privacy} GROUP
                        </span>
                        <span className="flex items-center gap-1.5">
                           <Users className="w-4 h-4" />
                           {community.memberCount || 1} Member{community.memberCount !== 1 && 's'}
                        </span>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                     {!user ? (
                       <button className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm">
                         Log In to Join
                       </button>
                     ) : !memberStatus ? (
                       <button onClick={() => setShowJoinDialog(true)} disabled={joining} className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm">
                         Join Group
                       </button>
                     ) : memberStatus.status === 'PENDING' ? (
                       <button className="bg-slate-200 text-slate-700 px-8 py-2.5 rounded-xl font-bold border border-slate-300">
                         Request Pending
                       </button>
                     ) : (
                       <div className="flex gap-2">
                         <button 
                           onClick={() => {
                             if (memberStatus.role === 'ADMIN') {
                               alert("Admins cannot leave without transferring ownership first.");
                             } else {
                               setShowLeaveDialog(true);
                             }
                           }} 
                           disabled={joining} 
                           className="bg-slate-100 text-slate-700 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors border border-slate-200 flex items-center gap-2"
                         >
                           Joined
                         </button>
                       </div>
                     )}
                  </div>
               </div>
            </div>
            
            {/* Tabs */}
            <div className="px-4 md:px-8 flex items-center gap-1 border-t border-slate-100">
               <button 
                 onClick={() => setActiveTab('discussion')}
                 className={`px-4 py-4 font-bold border-b-4 transition-colors ${activeTab === 'discussion' ? 'text-indigo-600 border-indigo-600' : 'text-slate-500 hover:bg-slate-50 border-transparent rounded-t-lg'}`}>
                 Discussion
               </button>
               <button 
                 onClick={() => setActiveTab('members')}
                 className={`px-4 py-4 font-bold border-b-4 transition-colors ${activeTab === 'members' ? 'text-indigo-600 border-indigo-600' : 'text-slate-500 hover:bg-slate-50 border-transparent rounded-t-lg'}`}>
                 Members
               </button>
               {memberStatus?.role === 'ADMIN' && (
                 <Link href={`/communities/${communityId}/settings`} className="px-4 py-4 font-bold text-slate-500 hover:bg-slate-50 border-b-4 border-transparent rounded-t-lg transition-colors">
                   Settings
                 </Link>
               )}
            </div>
         </div>
      </div>

      <div className="flex-1 max-w-[1096px] w-full mx-auto px-4 md:px-8 py-6 flex flex-col md:flex-row gap-6">
        
         {/* Main Feed */}
         <div className="flex-1 min-w-0 space-y-4">
            {canViewContent ? (
              <>
                {activeTab === 'discussion' && (
                  <>
                    {canPost && (
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                         <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                              {profile?.photoUrl || user?.photoURL ? (
                                 <Image src={profile?.photoUrl || user?.photoURL} alt="User" width={40} height={40} className="object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                 <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 text-lg font-bold">U</div>
                              )}
                            </div>
                            <input 
                               type="text" 
                               value={newPostText}
                               onChange={(e) => setNewPostText(e.target.value)}
                               onKeyDown={(e) => { if(e.key === 'Enter') submitDiscussion() }}
                               placeholder="Write something to the group..." 
                               className="flex-1 bg-slate-100 border-none rounded-full px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-600 placeholder:text-slate-500"
                            />
                         </div>
                         <div className="h-[1px] bg-slate-100 my-3"></div>
                           <div className="flex gap-2 items-center">
                              {(memberStatus?.role === 'ADMIN' || memberStatus?.role === 'MODERATOR') && (
                                <label className="flex items-center gap-2 cursor-pointer mr-auto ml-2">
                                  <input 
                                    type="checkbox" 
                                    checked={isAnnouncement}
                                    onChange={(e) => setIsAnnouncement(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 transition-all cursor-pointer"
                                  />
                                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Post as Announcement</span>
                                </label>
                              )}
                              <Link href={`/create?communityId=${communityId}`} className="px-4 flex items-center justify-center gap-2 py-2 hover:bg-slate-50 rounded-lg text-slate-600 font-bold text-sm transition-colors cursor-pointer">
                                 <Tag className="w-5 h-5 text-indigo-500" />
                                 Sell Something
                              </Link>
                              <button onClick={submitDiscussion} disabled={!newPostText.trim() || posting} className="px-4 flex items-center justify-center gap-2 py-2 hover:bg-slate-50 rounded-lg text-slate-600 font-bold text-sm transition-colors cursor-pointer disabled:opacity-50">
                                 <MessageSquare className="w-5 h-5 text-emerald-500" />
                                 {isAnnouncement ? 'Post Announcement' : 'Post Discussion'}
                              </button>
                           </div>
                      </div>
                    )}
                    
                    {pendingPosts.length > 0 && (memberStatus?.role === 'ADMIN' || memberStatus?.role === 'MODERATOR') && (
                      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                           <h3 className="font-bold text-amber-900 flex items-center gap-2">
                             <ShieldCheck className="w-5 h-5 text-amber-600" />
                             Pending Approval ({pendingPosts.length})
                           </h3>
                        </div>
                        <div className="space-y-3">
                           {pendingPosts.map(post => (
                              <div key={post.id} className="bg-white rounded-lg p-3 border border-amber-100 shadow-sm flex items-start justify-between gap-4">
                                <div>
                                   <p className="font-bold text-sm text-slate-900">{post.ownerName} wants to post</p>
                                   <p className="text-xs text-slate-500 mb-2">{post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), {addSuffix:true}) : 'recently'}</p>
                                   <p className="text-sm text-slate-700 line-clamp-2">{post.title || post.description}</p>
                                </div>
                                <div className="flex flex-col gap-2 shrink-0">
                                   <button 
                                     onClick={async () => {
                                        try {
                                          await setDoc(doc(db, 'posts', post.id), { status: 'ACTIVE' }, { merge: true });
                                          setPendingPosts(prev => prev.filter(p => p.id !== post.id));
                                          setPosts([{...post, status: 'ACTIVE'}, ...posts]);
                                        } catch (e) {
                                          console.error("Error approving post", e);
                                        }
                                     }}
                                     className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700">
                                     Approve
                                   </button>
                                   <button 
                                     onClick={async () => {
                                        try {
                                          await deleteDoc(doc(db, 'posts', post.id));
                                          setPendingPosts(prev => prev.filter(p => p.id !== post.id));
                                        } catch (e) {
                                          console.error("Error declining post", e);
                                        }
                                     }}
                                     className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 text-center">
                                     Decline
                                   </button>
                                </div>
                              </div>
                           ))}
                        </div>
                      </div>
                    )}
                    
                    {posts.length > 0 ? (
                      <div className="space-y-4">
                         {posts
                           .sort((a, b) => {
                             // Sort announcements first, then by date descending
                             if (a.postType === 'ANNOUNCEMENT' && b.postType !== 'ANNOUNCEMENT') return -1;
                             if (a.postType !== 'ANNOUNCEMENT' && b.postType === 'ANNOUNCEMENT') return 1;
                             const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
                             const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
                             return dateB.getTime() - dateA.getTime();
                           })
                           .map(post => (
                            <div key={post.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                               {post.postType === 'LISTING' ? (
                                  <div className="p-0">
                                     {/* Display Listing Style inside feed */}
                                     <div className="p-4 flex items-center justify-between border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                           <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                              {post.ownerPhotoUrl && <Image src={post.ownerPhotoUrl} alt="" width={40} height={40} className="object-cover" referrerPolicy="no-referrer" />}
                                           </div>
                                           <div>
                                              <p className="font-bold text-sm text-slate-900 leading-tight">{post.ownerName}</p>
                                              <p className="text-xs text-slate-500">{post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), {addSuffix:true}) : 'recently'}</p>
                                           </div>
                                        </div>
                                        <div className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded">Listing</div>
                                     </div>
                                     <Link href={`/posts/${post.id}`} className="block group">
                                         <div className="p-4">
                                            <div className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{post.title}</div>
                                            <div className="font-black text-xl text-[#050505] mt-1">${post.price}</div>
                                         </div>
                                         {post.photoUrls && post.photoUrls.length > 0 && (
                                            <div className="relative h-72 w-full bg-slate-100">
                                               <Image src={post.photoUrls[0]} alt="" fill className="object-cover" />
                                            </div>
                                         )}
                                     </Link>
                                  </div>
                               ) : (
                                  <div className="p-4">
                                      {/* Display Discussion Style */}
                                      <div className="flex items-center gap-3 mb-3">
                                         <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                            {post.ownerPhotoUrl && <Image src={post.ownerPhotoUrl} alt="" width={40} height={40} className="object-cover" referrerPolicy="no-referrer" />}
                                         </div>
                                         <div className="flex-1">
                                            <p className="font-bold text-sm text-slate-900 leading-tight">{post.ownerName}</p>
                                            <p className="text-xs text-slate-500">{post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), {addSuffix:true}) : 'recently'}</p>
                                         </div>
                                         {post.postType === 'ANNOUNCEMENT' && (
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                                               <ShieldCheck className="w-4 h-4" />
                                               <span className="text-[10px] font-black uppercase tracking-wider">Announcement</span>
                                            </div>
                                         )}
                                      </div>
                                      <p className="text-sm text-slate-800 whitespace-pre-wrap">{post.description}</p>
                                  </div>
                               )}
                               
                               {/* Post Interactions */}
                               <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between">
                                  <span className="text-xs text-slate-500 font-medium">{post.likesCount || 0} Likes • {post.commentsCount || 0} Comments</span>
                               </div>
                               <div className="px-2 py-1 flex border-t border-slate-100">
                                  <button className="flex-1 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">Like</button>
                                  <button className="flex-1 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">Comment</button>
                               </div>
                            </div>
                         ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                         <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                         <h3 className="text-lg font-bold text-slate-900">No recent activity</h3>
                         <p className="text-sm text-slate-500 mt-1">Be the first to post something in {community.name}!</p>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'members' && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <h2 className="text-lg font-bold text-slate-900">Members ({membersList.length})</h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {membersList.map(member => (
                        <div key={member.id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {member.profile?.photoUrl ? (
                                <Image src={member.profile.photoUrl} alt="" width={48} height={48} className="object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <Users className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <div>
                               <div className="flex items-center gap-2">
                                  <p className="font-bold text-slate-900 text-[15px]">{member.profile?.displayName || 'Unknown User'}</p>
                                  {member.role === 'ADMIN' && <span className="bg-indigo-100 text-indigo-700 text-[10px] uppercase font-black px-2 py-0.5 rounded">Admin</span>}
                                  {member.role === 'MODERATOR' && <span className="bg-blue-100 text-blue-700 text-[10px] uppercase font-black px-2 py-0.5 rounded">Moderator</span>}
                                  {member.status === 'PENDING' && <span className="bg-amber-100 text-amber-700 text-[10px] uppercase font-black px-2 py-0.5 rounded">Pending Approval</span>}
                               </div>
                               <p className="text-sm text-slate-500 mt-0.5">Joined {member.joinedAt?.toDate ? formatDistanceToNow(member.joinedAt.toDate(), {addSuffix: true}) : 'recently'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <Lock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900">This group is Private</h3>
                <p className="text-sm text-slate-500 mt-1">Join this group to view and participate in the discussion.</p>
             </div>
           )}
        </div>

        {/* Right Sidebar (About) */}
        <div className="w-full md:w-[360px] space-y-4">
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 text-lg mb-3">About this group</h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{community.description}</p>
              
              <div className="mt-5 space-y-4">
                 <div className="flex gap-3 items-start">
                    {community.privacy === 'PUBLIC' ? <Globe className="w-5 h-5 text-slate-400 shrink-0" /> : <Lock className="w-5 h-5 text-slate-400 shrink-0" />}
                    <div>
                       <p className="text-sm font-bold text-slate-900">{community.privacy === 'PUBLIC' ? 'Public' : 'Private'}</p>
                       <p className="text-xs text-slate-500 mt-0.5">{community.privacy === 'PUBLIC' ? 'Anyone can see who\'s in the group and what they post.' : 'Only members can see who\'s in the group and what they post.'}</p>
                    </div>
                 </div>
                 
                 <div className="flex gap-3 items-start">
                    <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0" />
                    <div>
                       <p className="text-sm font-bold text-slate-900">Community Moderated</p>
                       <p className="text-xs text-slate-500 mt-0.5">This space is actively moderated by admins and verified members.</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

      </div>
      
      {/* Join Dialog Modal */}
      {showJoinDialog && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Join {community.name}</h3>
            <p className="text-slate-600 mb-6">
              {community.requireMemberApproval 
                ? "This community requires admin approval to join. Your request will be sent to the administrators."
                : "Are you sure you want to join this community?"}
            </p>
            <div className="flex gap-3 justify-end mt-6">
              <button 
                onClick={() => setShowJoinDialog(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                disabled={joining}
              >
                Cancel
              </button>
              <button 
                onClick={handleJoin}
                disabled={joining}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                {joining ? 'Joining...' : (community.requireMemberApproval ? 'Request to Join' : 'Join Community')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Dialog Modal */}
      {showLeaveDialog && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Leave Community</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to leave {community.name}? You may need approval to rejoin.</p>
            <div className="flex gap-3 justify-end mt-6">
              <button 
                onClick={() => setShowLeaveDialog(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                disabled={joining}
              >
                Cancel
              </button>
              <button 
                onClick={handleLeave}
                disabled={joining}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Leave Community
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
