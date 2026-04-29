'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { PostCard } from '@/components/PostCard';
import { useFeed } from '@/hooks/useFeed';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  MapPin, 
  SlidersHorizontal, 
  LayoutGrid, 
  ChevronDown, 
  X,
  Loader2,
  Tag,
  ArrowUpDown
} from 'lucide-react';

const CATEGORIES = ['School', 'Sports Equipment', 'Secondhand'];
const TYPES = ['All', 'SALE', 'WTB', 'FREE'];
const CONDITIONS = ['All', 'New', 'Like New', 'Good', 'Fair'];

function UniformsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  const filters = useMemo(() => ({
    category: selectedCategory,
    type: selectedType,
    condition: selectedCondition,
    sortBy: sortBy === 'price-low' ? 'PriceLowToHigh' : sortBy === 'price-high' ? 'PriceHighToLow' : 'Newest'
  }), [selectedCategory, selectedType, selectedCondition, sortBy]);

  const { posts, loading, hasMore, fetchingMore, fetchPosts } = useFeed(filters, searchQuery);

  const filteredPosts = posts;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Modern Search Hub */}
      <div className="bg-white border-b border-slate-200 sticky top-14 z-30 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search school gear & uniforms..."
                className="w-full bg-slate-100 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              )}
            </div>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-5 py-3.5 bg-slate-100 rounded-2xl text-slate-700 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          <AnimatePresence>
            {isFilterOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-6 pb-2 border-t border-slate-100">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                            selectedCategory === cat ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Listing Type</label>
                    <div className="flex flex-wrap gap-2">
                      {TYPES.map(type => (
                        <button
                          key={type}
                          onClick={() => setSelectedType(type)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                            selectedType === type ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Sort By</label>
                    <div className="relative">
                       <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       <select 
                         value={sortBy}
                         onChange={(e) => setSortBy(e.target.value)}
                         className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                       >
                         <option value="newest">Newest First</option>
                         <option value="price-low">Price: Low to High</option>
                         <option value="price-high">Price: High to Low</option>
                       </select>
                       <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <main className="flex-1 max-w-[1240px] mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-baseline gap-3">
             <h2 className="text-3xl font-black text-slate-900 tracking-tight">Uniforms</h2>
             <p className="text-slate-400 font-bold text-sm">{filteredPosts.length} Results found</p>
          </div>
          <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
             <MapPin className="w-4 h-4" />
             <span className="text-xs font-black uppercase tracking-wider">Richmond · 40KM</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
             <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Searching Inventory...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-8">
            <AnimatePresence mode="popLayout">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <PostCard key={post.id} id={post.id} post={post} />
                ))
              ) : (
                <div className="col-span-full py-40 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                   <div className="max-w-xs mx-auto space-y-4">
                     <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto">
                        <Tag className="w-8 h-8 text-slate-200" />
                     </div>
                     <div>
                       <h3 className="text-xl font-bold text-slate-800 tracking-tight">No results matched</h3>
                       <p className="text-slate-400 text-sm italic mt-1 px-4">Maybe try different keywords or expand your search distance?</p>
                     </div>
                     <button 
                       onClick={() => {setSelectedCategory('All'); setSelectedType('All'); setSearchQuery('');}}
                       className="text-indigo-600 font-black text-xs uppercase tracking-widest bg-indigo-50 px-6 py-3 rounded-xl hover:bg-indigo-100 transition-all"
                     >
                       Reset All Filters
                     </button>
                   </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {!loading && hasMore && filteredPosts.length > 0 && (
           <div className="flex justify-center py-8">
             <button 
               onClick={() => fetchPosts(true)}
               disabled={fetchingMore}
               className="px-6 py-2.5 bg-white border border-slate-200 shadow-sm rounded-full font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center gap-2"
             >
               {fetchingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
               Load More
             </button>
           </div>
        )}
      </main>
    </div>
  );
}

export default function UniformsPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    }>
      <UniformsContent key={q} />
    </Suspense>
  );
}
