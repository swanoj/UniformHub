'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '@/lib/firebase';
import { getProviderRedirectResult, signInWithProvider, shouldUseRedirectAuth } from '@/lib/auth';
import { ArrowLeft, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = React.useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [providerSubmitting, setProviderSubmitting] = React.useState(false);
  const [authError, setAuthError] = React.useState('');
  const [showAuth, setShowAuth] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    getProviderRedirectResult()
      .then((result) => {
        if (!cancelled && result?.user) {
          router.push('/');
        }
      })
      .catch((error: any) => {
        console.error('Redirect authentication failed', error);
        if (!cancelled) {
          setAuthError(error?.message || 'Authentication failed. Please try again.');
          setProviderSubmitting(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogin = async (provider: any) => {
    setAuthError('');
    setProviderSubmitting(true);
    try {
      const result = await signInWithProvider(provider);
      if (result?.user) {
        router.push('/');
      }
    } catch (error: any) {
      console.error("Authentication failed", error);
      if (error.code !== 'auth/closed-by-user') {
        setAuthError(error?.message || 'Authentication failed. Please try again.');
      }
    } finally {
      if (!shouldUseRedirectAuth()) {
        setProviderSubmitting(false);
      }
    }
  };

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!isValidEmail(email.trim())) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (authMode === 'signin') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
      router.push('/');
    } catch (error: any) {
      setAuthError(error?.message || 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!showAuth) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex flex-col p-6">
        <section id="welcome-screen" className="flex flex-1 flex-col justify-between mx-auto w-full max-w-md">
          <div className="pt-8">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-black text-3xl italic tracking-tighter">U</span>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-600">UniformHub</p>
              <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-slate-950">
                School uniforms, sorted.
              </h1>
              <p className="text-base font-medium leading-7 text-slate-600">
                Buy and sell second-hand school uniforms with local families, clubs, and school communities.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <ShoppingBag className="h-5 w-5 text-indigo-600" />
                <p className="text-sm font-bold text-slate-800">List outgrown uniforms in minutes.</p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <p className="text-sm font-bold text-slate-800">Keep conversations inside the app.</p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <p className="text-sm font-bold text-slate-800">Find the right school, sport, size, and suburb.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pb-3">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setShowAuth(true);
              }}
              className="w-full rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-200 transition-all active:scale-[0.98]"
            >
              Get started
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setShowAuth(true);
              }}
              className="w-full rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black uppercase tracking-widest text-slate-700 transition-all active:scale-[0.98]"
            >
              I already have an account
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <button
        type="button"
        onClick={() => {
          setShowAuth(false);
          setAuthError('');
        }}
        className="fixed top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Welcome
      </button>

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 text-center bg-slate-50 border-b border-slate-100">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20 rotate-3 group-hover:rotate-0 transition-transform">
            <span className="text-white font-black text-3xl italic tracking-tighter">U</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">UniformHub</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Secondhand, simple, sustainable.</p>
        </div>

        <div className="p-8 space-y-4">
          <form onSubmit={handleEmailAuth} className="space-y-3 mb-6">
            <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest text-center mb-3">
              {authMode === 'signin' ? 'Sign in with email' : 'Create account'}
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white border-2 border-slate-100 text-slate-700 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              className="w-full bg-white border-2 border-slate-100 text-slate-700 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {authError && <p className="text-xs text-rose-600 font-semibold">{authError}</p>}
            <button
              type="submit"
              disabled={submitting || providerSubmitting}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold tracking-tight hover:bg-indigo-700 transition-all disabled:opacity-60"
            >
              {submitting ? 'Please wait...' : authMode === 'signin' ? 'Sign in with Email' : 'Create Account'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                setAuthError('');
              }}
              className="w-full text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
            >
              {authMode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
            </button>
          </form>

          <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest text-center mb-6">Or continue with</p>
          
          {/* Apple Sign In - Mandatory for iOS Submission */}
          <button
            onClick={() => handleLogin(appleProvider)}
            disabled={submitting || providerSubmitting}
            className="w-full bg-black text-white px-6 py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-900 transition-all active:scale-[0.98] shadow-md disabled:opacity-60"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 384 512">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
            </svg>
            <span className="font-bold tracking-tight">Sign in with Apple</span>
          </button>

          {/* Google Sign In */}
          <button
            onClick={() => handleLogin(googleProvider)}
            disabled={submitting || providerSubmitting}
            className="w-full bg-white border-2 border-slate-100 text-slate-700 px-6 py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-[0.98] shadow-sm disabled:opacity-60"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
            <span className="font-bold tracking-tight">Sign in with Google</span>
          </button>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 font-medium px-4 leading-relaxed">
              By continuing, you agree to the <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-slate-600 underline">Terms of Service</a> and <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-slate-600 underline">Privacy Policy</a>.
            </p>
        </div>
      </div>
      
      <p className="mt-12 text-slate-300 font-black text-xs uppercase tracking-[0.2em] pointer-events-none">UniformHub V1.0 MVP</p>
    </div>
  );
}
