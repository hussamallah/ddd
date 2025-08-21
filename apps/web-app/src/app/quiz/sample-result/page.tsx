"use client";

import React from 'react';
import { composeAIR } from '../results/composeAIR';
import GoodBadUglySection from '../components/GoodBadUglySection';
import type { LineVerdict, QuizResult } from '@/lib/air-generator';

// ---------- Heat Map Components (Mirrored from QuizApp) ----------
const tokenColor = (t: string) =>
  t === "C" ? "bg-emerald-600/70" : t === "O" ? "bg-amber-500/70" : "bg-rose-600/70";

const Count = ({ v }: { v: string }) => (
  <span className="tabular-nums font-semibold">{v}</span>
);

const TokenPill: React.FC<{ t: string }> = ({ t }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-white ${tokenColor(t)}`}>
    {t === "C" ? "Close" : t === "O" ? "Offset" : "Frag"}
  </span>
);

// ---------- Results Heat Map (Mirrored from QuizApp) ----------
const ResultsHeatMap: React.FC<{
  lines: any[];
  title?: string;
}> = ({ lines, title = "7 Lines Under Pressure — You Now" }) => {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<any>(null);

  const headerCls =
    "sticky top-0 z-10 grid grid-cols-4 gap-2 rounded-xl bg-zinc-950/70 px-2 py-1 text-[11px] text-zinc-400 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/40";
  const rowCls =
    "group grid grid-cols-4 items-center gap-2 rounded-xl px-2 py-2 text-left transition-all duration-200 focus-outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 hover:bg-indigo-900/50 hover:ring-2 hover:ring-indigo-400";

  return (
    <div className="w-full">
      {title && (
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">{title}</h2>
      )}
      <div className="w-full">
        <div className="w-full rounded-2xl border border-white/10 bg-zinc-900/40 p-2 ring-1 ring-white/5">
          {/* Legend */}
          <div className="mb-3 text-center">
            <div className="inline-flex items-center gap-4 text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <span className="text-green-400">✅</span>
                <span>Stable — line holds</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="text-amber-400">⚠️</span>
                <span>Offset — wobbles</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="text-red-400">❌</span>
                <span>Break — collapses</span>
              </span>
            </div>
          </div>

          {/* Header */}
          <div className={headerCls}>
            <div>Line</div>
            <div className="text-center">Status</div>
            <div className="text-center">Trips You</div>
            <div className="text-center">Steady Truth</div>
          </div>

          {/* Rows */}
          <div className="mt-1 space-y-0.5">
            {lines.map((line, idx) => (
              <button
                key={line.line}
                onClick={() => { setSelected(line); setOpen(true); }}
                className={`${rowCls} w-full ${idx % 2 === 0 ? "bg-white/0" : "bg-white/[0.03]"}`}
                aria-label={`Open ${line.line} details`}
              >
                {/* Line */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">
                    {line.line === 'Control' ? '🎯 Control — Who owns the call' :
                     line.line === 'Pace' ? '⏰ Pace — How time is handled' :
                     line.line === 'Boundary' ? '🛡️ Boundary — What gets through' :
                     line.line === 'Truth' ? '⚖️ Truth — How decisions are made' :
                     line.line === 'Recognition' ? '👁️ Recognition — What gets noticed' :
                     line.line === 'Bonding' ? '🤝 Bonding — How ties are held' :
                     line.line === 'Stress' ? '🔥 Stress — What happens under load' :
                     line.line}
                  </span>
                </div>

                {/* Status */}
                <div className="flex items-center justify-center">
                  {line.distance === 'Close' ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-white bg-green-600/70">
                      ✅ Stable
                    </span>
                  ) : line.distance === 'Offset' ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-white bg-amber-500/70">
                      ⚠️ Offset
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-white bg-red-600/70">
                      ❌ Break
                    </span>
                  )}
                </div>

                {/* Trips You */}
                <div className="rounded-lg bg-zinc-800/60 p-1 text-center text-xs text-white truncate">
                  {line.slipDriver}
                </div>

                {/* Steady Truth */}
                <div className="rounded-lg bg-black/30 p-1 text-center text-xs text-white truncate">
                  {line.card.split('Truth:')[1]?.trim() || line.card.split('.').slice(-2).join('.')}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal for line details */}
      {open && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-900/90 p-5 ring-1 ring-white/10 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{selected.line}</h3>
                <TokenPill t={selected.distance === 'Close' ? 'C' : selected.distance === 'Offset' ? 'O' : 'F'} />
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors">
                Close
              </button>
            </div>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
              <span className="rounded-lg bg-zinc-800/60 px-2 py-1">Base <Count v={selected.base} /></span>
              <span className="opacity-60">→</span>
              <span className="rounded-lg bg-zinc-800/60 px-2 py-1">Final <Count v={selected.final} /></span>
              <span className="rounded-lg bg-zinc-800/60 px-2 py-1">Slip: {selected.slipDriver}</span>
            </div>
            <p className="text-sm leading-6 text-zinc-200">{selected.card}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default function SampleResultPage() {
  // Create a REAL sample profile: "Sovereign" archetype (CCCCCCC - all Close lines)
  const sampleVerdicts: LineVerdict[] = [
    {
      line: 'Control',
      distance: 'Close',
      base: '3-0-0',
      final: '3-0-0',
      slipDriver: 'context pressure',
      variance: false,
      card: 'You maintain clear command under pressure. Your authority remains steady even when systems are stressed. **Truth:** you stay aligned with your core patterns.'
    },
    {
      line: 'Pace',
      distance: 'Close',
      base: '3-0-0',
      final: '3-0-0',
      slipDriver: 'deadline stress',
      variance: false,
      card: 'Your tempo remains consistent regardless of external pressure. You maintain steady rhythm even in chaos. **Truth:** your pace is your anchor.'
    },
    {
      line: 'Boundary',
      distance: 'Close',
      base: '3-0-0',
      final: '3-0-0',
      slipDriver: 'social dynamics',
      variance: false,
      card: 'Your boundaries stay firm under pressure. You maintain clear limits even when others push. **Truth:** your boundaries protect your integrity.'
    },
    {
      line: 'Truth',
      distance: 'Close',
      base: '3-0-0',
      final: '3-0-0',
      slipDriver: 'complexity overload',
      variance: false,
      card: 'Your truth remains unwavering under pressure. You speak clearly even when it\'s uncomfortable. **Truth:** your honesty is your foundation.'
    },
    {
      line: 'Recognition',
      distance: 'Close',
      base: '3-0-0',
      final: '3-0-0',
      slipDriver: 'attention splitting',
      variance: false,
      card: 'Your awareness stays sharp under pressure. You notice patterns even in chaos. **Truth:** your perception is your advantage.'
    },
    {
      line: 'Bonding',
      distance: 'Close',
      base: '3-0-0',
      final: '3-0-0',
      slipDriver: 'relationship tension',
      variance: false,
      card: 'Your connections remain strong under pressure. You maintain relationships even when stressed. **Truth:** your bonds are your strength.'
    },
    {
      line: 'Stress',
      distance: 'Close',
      base: '3-0-0',
      final: '3-0-0',
      slipDriver: 'systemic pressure',
      variance: false,
      card: 'Your stress response remains controlled and productive. You channel pressure into performance. **Truth:** stress is your fuel.'
    }
  ];

  // Generate the result using the REAL QuizApp engine
  const result = composeAIR(sampleVerdicts, 'standard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-neutral-100">
      <div className="mx-auto max-w-7xl p-4">
        {/* Back to Quiz Button */}
        <div className="mb-6">
          <a 
            href="/quiz" 
            className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all"
          >
            ← Back to Quiz
          </a>
        </div>

        {/* EXACT SAME CONTENT AS QUIZAPP RESULTS */}
        <div className="space-y-6">
          {/* PROMINENT ARCHETYPE HEADLINE */}
          <div className="text-center mb-8">
            <div className="space-y-4">
              {/* Main Archetype Display */}
              <div className="backdrop-blur-xl bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-3xl border border-purple-500/30 p-6 shadow-2xl">
                <div className="text-5xl mb-3">👑</div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
                  Sovereign
                </h1>
                <p className="text-lg text-purple-200 mb-3 max-w-xl mx-auto leading-relaxed">
                  Commands the room, expects alignment
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                  {/* Profile Code */}
                  <div className="inline-flex items-center gap-2 rounded-full bg-purple-800/30 px-3 py-1.5 border border-purple-500/30">
                    <span className="text-purple-300 font-mono text-xs">Profile Code:</span>
                    <span className="text-purple-100 font-bold font-mono text-base">CCCCCCC</span>
                  </div>
                  
                  {/* Axis Tier */}
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-800/30 px-3 py-1.5 border border-emerald-500/30">
                    <span className="text-emerald-300 font-mono text-xs">Axis Tier:</span>
                    <span className="text-emerald-100 font-bold text-base">{result.axisTier}</span>
                  </div>
                  
                  {/* Primary Drift */}
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-800/30 px-3 py-1.5 border border-amber-500/30">
                    <span className="text-amber-300 font-mono text-xs">Primary Drift:</span>
                    <span className="text-amber-100 font-bold text-base">{result.primaryDrift}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Heat Map Results Display */}
          <ResultsHeatMap lines={result.lines} />
          
          {/* Good/Bad/Ugly Analysis */}
          <GoodBadUglySection analysis={result.goodBadUgly} />
        </div>
      </div>
    </div>
  );
}
