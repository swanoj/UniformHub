'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, updateDoc } from 'firebase/firestore';
import { useSchools } from '@/hooks/useSchools';

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
  const [showSchoolSuggestions, setShowSchoolSuggestions] = useState(false);
  const { schools: AUSTRALIAN_SCHOOLS, loading: schoolsLoading } = useSchools();

  const matchedSchool =
    AUSTRALIAN_SCHOOLS.find((s) => s.toLowerCase() === school.trim().toLowerCase()) || '';
  const filteredSchools = school.trim()
    ? AUSTRALIAN_SCHOOLS.filter(
        (s) =>
          s.toLowerCase().includes(school.trim().toLowerCase()) &&
          s.toLowerCase() !== school.trim().toLowerCase()
      ).slice(0, 8)
    : [];

  useEffect(() => {
    let unsubscribeProfile: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          const newProfile = {
            displayName: user.displayName || 'Anonymous User',
            email: user.email,
            photoUrl: user.photoURL,
            onboarded: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, newProfile);
        }

        unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          }
          setLoading(false);
        });
      } else {
        setProfile(null);
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
      if (!school.trim()) return alert('Please select your primary school from the list.');
      if (!matchedSchool) return alert('Please choose a valid school from the suggestions list.');

      await updateDoc(doc(db, 'users', user.uid), {
        onboarded: true,
        isOver18: true,
        school: matchedSchool,
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
             <div className="relative">
               <input
                 type="text"
                 value={school}
                 onChange={(e) => setSchool(e.target.value)}
                 onFocus={() => setShowSchoolSuggestions(true)}
                 onBlur={() => setTimeout(() => setShowSchoolSuggestions(false), 120)}
                 placeholder="Start typing your school..."
                 className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
               />

               {showSchoolSuggestions && school.trim() && (
                 <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                   {schoolsLoading ? (
                     <div className="px-4 py-3 text-sm text-slate-500">Loading schools...</div>
                   ) : matchedSchool ? (
                     <div className="px-4 py-3 text-sm font-semibold text-emerald-600">Selected: {matchedSchool}</div>
                   ) : filteredSchools.length > 0 ? (
                     filteredSchools.map((s) => (
                       <button
                         key={s}
                         type="button"
                         onClick={() => {
                           setSchool(s);
                           setShowSchoolSuggestions(false);
                         }}
                         className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                       >
                         {s}
                       </button>
                     ))
                   ) : (
                     <div className="px-4 py-3 text-sm text-slate-500">No matches found. Keep typing to find your school.</div>
                   )}
                 </div>
               )}
             </div>
           </div>

           <div className="flex items-start gap-3 mt-4">
             <input type="checkbox" id="over18" checked={agreed18} onChange={e => setAgreed18(e.target.checked)} className="mt-1 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
             <label htmlFor="over18" className="text-sm font-semibold text-slate-700 leading-snug cursor-pointer flex-1">
               I confirm I am over 18 years old and agree to the <a href="/legal/terms" target="_blank" className="text-indigo-600 font-bold hover:underline">Terms and Conditions</a>, including the community guidelines.
             </label>
           </div>

           <button onClick={completeOnboarding} disabled={!agreed18 || !school.trim() || !matchedSchool} className="mt-4 w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl font-bold tracking-tight shadow-md transition-all active:scale-[0.98]">
             Complete Profile
           </button>
         </div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ user, loading, profile: profile ? { ...profile, isMember: true } : null }}>
      {children}
    </UserContext.Provider>
  );
}
