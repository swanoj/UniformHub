'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, limit, getDocs, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUser } from '@/components/FirebaseProvider';
import { Navbar } from '@/components/Navbar';
import Image from 'next/image';
import { motion } from 'motion/react';
import { MessageCircle, MapPin, Flag, ShieldAlert, ChevronLeft, ChevronRight, ZoomIn, X, Calendar, User, Tag, ShoppingBag, Send, Share2, MoreHorizontal, Info, Loader2, Sparkles, ShieldCheck, Zap, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function PostDetailPage() {
  const { postId } = useParams();
  const router = useRouter();
  const { user, profile } = useUser();
  const [post, setPost] = useState<any>(null);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [optimisticFavorited, setOptimisticFavorited] = useState<boolean | null>(null);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [purchaseQty, setPurchaseQty] = useState(1);
  const images: string[] =
    Array.isArray(post?.photoUrls) && post.photoUrls.length > 0
      ? post.photoUrls
      : ['/icon.png'];
  const isExpired = (() => {
    if (!post?.expiresAt) return false;
    const expiresAt =
      typeof post.expiresAt?.toDate === 'function'
        ? post.expiresAt.toDate()
        : new Date(post.expiresAt);
    return !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < new Date().getTime();
  })();

  const isFavorited = optimisticFavorited !== null 
    ? optimisticFavorited 
    : (profile && Array.isArray(profile.savedPosts) && typeof postId === 'string' && profile.savedPosts.includes(postId)) || false;

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    async function fetchPost() {
      const docRef = doc(db, 'posts', postId as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const postData = docSnap.data();
        setPost({ id: docSnap.id, ...postData });
        
        if (postData.ownerId) {
          const sellerRef = doc(db, 'users', postData.ownerId);
          const sellerSnap = await getDoc(sellerRef);
          if (sellerSnap.exists()) {
            setSellerProfile(sellerSnap.data());
          }
        }
      } else {
        router.push('/');
      }
      setLoading(false);
    }
    fetchPost();
  }, [postId, router]);

  const handleToggleFavorite = async () => {
    if (!user || !profile || isFavoriting) return;
    setIsFavoriting(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const currentSaved = Array.isArray(profile.savedPosts) ? profile.savedPosts : [];
      let newSavedPosts;
      
      if (isFavorited) {
        newSavedPosts = currentSaved.filter((id: string) => id !== postId);
        setOptimisticFavorited(false);
      } else {
        newSavedPosts = [...currentSaved, postId];
        setOptimisticFavorited(true);
        
        if (post.ownerId !== user.uid) {
          try {
            await addDoc(collection(db, `users/${post.ownerId}/notifications`), {
              userId: post.ownerId,
              type: 'LIKE',
              actorId: user.uid,
              actorName: profile.displayName || 'Someone',
              actorPhotoUrl: profile.photoUrl || '',
              referenceId: post.id,
              message: `favorited your listing: ${post.title}`,
              read: false,
              createdAt: serverTimestamp()
            });

            const ownerDoc = await getDoc(doc(db, 'users', post.ownerId));
            if (ownerDoc.exists()) {
              const tokens = ownerDoc.data().fcmTokens;
              if (tokens && tokens.length > 0) {
                fetch('/api/notifications/send', {
                  method: 'POST',
                  body: JSON.stringify({
                    tokens,
                    title: `${profile.displayName || 'Someone'} favorited your listing`,
                    body: post.title,
                    data: { postId: post.id, type: 'LIKE' }
                  })
                }).catch(e => console.error('Notification failed', e));
              }
            }
          } catch (notifErr) {
            console.error("Failed to send notification", notifErr);
          }
        }
      }
      
      await updateDoc(userRef, { savedPosts: newSavedPosts });
    } catch (error) {
      console.error("Error toggling favorite", error);
      setOptimisticFavorited(!isFavorited); // Revert on failure
    } finally {
      setIsFavoriting(false);
    }
  };

  const handleMessageSeller = async () => {
    if (!user || !post) return;
    setCreatingChat(true);

    try {
      const threadKey = `${post.id}_${user.uid}_${post.ownerId}`;
      const threadsRef = collection(db, 'threads');
      const q = query(threadsRef, where('participantIds', 'array-contains', user.uid), where('threadKey', '==', threadKey), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        router.push(`/chat/${querySnapshot.docs[0].id}`);
      } else {
        const newThread = {
          postId: post.id,
          postTitle: post.title,
          sellerId: post.ownerId,
          sellerName: post.ownerName,
          buyerId: user.uid,
          buyerName: profile?.displayName || 'Buyer',
          participantIds: [user.uid, post.ownerId],
          threadKey,
          lastMessageText: '',
          lastMessageAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, 'threads'), newThread);

        // Notify seller of new conversation
        try {
          await addDoc(collection(db, `users/${post.ownerId}/notifications`), {
            userId: post.ownerId,
            type: 'MESSAGE',
            actorId: user.uid,
            actorName: profile?.displayName || 'Someone',
            actorPhotoUrl: profile?.photoUrl || '',
            referenceId: docRef.id,
            message: `wants to buy: ${post.title}`,
            read: false,
            createdAt: serverTimestamp(),
          });
          const ownerDoc = await getDoc(doc(db, 'users', post.ownerId));
          if (ownerDoc.exists()) {
            const tokens = ownerDoc.data().fcmTokens;
            if (tokens?.length > 0) {
              fetch('/api/notifications/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tokens,
                  title: `${profile?.displayName || 'Someone'} is interested in your listing`,
                  body: post.title,
                  data: { threadId: docRef.id, type: 'MESSAGE' },
                }),
              }).catch(() => {});
            }
          }
        } catch (notifErr) {
          console.error('Failed to send new-thread notification', notifErr);
        }

        router.push(`/chat/${docRef.id}`);
      }
    } catch (error) {
      console.error("Error starting chat", error);
    } finally {
      setCreatingChat(false);
    }
  };

  const handleReport = async () => {
    if (!user || !post) return;
    
    const reason = window.prompt('Please enter the reason for reporting this listing:', 'Inappropriate content/Spam');
    if (!reason || reason.trim() === '') return;

    try {
      const reportData = {
        reporterId: user.uid,
        reporterEmail: user.email || 'anonymous',
        reporterName: profile?.displayName || user.displayName || 'Anonymous',
        postId: post.id,
        postTitle: post.title,
        postOwnerId: post.ownerId,
        postOwnerName: post.ownerName,
        postOwnerEmail: post.ownerEmail || 'No email',
        reason: reason,
        status: 'open',
        reportedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'reports'), reportData);

      await addDoc(collection(db, 'mail'), {
        to: ['sascha.crawford@hotmail.com'],
        message: {
          subject: `[UniformHub Report] ${post.title}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #e11d48;">New listing report</h2>
              <p><strong>Listing:</strong> ${post.title}</p>
              <p><strong>Seller:</strong> ${post.ownerName} (${post.ownerEmail || 'No email'})</p>
              <hr />
              <p><strong>Reported by:</strong> ${profile?.displayName || user.displayName || 'Anonymous'} (${user.email || 'No email'})</p>
              <p><strong>Reason:</strong> ${reason}</p>
              <p><strong>Reported at:</strong> ${new Date().toLocaleString()}</p>
              <br />
              <a href="https://uniformhub-prod.web.app/admin?tab=reports" style="display: inline-block; padding: 10px 20px; background-color: #0f172a; color: white; border-radius: 5px; text-decoration: none; font-weight: bold;">Open Admin Reports Tab</a>
            </div>
          `
        }
      });

      alert('Report submitted. Our team will review it.');
    } catch (error) {
      console.error("Error reporting post", error);
      alert('Failed to submit report. Please try again later.');
    }
  };

  const handleBlockUser = async () => {
    if (!user || !post) return;
    if (true) {
      try {
        await addDoc(collection(db, 'blocks'), {
          blockerId: user.uid,
          blockedId: post.ownerId,
          createdAt: serverTimestamp(),
        });
        alert('User blocked. Refresh to see changes.');
        router.push('/');
      } catch (error) {
        console.error("Error blocking user", error);
      }
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full shadow-lg shadow-indigo-500/20" />
    </div>
  );
  if (!post) return null;

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col h-screen overflow-hidden">
      <Navbar />

      <main className="flex-1 flex flex-col md:flex-row h-full overflow-hidden w-full">
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden group">
           <div className="absolute top-4 left-4 z-20 flex gap-2">
             <button onClick={() => router.back()} className="w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors">
               <ChevronLeft className="w-6 h-6" />
             </button>
           </div>

           <div className="absolute top-4 right-4 z-20">
             <button onClick={() => setIsFullscreen(true)} className="w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors" title="Zoom In">
               <ZoomIn className="w-5 h-5" />
             </button>
           </div>

           {images.length > 1 && (
             <>
               <button 
                 onClick={prevImage}
                 className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
               >
                 <ChevronLeft className="w-6 h-6 mr-1" />
               </button>
               <button 
                 onClick={nextImage}
                 className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
               >
                 <ChevronRight className="w-6 h-6 ml-1" />
               </button>
             </>
           )}

           <motion.div 
             layoutId={`post-image-${postId}`}
             className="relative w-full h-[60vh] md:h-full cursor-zoom-in"
             onClick={() => setIsFullscreen(true)}
           >
              <Image 
                src={images[activeImageIndex]} 
                alt={post.title} 
                fill 
                className="object-contain"
                referrerPolicy="no-referrer"
              sizes="(max-width: 768px) 100vw, 33vw" />
           </motion.div>

           {images.length > 1 && (
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/20 backdrop-blur-md rounded-xl overflow-x-auto max-w-[90%] pointer-events-auto">
               {images.map((url: string, i: number) => (
                 <button 
                   key={i} 
                   onClick={() => setActiveImageIndex(i)}
                   className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 transition-all ${activeImageIndex === i ? 'ring-2 ring-white scale-110 z-10' : 'opacity-60 hover:opacity-100'}`}
                 >
                   <Image src={url} alt={`Preview ${i}`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" referrerPolicy="no-referrer" />
                 </button>
               ))}
             </div>
           )}
        </div>

        <div className="w-full md:w-90 bg-white border-l border-slate-200 overflow-y-auto flex flex-col shrink-0">
           <div className="p-4 border-b border-slate-100 sticky top-0 bg-white z-10 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900 line-clamp-1">Listing Details</h2>
              <div className="flex gap-1">
                {user && (
                  <button 
                    onClick={handleToggleFavorite}
                    disabled={isFavoriting}
                    className="w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <Heart className={`w-5 h-5 ${isFavorited ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} />
                  </button>
                )}
                <button className="w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
           </div>

           <div className="p-4 space-y-6">
              <div className="space-y-4">
                 <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                   {post.title}
                 </h1>
                 
                 <div>
                   <p className={`text-[28px] font-black leading-none flex items-center gap-2 ${post.originalPrice && Number(post.originalPrice) > Number(post.price) ? 'text-emerald-600' : 'text-slate-900'}`}>
                     {post.type === 'FREE' ? 'FREE' : post.price ? `$${post.price}` : 'Negotiable'}
                     
                     {post.originalPrice && Number(post.originalPrice) > Number(post.price) && (
                       <span className="text-xl font-bold text-slate-400 line-through">
                         ${post.originalPrice}
                       </span>
                     )}
                   </p>
                   
                   {post.originalPrice && Number(post.originalPrice) > Number(post.price) && (
                     <div className="mt-1">
                       <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-widest">
                         Save ${Number(post.originalPrice) - Number(post.price)} 
                         &nbsp;({Math.round((1 - (Number(post.price) / Number(post.originalPrice))) * 100)}% off)
                       </span>
                     </div>
                   )}
                 </div>

                 <div className="flex items-center gap-2 mt-2">
                   <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                     {post.type}
                   </span>
                   <p className="text-sm text-slate-500 font-medium">
                     Posted {formatDistanceToNow(post.createdAt?.toDate ? post.createdAt.toDate() : new Date(), { addSuffix: true })}
                   </p>
                 </div>

                 <div className="grid grid-cols-2 gap-y-4 gap-x-8 pt-4 border-t border-slate-100">
                    <div>
                       <p className="text-[11px] font-bold text-slate-400 tracking-wide uppercase mb-0.5">Size</p>
                       <p className="text-sm font-semibold text-slate-900">{post.size ? post.size + (post.sizeCategory ? ' (' + post.sizeCategory + ')' : '') : 'N/A'}</p>
                    </div>
                    <div>
                       <p className="text-[11px] font-bold text-slate-400 tracking-wide uppercase mb-0.5">Condition</p>
                       <div className="flex items-center gap-1.5">
                         <div className={'w-2 h-2 rounded-full ' + (post.condition?.includes('New') ? 'bg-emerald-500' : post.condition?.includes('Excellent') ? 'bg-teal-500' : 'bg-slate-400')}></div>
                         <p className="text-sm font-semibold text-slate-900">{post.condition || 'N/A'}</p>
                       </div>
                    </div>
                    <div>
                       <p className="text-[11px] font-bold text-slate-400 tracking-wide uppercase mb-0.5">Location</p>
                       <p className="text-sm font-semibold text-slate-900">{post.school || post.suburb || 'N/A'}</p>
                    </div>
                    <div>
                       <p className="text-[11px] font-bold text-slate-400 tracking-wide uppercase mb-0.5">Category</p>
                       <p className="text-sm font-semibold text-slate-900">{post.category || 'N/A'}</p>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col gap-2">
                {post.verifiedCondition && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <Sparkles className="w-4 h-4 text-indigo-600 fill-indigo-600 shadow-sm" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest leading-none">AI Quality Audit</p>
                      <p className="text-xs font-bold text-indigo-900">{post.verifiedCondition}</p>
                    </div>
                  </div>
                )}

                {profile?.school && post.school === profile.school && (
                   <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shadow-sm" />
                      <div>
                        <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest leading-none">Trust Connection</p>
                        <p className="text-xs font-bold text-emerald-900">Same School Community</p>
                      </div>
                   </div>
                 )}
              </div>

              <div className="flex flex-col gap-3">
                {user?.uid !== post.ownerId && post.status !== 'SOLD' && !isExpired ? (
                   <>
                     {post.type === 'WTB' ? (
                       <button
                         onClick={() => router.push(`/create?sourcePostId=${post.id}&title=${encodeURIComponent(post.title)}&school=${encodeURIComponent(post.school || '')}`)}
                         className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-[15px] flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                       >
                         <Zap className="w-5 h-5 fill-white" />
                         I Have This!
                       </button>
                     ) : (
                       <button
                         onClick={handleMessageSeller}
                         disabled={creatingChat}
                         className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-[15px] flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                       >
                         {creatingChat ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />}
                         Message Seller
                       </button>
                     )}
                     <p className="text-xs text-slate-600 font-medium">
                       Keep all communication within the app. Sharing personal contact details may breach our T&amp;Cs.
                     </p>
                   </>
                ) : user?.uid === post.ownerId ? (
                  <div className="flex gap-2">
                    <button onClick={() => router.push(`/posts/edit/${post.id}`)} className="flex-1 bg-slate-100 text-slate-800 py-3 rounded-lg font-black text-[15px] hover:bg-slate-200 transition-colors border border-slate-200">
                      Edit Listing
                    </button>
                    <button onClick={() => router.push('/profile')} className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-black text-[15px] hover:bg-slate-800 transition-colors">
                      Manage Listing
                    </button>
                  </div>
                ) : null}
                
                <p className="text-xs text-center text-slate-500 font-medium mt-2">All transactions are arranged directly between buyer and seller.</p>


                {post.status === 'SOLD' && (
                   <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 text-center">
                      <Tag className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                      <h4 className="text-lg font-black text-slate-900 uppercase">Item Sold</h4>
                      <p className="text-xs text-slate-500 font-medium mt-1 italic">This listing is no longer public</p>
                   </div>
                )}

                {isExpired && post.status !== 'SOLD' && (
                   <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 text-center">
                      <Calendar className="w-8 h-8 text-rose-400 mx-auto mb-3" />
                      <h4 className="text-lg font-black text-rose-900 uppercase">Listing Expired</h4>
                      <p className="text-xs text-rose-500 font-medium mt-1 italic">Ads on UniformHub expire after 8 weeks</p>
                   </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button className="bg-slate-50 text-slate-900 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-100 transition-all border border-slate-100">Save</button>
                  <button className="bg-slate-50 text-slate-900 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-100 transition-all border border-slate-100">Share</button>
                </div>
              </div>

              <div className="h-[1px] bg-slate-100"></div>

              <div className="space-y-3">
                 <h3 className="text-lg font-bold text-slate-900">Additional Comments</h3>
                 <p className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                   {post.description}
                 </p>
                 <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                    <span className="bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 uppercase tracking-tighter">Size: {post.sizeCategory ? `${post.sizeCategory} - ${post.size || 'N/A'}` : (post.size || 'N/A')}</span>
                    <span className="bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 uppercase tracking-tighter">Condition: {post.condition}</span>
                    <span className="bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 uppercase tracking-tighter">Category: {post.category}</span>
                 </div>
              </div>

              <div className="h-[1px] bg-slate-100"></div>

              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900">Seller Information</h3>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-200">
                       {sellerProfile?.photoUrl || post.ownerPhotoUrl ? (
                         <Image src={sellerProfile?.photoUrl || post.ownerPhotoUrl} alt={post.ownerName} width={56} height={56} className="object-cover" referrerPolicy="no-referrer" />
                       ) : (
                         <User className="w-7 h-7 text-slate-400" />
                       )}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900 leading-tight">{sellerProfile?.displayName || post.ownerName}</p>
                      <p className="text-sm text-slate-500 font-medium">
                        Joined in {sellerProfile?.createdAt?.toDate ? sellerProfile.createdAt.toDate().getFullYear() : '2024'}
                      </p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-tight">Verified Student Community Member</span>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900">Location</h3>
                    <button className="text-slate-500 text-sm font-medium">{post.suburb || 'Richmond, VIC'}</button>
                 </div>
                 <div className="relative aspect-[16/6] rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden group">
                    <div className="absolute inset-0 bg-indigo-50/50 flex items-center justify-center">
                       <div className="relative">
                          <MapPin className="w-8 h-8 text-indigo-600 drop-shadow-lg" />
                          <div className="absolute -inset-1 bg-indigo-600/30 rounded-full animate-ping"></div>
                       </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent"></div>
                 </div>
              </div>

               <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 space-y-3">
                 <div className="flex items-center gap-2 text-rose-700">
                   <ShieldAlert className="w-5 h-5" />
                   <p className="font-black text-xs uppercase tracking-widest">Safety Warning</p>
                 </div>
                 <p className="text-rose-800 text-xs font-bold leading-relaxed">
                   Meet in well-lit public places and inspect quality before payment.
                 </p>
                 <p className="text-rose-600 text-[10px] font-medium leading-relaxed">
                   Do not provide home addresses. Verify the item in person before completing the exchange.
                 </p>
                 <div className="flex gap-4 pt-1 border-t border-rose-200/50">
                    <button onClick={handleReport} className="text-rose-600 text-[10px] font-black uppercase tracking-widest hover:underline">Report Listing</button>
                    <button onClick={handleBlockUser} className="text-rose-600 text-[10px] font-black uppercase tracking-widest hover:underline">Block Seller</button>
                 </div>
              </div>
           </div>
        </div>
      </main>

      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center">
          <div className="absolute top-6 right-6 z-50">
            <button 
              onClick={() => setIsFullscreen(false)}
              className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {images.length > 1 && (
             <>
               <button 
                 onClick={prevImage}
                 className="absolute left-6 top-1/2 -translate-y-1/2 z-50 w-14 h-14 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-lg transition-colors"
               >
                 <ChevronLeft className="w-8 h-8 mr-1" />
               </button>
               <button 
                 onClick={nextImage}
                 className="absolute right-6 top-1/2 -translate-y-1/2 z-50 w-14 h-14 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-lg transition-colors"
               >
                 <ChevronRight className="w-8 h-8 ml-1" />
               </button>
             </>
           )}

          <motion.div 
            layoutId={`post-image-${postId}`}
            className="relative w-full h-[90vh] max-w-7xl cursor-zoom-out"
            onClick={() => setIsFullscreen(false)}
          >
            <Image
              src={images[activeImageIndex]}
              alt={post.title}
              fill
              className="object-contain"
              referrerPolicy="no-referrer"
            sizes="(max-width: 768px) 100vw, 33vw" />
          </motion.div>
          
          {images.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 px-4 py-3 bg-black/40 backdrop-blur-xl rounded-2xl z-50">
              {images.map((_: any, i: number) => (
                <button 
                  key={i} 
                  onClick={() => setActiveImageIndex(i)}
                  className={`w-3 h-3 rounded-full transition-all ${activeImageIndex === i ? 'bg-white scale-125 ring-2 ring-white/50' : 'bg-white/40 hover:bg-white/80'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
