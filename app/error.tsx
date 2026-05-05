'use client';

import { ErrorState } from '@/components/ErrorState';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
          <ErrorState
            heading="Something went wrong"
            body="We've logged the issue. Try refreshing the page."
            onRetry={reset}
            className="max-w-md bg-white"
          />
        </main>
      </body>
    </html>
  );
}
