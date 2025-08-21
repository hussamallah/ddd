import { Suspense } from 'react';
import StacksPageClient from './StacksPageClient';

export const dynamic = 'force-dynamic'; // skip prerender pressure
export const revalidate = 0; // ensure runtime fetch

export default function Page() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    }>
      <StacksPageClient />
    </Suspense>
  );
}
