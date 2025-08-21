"use client";

import { testGBULoader } from '@/lib/gbu-loader';
import { useEffect, useState } from 'react';

export default function TestGBUPage() {
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    const result = testGBULoader();
    setTestResult(result);
  }, []);

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Good/Bad/Ugly Integration Test</h1>
      
      {testResult && (
        <div className="space-y-6">
          <div className="rounded-lg border border-white/20 p-4">
            <h2 className="text-lg font-medium mb-3">Test Results</h2>
            <pre className="text-sm bg-black/20 p-4 rounded-lg whitespace-pre-wrap">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Good */}
            <div className="rounded-lg border border-emerald-600/30 bg-emerald-500/5 p-4">
              <h3 className="text-sm font-medium text-emerald-300 mb-2">The Good</h3>
              <div className="space-y-1">
                {testResult.good.map((item: string, index: number) => (
                  <div key={index} className="text-xs text-emerald-200">
                    • {item}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Bad */}
            <div className="rounded-lg border border-amber-600/30 bg-amber-500/5 p-4">
              <h3 className="text-sm font-medium text-amber-300 mb-2">The Bad</h3>
              <div className="space-y-1">
                {testResult.bad.map((item: string, index: number) => (
                  <div key={index} className="text-xs text-amber-200">
                    • {item}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Ugly */}
            <div className="rounded-lg border border-rose-600/30 bg-rose-500/5 p-4">
              <h3 className="text-sm font-medium text-rose-300 mb-2">The Ugly</h3>
              <div className="space-y-1">
                {testResult.ugly && testResult.ugly.map((item: string, index: number) => (
                  <div key={index} className="text-xs text-rose-200">
                    • {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
