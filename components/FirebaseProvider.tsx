'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, updateDoc } from 'firebase/firestore';
import { TERMS_VERSION } from '@/lib/constants';
import { ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

interface UserContextType {
  user: User | null;
  loading: boolean;
  profile: any | null;
}

const UserContext = createContext<UserContextType>({ user: null, loading: true, profile: null });

export const useUser = () => useContext(UserContext);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState('');
  const [agreed18, setAgreed18] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [acceptingTerms, setAcceptingTerms] = useState(false);
  const [agreedToUpdate, setAgreedToUpdate] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = undefined;
        }
        setProfile(null);
        setShowTermsModal(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Ensure an auth token is available before the first Firestore read/write.
        await nextUser.getIdToken();

        const userRef = doc(db, 'users', nextUser.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          const newProfile = {
            displayName: nextUser.displayName || 'Anonymous User',
            email: nextUser.email,
            photoUrl: nextUser.photoURL,
            onboarded: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, newProfile);
        }

        if (unsubscribeProfile) {
          unsubscribeProfile();
        }

        unsubscribeProfile = onSnapshot(
          userRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setProfile(data);

              // §17 Terms Version Check
              if (data.onboarded !== false) {
                if (data.termsAccepted?.version !== TERMS_VERSION) {
                  setShowTermsModal(true);
                } else {
                  setShowTermsModal(false);
                }
              }
            }
            setLoading(false);
          },
          (error) => {
            console.error('[FirebaseProvider] Profile subscription failed:', error);
            setProfile(null);
            setShowTermsModal(false);
            setLoading(false);
          },
        );
      } catch (error) {
        console.error('[FirebaseProvider] Failed to bootstrap user profile:', error);
        setProfile(null);
        setShowTermsModal(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  if (loading) {
     return <div className="min-h-screen bg-white" />;
  }

  if (user && profile && profile.onboarded === false) {
    const completeOnboarding = async () => {
      if (!agreed18) return alert('Please confirm your age.');
      if (!school.trim()) return alert('Please tell us your primary school or club.');

      await updateDoc(doc(db, 'users', user.uid), {
        onboarded: true,
        isOver18: true,
        school: school.trim(),
        termsAccepted: {
          version: '2.0',
          acceptedAt: serverTimestamp()
        }
      });
    };

    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-center">
         <h1 className="text-3xl font-black text-slate-900 mb-2">Welcome to UniformHub</h1>
         <p className="text-slate-500 mb-8 max-w-md">To ensure a safe community, tell us a bit about yourself.</p>
         
         <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl w-full max-w-sm flex flex-col gap-4 text-left">
           <div>
             <label className="block text-sm font-bold text-slate-700 mb-1">Primary School / Club</label>
             <input type="text" value={school} onChange={e => setSchool(e.target.value)} placeholder="e.g. State High School" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium" />
           </div>

           <div className="flex items-start gap-3 mt-4">
             <input type="checkbox" id="over18" checked={agreed18} onChange={e => setAgreed18(e.target.checked)} className="mt-1 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
             <label htmlFor="over18" className="text-sm font-semibold text-slate-700 leading-snug cursor-pointer flex-1">
               I confirm I am over 18 years old and agree to the <a href="/legal/terms" target="_blank" className="text-indigo-600 font-bold hover:underline">Terms and Conditions</a>, including the community guidelines.
             </label>
           </div>

           <button onClick={completeOnboarding} disabled={!agreed18 || !school.trim()} className="mt-4 w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl font-bold tracking-tight shadow-md transition-all active:scale-[0.98]">
             Complete Profile
           </button>
         </div>
      </div>
    );
  }

  const handleAcceptUpdatedTerms = async () => {
    if (!user || !agreedToUpdate) return;
    setAcceptingTerms(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        termsAccepted: {
          version: TERMS_VERSION,
          acceptedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });
      setShowTermsModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update. Please try again.');
    } finally {
      setAcceptingTerms(false);
    }
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      loading, 
      profile 
    }}>
      {showTermsModal && user && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="bg-indigo-600 p-10 text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShieldCheck className="w-32 h-32" />
              </div>
              <h2 className="text-3xl font-black tracking-tight mb-2">Terms Updated</h2>
              <p className="text-indigo-100 font-medium">We&apos;ve updated our community guidelines to version {TERMS_VERSION}. Please review them to continue.</p>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="mt-1">
                    <input 
                      type="checkbox" 
                      id="update-agree" 
                      checked={agreedToUpdate}
                      onChange={(e) => setAgreedToUpdate(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                  <label htmlFor="update-agree" className="text-sm text-slate-600 leading-relaxed font-medium cursor-pointer">
                    I have read and agree to the <a href="/legal/terms" target="_blank" className="text-indigo-600 font-bold hover:underline">updated Terms & Conditions</a>. I understand these rules apply to all listings and safety precautions.
                  </label>
                </div>
              </div>

              <button 
                onClick={handleAcceptUpdatedTerms}
                disabled={!agreedToUpdate || acceptingTerms}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50"
              >
                {acceptingTerms ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <span>Accept & Continue</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {children}
    </UserContext.Provider>
  );
}
