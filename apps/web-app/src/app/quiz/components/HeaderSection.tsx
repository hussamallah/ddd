import React from 'react';

interface HeaderSectionProps {
  result: {
    axisTier: string;
    profileCode: string;
    aRate: number;
    primaryDrift: string;
    farLines: number;
  };
}

export default function HeaderSection({ result }: HeaderSectionProps) {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Solid': return 'text-emerald-400';
      case 'Steady': return 'text-blue-400';
      case 'Mixed': return 'text-amber-400';
      case 'Unstable': return 'text-rose-400';
      default: return 'text-neutral-400';
    }
  };

  const getDriftColor = (drift: string) => {
    return drift === 'Stall' ? 'text-amber-400' : 'text-rose-400';
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        {/* Axis Tier */}
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wider text-neutral-400">Axis Tier</div>
          <div className={`text-2xl font-bold ${getTierColor(result.axisTier)}`}>
            {result.axisTier}
          </div>
        </div>

        {/* Profile Code */}
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wider text-neutral-400">Profile Code</div>
          <div className="text-lg font-mono font-semibold text-neutral-200">
            {result.profileCode}
          </div>
        </div>

        {/* A-Rate */}
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wider text-neutral-400">Hold Rate</div>
          <div className="text-lg font-semibold text-neutral-200">
            {Math.round(result.aRate * 100)}%
          </div>
        </div>

        {/* Primary Drift */}
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wider text-neutral-400">Primary Drift</div>
          <div className={`text-lg font-semibold ${getDriftColor(result.primaryDrift)}`}>
            {result.primaryDrift}
          </div>
        </div>

        {/* Far Lines */}
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wider text-neutral-400">Far Lines</div>
          <div className="text-lg font-semibold text-neutral-200">
            {result.farLines}
          </div>
        </div>
      </div>
    </div>
  );
}
