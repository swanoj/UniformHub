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
import { Camera, Loader2, X, ChevronLeft, LayoutGrid, Package, Plus } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import Image from 'next/image';
import { CONDITION_OPTIONS } from '@/lib/constants';
import { useRequireAuth } from '@/hooks/useRequireAuth';

const CATEGORIES = ['School Uniforms & Sports Equipment'];
const ITEM_NAMES = ["Basketball shorts","Basketball singlet","Bathers","Belt","Bib","Blazer","Blouse","Books","Calculator","Camp / Venture / Outdoor Ed items","Fleece","Football (AFL) guernsey","Football (AFL) shorts","Football boots","Hockey shirt","Hockey shorts","Hockey skirt","House polo","Indoor court shoes","Jumper","Library bag","Netball dress","Other","Pencil case","Pinafore","Rain jacket","Rash vest","School bag","School shoes","Scarf","Shorts - Summer","Shorts - Winter","Soccer boots","Soccer jersey/shirt","Soccer shorts","Sport hat","Sport jacket","Sport polo","Sport shorts","Sport skort","Sport track pants","Sport visor","Sports bag","Straw hat","Summer dress","Swim cap","Tie","Trousers","Umbrella","Winter skirt"];
const SIZES = ["4","6","8","10","12","14","16","18","20","22","24","26","28","30","32","34","36","38","40","XXS","XS","S","M","L"];
const TYPES = ['SALE', 'WTB', 'FREE'];

export default function EditPostPage() {
  const router = useRouter();
  const { postId } = useParams();
  const { user, profile } = useUser();
  const { isCheckingAuth } = useRequireAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [postRef, setPostRef] = useState<any>(null);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'School Uniforms & Sports Equipment',
    type: 'SALE',
    size: '',
    sizeCategory: 'Child',
    condition: 'Good',
    price: '',
    originalPrice: '',
    school: '',
    suburb: '',
    postcode: '',
  });

  useEffect(() => {
    async function fetchPost() {
      if (!postId) return;
      try {
        const dRef = doc(db, 'posts', postId as string);
        const docSnap = await getDoc(dRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (
            data.ownerId !== user?.uid &&
            user?.email !== 'oliverjs090@gmail.com' &&
            user?.email !== 'sascha.crawford@hotmail.com'
          ) {
             alert('You are not authorized to edit this post.');
             router.push('/');
             return;
          }
          setPostRef(dRef);
          setForm({
            title: data.title || '',
            description: data.description || '',
            category: data.category || 'School Uniforms & Sports Equipment',
            type: data.type || 'SALE',
            size: data.size || '',
            sizeCategory: data.sizeCategory || 'Child',
            condition: data.condition || 'Good',
            price: data.price ? String(data.price) : '',
            originalPrice: data.originalPrice ? String(data.originalPrice) : '',
            school: data.school || '',
            suburb: data.suburb || '',
            postcode: data.postcode || '',
          });
          setQuantity(data.quantity || 1);
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
      alert("You can only have up to 4 photos.");
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
      if (dropFiles.length + imageFiles.length + existingPhotos.length > 4) {
        alert('You can only upload up to 4 photos.');
        return;
      }
      
      setImageFiles(prev => [...prev, ...dropFiles]);
      const newPreviews = dropFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviews]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !postRef) return;
    if (imageFiles.length === 0 && existingPhotos.length === 0) {
      alert("Please have at least one photo.");
      return;
    }
    if (
      /[\w.-]+@[\w.-]+\.\w+/.test(form.title) ||
      /\+?\d{8,15}/.test(form.title) ||
      /[\w.-]+@[\w.-]+\.\w+/.test(form.description) ||
      /\+?\d{8,15}/.test(form.description)
    ) {
      alert("Please do not include personal contact details (email or phone numbers) in the description.");
      return;
    }

    if (form.postcode && !/^\d{4}$/.test(form.postcode.trim())) {
      alert('Postcode must be 4 digits.');
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
        size: form.size,
        sizeCategory: (form as any).sizeCategory,
        quantity: quantity,
        condition: form.condition,
        school: form.school || profile?.school || '',
        suburb: form.suburb || profile?.suburb || '',
        postcode: form.postcode.trim(),
        price: form.type === 'FREE' ? '' : form.price,
        originalPrice: form.type === 'FREE' ? '' : form.originalPrice,
        photoUrls: finalPhotoUrls, 
        searchTerms: `${form.title} ${form.description} ${form.school} ${form.suburb} ${form.postcode} ${form.category}`.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 2),
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
    suburb: form.suburb || profile?.suburb || 'Local',
    postcode: form.postcode,
    createdAt: { toDate: () => new Date() },
    status: 'ACTIVE'
  };

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-[#F0F2F5]" />;
  }

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
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-slate-700">Photos · {existingPhotos.length + imageFiles.length} / 4</label>
                  </div>
                  
                  {existingPhotos.length === 0 && previewUrls.length === 0 ? (
                    <label
                      htmlFor="photo-upload-main"
                      className="w-full h-40 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-3 hover:bg-slate-100 hover:border-indigo-400 transition-all cursor-pointer group shadow-sm"
                    >
                      <div className="w-12 h-12 bg-white rounded-full shadow-sm border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                         <span className="block text-sm font-bold text-slate-700">Click to upload photos</span>
                         <span className="block text-[11px] text-slate-500 font-medium mt-1">Add up to 4 photos of your item</span>
                      </div>
                      <input id="photo-upload-main" type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />
                    </label>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        {/* Existing Photos */}
                        {existingPhotos.map((img, i) => (
                          <div key={`existing-${i}`} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-200 bg-slate-50 shadow-sm">
                            <Image src={img} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" referrerPolicy="no-referrer" />
                            <button
                              type="button"
                              onClick={() => removeExistingImage(i)}
                              className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-red-500/90 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {/* New Previews */}
                        {previewUrls.map((img, i) => (
                          <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-200 bg-slate-50 shadow-sm">
                            <Image src={img} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" referrerPolicy="no-referrer" />
                            <button
                              type="button"
                              onClick={() => removeNewImage(i)}
                              className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-red-500/90 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {existingPhotos.length + previewUrls.length < 4 && (
                          <label
                            htmlFor="photo-upload-secondary"
                            className={"aspect-square rounded-xl border-2 border-dashed " + (isDragging ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white") + " flex flex-col items-center justify-center gap-2 hover:bg-slate-50 hover:border-indigo-400 transition-all cursor-pointer text-slate-400 hover:text-indigo-600 group"}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                          >
                            <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Add More</span>
                            <input id="photo-upload-secondary" type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />
                          </label>
                        )}
                      </div>
                    </div>
                  )}
               </div>

               <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 font-sans">Item Name</label>
                    <select
                      required
                      name="title"
                      value={form.title}
                      onChange={handleAddField}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select Item Name</option>
                      {ITEM_NAMES.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-slate-700">Size</label>
                      <select name="size" value={form.size} onChange={handleAddField} className="w-full bg-slate-50 border border-slate-300 shadow-sm rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium">
                        <option value="" disabled>Select Size</option>
                        {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-slate-700">Category (Size)</label>
                      <select name="sizeCategory" value={(form as any).sizeCategory} onChange={handleAddField} className="w-full bg-slate-50 border border-slate-300 shadow-sm rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium">
                        <option value="Child">Child</option>
                        <option value="Adult">Adult</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-slate-700">Price</label>
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

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-slate-700">Suburb</label>
                      <input
                        name="suburb"
                        value={form.suburb}
                        onChange={handleAddField}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium transition-shadow hover:shadow-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-slate-700">Postcode</label>
                      <input
                        name="postcode"
                        value={form.postcode}
                        inputMode="numeric"
                        maxLength={4}
                        onChange={(e) => setForm((prev) => ({ ...prev, postcode: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                        placeholder="3121"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium transition-shadow hover:shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700">Item Condition</label>
                    <select
                      name="condition"
                      value={form.condition}
                      onChange={handleAddField}
                      className="w-full bg-slate-50 border border-slate-300 shadow-sm rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none cursor-pointer"
                    >
                      {CONDITION_OPTIONS.map((condition) => (
                        <option key={condition} value={condition}>{condition}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700">Additional Comments</label>
                    <textarea
                      required
                      name="description"
                      value={form.description}
                      onChange={handleAddField}
                      rows={4}
                      placeholder="e.g. missing button, texta mark"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium resize-none"
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] pl-1">
                      Quantity Available
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setQuantity(num)}
                          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                            quantity === num
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                              : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
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
