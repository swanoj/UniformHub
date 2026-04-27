'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useUser } from '@/components/FirebaseProvider';
import { Navbar } from '@/components/Navbar';
import { Users, Globe, Lock, ShieldAlert, Loader2, Info, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function CreateCommunityPage() {
  const { user } = useUser();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('PUBLIC');
  const [onlyAdminsCanPost, setOnlyAdminsCanPost] = useState(false);
  const [requireMemberApproval, setRequireMemberApproval] = useState(false);
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be smaller than 5MB");
        return;
      }
      setCoverPhotoFile(file);
      setCoverPhotoPreview(URL.createObjectURL(file));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F0F2F5]">
        <Navbar />
        <div className="flex justify-center mt-20">
          <div className="bg-white p-8 rounded-xl shadow-sm text-center">
            <h2 className="text-xl font-bold mb-4">You must be logged in</h2>
            <p className="text-slate-500 mb-6">Log in to create and manage communities.</p>
            <Link href="/" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold">Go Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    
    setSaving(true);
    try {
      let finalCoverUrl = '';
      if (coverPhotoFile) {
        const fileRef = ref(storage, `community_covers/${user.uid}/${Date.now()}_${coverPhotoFile.name}`);
        const snapshot = await uploadBytes(fileRef, coverPhotoFile);
        finalCoverUrl = await getDownloadURL(snapshot.ref);
      }

      // 1. Create the community document
      const communityData = {
        name: name.trim(),
        description: description.trim(),
        ownerId: user.uid,
        privacy,
        coverPhoto: finalCoverUrl,
        onlyAdminsCanPost,
        requireMemberApproval,
        memberCount: 1, // The owner
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'communities'), communityData);
      
      // 2. Add the creator as an ADMIN member of the community
      await setDoc(doc(db, `communities/${docRef.id}/members`, user.uid), {
        userId: user.uid,
        role: 'ADMIN',
        status: 'APPROVED',
        joinedAt: serverTimestamp() // Safe locally if relying on server time in production, but works for UI
      });

      router.push(`/communities/${docRef.id}`);
    } catch (error) {
      console.error("Error creating community", error);
      alert("Failed to create community. See console for details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8">
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="border-b border-slate-200 p-6 bg-slate-50">
              <h1 className="text-2xl font-black text-slate-900">Create a Community</h1>
              <p className="text-sm text-slate-600 mt-1">Setup a safe space for your school, club, or team to share and sell uniforms.</p>
           </div>
           
           <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1.5">Cover Photo</label>
                  <div className="relative group w-full h-32 md:h-48 rounded-xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center transition-colors hover:bg-slate-50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {coverPhotoPreview ? (
                      <>
                        <img src={coverPhotoPreview} alt="Cover preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-white font-medium flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> Change Photo
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-slate-500">
                        <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <span className="text-sm font-medium">Click or drag to upload cover photo</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1.5">Community Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Richmond High Buy/Sell/Swap"
                    className="w-full border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 font-medium"
                  />
                  <p className="text-xs text-slate-500 mt-1.5">Use a name that clearly identifies your school or group.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1.5">Description *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                    placeholder="Describe the purpose of this group..."
                    className="w-full border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 font-medium resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="h-[1px] bg-slate-100"></div>

              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900">Privacy & Permissions</h3>
                
                {/* Privacy Toggle */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-900">Visibility</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPrivacy('PUBLIC')}
                      className={`p-4 rounded-xl border-2 text-left flex gap-3 transition-all ${privacy === 'PUBLIC' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                    >
                      <Globe className={`w-5 h-5 shrink-0 ${privacy === 'PUBLIC' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <div>
                        <div className={`font-bold text-sm ${privacy === 'PUBLIC' ? 'text-indigo-900' : 'text-slate-700'}`}>Public Group</div>
                        <div className={`text-xs mt-0.5 ${privacy === 'PUBLIC' ? 'text-indigo-600/80' : 'text-slate-500'}`}>Anyone can find this group and see who is in it.</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrivacy('CLOSED')}
                      className={`p-4 rounded-xl border-2 text-left flex gap-3 transition-all ${privacy === 'CLOSED' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                    >
                      <Lock className={`w-5 h-5 shrink-0 ${privacy === 'CLOSED' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <div>
                        <div className={`font-bold text-sm ${privacy === 'CLOSED' ? 'text-indigo-900' : 'text-slate-700'}`}>Closed Group</div>
                        <div className={`text-xs mt-0.5 ${privacy === 'CLOSED' ? 'text-indigo-600/80' : 'text-slate-500'}`}>Anyone can find this group, but only members can see content.</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="flex h-6 items-center">
                      <input
                        type="checkbox"
                        checked={requireMemberApproval}
                        onChange={(e) => setRequireMemberApproval(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 transition-all cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-900">Require Member Approval</span>
                      <p className="text-xs text-slate-500 mt-0.5">Admins must approve requests to join the community.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="flex h-6 items-center">
                      <input
                        type="checkbox"
                        checked={onlyAdminsCanPost}
                        onChange={(e) => setOnlyAdminsCanPost(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 transition-all cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-900">Only Admins Can Post (Broadcast Page)</span>
                      <p className="text-xs text-slate-500 mt-0.5">Turn this into an official Page where only admins can create new posts or listings.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-200 flex justify-end gap-3">
                 <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                   Cancel
                 </button>
                 <button 
                  type="submit" 
                  disabled={saving || !name.trim()}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2"
                 >
                   {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                   Create Community
                 </button>
              </div>

           </form>
        </div>
      </div>
    </div>
  );
}
