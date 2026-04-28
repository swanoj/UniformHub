'use client';

import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUser } from '@/components/FirebaseProvider';
import { Navbar } from '@/components/Navbar';
import { Loader2, Plus, CheckCircle2, ChevronLeft, Database } from 'lucide-react';
import router from 'next/router';
import Link from 'next/link';

const DEMO_POSTS = [
  {
    title: "GM Powerplay Pro Cricket Bat",
    description: "Barely used, 2023 season. Full size. Excellent Condition, Grade 1 Willow - 2.9 lbs. Comes with bat cover (not pictured).",
    price: 250,
    originalPrice: 400,
    category: "Sport",
    type: "SALE",
    condition: "Like New",
    school: "Any",
    suburb: "Melbourne",
    photos: ["https://picsum.photos/seed/gm_bat/800/800"]
  },
  {
    title: "Girls Navy School Uniform Set",
    description: "Includes navy cardigan with school crest, white collared shirt, and navy pleated skirt. Excellent condition.",
    price: 45,
    category: "School",
    type: "SALE",
    condition: "Good",
    school: "Generic High School",
    suburb: "Carlton",
    photos: ["https://picsum.photos/seed/girls_uniform/800/800"]
  },
  {
    title: "Hampton Rover Boys Uniform (15 Yr Old)",
    description: "Full uniform bundle! Includes navy blazer (Est 1928 crest), striped tie, charcoal trousers with belt, white short sleeve shirt, and socks. Has name tag J. Patel Yr 10 inside.",
    price: 35,
    category: "School",
    type: "SALE",
    condition: "Good",
    school: "Hampton Rover",
    suburb: "Hampton",
    photos: ["https://picsum.photos/seed/hampton_boys_1/800/800"]
  },
  {
    title: "Kookaburra Ghost Cricket Bat (2024)",
    description: "Cricket Bat - Excellent Condition. Kookaburra Ghost 2024 model. Lightweight | 2lb 9oz | RH. White grip with purple tip.",
    price: 250,
    originalPrice: 450,
    category: "Sport",
    type: "SALE",
    condition: "Like New",
    school: "Any",
    suburb: "Richmond",
    photos: ["https://picsum.photos/seed/kooks_bat/800/800"]
  },
  {
    title: "Hampton Rover Uniform Sale - Grade 8-10",
    description: "Bundle includes: Navy blazer with J. Thompson name tag, light blue short sleeve shirt, navy/red striped tie, dark trousers, and navy school cap. All for $35.",
    price: 35,
    category: "School",
    type: "SALE",
    condition: "Good",
    school: "Hampton Rover",
    suburb: "Hampton",
    photos: ["https://picsum.photos/seed/hampton_boys_2/800/800"]
  },
  {
    title: "Rockrider Full Suspension MTB",
    description: "Like NEW - Full Suspension Mountain Bike. Ready to ride! Black with blue accents.",
    price: 500,
    originalPrice: 850,
    category: "Sport",
    type: "SALE",
    condition: "Like New",
    school: "Any",
    suburb: "Southbank",
    photos: ["https://picsum.photos/seed/mtb_bike/800/800"]
  },
  {
    title: "South Melbourne FC Kit - Size M",
    description: "Match worn kit. Authentic South Melbourne FC red and white soccer kit. Includes shirt (#17), shorts, and socks. Latrobe sponsor.",
    price: 55,
    category: "Sport",
    type: "SALE",
    condition: "Used - Good",
    school: "South Melbourne FC",
    suburb: "South Melbourne",
    photos: ["https://picsum.photos/seed/smfc_kit/800/800"]
  },
  {
    title: "Essential Mathematics Year 10 (Cambridge)",
    description: "Essential Mathematics for the Australian Curriculum (David Greenwood et al). Generic High School, Carlton. Second-hand - Good condition. Giving it away for free!",
    price: 0,
    originalPrice: 49.95,
    category: "School",
    type: "FREE",
    condition: "Good",
    school: "Generic High School",
    suburb: "Carlton",
    photos: ["https://picsum.photos/seed/mathdb/800/800"]
  }
];

export default function SeedPage() {
  const { user, profile } = useUser();
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const seedData = async () => {
    if (!user) {
      setError("You must be logged in to seed data.");
      return;
    }
    setError(null);
    setLoading(true);
    setCount(0);

    try {
      for (const post of DEMO_POSTS) {
        await addDoc(collection(db, 'posts'), {
          ...post,
          quantity: Math.floor(Math.random() * 3) + 1,
          photoUrls: post.photos,
          ownerId: user.uid,
          ownerName: user.displayName || 'Demo User',
          communityId: null,
          status: 'ACTIVE',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setCount(prev => prev + 1);
      }
      alert("Successfully seeded 10 posts!");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to seed data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <Database className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Database Seeder</h1>
              <p className="text-sm text-gray-500">Generate demo listings</p>
            </div>
          </div>

          {!user ? (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700 text-sm mb-6">
              Please log in to your account first so the demo listings are attributed to you.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-sm text-gray-600 mb-2">This will generate:</p>
                <ul className="text-sm font-medium text-gray-800 space-y-1">
                  <li>• 7 Sale Items</li>
                  <li>• 2 WTB Requests</li>
                  <li>• 1 Free Item</li>
                  <li>• High-quality mock images</li>
                </ul>
              </div>

              {error && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-red-600 text-xs font-bold">
                  Error: {error}
                </div>
              )}

              <button
                onClick={seedData}
                disabled={loading}
                className="w-full bg-indigo-600 text-white h-14 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Seeding ({count}/10)...
                  </>
                ) : (
                  <>
                    <Plus className="w-6 h-6" />
                    Generate 10 Demo Posts
                  </>
                )}
              </button>

              <Link 
                href="/"
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Uniforms
              </Link>
            </div>
          )}

          {count === 10 && !loading && (
            <div className="mt-6 flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <p className="text-sm font-bold">Success! Your uniforms feed is now populated.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
