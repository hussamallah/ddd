import { Suspense } from 'react';
import SampleResultPageClient from './SampleResultPageClient';

export const dynamic = 'force-dynamic'; // no SSG attempt
export const revalidate = 0; // ensure runtime fetch

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-neutral-100">
        <div className="mx-auto max-w-7xl p-4">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-700 rounded mb-6"></div>
            <div className="h-96 bg-gray-800 rounded-3xl mb-8"></div>
            <div className="space-y-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-800 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <SampleResultPageClient />
    </Suspense>
  );
}
