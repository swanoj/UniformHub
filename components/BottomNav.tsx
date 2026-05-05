'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusCircle, MessageSquare, User, Menu } from 'lucide-react';
import { motion } from 'motion/react';

const NAV_ITEMS = [
  { icon: Home, label: 'Browse', href: '/' },
  { icon: Search, label: 'Explore', href: '/uniforms' },
  { icon: PlusCircle, label: 'Sell', href: '/create' },
  { icon: MessageSquare, label: 'Chats', href: '/inbox' },
  { icon: Menu, label: 'Menu', href: '/menu' },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/create' || pathname === '/login') return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-slate-200 pb-safe shadow-2xl">
      <div className="flex justify-around items-center h-16">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href;
          return (
            <Link 
              key={href} 
              href={href}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full relative transition-colors ${
                isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute top-0 w-8 h-1 bg-indigo-600 rounded-b-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-bold uppercase tracking-tighter line-clamp-1">
                {label}
              </span>
              {label === 'Chats' && (
                <span className="absolute top-3 right-1/2 translate-x-3 w-2 h-2 bg-rose-500 rounded-full border border-white" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
