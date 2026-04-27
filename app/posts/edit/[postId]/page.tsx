'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { updateDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '@/lib/firebase';
import { useUser } from '@/components/FirebaseProvider';
import { Navbar } from '@/components/Navbar';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Camera, Loader2, X, ChevronLeft, LayoutGrid, Package } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import Image from 'next/image';

const CATEGORIES = ['School', 'Sport', 'Secondhand'];
const TYPES = ['SALE', 'WTB', 'FREE'];

export default function EditPostPage() {
  const router = useRouter();
  const { postId } = useParams();
  const { user, profile } = useUser();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [postRef, setPostRef] = useState<any>(null);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'School',
    type: 'SALE',
    condition: 'Good',
    price: '',
    originalPrice: '',
    school: '',
  });

  useEffect(() => {
    async function fetchPost() {
      if (!postId) return;
      try {
        const dRef = doc(db, 'posts', postId as string);
        const docSnap = await getDoc(dRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.ownerId !== user?.uid && user?.email !== 'oliverjs090@gmail.com') {
             alert('You are not authorized to edit this post.');
             router.push('/');
             return;
          }
          setPostRef(dRef);
          setForm({
            title: data.title || '',
            description: data.description || '',
            category: data.category || 'School',
            type: data.type || 'SALE',
            condition: data.condition || 'Good',
            price: data.price ? String(data.price) : '',
            originalPrice: data.originalPrice ? String(data.originalPrice) : '',
            school: data.school || '',
          });
          setExistingPhotos(data.photoUrls || []);
        } else {
          alert('Post not found.');
          router.push('/');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    }
    if (user) fetchPost();
  }, [postId, user, router]);

  const handleAddField = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + imageFiles.length + existingPhotos.length > 10) {
      alert("You can only have up to 10 photos.");
      return;
    }
    setImageFiles(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const removeExistingImage = (index: number) => {
    setExistingPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      const newUrls = [...prev];
      URL.revokeObjectURL(newUrls[index]);
      newUrls.splice(index, 1);
      return newUrls;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !postRef) return;
    if (!profile?.isMember) {
      alert("You need an active membership to edit posts.");
      return;
    }
    if (!agreedToTerms) {
      alert("You must agree to the Terms & Conditions.");
      return;
    }
    if (imageFiles.length === 0 && existingPhotos.length === 0) {
      alert("Please have at least one photo.");
      return;
    }
    if (/[\w.-]+@[\w.-]+\.\w+/.test(form.description) || /\+?\d{8,15}/.test(form.description)) {
      alert("Please do not include personal contact details (email or phone numbers) in the description.");
      return;
    }

    setLoading(true);
    try {
      let finalPhotoUrls: string[] = [...existingPhotos];

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        try {
           const fileRef = ref(storage, `post_images/${user.uid}/${Date.now()}_${file.name}`);
           const snapshot = await uploadBytes(fileRef, file);
           const dlUrl = await getDownloadURL(snapshot.ref);
           finalPhotoUrls.push(dlUrl);
        } catch (err) {
           console.error("Upload failed for image", i, err);
        }
      }

      await updateDoc(postRef, {
        title: form.title,
        description: form.description,
        category: form.category,
        type: form.type,
        condition: form.condition,
        school: form.school || profile?.school || '',
        price: form.type === 'FREE' ? '' : form.price,
        originalPrice: form.type === 'FREE' ? '' : form.originalPrice,
        photoUrls: finalPhotoUrls, 
        searchTerms: `${form.title} ${form.description} ${form.school} ${form.category}`.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 2),
        updatedAt: serverTimestamp(),
      });
      
      router.push(`/posts/${postId}`);
    } catch (error: any) {
      console.error("Error updating post", error);
      alert("Failed to update: " + (error.message || "Unknown error occurred."));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const previewPost = {
    ...form,
    id: postId,
    photoUrls: [...existingPhotos, ...previewUrls],
    ownerName: profile?.displayName || 'You',
    suburb: profile?.suburb || 'Local',
    createdAt: { toDate: () => new Date() },
    status: 'ACTIVE'
  };

  return (
    <div className="h-screen bg-[#F0F2F5] flex flex-col overflow-hidden">
      <Navbar />

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <aside className="w-full md:w-90 bg-white border-r border-slate-200 overflow-y-auto shadow-sm z-10">
          <div className="p-4 border-b border-slate-100 sticky top-0 bg-white z-10 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                 <ChevronLeft className="w-6 h-6 text-slate-500" />
               </button>
               <h1 className="text-xl font-black text-slate-900">Edit Listing</h1>
             </div>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Photos · {existingPhotos.length + imageFiles.length} / 10</label>
                  <p className="text-[11px] text-slate-400 font-medium">Add up to 10 photos.</p>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {/* Existing Photos */}
                    {existingPhotos.map((img, i) => (
                      <div key={`existing-${i}`} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-100 bg-slate-50">
                        <Image src={img} alt="" fill className="object-cover" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(i)}
                          className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full hover:bg-black/80 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {/* New Previews */}
                    {previewUrls.map((img, i) => (
                      <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-100 bg-slate-50">
                        <Image src={img} alt="" fill className="object-cover" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => removeNewImage(i)}
                          className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full hover:bg-black/80 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {existingPhotos.length + previewUrls.length < 10 && (
                      <label
                        htmlFor="photo-upload"
                        className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 hover:bg-slate-50 hover:border-indigo-400 transition-all cursor-pointer text-slate-400 hover:text-indigo-600 group"
                      >
                        <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Add</span>
                        <input id="photo-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />
                      </label>
                    )}
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 font-sans">Title</label>
                    <input
                      required
                      name="title"
                      value={form.title}
                      onChange={handleAddField}
                      placeholder="Title"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium transition-shadow hover:shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-slate-700">Sale Price</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          name="price"
                          value={form.price}
                          disabled={form.type === 'FREE'}
                          onChange={(e) => {
                            if (parseFloat(e.target.value) < 0) return;
                            handleAddField(e);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium disabled:opacity-50"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-slate-700 truncate">Original Price</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          name="originalPrice"
                          value={form.originalPrice}
                          disabled={form.type === 'FREE'}
                          onChange={(e) => {
                            if (parseFloat(e.target.value) < 0) return;
                            handleAddField(e);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700">Category</label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleAddField}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none cursor-pointer"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700">School / Suburb</label>
                    <input
                      name="school"
                      value={form.school}
                      onChange={handleAddField}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium transition-shadow hover:shadow-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700">Listing Type</label>
                    <div className="flex gap-2">
                       {TYPES.map(t => (
                         <button
                           key={t}
                           type="button"
                           onClick={() => setForm({...form, type: t})}
                           className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                             form.type === t 
                               ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10' 
                               : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-400 hover:text-indigo-600'
                           }`}
                         >
                           {t}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700">Description</label>
                    <textarea
                      required
                      name="description"
                      value={form.description}
                      onChange={handleAddField}
                      rows={4}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium resize-none"
                    />
                  </div>
               </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-4">
               <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                    <>
                      <Package className="w-5 h-5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
            </div>
          </form>
        </aside>

        <section className="hidden md:flex flex-1 flex-col p-8 overflow-y-auto">
           <div className="max-w-[1000px] mx-auto w-full space-y-6">
              <div className="flex justify-between items-center">
                 <h2 className="text-xl font-bold text-slate-900">Desktop Preview</h2>
                 <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-400">
                    <LayoutGrid className="w-5 h-5" />
                 </div>
              </div>

              <div className="bg-white rounded-3xl p-10 shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[600px] flex items-center justify-center relative group">
                 <div className="w-[300px] transition-transform duration-500 hover:scale-105">
                    <PostCard id="preview" post={previewPost} />
                 </div>
              </div>
           </div>
        </section>
      </main>
    </div>
  );
}
