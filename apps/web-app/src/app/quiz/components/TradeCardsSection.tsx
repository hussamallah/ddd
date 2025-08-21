import React from 'react';

interface LineVerdict {
  line: string;
  distance: 'Close' | 'Offset' | 'Far';
  base: string;
  final: string;
  slipDriver: string;
  variance: boolean;
  card: string;
}

interface TradeCardsSectionProps {
  lines: LineVerdict[];
}

export default function TradeCardsSection({ lines }: TradeCardsSectionProps) {
  const getDistanceColor = (distance: string) => {
    switch (distance) {
      case 'Close': return 'bg-emerald-500/15 text-emerald-300 border border-emerald-600/30';
      case 'Offset': return 'bg-amber-500/15 text-amber-300 border border-amber-600/30';
      case 'Far': return 'bg-rose-500/15 text-rose-300 border border-rose-600/30';
      default: return 'bg-neutral-500/15 text-neutral-300 border border-neutral-600/30';
    }
  };

  const getDistanceLabel = (distance: string) => {
    switch (distance) {
      case 'Close': return 'C';
      case 'Offset': return 'O';
      case 'Far': return 'F';
      default: return distance;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-neutral-300 mb-4">7 Lines Under Pressure — You Now</div>
      
      <div className="grid gap-4">
        {lines.map((line, index) => (
          <div key={index} className="rounded-xl border border-neutral-800 p-5 bg-neutral-900/40">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                <div className="font-semibold text-lg text-neutral-200">{line.line}</div>
                <div className="text-sm text-neutral-400">
                  Slip driver: <span className="text-neutral-300">{line.slipDriver}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${getDistanceColor(line.distance)}`}>
                  {getDistanceLabel(line.distance)}
                </span>
                <span className="text-xs text-neutral-500 font-mono">
                  {line.base} → {line.final}
                </span>
              </div>
            </div>

            {/* Variance indicator */}
            {line.variance && (
              <div className="mb-3">
                <span className="text-[11px] uppercase tracking-wide text-neutral-500 bg-neutral-800 px-2 py-1 rounded">
                  variance
                </span>
              </div>
            )}

            {/* Diagnostic Card */}
            <div className="text-sm text-neutral-300 leading-relaxed">
              {line.card}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
