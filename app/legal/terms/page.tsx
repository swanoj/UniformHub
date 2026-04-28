import React from 'react';
import { Navbar } from '@/components/Navbar';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-16 w-full">
        <h1 className="text-4xl font-black text-slate-900 mb-8 tracking-tight">Terms of Use</h1>
        
        <div className="prose prose-slate bg-white p-10 rounded-3xl shadow-sm border border-slate-200 w-full max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">1. Role of UniformHub</h2>
            <p className="text-slate-600 leading-relaxed">UniformHub provides a platform for users to list items, communicate, and arrange local pickup. UniformHub does not: verify authenticity, guarantee quality, participate in transactions, handle payments, or act as an agent.</p>
          </section>
          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">2. Age Requirements</h2>
            <p className="text-slate-600 leading-relaxed">To use UniformHub, you must be at least 18 years old. By creating an account, you confirm that you meet this minimum age requirement.</p>
          </section>
          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">3. Platform Usage &amp; Safety</h2>
            <p className="text-slate-600 leading-relaxed">UniformHub is currently a community-driven platform for the exchange of secondhand school items. Users must act in good faith and follow community safety guidelines at all times.</p>
          </section>
          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">6. Listings &amp; Accuracy</h2>
            <p className="text-slate-600 leading-relaxed">Personal contact details (such as phone numbers, email addresses, or home addresses) must not be included in listings. All communication must occur through the in-app messaging system.</p>
          </section>
          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">8. Collection &amp; Pickup Rules</h2>
            <p className="text-slate-600 leading-relaxed">UniformHub operates on a local pickup model. Buyers must collect purchased items within 5 calendar days, unless another timeframe is mutually agreed.</p>
          </section>
          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">10. Quantity &amp; Multiple Items</h2>
            <p className="text-slate-600 leading-relaxed">Some sellers may list more than one of the same item (for example, three blazers). Buyers can select how many they want to purchase.</p>
          </section>
          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">13. Listing Expiry</h2>
            <p className="text-slate-600 leading-relaxed">Listings automatically expire after 8 weeks unless renewed.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
