'use client';

import React from 'react';
import Link from 'next/link';
import { useUser } from '@/components/FirebaseProvider';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Users, Shield, BookOpen, LogOut, Info, Settings, Database, User } from 'lucide-react';

export default function MenuPage() {
  const { user, profile } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const menuItems = [
    { icon: User, label: 'Profile', href: '/profile', description: 'Manage your profile and listings' },
    { icon: Users, label: 'Communities', href: '/communities', description: 'Join and manage your groups' },
    { icon: BookOpen, label: 'Terms & Privacy', href: '/legal/terms', description: 'Read our policies' },
    { icon: Database, label: 'Seed DB', href: '/debug/seed', description: 'Add dummy data (Admin Only)' }
  ];

  if (profile?.isAdmin) {
    menuItems.push({ icon: Shield, label: 'Admin Dashboard', href: '/admin', description: 'Manage platform' });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-32">
      <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-8">Menu</h1>
      
      {!user && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold text-indigo-900 mb-2">Sign in for more features</h2>
          <p className="text-sm text-indigo-700 font-medium mb-4">Join communities, save your favorite uniforms, and message sellers.</p>
          <button 
            onClick={() => {
              const el = document.querySelector('nav button'); // Find login button in navbar if possible
              if (el) (el as HTMLElement).click();
            }}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-sm"
          >
            Sign In / Sign Up
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
        <div className="divide-y divide-slate-100">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link key={i} href={item.href} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors group">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900">{item.label}</h3>
                  <p className="text-xs text-slate-500 font-medium">{item.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {user && (
        <div className="mt-8">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-rose-50 text-rose-600 font-bold py-4 rounded-2xl border border-rose-100 hover:bg-rose-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
