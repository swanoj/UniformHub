'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDoc, query, where, getCountFromServer } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '@/lib/firebase';
import { useUser } from '@/components/FirebaseProvider';
import { Navbar } from '@/components/Navbar';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Image as ImageIcon, Camera, Loader2, X, Plus, AlertCircle, ChevronLeft, LayoutGrid, Sparkles, Wand2, Package, Search } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import { addWeeks } from 'date-fns';
import { GoogleGenAI, Type } from "@google/genai";
import { useSchools } from '@/hooks/useSchools';

import Image from 'next/image';

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim() || '';
const aiFeaturesEnabled = Boolean(geminiApiKey);
const showAiDisabledNotice = !aiFeaturesEnabled && process.env.NODE_ENV !== 'production';

const CATEGORIES = ['School Uniforms & Sports Equipment'];
const SPORT_TYPE_OPTIONS = ['AFL', 'Basketball', 'Cricket', 'Floorball', 'Hockey', 'Netball', 'Other', 'Rugby', 'Soccer'];
const ITEM_NAMES = ["Basketball shorts","Basketball singlet","Bathers","Belt","Bib","Blazer","Blouse","Books","Calculator","Camp / Venture / Outdoor Ed items","Fleece","Football (AFL) guernsey","Football (AFL) shorts","Football boots","Hockey shirt","Hockey shorts","Hockey skirt","House polo","Indoor court shoes","Jumper","Library bag","Netball dress","Other","Pencil case","Pinafore","Rain jacket","Rash vest","School bag","School shoes","Scarf","Shorts - Summer","Shorts - Winter","Soccer boots","Soccer jersey/shirt","Soccer shorts","Sport hat","Sport jacket","Sport polo","Sport shorts","Sport skort","Sport track pants","Sport visor","Sports bag","Straw hat","Summer dress","Swim cap","Tie","Trousers","Umbrella","Winter skirt"];
const SIZES = ["4","6","8","10","12","14","16","18","20","22","24","26","28","30","32","34","36","38","40","XXS","XS","S","M","L"];
const TYPES = ['SALE', 'WTB', 'FREE'];

export default function CreatePostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useUser();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const { schools: AUSTRALIAN_SCHOOLS } = useSchools();
  const [form, setForm] = useState({
    title: searchParams.get('title') || '',
    description: '',
    category: 'School Uniforms & Sports Equipment',
    type: (searchParams.get('type') as any) || 'SALE',
    size: searchParams.get('size') || '',
    sizeCategory: 'Child',
    quantity: '1',
    condition: 'Good',
    price: '',
    originalPrice: '',
    school: searchParams.get('school') || '',
    suburb: profile?.suburb || '',
    sportType: '',
    clubName: '',
    sourcePostId: searchParams.get('sourcePostId') || '',
  });

  const handleAddField = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const filteredSchools = AUSTRALIAN_SCHOOLS
    .filter((s) =>
      s.toLowerCase().includes(form.school.toLowerCase()) &&
      s.toLowerCase() !== form.school.toLowerCase()
    )
    .slice(0, 5);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + imageFiles.length > 4) {
      alert("You can only upload up to 4 photos.");
      return;
    }
    setImageFiles(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
    e.target.value = ''; // Reset input to allow same file selection
  };

  const removeImage = (index: number) => {
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
      if (dropFiles.length + imageFiles.length > 4) {
        alert('You can only upload up to 4 photos.');
        return;
      }
      
      setImageFiles(prev => [...prev, ...dropFiles]);
      const newPreviews = dropFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviews]);
    }
  };

  const generateAIListing = async () => {
    if (imageFiles.length === 0) {
      alert("Please add at least one photo first so AI can identify your item.");
      return;
    }

    if (!aiFeaturesEnabled) {
      alert("AI auto-fill is unavailable because the Gemini API key is not configured.");
      return;
    }

    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            text: "Analyze this image of a school uniform or clothing item. Generate a professional listing title, a detailed description including key features, identify the school if possible (or suggest a generic school name if appropriate for the item like 'State High'), assess the condition (Poor, Fair, Good, Like New, New), and a fair market price in integer USD. Also provide a 'verifiedCondition' string (e.g., 'Excellent - Minimal Wear'). Respond in JSON format."
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              condition: { type: Type.STRING },
              verifiedCondition: { type: Type.STRING },
              school: { type: Type.STRING },
              suggestedPrice: { type: Type.NUMBER }
            },
            required: ["title", "description", "category", "condition", "verifiedCondition", "school", "suggestedPrice"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      setForm(prev => ({
        ...prev,
        title: result.title,
        description: result.description,
        category: CATEGORIES.includes(result.category) ? result.category : 'School Uniforms & Sports Equipment',
        condition: result.condition,
        school: result.school,
        price: result.suggestedPrice.toString(),
        verifiedCondition: result.verifiedCondition
      }));
    } catch (error) {
      console.error("AI Generation Error", error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleReset = () => {
    if (true) {
      setForm({
        category: 'School Uniforms & Sports Equipment',
        type: 'SALE',
        size: '',
        sizeCategory: 'Child',
        quantity: '1',
        condition: 'Good',
        price: '',
        originalPrice: '',
        title: '',
        description: '',
        school: '',
        suburb: profile?.suburb || '',
        sportType: '',
        clubName: '',
        sourcePostId: '',
      });
      
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      setImageFiles([]);
      setPreviewUrls([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    
    try {
      if (imageFiles.length === 0) {
        alert("Please add at least one photo.");
        setLoading(false);
        return;
      }

      if (
        /[\w.-]+@[\w.-]+\.\w+/.test(form.title) ||
        /\+?\d{8,15}/.test(form.title) ||
        /[\w.-]+@[\w.-]+\.\w+/.test(form.description) ||
        /\+?\d{8,15}/.test(form.description)
      ) {
        alert("Please do not include personal contact details (email or phone numbers) in the description.");
        setLoading(false);
        return;
      }

      let finalPhotoUrls: string[] = [];
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

      let newStatus = 'ACTIVE';
      const targetCommunityId = searchParams.get('communityId');
      
      if (targetCommunityId) {
        const memberRef = doc(db, `communities/${targetCommunityId}/members`, user.uid);
        const memberSnap = await getDoc(memberRef);
        if (memberSnap.exists()) {
           const role = memberSnap.data().role;
           if (role !== 'ADMIN' && role !== 'MODERATOR') {
              newStatus = 'PENDING_APPROVAL';
           }
        } else {
           newStatus = 'PENDING_APPROVAL';
        }
      }


        const postData = {
        ownerId: user.uid,
        ownerName: profile?.displayName || user.displayName || 'Seller',
        ownerPhotoUrl: profile?.photoUrl || user.photoURL || '',
        title: form.title,
        description: form.description,
        postType: 'LISTING',
        communityId: targetCommunityId || null,
        category: form.category,
        size: form.size,
        sizeCategory: (form as any).sizeCategory,
        quantity: quantity,
        type: form.type,
        condition: form.condition,
        verifiedCondition: (form as any).verifiedCondition || '',
        school: form.school || profile?.school || '',
        sportType: form.sportType || '',
        clubName: form.clubName || '',
        price: form.type === 'FREE' ? '' : form.price,
        originalPrice: form.type === 'FREE' ? '' : form.originalPrice,
        photoUrls: finalPhotoUrls, 
        status: newStatus,
        searchTerms: `${form.title} ${form.description} ${form.school} ${form.suburb} ${form.sportType} ${form.clubName} ${form.category}`.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 2),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),

        suburb: form.suburb || profile?.suburb || '',
        sourcePostId: form.sourcePostId || null,
        expiresAt: addWeeks(new Date(), 8),
      };

      await addDoc(collection(db, 'posts'), postData);
      
      if (targetCommunityId) {
        if (newStatus === 'PENDING_APPROVAL') {
           alert("Your post has been submitted and is pending approval from community moderators.");
        }
        router.push(`/communities/${targetCommunityId}`);
      } else {
        router.push(`/`);
      }
    } catch (error: any) {
      console.error("Error creating post", error);
      alert("Failed to publish: " + (error.message || "Unknown error occurred."));
    } finally {
      setLoading(false);
    }
  };

  const previewPost = {
    ...form,
    quantity: quantity,
    photoUrls: previewUrls,
    ownerName: profile?.displayName || 'You',
    suburb: form.suburb || profile?.suburb || 'Local',
    createdAt: { toDate: () => new Date() }
  };

  return (
    <div className="h-screen bg-[#F0F2F5] flex flex-col overflow-hidden">
      <Navbar />

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <aside className="w-full md:w-90 bg-white border-r border-slate-200 overflow-y-auto shadow-sm z-4">
          <div className="p-4 border-b border-slate-40 sticky top-0 bg-white z-4 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <button onClick={() => router.back()} className="p-2 hover:bg-slate-40 rounded-full transition-colors">
                 <ChevronLeft className="w-6 h-6 text-slate-500" />
               </button>
               <h1 className="text-xl font-black text-slate-900">Create New Listing</h1>
             </div>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-6">
            <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-slate-700">Photos · {imageFiles.length} / 4</label>
                    {imageFiles.length > 0 && (
                      <button
                        type="button"
                        onClick={generateAIListing}
                        disabled={aiLoading || !aiFeaturesEnabled}
                        title={!aiFeaturesEnabled ? 'Set NEXT_PUBLIC_GEMINI_API_KEY to enable AI auto-fill.' : undefined}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[4px] font-black uppercase tracking-wider hover:bg-indigo-40 transition-all disabled:opacity-50"
                      >
                        {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {aiLoading ? "Analyzing..." : "Auto-Fill with AI"}
                      </button>
                    )}
                  </div>
                  {showAiDisabledNotice && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      AI features disabled: set <code>NEXT_PUBLIC_GEMINI_API_KEY</code> in <code>.env</code> to enable.
                    </p>
                  )}
                  
                  {previewUrls.length === 0 ? (
                    <label
                      htmlFor="photo-upload-main"
                      className={"w-full h-40 rounded-2xl border-2 border-dashed " + (isDragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-slate-50") + " flex flex-col items-center justify-center gap-3 hover:bg-slate-50 hover:border-indigo-400 transition-all cursor-pointer group shadow-sm"}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="w-12 h-12 bg-white rounded-full shadow-sm border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:scale-14 transition-all">
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
                        {previewUrls.map((img, i) => (
                          <div key={i} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-200 bg-slate-50 shadow-sm">
                            <Image src={img} alt="" fill sizes="(max-width: 768px) 40vw, 33vw" className="object-cover" referrerPolicy="no-referrer" />
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-red-500/90 transition-all opacity-0 group-hover:opacity-40"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {previewUrls.length < 4 && (
                          <label
                            htmlFor="photo-upload-secondary"
                            className={"aspect-square rounded-xl border-2 border-dashed " + (isDragging ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white") + " flex flex-col items-center justify-center gap-2 hover:bg-slate-50 hover:border-indigo-400 transition-all cursor-pointer text-slate-400 hover:text-indigo-600 group"}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                          >
                            <Plus className="w-6 h-6 group-hover:scale-14 transition-transform" />
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

                  <div className="space-y-3">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] pl-1 flex items-center gap-2">
                        Quantity Available
                        <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[8px] text-slate-400">?</span>
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
                      <p className="text-[10px] text-slate-400 italic pl-1">Max 3 items of the same type per listing.</p>
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
                          placeholder="Price"
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
                          placeholder="Optional"
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
                      <option value="" disabled>Select Category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700">School / Suburb</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        name="school"
                        value={form.school}
                        onChange={handleAddField}
                        placeholder="e.g. Melbourne Grammar or Richmond"
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium transition-shadow hover:shadow-sm"
                      />
                      {form.school && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl mt-1 shadow-xl z-20 overflow-hidden">
                          {filteredSchools.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setForm((prev) => ({ ...prev, school: s }))}
                              className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 font-medium"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700">Suburb</label>
                    <input
                      name="suburb"
                      value={form.suburb}
                      onChange={handleAddField}
                      placeholder="e.g. Richmond"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium transition-shadow hover:shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-slate-700">Sport Type</label>
                      <select
                        name="sportType"
                        value={form.sportType}
                        onChange={handleAddField}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none cursor-pointer"
                      >
                        <option value="">Select sport type</option>
                        {SPORT_TYPE_OPTIONS.map((sport) => (
                          <option key={sport} value={sport}>
                            {sport}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-slate-700">Club Name</label>
                      <input
                        name="clubName"
                        value={form.clubName}
                        onChange={handleAddField}
                        placeholder={form.sportType ? `${form.sportType} club name` : 'Enter club name'}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
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
                      <option value="New - with tags">New - with tags</option>
                      <option value="New - without tags">New - without tags</option>
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Worn">Worn</option>
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
                               ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/4' 
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

            <div className="pt-4 border-t border-slate-40 space-y-4">
               <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                    <>
                      <Package className="w-5 h-5" />
                      <span>Publish Listing</span>
                    </>
                  )}
                </button>

            </div>
          </form>
        </aside>

        {/* Right Side: Desktop Preview - Identical to FB Preview */}
        <section className="hidden md:flex flex-1 flex-col p-8 overflow-y-auto">
           <div className="max-w-[400px] mx-auto w-full space-y-6">
              <div className="flex justify-between items-center">
                 <h2 className="text-xl font-bold text-slate-900">Desktop Preview</h2>
                 <div className="flex gap-2">
                   <div className="w-4 h-4 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-400">
                      <LayoutGrid className="w-5 h-5" />
                   </div>
                 </div>
              </div>

              <div className="bg-white rounded-3xl p-4 shadow-xl shadow-slate-200/50 border border-slate-40 min-h-[600px] flex items-center justify-center relative group">
                 <div className="w-[300px] transition-transform duration-500 hover:scale-45">
                    <PostCard id="preview" post={previewPost} />
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[4px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-2xl opacity-0 group-hover:opacity-40 transition-opacity">
                      Your listing preview
                    </div>
                 </div>
              </div>

              <div className="bg-indigo-50/50 border border-indigo-40 rounded-2xl p-6 flex gap-4">
                 <AlertCircle className="w-6 h-6 text-indigo-400 shrink-0" />
                 <div>
                    <h4 className="font-bold text-indigo-900 text-sm">Reviewing your listing</h4>
                    <p className="text-xs text-indigo-700/80 leading-relaxed mt-1">
                       Once you publish, your listing will be visible to everyone in the student community. You can mark it as sold or hide it anytime from your dashboard.
                    </p>
                 </div>
              </div>
           </div>
        </section>
      </main>
    </div>
  );
}
