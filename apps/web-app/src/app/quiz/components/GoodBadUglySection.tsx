import React from 'react';

interface GoodBadUglySectionProps {
  analysis: {
    good: string[];
    bad: string[];
    ugly?: string;
  };
}

export default function GoodBadUglySection({ analysis }: GoodBadUglySectionProps) {
  // Ensure we only show 1-3 items per category
  const goodItems = analysis.good.slice(0, 3);
  const badItems = analysis.bad.slice(0, 3);
  
  return (
    <div className="space-y-4">
      {/* Good */}
      <div className="rounded-2xl border border-emerald-600/30 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <div className="text-sm font-medium text-emerald-300">✅ The Good</div>
        </div>
        <div className="space-y-2">
          {goodItems.length > 0 ? (
            goodItems.map((item, index) => (
              <div key={index} className="text-base text-emerald-200 font-bold text-center">
                "{item}"
              </div>
            ))
          ) : (
            <div className="text-sm text-emerald-400 italic text-center">No Close lines detected</div>
          )}
        </div>
        <div className="mt-3 text-xs text-emerald-400 text-center">
          Stable. Outcomes land. Clear tempo.
        </div>
      </div>

      {/* Bad */}
      <div className="rounded-2xl border border-amber-600/30 bg-amber-500/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <div className="text-sm font-medium text-amber-300">⚠️ The Bad</div>
        </div>
        <div className="space-y-2">
          {badItems.length > 0 ? (
            badItems.map((item, index) => (
              <div key={index} className="text-base text-amber-200 font-bold text-center">
                "{item}"
              </div>
            ))
          ) : (
            <div className="text-sm text-amber-400 italic text-center">All lines are Close</div>
          )}
        </div>
        <div className="mt-3 text-xs text-amber-400 text-center">
          Variability enters. Delays creep in.
        </div>
      </div>

      {/* Ugly */}
      {analysis.ugly && (
        <div className="rounded-2xl border border-rose-600/30 bg-rose-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            <div className="text-sm font-medium text-rose-300">❌ The Ugly</div>
          </div>
          <div className="text-base text-rose-200 font-bold text-center">
            "{analysis.ugly}"
          </div>
        </div>
      )}
    </div>
  );
}
