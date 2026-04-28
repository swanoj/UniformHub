'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Tag, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface PostCardProps {
  post: any;
  id: string;
}

export function PostCard({ post, id }: PostCardProps) {
  const [imgError, setImgError] = React.useState(false);
  const thumbnail = !imgError && post.photoUrls?.[0] ? post.photoUrls[0] : (post.photoUrls?.[0] || `https://picsum.photos/seed/${id}/600/600`);
  // Or better, just show a fallback placeholder.
  const fallbackSrc = `https://picsum.photos/seed/${id}/600/600`;

  const createdAt = post.createdAt?.toDate ? post.createdAt.toDate() : new Date();

  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true }).replace('about ', '');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="group cursor-pointer flex flex-col h-full bg-white transition-all duration-200"
    >
      <Link href={`/posts/${id}`} className="relative aspect-square block w-full bg-slate-100 mb-2 rounded-lg overflow-hidden">
        <Image
          src={imgError ? fallbackSrc : thumbnail}
          alt={post.title}
          fill
          className="object-cover"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)} sizes="(max-width: 768px) 100vw, 33vw"
        />
        {post.status !== 'ACTIVE' && (
           <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
             <span className="bg-slate-900/80 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-sm shadow-md">
               {post.status}
             </span>
           </div>
        )}
        
        {post.type === 'WTB' && (
          <div className="absolute top-2 left-2">
            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-rose-600 text-white uppercase tracking-widest shadow-sm">
              Wanted
            </span>
          </div>
        )}
        
        {post.originalPrice && Number(post.originalPrice) > Number(post.price) && (
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-black px-2 py-1 rounded-full bg-emerald-500 text-white uppercase tracking-wider shadow-sm flex items-center gap-1">
              -{Math.round((1 - (Number(post.price) / Number(post.originalPrice))) * 100)}%
            </span>
          </div>
        )}
        {post.quantity > 1 && (
           <div className="absolute bottom-2 right-2">
             <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-900/80 text-white uppercase tracking-widest shadow-sm">
               {post.quantity} Available
             </span>
           </div>
        )}
      </Link>

      <div className="flex flex-col px-0.5 pb-2">
        <div className="flex items-center gap-1.5">
          <span className={`font-semibold text-[16px] leading-tight ${post.originalPrice && Number(post.originalPrice) > Number(post.price) ? 'text-emerald-600' : 'text-[#050505]'}`}>
            {post.type === 'FREE' ? 'FREE' : post.price ? `$${post.price}` : 'Negotiable'}
          </span>
          {post.originalPrice && Number(post.originalPrice) > Number(post.price) && (
            <span className="text-[12px] font-medium text-slate-500 line-through">
               ${post.originalPrice}
            </span>
          )}
        </div>
        <h3 className="text-[14px] text-[#65676B] font-normal line-clamp-1 leading-tight group-hover:underline">
          {post.title}
        </h3>
        <p className="text-[12px] text-[#65676B] font-normal flex items-center flex-wrap gap-1 mt-0.5">
          {post.suburb || 'Melbourne, VIC'}
          <span className="text-[10px]">&bull;</span>
          <span>{timeAgo}</span>
        </p>

        {post.verifiedCondition && (
          <div className="mt-1 flex items-center gap-1 text-indigo-600 text-[10px] font-bold uppercase tracking-tight">
             <ShieldCheck className="w-3 h-3" />
             <span>AI Checked</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
