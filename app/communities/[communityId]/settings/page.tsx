'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUser } from '@/components/FirebaseProvider';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { ChevronLeft, Loader2, Users, ShieldAlert, Image as ImageIcon, CheckCircle, XCircle, Globe, Lock, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CommunitySettingsPage() {
  const { communityId } = useParams();
  const router = useRouter();
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'approvals'>('general');

  // General Settings State
  const [community, setCommunity] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('PUBLIC');
  const [coverPhotoPreview, setCoverPhotoPreview] = useState('');
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);

  // Members State
  const [members, setMembers] = useState<any[]>([]);

  // Approvals State
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !communityId) return;

    async function checkAccessAndLoad() {
      try {
        // Check permissions
        const memberRef = doc(db, `communities/${communityId}/members`, user!.uid);
        const memberSnap = await getDoc(memberRef);
        
        if (!memberSnap.exists() || !['ADMIN', 'MODERATOR'].includes(memberSnap.data().role)) {
          alert("You do not have permission to view this page.");
          router.push(`/communities/${communityId}`);
          return;
        }

        // Load Community info
        const commRef = doc(db, 'communities', communityId as string);
        const commSnap = await getDoc(commRef);
        if (commSnap.exists()) {
          const data = commSnap.data();
          setCommunity({ id: commSnap.id, ...data });
          setName(data.name || '');
          setDescription(data.description || '');
          setPrivacy(data.privacy || 'PUBLIC');
          setCoverPhotoPreview(data.coverPhoto || '');
        }

        // Load Members
        const membersRef = collection(db, `communities/${communityId}/members`);
        const membersSnap = await getDocs(membersRef);
        const membersList = membersSnap.docs.map(d => ({id: d.id, ...d.data()}));

        // Fetch member profile details to get names
        const userIds = membersList.map((m: any) => m.id);
        let profilesData: Record<string, any> = {};
        if (userIds.length > 0) {
           // We chop into chunks conceptually, but assume small < 30 for MVP
           const usersQ = query(collection(db, 'users'), where('__name__', 'in', userIds.slice(0, 30)));
           const usersSnap = await getDocs(usersQ);
           usersSnap.docs.forEach(d => {
              profilesData[d.id] = d.data();
           });
        }
        
        const mergedMembers = membersList.map((m: any) => ({
           ...m,
           displayName: profilesData[m.id]?.displayName || 'Unknown User',
           photoUrl: profilesData[m.id]?.photoUrl || ''
        }));
        setMembers(mergedMembers);

        // Load Pending Posts
        const pendingQ = query(
          collection(db, 'posts'),
          where('communityId', '==', communityId),
          where('status', '==', 'PENDING_APPROVAL')
        );
        const pendingSnap = await getDocs(pendingQ);
        setPendingPosts(pendingSnap.docs.map(d => ({id: d.id, ...d.data()})));

        setLoading(false);
      } catch (err) {
        console.error("Error loading settings:", err);
        setLoading(false);
      }
    }

    checkAccessAndLoad();
  }, [user, communityId, router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return alert("Image must be < 5MB");
      setCoverPhotoFile(file);
      setCoverPhotoPreview(URL.createObjectURL(file));
    }
  };

  const saveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let finalCoverUrl = community?.coverPhoto || '';
      
      if (coverPhotoFile) {
        try {
           const fileRef = ref(storage, `community_covers/${user?.uid}/${Date.now()}_${coverPhotoFile.name}`);
           const snapshot = await uploadBytes(fileRef, coverPhotoFile);
           finalCoverUrl = await getDownloadURL(snapshot.ref);
        } catch (e) {
           console.error("Cover upload failed", e);
        }
      }

      await updateDoc(doc(db, 'communities', communityId as string), {
        name: name.trim(),
        description: description.trim(),
        privacy,
        coverPhoto: finalCoverUrl
      });
      alert('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
       await updateDoc(doc(db, `communities/${communityId}/members`, userId), {
          role: newRole
       });
       setMembers(members.map(m => m.id === userId ? {...m, role: newRole} : m));
    } catch (err) {
       alert("Failed to update role");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    
    try {
       await deleteDoc(doc(db, `communities/${communityId}/members`, userId));
       setMembers(members.filter(m => m.id !== userId));
    } catch (err) {
       alert("Failed to remove member");
    }
  };

  const handlePostApproval = async (postId: string, approved: boolean) => {
    try {
      await updateDoc(doc(db, 'posts', postId), {
        status: approved ? 'ACTIVE' : 'REJECTED'
      });
      setPendingPosts(pendingPosts.filter(p => p.id !== postId));
    } catch (err) {
      alert("Failed to update post status");
    }
  };

  if (loading) return (
    <div className="h-screen bg-[#F0F2F5] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-6">
        
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 shrink-0 space-y-2">
          <Link href={`/communities/${communityId}`} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 font-bold text-sm">
            <ChevronLeft className="w-4 h-4" /> Back to Community
          </Link>
          
          <h2 className="text-xl font-black text-slate-900 mb-4 tracking-tight px-3">Manage</h2>
          
          <button 
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'general' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            <Settings className="w-5 h-5" /> General Settings
          </button>
          
          <button 
            onClick={() => setActiveTab('members')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'members' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            <Users className="w-5 h-5" /> Members
          </button>
          
          <button 
            onClick={() => setActiveTab('approvals')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'approvals' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            <div className="relative">
               <ShieldAlert className="w-5 h-5" />
               {pendingPosts.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#F0F2F5]" />}
            </div>
            Pending Posts
          </button>
        </aside>

        {/* Content Area */}
        <main className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* GENERAL SETTINGS */}
          {activeTab === 'general' && (
            <form onSubmit={saveGeneralSettings} className="p-6 md:p-8 space-y-6">
              <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4">General Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1.5">Cover Photo</label>
                  <div className="relative group w-full h-32 md:h-48 rounded-xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center transition-colors hover:bg-slate-50">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    {coverPhotoPreview ? (
                      <>
                        <img src={coverPhotoPreview} alt="Cover" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-white font-medium flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Change</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-slate-500 text-center"><ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-400" /><span className="text-sm font-medium">Upload Cover</span></div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1.5">Community Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 font-medium" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1.5">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} className="w-full border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 font-medium resize-none"></textarea>
                </div>

                <div className="space-y-3 pt-4">
                  <label className="block text-sm font-bold text-slate-900">Privacy</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button type="button" onClick={() => setPrivacy('PUBLIC')} className={`p-4 rounded-xl border-2 text-left flex gap-3 transition-all ${privacy === 'PUBLIC' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <Globe className={`w-5 h-5 ${privacy === 'PUBLIC' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <div><div className="font-bold text-sm">Public Group</div><div className="text-xs text-slate-500">Anyone can see content.</div></div>
                    </button>
                    <button type="button" onClick={() => setPrivacy('CLOSED')} className={`p-4 rounded-xl border-2 text-left flex gap-3 transition-all ${privacy === 'CLOSED' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <Lock className={`w-5 h-5 ${privacy === 'CLOSED' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <div><div className="font-bold text-sm">Closed Group</div><div className="text-xs text-slate-500">Only members see content.</div></div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 flex justify-end">
                <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
                </button>
              </div>
            </form>
          )}

          {/* MEMBERS */}
          {activeTab === 'members' && (
            <div className="p-6 md:p-8 space-y-6">
              <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4">Members ({members.length})</h3>
              <div className="space-y-4">
                {members.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden text-center leading-10 font-bold text-slate-500 uppercase">
                         {member.photoUrl ? <img src={member.photoUrl} alt="" className="w-full h-full object-cover"/> : member.displayName[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{member.displayName}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-widest">{member.role}</div>
                      </div>
                    </div>
                    {/* Only show controls if user is Admin and we are not deleting ourselves */}
                    {member.id !== user?.uid && (
                      <div className="flex items-center gap-2">
                        <select 
                          value={member.role} 
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className="bg-white border-slate-200 rounded-lg text-xs font-bold py-1.5 focus:ring-indigo-500"
                        >
                          <option value="MEMBER">Member</option>
                          <option value="MODERATOR">Moderator</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <button onClick={() => handleRemoveMember(member.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* APPROVALS */}
          {activeTab === 'approvals' && (
            <div className="p-6 md:p-8 space-y-6">
              <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4">Pending Post Approvals</h3>
              
              {pendingPosts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium text-sm">No posts currently awaiting approval.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingPosts.map(post => (
                    <div key={post.id} className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-start">
                      <div className="flex-1 space-y-2">
                         <div className="flex items-center gap-2">
                            <span className="bg-amber-100 text-amber-700 text-xs font-black px-2 py-0.5 rounded-md uppercase tracking-wider">Pending</span>
                            <span className="text-xs font-bold text-slate-400">By {post.ownerName}</span>
                         </div>
                         <h4 className="font-bold text-slate-900">{post.title}</h4>
                         <p className="text-sm text-slate-600 line-clamp-2">{post.description}</p>
                         
                         {post.photoUrls && post.photoUrls.length > 0 && (
                           <div className="flex gap-2 mt-2">
                             {post.photoUrls.slice(0,3).map((url: string, i: number) => (
                               <div key={i} className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100">
                                 <img src={url} alt="" className="w-full h-full object-cover" />
                               </div>
                             ))}
                             {post.photoUrls.length > 3 && <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">+{post.photoUrls.length-3}</div>}
                           </div>
                         )}
                      </div>
                      
                      <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                        <button onClick={() => handlePostApproval(post.id, true)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-lg font-bold text-sm transition-colors border border-emerald-200">
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button onClick={() => handlePostApproval(post.id, false)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 px-4 py-2 rounded-lg font-bold text-sm transition-colors border border-rose-200">
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
