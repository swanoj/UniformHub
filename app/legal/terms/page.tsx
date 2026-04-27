import React from 'react';
import { Navbar } from '@/components/Navbar';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-16 w-full">
        <h1 className="text-4xl font-black text-slate-900 mb-8 tracking-tight">Terms of Use</h1>
        
        <div className="prose prose-slate bg-white p-10 rounded-3xl shadow-sm border border-slate-200">
          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-600 leading-relaxed">
              By using UniformHub, you agree to comply with these terms. UniformHub is a platform facilitate the trade of second-hand school and sports gear.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">2. Membership & Fees</h2>
            <p className="text-slate-600 leading-relaxed">
              Sellers are required to maintain an active membership:
              <br />• Individual Sellers: $5.00 AUD per year.
              <br />• School/Commercial Shops: $500.00 AUD per year.
              All fees are non-refundable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">3. Content Rules</h2>
            <p className="text-slate-600 leading-relaxed">
              Users must use appropriate language and conduct. Only authentic school/club uniforms and equipment are permitted. Sellers MUST disclose if an item has been altered.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">4. Limitation of Liability</h2>
            <p className="text-slate-600 leading-relaxed font-bold">
              UniformHub has no responsibility for the quality of listings, the accuracy of information seller discloses, or the safety of physical meetups. Users interact at their own risk.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">5. Ad Expiry</h2>
            <p className="text-slate-600 leading-relaxed">
              Listings will automatically expire and be deleted after 8 weeks of activity.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
