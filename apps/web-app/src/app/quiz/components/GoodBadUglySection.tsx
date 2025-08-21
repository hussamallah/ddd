import React from 'react';

interface GoodBadUglySectionProps {
  analysis: {
    good: string[];
    bad: string[];
    ugly?: string;
  };
}

export default function GoodBadUglySection({ analysis }: GoodBadUglySectionProps) {
  return (
    <div className="space-y-4">
      {/* Good */}
      <div className="rounded-2xl border border-emerald-600/30 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <div className="text-sm font-medium text-emerald-300">The Good</div>
        </div>
        <div className="space-y-1">
          {analysis.good.length > 0 ? (
            analysis.good.map((item, index) => (
              <div key={index} className="text-sm text-emerald-200">
                • {item}
              </div>
            ))
          ) : (
            <div className="text-sm text-emerald-400 italic">No Close lines detected</div>
          )}
        </div>
        {analysis.good.length > 0 && (
          <div className="mt-2 text-xs text-emerald-400">
            These lines give others: ownership, closure, clear tempo
          </div>
        )}
      </div>

      {/* Bad */}
      <div className="rounded-2xl border border-amber-600/30 bg-amber-500/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <div className="text-sm font-medium text-amber-300">The Bad</div>
        </div>
        <div className="space-y-1">
          {analysis.bad.length > 0 ? (
            analysis.bad.map((item, index) => (
              <div key={index} className="text-sm text-amber-200">
                • {item}
              </div>
            ))
          ) : (
            <div className="text-sm text-amber-400 italic">All lines are Close</div>
          )}
        </div>
        {analysis.bad.length > 0 && (
          <div className="mt-2 text-xs text-amber-400">
            These lines show: stall tax, optics bleed, tempo loss
          </div>
        )}
      </div>

      {/* Ugly */}
      {analysis.ugly && (
        <div className="rounded-2xl border border-rose-600/30 bg-rose-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            <div className="text-sm font-medium text-rose-300">The Ugly</div>
          </div>
          <div className="text-sm text-rose-200 leading-relaxed">
            {analysis.ugly}
          </div>
        </div>
      )}
    </div>
  );
}
