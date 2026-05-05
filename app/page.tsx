'use client';

import React, { useState, useMemo } from 'react';
import { useUser } from '@/components/FirebaseProvider';
import { Navbar } from '@/components/Navbar';
import { PostCard } from '@/components/PostCard';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { useFeed } from '@/hooks/useFeed';
import { CONDITION_OPTIONS, SPORT_TYPES } from '@/lib/constants';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ListingGridSkeleton } from '@/components/Skeleton';
import { 
  Filter, 
  Search as SearchIcon, 
  Loader2, 
  LayoutGrid, 
  Bell, 
  Inbox, 
  User, 
  Home, 
  MapPin, 
  ChevronRight, 
  PlusCircle, 
  Tag, 
  ShoppingBag, 
  Settings,
  Store,
  Sparkles,
  ShieldCheck,
  Zap,
  Search,
  MessageCircle,
  Plus,
  Database
} from 'lucide-react';
import { getDistanceBetweenSuburbs } from '@/lib/suburbs';

const CATEGORIES = ['School Uniforms & Sports Equipment'];
const TYPES = ['All', 'SALE', 'WTB', 'FREE'];
const CONDITIONS = ['All', ...CONDITION_OPTIONS];

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
};

function SchoolHubSection({ userSchool, posts }: { userSchool: string, posts: any[] }) {
  const schoolPosts = posts.filter(p => p.school?.toLowerCase().includes(userSchool.toLowerCase())).slice(0, 4);
  if (!userSchool || schoolPosts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-[17px] leading-tight">{userSchool} Hub</h2>
            <p className="text-xs text-slate-500 font-medium">Items from your school community</p>
          </div>
        </div>
        <Link href={`/uniforms?q=${encodeURIComponent(userSchool)}`} className="text-[#1877F2] text-sm font-semibold hover:underline">See All</Link>
      </div>
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {schoolPosts.map(post => (
          <PostCard key={post.id} post={post} id={post.id} />
        ))}
      </div>
    </div>
  );
}

function WantedBoardSection({ posts }: { posts: any[] }) {
  const wantedPosts = posts.filter(p => p.type === 'WTB' && p.status === 'ACTIVE').slice(0, 3);
  if (wantedPosts.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">Community requests</h2>
        <Link href="/create?type=WTB" className="text-[#1877F2] text-sm font-semibold hover:underline">View all</Link>
      </div>
      <div className="space-y-3">
        {wantedPosts.map(post => (
          <div key={post.id} className="bg-white rounded-xl shadow-sm p-4 space-y-3 border border-slate-100 hover:border-slate-200 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm text-slate-400">
                   <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-[15px] leading-tight">{post.ownerName || 'Anonymous User'}</p>
                  <p className="text-[12px] text-slate-500 font-medium mt-0.5">
                    {formatDistanceToNow(post.createdAt?.toDate ? post.createdAt.toDate() : new Date())} ago • {post.suburb || 'Melbourne'}
                  </p>
                </div>
              </div>
              <div className="bg-rose-50 text-rose-600 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider">
                Wanted
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-[16px] leading-snug">{post.title}</h3>
              <p className="text-[15px] text-slate-700 font-normal line-clamp-2 leading-relaxed">{post.description}</p>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <Link 
                href={`/create?title=${encodeURIComponent(post.title)}&type=WTS&school=${encodeURIComponent(post.school || '')}&sourcePostId=${post.id}`}
                className="flex-1 bg-[#E7F3FF] text-[#1877F2] py-2 rounded-lg font-bold text-sm hover:bg-[#DBEAFE] transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                I have this!
              </Link>
              <Link 
                href={`/posts/${post.id}`}
                className="px-4 bg-slate-100 text-slate-700 py-2 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors"
              >
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const { user, profile } = useUser();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [selectedSize, setSelectedSize] = useState('All');
  const [locationQuery, setLocationQuery] = useState(profile?.suburb || '');
  const [selectedLocation, setSelectedLocation] = useState(profile?.suburb || '');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationPanelOpen, setLocationPanelOpen] = useState(false);
  const [selectedDistance, setSelectedDistance] = useState('40');
  const [anyDistance, setAnyDistance] = useState(false);
  const [selectedSportType, setSelectedSportType] = useState('All');
  const [selectedSortBy, setSelectedSortBy] = useState('Newest');
  const [searchQuery, setSearchQuery] = useState('');

  const filters = useMemo(() => ({
    category: selectedCategory,
    type: selectedType,
    condition: selectedCondition,
    size: selectedSize,
    school: 'All',
    sportType: selectedSportType,
    sortBy: selectedSortBy === 'Closest' ? 'Newest' : selectedSortBy
  }), [selectedCategory, selectedType, selectedCondition, selectedSize, selectedSportType, selectedSortBy]);

  const effectiveSearchQuery = useMemo(
    () => `${searchQuery} ${selectedLocation}`.trim(),
    [searchQuery, selectedLocation]
  );

  const { posts, loading, hasMore, fetchingMore, fetchPosts, error } = useFeed(filters, effectiveSearchQuery);
  const locationOptions = useMemo(() => {
    const fromPosts = posts.flatMap((post) => [post.school, post.suburb]).filter(Boolean) as string[];
    const fromProfile = [profile?.suburb, profile?.school].filter(Boolean) as string[];
    return Array.from(new Set([...fromProfile, ...fromPosts])).sort((a, b) => a.localeCompare(b));
  }, [posts, profile]);
  const hasHomeLocation = Boolean(profile?.homeSuburb?.trim() && /^\d{4}$/.test(String(profile?.homePostcode || '').trim()));
  const filteredLocationOptions = useMemo(() => {
    const q = locationQuery.trim().toLowerCase();
    if (!q) return locationOptions.slice(0, 8);
    return locationOptions.filter((loc) => loc.toLowerCase().includes(q)).slice(0, 8);
  }, [locationOptions, locationQuery]);
  const mergedLocationOptions = filteredLocationOptions.slice(0, 10);

  const filteredPosts = useMemo(() => {
    const normalizedLocation = selectedLocation.trim().toLowerCase();
    const distanceLimit = anyDistance ? null : Number(selectedDistance);

    const result = posts.filter((post) => {
      const locationMatches =
        !normalizedLocation ||
        String(post.school || '').toLowerCase().includes(normalizedLocation) ||
        String(post.suburb || '').toLowerCase().includes(normalizedLocation);

      const distanceKm = getDistanceBetweenSuburbs(
        {
          suburb: profile?.homeSuburb,
          postcode: profile?.homePostcode,
        },
        {
          suburb: post.suburb,
          postcode: post.postcode,
        }
      );
      const distanceMatches =
        !hasHomeLocation ||
        distanceLimit == null ||
        (distanceKm != null && distanceKm <= distanceLimit);

      return locationMatches && distanceMatches;
    });

    if (selectedSortBy === 'Closest' && hasHomeLocation) {
      return result.sort((a, b) => {
        const distanceA = getDistanceBetweenSuburbs(
          { suburb: profile?.homeSuburb, postcode: profile?.homePostcode },
          { suburb: a.suburb, postcode: a.postcode }
        );
        const distanceB = getDistanceBetweenSuburbs(
          { suburb: profile?.homeSuburb, postcode: profile?.homePostcode },
          { suburb: b.suburb, postcode: b.postcode }
        );
        return (distanceA ?? Number.MAX_SAFE_INTEGER) - (distanceB ?? Number.MAX_SAFE_INTEGER);
      });
    }

    return result;
  }, [posts, selectedLocation, selectedDistance, hasHomeLocation, anyDistance, profile?.homeSuburb, profile?.homePostcode, selectedSortBy]);

  const activeLocationLabel = useMemo(() => {
    const homeLocation = [profile?.homeSuburb, profile?.homePostcode].filter(Boolean).join(' ');
    const label = selectedLocation.trim() || locationQuery.trim() || homeLocation || 'Set home suburb';
    return label;
  }, [selectedLocation, locationQuery, profile?.homeSuburb, profile?.homePostcode]);

  const applyLocationSearch = () => {
    const typed = locationQuery.trim();
    if (typed) {
      setSelectedLocation(typed);
      setLocationQuery(typed);
    } else {
      setSelectedLocation('');
    }
    setShowLocationSuggestions(false);
    setLocationPanelOpen(false);
  };

  const favorites = useMemo(() => {
    const fSchools = toStringArray(profile?.favSchools);
    const fSports = toStringArray(profile?.favSports || profile?.favClubs);
    return [...fSchools, ...fSports];
  }, [profile]);

  const resetFilters = () => {
    setSelectedType('All');
    setSelectedCategory('All');
    setSelectedCondition('All');
    setSelectedSize('All');
    setSelectedSportType('All');
    setSelectedSortBy('Newest');
    setSearchQuery('');
    setLocationQuery('');
    setSelectedLocation('');
    setSelectedDistance('40');
    setAnyDistance(false);
  };

  const hasActiveFilters =
    selectedType !== 'All' ||
    selectedCategory !== 'All' ||
    selectedCondition !== 'All' ||
    selectedSize !== 'All' ||
    selectedSportType !== 'All' ||
    selectedLocation.trim() ||
    searchQuery.trim();
  const noListingsAtAll = posts.length === 0 && !hasActiveFilters;

  return (
    <div className="h-screen bg-[#F0F2F5] flex flex-col overflow-hidden">
      <Navbar />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Facebook Uniforms Style */}
        <aside className="hidden lg:flex flex-col w-90 bg-white border-r border-slate-200 overflow-y-auto z-10 shrink-0">
          <div className="p-4 space-y-4">
             <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Uniforms</h1>
                <Link href="/settings" className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors">
                   <Settings className="w-5 h-5 text-slate-600" />
                </Link>
             </div>

             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search Uniforms"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F0F2F5] border-none rounded-full pl-10 pr-4 py-2 text-sm focus:ring-0 placeholder:text-slate-500 font-normal"
                />
             </div>
             <div className="space-y-1">
                <button 
                  onClick={resetFilters}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === 'All' && selectedType === 'All' && selectedCondition === 'All' ? 'bg-[#F0F2F5]' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${selectedCategory === 'All' && selectedType === 'All' && selectedCondition === 'All' ? 'bg-[#1877F2]' : 'bg-slate-200'}`}>
                    <Home className={`w-5 h-5 ${selectedCategory === 'All' && selectedType === 'All' && selectedCondition === 'All' ? 'text-white' : 'text-slate-600'}`} />
                  </div>
                  <span className={`text-[15px] font-semibold ${selectedCategory === 'All' && selectedType === 'All' && selectedCondition === 'All' ? 'text-slate-900' : 'text-slate-800'}`}>Browse all</span>
                </button>

                <Link href="/notifications" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-900 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-slate-600" />
                  </div>
                  <span className="text-[15px] font-semibold text-slate-800">Notifications</span>
                </Link>

                <Link href="/inbox" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-900 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center">
                    <Inbox className="w-5 h-5 text-slate-600" />
                  </div>
                  <span className="text-[15px] font-semibold text-slate-800">Inbox</span>
                </Link>

                <Link href="/profile?tab=buying" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-900 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-slate-600" />
                  </div>
                  <span className="text-[15px] font-semibold text-slate-800">Buying</span>
                </Link>

                <Link href="/profile?tab=selling" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-900 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center">
                    <Tag className="w-5 h-5 text-slate-600" />
                  </div>
                  <span className="text-[15px] font-semibold text-slate-800">Selling</span>
                </Link>
             </div>

             <Link href="/create" className="flex items-center justify-center gap-2 w-full bg-[#E7F3FF] text-[#1877F2] py-2.5 rounded-lg font-bold text-[15px] hover:bg-[#DBEAFE] transition-colors mt-2">
                <Plus className="w-5 h-5" />
                Create New Listing
             </Link>

             <div className="h-[1px] bg-slate-200 !my-4"></div>

             <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                   <h3 className="font-bold text-[17px] text-slate-900 leading-tight">Filters</h3>
                </div>
                
                {/* Sort By */}
                <div className="space-y-1.5">
                   <label className="text-sm font-bold text-slate-700">Sort By</label>
                   <select 
                     value={selectedSortBy} 
                     onChange={(e) => setSelectedSortBy(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 appearance-none"
                   >
                     <option value="Newest">Newest First</option>
                     {hasHomeLocation && <option value="Closest">Closest First</option>}
                     <option value="PriceLowToHigh">Price: Low to High</option>
                     <option value="PriceHighToLow">Price: High to Low</option>
                   </select>
                </div>

                {/* School */}
                <div className="space-y-1.5">
                   <label className="text-sm font-bold text-slate-700">School / Club</label>
                   <input 
                     placeholder="Search school..."
                     value={locationQuery}
                     onChange={(e) => setLocationQuery(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                   />
                </div>

                <div className="space-y-1.5">
                   <div className="flex items-center justify-between">
                     <label className="text-sm font-bold text-slate-700">Distance</label>
                     <span className="text-xs font-semibold text-slate-500">{anyDistance ? 'Any distance' : `${selectedDistance} km`}</span>
                   </div>
                   {hasHomeLocation ? (
                     <>
                       <input
                         type="range"
                         min="5"
                         max="100"
                         step="5"
                         value={selectedDistance}
                         onChange={(e) => {
                           setSelectedDistance(e.target.value);
                           setAnyDistance(false);
                         }}
                         className="w-full accent-indigo-600"
                       />
                       <div className="flex items-center justify-between text-[11px] text-slate-500">
                         <span>5km</span>
                         <span>100km</span>
                       </div>
                       <label className="flex items-center gap-2 text-xs text-slate-600 mt-2">
                         <input
                           type="checkbox"
                           checked={anyDistance}
                           onChange={(e) => setAnyDistance(e.target.checked)}
                           className="rounded border-slate-300"
                         />
                         Any distance
                       </label>
                     </>
                   ) : (
                     <p className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-[11px] text-slate-500">
                       Set your home suburb to filter by distance.
                     </p>
                   )}
                </div>

                <div className="space-y-1.5">
                   <label className="text-sm font-bold text-slate-700">Sport Type</label>
                   <select
                     value={selectedSportType}
                     onChange={(e) => setSelectedSportType(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 appearance-none"
                   >
                     <option value="All">Any Sport</option>
                     {Object.keys(SPORT_TYPES).map((sport) => (
                       <option key={sport} value={sport}>{sport}</option>
                     ))}
                   </select>
                </div>

                {/* Size */}
                <div className="space-y-1.5">
                   <label className="text-sm font-bold text-slate-700">Size</label>
                   <select 
                     value={selectedSize} 
                     onChange={(e) => setSelectedSize(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 appearance-none"
                   >
                     <option value="All">Any Size</option>
                     {['4', '6', '8', '10', '12', '14', '16', '18', '20', '22', '24', '26', '28', '30', '32', '34', '36', '38', '40', 'XXS', 'XS', 'S', 'M', 'L'].map(s => (
                       <option key={s} value={s}>{s}</option>
                     ))}
                   </select>
                </div>

                {/* Condition */}
                <div className="space-y-1.5">
                   <label className="text-sm font-bold text-slate-700">Condition</label>
                   <select 
                     value={selectedCondition} 
                     onChange={(e) => setSelectedCondition(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 appearance-none"
                   >
                     <option value="All">Any Condition</option>
                     {CONDITION_OPTIONS.map((condition) => (
                       <option key={condition} value={condition}>{condition}</option>
                     ))}
                   </select>
                </div>
                
                {/* Type */}
                <div className="space-y-1.5">
                   <label className="text-sm font-bold text-slate-700">Item Type</label>
                   <select 
                     value={selectedType} 
                     onChange={(e) => setSelectedType(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 appearance-none"
                   >
                     <option value="All">Any Type</option>
                     <option value="SALE">For Sale</option>
                     <option value="WTB">Want to Buy</option>
                     <option value="FREE">Free</option>
                   </select>
                </div>

             </div>

             <div className="h-[1px] bg-slate-200 !my-4"></div>

             <div className="space-y-2">
                <h3 className="font-bold text-[17px] text-slate-900 px-1">Categories</h3>
                <div className="space-y-1">
                   {CATEGORIES.map(cat => (
                     <button
                       key={cat}
                       onClick={() => setSelectedCategory(cat)}
                       className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                         selectedCategory === cat ? 'bg-[#F0F2F5]' : 'hover:bg-slate-50'
                       }`}
                     >
                       <div className={`w-9 h-9 rounded-full flex items-center justify-center ${selectedCategory === cat ? 'bg-[#1877F2]' : 'bg-slate-200 text-slate-600'}`}>
                         <Tag className={`w-5 h-5 ${selectedCategory === cat ? 'text-white' : ''}`} />
                       </div>
                       <span className={`text-[15px] font-semibold text-left ${selectedCategory === cat ? 'text-slate-900' : 'text-slate-800'}`}>{cat}</span>
                     </button>
                   ))}
                </div>
             </div>

             <div className="h-[1px] bg-slate-200 !my-4"></div>

             <div className="space-y-2">
                <h3 className="font-bold text-[17px] text-slate-900 px-1">Type</h3>
                <div className="space-y-1">
                   {TYPES.map(type => (
                     <button
                       key={type}
                       onClick={() => setSelectedType(type)}
                       className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                         selectedType === type ? 'bg-[#F0F2F5]' : 'hover:bg-slate-50'
                       }`}
                     >
                       <div className={`w-9 h-9 rounded-full flex items-center justify-center ${selectedType === type ? 'bg-[#1877F2]' : 'bg-slate-200 text-slate-600'}`}>
                         {type === 'SALE' ? <Tag className={`w-5 h-5 ${selectedType === type ? 'text-white' : ''}`} /> : type === 'WTB' ? <MessageCircle className={`w-5 h-5 ${selectedType === type ? 'text-white' : ''}`} /> : type === 'FREE' ? <Sparkles className={`w-5 h-5 ${selectedType === type ? 'text-white' : ''}`} /> : <LayoutGrid className={`w-5 h-5 ${selectedType === type ? 'text-white' : ''}`} />}
                       </div>
                       <span className={`text-[15px] font-semibold text-left ${selectedType === type ? 'text-slate-900' : 'text-slate-800'}`}>
                         {type === 'WTB' ? 'Wanted' : type === 'SALE' ? 'For Sale' : type === 'FREE' ? 'Free Items' : 'All Types'}
                       </span>
                     </button>
                   ))}
                </div>
             </div>

             <div className="h-[1px] bg-slate-200 !my-4"></div>

             <div className="space-y-2">
                <h3 className="font-bold text-[17px] text-slate-900 px-1">Condition</h3>
                <div className="space-y-1">
                   {CONDITIONS.map(cond => (
                     <button
                       key={cond}
                       onClick={() => setSelectedCondition(cond)}
                       className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                         selectedCondition === cond ? 'bg-[#F0F2F5]' : 'hover:bg-slate-50'
                       }`}
                     >
                       <div className={`w-9 h-9 rounded-full flex items-center justify-center ${selectedCondition === cond ? 'bg-[#1877F2]' : 'bg-slate-200 text-slate-600'}`}>
                         <Sparkles className={`w-5 h-5 ${selectedCondition === cond ? 'text-white' : ''}`} />
                       </div>
                       <span className={`text-[15px] font-semibold text-left ${selectedCondition === cond ? 'text-slate-900' : 'text-slate-800'}`}>
                         {cond === 'All' ? 'Any Condition' : cond}
                       </span>
                     </button>
                   ))}
                </div>
             </div>

             <div className="h-[1px] bg-slate-200 !my-4"></div>

             {favorites.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-[17px] text-slate-900 px-1">My Communities</h3>
                  <div className="flex flex-col gap-1">
                    {favorites.map(fav => (
                      <button
                        key={fav}
                        onClick={() => setSearchQuery(prev => prev === fav ? '' : fav)}
                        className={`text-left px-3 py-2 rounded-xl text-[15px] font-semibold transition-all ${
                          searchQuery === fav 
                            ? 'bg-[#F0F2F5] text-indigo-600' 
                            : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        {fav}
                      </button>
                    ))}
                  </div>
                </div>
             )}
          </div>
        </aside>

        {/* Main Feed Content */}
        <main className="flex-1 overflow-y-auto bg-[#F0F2F5] pb-24 md:pb-6">
          <div className="max-w-[1240px] mt-2 mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
            
            {/* Discovery Header - Facebook Style */}
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
               <div className="flex items-center justify-between">
                  <h1 className="text-[20px] font-bold text-slate-900 leading-tight">Today&apos;s picks</h1>
                  <button
                     onClick={() => {
                       setLocationPanelOpen((v) => !v);
                       setTimeout(() => document.getElementById('location-search-input')?.focus(), 0);
                     }}
                     className="text-[#1877F2] text-[15px] font-semibold hover:underline flex items-center gap-1"
                  >
                     <MapPin className="w-4 h-4" />
                     {activeLocationLabel} • {anyDistance ? 'Any distance' : `${selectedDistance} km`}
                  </button>
               </div>

               {locationPanelOpen && (
               <div className="grid grid-cols-1 gap-2">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="location-search-input"
                      type="text"
                      value={locationQuery}
                      onChange={(e) => {
                        setLocationQuery(e.target.value);
                        setSelectedLocation('');
                        setShowLocationSuggestions(true);
                      }}
                      onFocus={() => setShowLocationSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 120)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          applyLocationSearch();
                        }
                      }}
                      placeholder="Search suburb or school"
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                    {showLocationSuggestions && (
                      <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                        {locationQuery.trim() && (
                          <button
                            type="button"
                            onClick={() => {
                              const typed = locationQuery.trim();
                              setSelectedLocation(typed);
                              setLocationQuery(typed);
                              setShowLocationSuggestions(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm font-semibold text-indigo-700 hover:bg-indigo-50 border-b border-slate-100"
                          >
                            Use “{locationQuery.trim()}”
                          </button>
                        )}
                        {mergedLocationOptions.length > 0 ? (
                          mergedLocationOptions.map((loc) => (
                            <button
                              key={loc}
                              type="button"
                              onClick={() => {
                                setSelectedLocation(loc);
                                setLocationQuery(loc);
                                setShowLocationSuggestions(false);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                            >
                              {loc}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-slate-500">No matching saved locations yet.</div>
                        )}
                      </div>
                    )}
                  </div>
                  {hasHomeLocation ? (
                    <div className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
                        <span>Range</span>
                        <span>{anyDistance ? 'Any distance' : `${selectedDistance} km`}</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        step="5"
                        value={selectedDistance}
                        onChange={(e) => {
                          setSelectedDistance(e.target.value);
                          setAnyDistance(false);
                        }}
                        className="w-full accent-indigo-600"
                      />
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>5km</span>
                        <span>100km</span>
                      </div>
                      <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={anyDistance}
                          onChange={(e) => setAnyDistance(e.target.checked)}
                          className="rounded border-slate-300"
                        />
                        Any distance
                      </label>
                    </div>
                  ) : (
                    <p className="rounded-xl bg-slate-100 border border-slate-200 px-3 py-2.5 text-xs text-slate-600">
                      Set your home suburb to filter by distance.
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={applyLocationSearch}
                      className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                    >
                      Search
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLocationQuery('');
                        setSelectedLocation('');
                        setShowLocationSuggestions(false);
                      }}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
               </div>
               )}
               {locationQuery.trim() && !selectedLocation && (
                 <p className="text-[11px] text-amber-600">Select a location from the dropdown to apply this filter.</p>
               )}

               {!searchQuery && (
                 <div className="grid grid-cols-2 gap-3">
                    <button
                       onClick={() => router.push('/create')}
                       className="bg-[#E7F3FF] p-3 rounded-xl flex items-center gap-2.5 group hover:bg-[#DBEAFE] transition-colors text-left"
                    >
                       <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                          <Tag className="text-[#1877F2] w-4 h-4" />
                       </div>
                       <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-[14px] leading-tight">Sell items</p>
                          <p className="text-xs text-slate-600 line-clamp-1">List what you don&apos;t need.</p>
                       </div>
                       <ChevronRight className="ml-auto w-4 h-4 text-slate-400 group-hover:text-[#1877F2] transition-colors shrink-0" />
                    </button>
                    <button
                       onClick={() => { setSelectedType('WTB'); setSearchQuery(''); }}
                       className="bg-[#F2F2F2] p-3 rounded-xl flex items-center gap-2.5 group hover:bg-[#EAEAEA] transition-colors text-left"
                    >
                       <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                          <MessageCircle className="text-slate-600 w-4 h-4" />
                       </div>
                       <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-[14px] leading-tight">Requests</p>
                          <p className="text-xs text-slate-600 line-clamp-1">See what others want.</p>
                       </div>
                       <ChevronRight className="ml-auto w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                    </button>
                 </div>
               )}
            </div>

            {/* School Hub Section */}
            {profile?.school && !searchQuery && <SchoolHubSection userSchool={profile.school} posts={posts} />}

            {/* Wanted Board Section */}
            {!searchQuery && <WantedBoardSection posts={posts} />}

            <div className="space-y-6">
              <header className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-indigo-600" />
                  {effectiveSearchQuery ? `Results for "${effectiveSearchQuery}"` : "All Listings"}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setLocationPanelOpen(true);
                    setTimeout(() => document.getElementById('location-search-input')?.focus(), 0);
                  }}
                  className="flex items-center gap-2 text-indigo-600 text-sm font-medium hover:underline cursor-pointer bg-white px-4 py-2 rounded-full border border-slate-200"
                >
                  <MapPin className="w-4 h-4" />
                  <span>{activeLocationLabel} · {anyDistance ? 'Any distance' : `${selectedDistance} km`}</span>
                </button>
              </header>

              {error ? (
                <ErrorState
                  heading="Couldn't load listings"
                  body="Check your connection and try again."
                  onRetry={() => fetchPosts(false)}
                />
              ) : loading ? (
                <div className="grid grid-cols-2 gap-x-2 gap-y-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  <ListingGridSkeleton count={10} />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-2 gap-y-6">
                  <AnimatePresence mode="popLayout">
                    {filteredPosts.length > 0 ? (
                      filteredPosts.map((post) => (
                        <div key={post.id}>
                          <PostCard id={post.id} post={post} />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full">
                        <EmptyState
                          icon="□"
                          heading={noListingsAtAll ? "No listings yet" : searchQuery.trim() ? `No results for "${searchQuery.trim()}"` : "No matches"}
                          body={
                            noListingsAtAll
                              ? "Be the first to list a uniform — it takes about a minute."
                              : searchQuery.trim()
                                ? "Check spelling or try a broader term."
                                : "Try widening your distance, removing a filter, or searching another school."
                          }
                          action={
                            noListingsAtAll
                              ? { label: "Create a listing", href: "/create" }
                              : { label: "Clear filters", onClick: resetFilters }
                          }
                        />
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
