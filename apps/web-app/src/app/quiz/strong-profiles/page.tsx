'use client';

import React, { useState, useMemo } from 'react';
import archetypeData from '../../../data/archetype_decoder.json';
import { composeAIR } from '../results/composeAIR';
import HeaderSection from '../components/HeaderSection';
import TradeCardsSection from '../components/TradeCardsSection';
import GoodBadUglySection from '../components/GoodBadUglySection';
import type { LineVerdict, QuizResult } from '@/lib/air-generator';

type ArchetypeEntry = {
  code: string;
  archetype: string;
  label: string;
};

type StrengthCategory = {
  name: string;
  description: string;
  minCloseCount: number;
  maxCloseCount: number;
  color: string;
};

const strengthCategories: StrengthCategory[] = [
  {
    name: "Perfect Axis",
    description: "All 7 lines Close - Unbreakable integrity",
    minCloseCount: 7,
    maxCloseCount: 7,
    color: "bg-emerald-600 hover:bg-emerald-700"
  },
  {
    name: "Near Perfect",
    description: "6 Close, 1 Offset - Exceptional strength",
    minCloseCount: 6,
    maxCloseCount: 6,
    color: "bg-blue-600 hover:bg-blue-700"
  },
  {
    name: "Strong Axis",
    description: "5 Close, 2 Offset - Solid foundation",
    minCloseCount: 5,
    maxCloseCount: 5,
    color: "bg-cyan-600 hover:bg-cyan-700"
  },
  {
    name: "Steady Axis",
    description: "4 Close, 3 Offset - Reliable patterns",
    minCloseCount: 4,
    maxCloseCount: 4,
    color: "bg-teal-600 hover:bg-teal-700"
  }
];

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
    "group grid grid-cols-4 items-center gap-2 rounded-xl px-2 py-2 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 hover:bg-indigo-900/50 hover:ring-2 hover:ring-indigo-400";

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

// ---------- Category Selection (Enhanced) ----------
const CategorySelector: React.FC<{
  categories: StrengthCategory[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  profileCounts: Record<string, number>;
}> = ({ categories, selectedCategory, onSelectCategory, profileCounts }) => {
  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category) => {
          const count = profileCounts[category.name] || 0;
          const isSelected = selectedCategory === category.name;
          
          return (
            <button
              key={category.name}
              onClick={() => onSelectCategory(isSelected ? null : category.name)}
              className={`group grid grid-cols-6 items-center gap-2 rounded-xl px-4 py-3 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 hover:bg-indigo-900/50 hover:ring-2 hover:ring-indigo-400 ${
                isSelected ? "bg-indigo-900/50 ring-2 ring-indigo-400" : "bg-white/[0.03]"
              }`}
            >
              <div className="col-span-4">
                <div className="text-sm font-semibold text-white">{category.name}</div>
                <div className="text-xs text-zinc-400">{category.description}</div>
              </div>
              <div className="col-span-2 text-right">
                <div className="text-lg font-bold text-indigo-400">{count}</div>
                <div className="text-xs text-zinc-500">profiles</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ---------- Profile Selection Grid (Simplified) ----------
const ProfileSelectionGrid: React.FC<{
  profiles: ArchetypeEntry[];
  onSelectProfile: (archetype: ArchetypeEntry) => void;
}> = ({ profiles, onSelectProfile }) => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((archetype) => {
          const closeCount = (archetype.code.match(/C/g) || []).length;
          const offsetCount = (archetype.code.match(/O/g) || []).length;
          const farCount = (archetype.code.match(/F/g) || []).length;
            
            return (
              <button
                key={archetype.code}
                onClick={() => onSelectProfile(archetype)}
              className="group text-left rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                aria-label={`Open ${archetype.archetype} details`}
              >
              {/* Archetype Header */}
              <div className="mb-3">
                <div className="text-lg font-semibold text-white mb-1">{archetype.archetype}</div>
                <div className="text-sm text-zinc-400">{archetype.label}</div>
                </div>

                {/* Profile Code */}
              <div className="mb-3">
                <div className="rounded-lg bg-zinc-800/60 p-2 text-center text-xs font-mono text-white inline-block">
                  {archetype.code}
                </div>
                </div>

              {/* Stats Row */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-600/20 px-2 py-1 text-emerald-300 font-semibold">
                    {closeCount}C
                  </span>
                  <span className="rounded-full bg-amber-600/20 px-2 py-1 text-amber-300 font-semibold">
                    {offsetCount}O
                  </span>
                  <span className="rounded-full bg-rose-600/20 px-2 py-1 text-rose-300 font-semibold">
                    {farCount}F
                  </span>
                </div>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
};

export default function StrongProfilesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArchetype, setSelectedArchetype] = useState<ArchetypeEntry | null>(null);
  const [showResults, setShowResults] = useState(false);

  const archetypes = archetypeData as ArchetypeEntry[];

  const categorizedProfiles = useMemo(() => {
    const categories: Record<string, ArchetypeEntry[]> = {};
    
    strengthCategories.forEach(category => {
      categories[category.name] = archetypes.filter(archetype => {
        const closeCount = (archetype.code.match(/C/g) || []).length;
        return closeCount >= category.minCloseCount && closeCount <= category.maxCloseCount;
      });
    });

    return categories;
  }, [archetypes]);

  const profileCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    strengthCategories.forEach(category => {
      counts[category.name] = categorizedProfiles[category.name]?.length || 0;
    });
    return counts;
  }, [categorizedProfiles]);

  const totalStrongProfiles = Object.values(categorizedProfiles).reduce((sum, profiles) => sum + profiles.length, 0);

  // ---------- REAL QUIZ ENGINE INTEGRATION ----------
  const generateRealDiagnostic = (archetype: ArchetypeEntry): QuizResult => {
    const lines = ['Control', 'Pace', 'Boundary', 'Truth', 'Recognition', 'Bonding', 'Stress'];
    
    // Create real LineVerdict objects that match the QuizApp format
    const verdicts: LineVerdict[] = lines.map((line, index) => {
      const distance = archetype.code[index] === 'C' ? 'Close' : archetype.code[index] === 'O' ? 'Offset' : 'Far';
      
      // Generate realistic base and final counts based on distance
      let baseCounts, finalCounts;
      if (distance === 'Close') {
        // Close: High A (CLOSE), low B/C
        baseCounts = { A: 3, B: 0, C: 0 };
        finalCounts = { A: 3, B: 0, C: 0 };
      } else if (distance === 'Offset') {
        // Offset: High B (STALL), some A, low C
        baseCounts = { A: 1, B: 2, C: 0 };
        finalCounts = { A: 0, B: 3, C: 0 };
      } else {
        // Far: High C (FRAG), low A/B
        baseCounts = { A: 0, B: 1, C: 2 };
        finalCounts = { A: 0, B: 0, C: 3 };
      }

      // Create realistic slip driver descriptions
      const slipDrivers = {
        'Control': 'context pressure',
        'Pace': 'deadline stress',
        'Boundary': 'social dynamics',
        'Truth': 'complexity overload',
        'Recognition': 'attention splitting',
        'Bonding': 'relationship tension',
        'Stress': 'systemic pressure'
      };

      // Generate realistic diagnostic cards using the real system
      const card = generateDiagnosticCard(line, distance, slipDrivers[line as keyof typeof slipDrivers]);

      return {
        line,
        distance,
        base: `${baseCounts.A}-${baseCounts.B}-${baseCounts.C}`,
        final: `${finalCounts.A}-${finalCounts.B}-${finalCounts.C}`,
        counts: { base: baseCounts, final: finalCounts },
        slipDriver: slipDrivers[line as keyof typeof slipDrivers],
        variance: false,
        card
      };
    });

    // Use the REAL QuizApp engine to generate results
    return composeAIR(verdicts, 'standard');
  };

  // Generate realistic diagnostic cards that match the real system
  const generateDiagnosticCard = (line: string, distance: string, slipDriver: string): string => {
    const baseCards = {
      'Control': {
        'Close': 'You maintain clear command under pressure. Your authority remains steady even when systems are stressed. **Truth:** you stay aligned with your core patterns.',
        'Offset': 'Under pressure, your control shifts to accommodate context. You adapt your approach while maintaining direction. **Truth:** flexibility serves your goals.',
        'Far': 'When stressed, control becomes distributed across the system. You rely on emergent coordination rather than direct command. **Truth:** you trust collective intelligence.'
      },
      'Pace': {
        'Close': 'Your tempo remains consistent regardless of external pressure. You maintain steady rhythm even in chaos. **Truth:** your pace is your anchor.',
        'Offset': 'Under stress, you adjust timing to match context demands. You slow down when needed, speed up when possible. **Truth:** adaptive pacing preserves quality.',
        'Far': 'When overwhelmed, your pace becomes responsive to system needs. You follow the flow rather than setting it. **Truth:** you surrender to emergent timing.'
      },
      'Boundary': {
        'Close': 'Your boundaries stay firm under pressure. You maintain clear limits even when others push. **Truth:** your boundaries protect your integrity.',
        'Offset': 'Under stress, boundaries become negotiable based on context. You adapt limits to preserve relationships. **Truth:** flexible boundaries maintain connection.',
        'Far': 'When pressured, boundaries dissolve into system dynamics. You become permeable to maintain flow. **Truth:** you prioritize harmony over separation.'
      },
      'Truth': {
        'Close': 'Your truth remains unwavering under pressure. You speak clearly even when it\'s uncomfortable. **Truth:** your honesty is your foundation.',
        'Offset': 'Under stress, truth becomes contextual and adaptive. You adjust your message to maintain understanding. **Truth:** clarity serves connection.',
        'Far': 'When overwhelmed, truth emerges from collective dialogue. You discover truth through conversation. **Truth:** truth is co-created.'
      },
      'Recognition': {
        'Close': 'Your awareness stays sharp under pressure. You notice patterns even in chaos. **Truth:** your perception is your advantage.',
        'Offset': 'Under stress, recognition becomes selective and focused. You prioritize what matters most. **Truth:** focused attention reveals what\'s essential.',
        'Far': 'When pressured, recognition becomes distributed across the system. You rely on collective awareness. **Truth:** shared perception is more complete.'
      },
      'Bonding': {
        'Close': 'Your connections remain strong under pressure. You maintain relationships even when stressed. **Truth:** your bonds are your strength.',
        'Offset': 'Under stress, bonding becomes more selective and intentional. You focus on key relationships. **Truth:** quality connections matter more than quantity.',
        'Far': 'When pressured, bonding becomes fluid and adaptive. You connect where energy flows. **Truth:** natural affinity creates the strongest bonds.'
      },
      'Stress': {
        'Close': 'Your stress response remains controlled and productive. You channel pressure into performance. **Truth:** stress is your fuel.',
        'Offset': 'Under pressure, stress becomes manageable and adaptive. You adjust your response to context. **Truth:** stress teaches you flexibility.',
        'Far': 'When overwhelmed, stress becomes distributed and shared. You don\'t carry it alone. **Truth:** shared stress is lighter stress.'
      }
    };

    return baseCards[line as keyof typeof baseCards]?.[distance as keyof typeof baseCards[keyof typeof baseCards]] || 
           `Under ${slipDriver}, your ${line.toLowerCase()} patterns shift. **Truth:** adaptation reveals your true nature.`;
  };

  const handleSelectProfile = (archetype: ArchetypeEntry) => {
    setSelectedArchetype(archetype);
    setShowResults(true);
  };

  const handleBackToProfiles = () => {
    setShowResults(false);
    setSelectedArchetype(null);
  };

  // If showing results, display the EXACT same content as QuizApp
  if (showResults && selectedArchetype) {
    const result = generateRealDiagnostic(selectedArchetype);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-neutral-100">
        <div className="mx-auto max-w-7xl p-4">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={handleBackToProfiles}
              className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all"
            >
              ← Back to Strong Profiles
            </button>
          </div>

          {/* EXACT SAME CONTENT AS QUIZAPP RESULTS */}
          <div className="space-y-6">
            {/* PROMINENT ARCHETYPE HEADLINE */}
            <div className="text-center mb-8">
              <div className="space-y-4">
                {/* Main Archetype Display */}
                <div className="backdrop-blur-xl bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-3xl border border-purple-500/30 p-6 shadow-2xl">
                  <div className="text-5xl mb-3">🎭</div>
                  <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
                    {selectedArchetype.archetype}
                  </h1>
                  <p className="text-lg text-purple-200 mb-3 max-w-xl mx-auto leading-relaxed">
                    {selectedArchetype.label}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                    {/* Profile Code */}
                    <div className="inline-flex items-center gap-2 rounded-full bg-purple-800/30 px-3 py-1.5 border border-purple-500/30">
                      <span className="text-purple-300 font-mono text-xs">Profile Code:</span>
                      <span className="text-purple-100 font-bold font-mono text-base">{selectedArchetype.code}</span>
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

  // Show the profile selection interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-neutral-100">
      <div className="mx-auto max-w-7xl p-4">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 p-6 mb-4">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              🏆 Strong Axis Profiles
            </h1>
            <p className="text-neutral-300 mb-4 text-lg">
              {totalStrongProfiles} profiles with 4+ Close lines - representing strong axis integrity
            </p>
            <a 
              href="/quiz" 
              className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all"
            >
              ← Back to Quiz
            </a>
          </div>
        </div>

        {/* Category Selector */}
        <CategorySelector
          categories={strengthCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          profileCounts={profileCounts}
        />

        {/* Profile Heat Map */}
        {selectedCategory && (
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-semibold uppercase tracking-wide text-zinc-400">
              {selectedCategory} Profiles
            </h2>
            <ProfileSelectionGrid
              profiles={categorizedProfiles[selectedCategory] || []}
              onSelectProfile={handleSelectProfile}
            />
          </div>
        )}

        {/* Stats Dashboard */}
        <div className="mt-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6">
          <h3 className="text-2xl font-bold mb-4 text-center text-white">📊 Strong Axis Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {strengthCategories.map((category) => {
              const profiles = categorizedProfiles[category.name] || [];
              return (
                <div key={category.name} className="text-center">
                  <div className="text-3xl font-bold text-emerald-400 mb-1">{profiles.length}</div>
                  <div className="text-neutral-300 text-sm">{category.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

