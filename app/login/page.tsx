'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '@/lib/firebase';
import { Mail, ArrowLeft, Zap } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async (provider: any) => {
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error: any) {
      console.error("Authentication failed", error);
      if (error.code !== 'auth/closed-by-user') {
        alert(`Authentication failed: ${error.message}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <Link href="/" className="fixed top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 text-center bg-slate-50 border-b border-slate-100">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20 rotate-3 group-hover:rotate-0 transition-transform">
            <span className="text-white font-black text-3xl italic tracking-tighter">U</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">UniformHub</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Secondhand, simple, sustainable.</p>
        </div>

        <div className="p-8 space-y-4">
          <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest text-center mb-6">Continue with</p>
          
          {/* Apple Sign In - Mandatory for iOS Submission */}
          <button
            onClick={() => handleLogin(appleProvider)}
            className="w-full bg-black text-white px-6 py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-900 transition-all active:scale-[0.98] shadow-md"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 384 512">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
            </svg>
            <span className="font-bold tracking-tight">Sign in with Apple</span>
          </button>

          {/* Google Sign In */}
          <button
            onClick={() => handleLogin(googleProvider)}
            className="w-full bg-white border-2 border-slate-100 text-slate-700 px-6 py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-[0.98] shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
            <span className="font-bold tracking-tight">Sign in with Google</span>
          </button>

          {process.env.NEXT_PUBLIC_ENABLE_TEST_LOGIN === 'true' && (
            <div className="pt-4">
               <button
                 onClick={async () => {
                   try {
                     const { signInAnonymously } = await import('firebase/auth');
                     await signInAnonymously(auth);
                     router.push('/');
                   } catch (e) {
                     console.error("Bypass failed", e);
                     alert("Anonymous auth might be disabled in Firebase. Enable it or check console.");
                   }
                 }}
                 className="w-full bg-amber-50 border border-amber-200 text-amber-700 px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-100 transition-all font-bold text-xs uppercase tracking-widest"
               >
                 <Zap className="w-4 h-4 fill-current" />
                 Dev Bypass (Guest Login)
               </button>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 font-medium px-4 leading-relaxed">
              By continuing, you agree to the <a href="/legal/terms" className="text-slate-600 underline">Terms of Service</a> and <a href="/legal/privacy" className="text-slate-600 underline">Privacy Policy</a>.
            </p>
        </div>
      </div>
      
      <p className="mt-12 text-slate-300 font-black text-xs uppercase tracking-[0.2em] pointer-events-none">UniformHub V1.0 MVP</p>
    </div>
  );
}
