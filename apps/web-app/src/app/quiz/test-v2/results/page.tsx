'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { composeAIR } from '../../results/composeAIR';
import { LineVerdict } from '@/lib/types';

// Simple archetype profile generator
function generateArchetypeProfile(verdicts: any[]): any {
  // For now, return a simple profile based on the first line
  const firstLine = verdicts[0]?.line || 'Control';
  const archetype = firstLine === 'Control' ? 'Sovereign' : 
                   firstLine === 'Pace' ? 'Guardian' :
                   firstLine === 'Boundary' ? 'Visionary' :
                   firstLine === 'Truth' ? 'Architect' :
                   firstLine === 'Recognition' ? 'Spotlight' :
                   firstLine === 'Bonding' ? 'Provider' :
                   firstLine === 'Stress' ? 'Diplomat' : 'Sovereign';
  
  return {
    archetype,
    name: archetype,
    primaryLine: firstLine,
    secondaryLine: undefined
  };
}

// Archetype colors from integrated quiz bank
const ARCHETYPE_COLORS: Record<string, { name: string; hex: string }> = {
  "Sovereign": { "name": "Imperial Purple", "hex": "#6B2F8A" },
  "Visionary": { "name": "Indigo", "hex": "#3F51B5" },
  "Rebel": { "name": "Crimson", "hex": "#C62828" },
  "Equalizer": { "name": "Teal", "hex": "#00897B" },
  "Provider": { "name": "Sage Green", "hex": "#5E8C6A" },
  "Wanderer": { "name": "Turquoise", "hex": "#1ABC9C" },
  "Seeker": { "name": "Midnight Blue", "hex": "#0D47A1" },
  "Mask": { "name": "Charcoal", "hex": "#2E3138" },
  "Partner": { "name": "Rose", "hex": "#D81B60" },
  "Guardian": { "name": "Forest Green", "hex": "#1B5E20" },
  "Servant": { "name": "Ochre", "hex": "#A9782B" },
  "Spotlight": { "name": "Marigold", "hex": "#F9A825" },
  "Architect": { "name": "Blueprint Blue", "hex": "#355AA6" },
  "Strategist": { "name": "Navy", "hex": "#1A2A44" },
  "Catalyst": { "name": "Flame Orange", "hex": "#EF6C00" },
  "Diplomat": { "name": "Olive", "hex": "#6B8E23" },
  "Sentinel": { "name": "Blue-Gray", "hex": "#455A64" },
  "Artisan": { "name": "Terracotta", "hex": "#C65D3A" },
  "Navigator": { "name": "Cerulean", "hex": "#2A9DF4" },
  "Alchemist": { "name": "Citrine", "hex": "#C59A1F" }
};

// ---------- Heat Map Results Display ----------
const ResultsHeatMap: React.FC<{
  lines: any[];
  title?: string;
}> = ({ lines, title = "7 Lines Under Pressure — You Now" }) => {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<any>(null);

  const headerCls =
    "sticky top-0 z-10 grid grid-cols-4 gap-1 rounded-lg bg-zinc-950/70 px-1 py-0.5 text-[10px] text-zinc-400 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/40";
  const rowCls =
    "group grid grid-cols-4 items-center gap-1 rounded-lg px-1 py-1 text-left transition-all duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 hover:bg-indigo-900/50 hover:ring-1 hover:ring-indigo-400";

  return (
    <div className="w-full">
      {title && (
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">{title}</h2>
      )}
      <div className="w-full">
        <div className="w-full rounded-xl bg-zinc-900/40 p-1">
          {/* Legend */}
          <div className="mb-2 text-center">
            <div className="inline-flex items-center gap-2 text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <span className="text-green-400">✅</span>
                <span>Stable</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="text-amber-400">⚠️</span>
                <span>Offset</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="text-red-400">❌</span>
                <span>Break</span>
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
          <div className="mt-0.5 space-y-0.5">
            {lines.map((line, idx) => (
              <button
                key={line.line}
                onClick={() => { setSelected(line); setOpen(true); }}
                className={`${rowCls} w-full ${idx % 2 === 0 ? "bg-white/0" : "bg-white/[0.03]"}`}
                aria-label={`Open ${line.line} details`}
              >
                {/* Line */}
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-white">
                    {line.line === 'Control' ? '🎯 Control' :
                     line.line === 'Pace' ? '⏰ Pace' :
                     line.line === 'Boundary' ? '🛡️ Boundary' :
                     line.line === 'Truth' ? '⚖️ Truth' :
                     line.line === 'Recognition' ? '👁️ Recognition' :
                     line.line === 'Bonding' ? '🤝 Bonding' :
                     line.line === 'Stress' ? '🔥 Stress' :
                     line.line}
                  </span>
                </div>

                {/* Status */}
                <div className="flex items-center justify-center">
                  {line.distance === 'Close' ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full px-1 py-0.5 text-[10px] font-semibold text-white bg-green-600/70">
                      ✅
                    </span>
                  ) : line.distance === 'Offset' ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full px-1 py-0.5 text-[10px] font-semibold text-white bg-amber-500/70">
                      ⚠️
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 rounded-full px-1 py-0.5 text-[10px] font-semibold text-white bg-red-600/70">
                      ❌
                    </span>
                  )}
                </div>

                {/* Trips You */}
                <div className="rounded-lg bg-zinc-800/60 p-0.5 text-center text-[10px] text-white truncate">
                  {line.slipDriver}
                </div>

                {/* Steady Truth */}
                <div className="rounded-lg bg-black/30 p-0.5 text-center text-[10px] text-white truncate">
                  {line.card.split('Truth:')[1]?.trim() || line.card.split('.').slice(-2).join('.')}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Simple Modal for line details */}
      {open && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">{selected.line} Details</h3>
              <button 
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-zinc-400 mb-2">Status</h4>
                <p className="text-white">{selected.distance}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-400 mb-2">Trips You</h4>
                <p className="text-white">{selected.slipDriver}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-400 mb-2">Full Card</h4>
                <p className="text-white">{selected.card}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const GbuDiagnosticCards: React.FC<{
  good: string;
  bad: string;
  ugly?: string;
  goodFooter?: string;
  badFooter?: string;
}> = ({ good, bad, ugly, goodFooter, badFooter }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white mb-4">Diagnostic Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Good Card */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
          <div className="text-2xl mb-3">✅</div>
          <h4 className="text-lg font-semibold text-green-300 mb-2">Stable Patterns</h4>
          <p className="text-green-200 mb-3">{good}</p>
          {goodFooter && (
            <div className="text-sm text-green-400/80 italic">{goodFooter}</div>
          )}
        </div>

        {/* Bad Card */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
          <div className="text-2xl mb-3">⚠️</div>
          <h4 className="text-lg font-semibold text-yellow-300 mb-2">Variable Patterns</h4>
          <p className="text-green-200 mb-3">{bad}</p>
          {badFooter && (
            <div className="text-sm text-yellow-400/80 italic">{badFooter}</div>
          )}
        </div>
      </div>

      {/* Ugly Card (if exists) */}
      {ugly && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <div className="text-2xl mb-3">❌</div>
          <h4 className="text-lg font-semibold text-red-300 mb-2">Break Patterns</h4>
          <p className="text-red-200">{ugly}</p>
        </div>
      )}
    </div>
  );
};

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get results from URL params or localStorage
    const verdictsParam = searchParams.get('verdicts');
    const selectedModeParam = searchParams.get('mode');
    
    if (verdictsParam && selectedModeParam) {
      try {
        const verdicts = JSON.parse(decodeURIComponent(verdictsParam));
        const selectedMode = selectedModeParam;
        
        const result = composeAIR(verdicts, selectedMode);
        const archetypeProfile = generateArchetypeProfile(verdicts);
        
        setResults({ result, archetypeProfile, verdicts, selectedMode });
        setLoading(false);
      } catch (error) {
        console.error('Error parsing results:', error);
        setLoading(false);
      }
    } else {
      // Try to get from localStorage as fallback
      const storedResults = localStorage.getItem('quizResults');
      if (storedResults) {
        try {
          const parsed = JSON.parse(storedResults);
          setResults(parsed);
          setLoading(false);
        } catch (error) {
          console.error('Error parsing stored results:', error);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-red-400">No Results Found</h1>
          <p className="text-xl mb-6 text-neutral-300">Please complete the quiz first</p>
          <button
            onClick={() => router.push('/quiz/test-v2')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Take Quiz
          </button>
        </div>
      </div>
    );
  }

  const { result, archetypeProfile, verdicts, selectedMode } = results;
  
  // Get archetype color for theming
  const archetypeColor = ARCHETYPE_COLORS[archetypeProfile.archetype] || ARCHETYPE_COLORS.Sovereign;
  
  return (
    <div 
      className="min-h-screen bg-black text-white relative overflow-hidden"
      style={{
        background: `radial-gradient(circle at center, ${archetypeColor.hex}10 0%, ${archetypeColor.hex}05 50%, #000000 100%)`,
        transform: 'scale(0.85)',
        transformOrigin: 'top center',
        marginTop: '-10vh'
      }}
    >
      {/* Glowing Background Elements */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at 30% 20%, ${archetypeColor.hex}40 0%, transparent 50%),
                      radial-gradient(circle at 70% 80%, ${archetypeColor.hex}30 0%, transparent 50%)`
        }}
      />
      
      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Quiz Complete</h1>
          <p className="text-xl text-neutral-300">Your archetype profile and operating lines assessment</p>
        </div>
        
        {/* Results Header */}
        <div className="text-center mb-12">
          {/* Archetype Icon - Centered and Glowing */}
          <div className="mb-6 flex justify-center">
            <div 
              className="p-4 rounded-full"
              style={{
                background: `radial-gradient(circle, ${archetypeColor.hex}30, ${archetypeColor.hex}10)`,
                boxShadow: `0 0 30px ${archetypeColor.hex}50, 0 0 60px ${archetypeColor.hex}30`
              }}
            >
              <div className="text-4xl">🎭</div>
            </div>
          </div>
          
          {/* Main Title - Glowing Archetype Name */}
          <h1 
            className="text-6xl font-black mb-4 tracking-wider"
            style={{
              color: archetypeColor.hex,
              textShadow: `0 0 20px ${archetypeColor.hex}, 0 0 40px ${archetypeColor.hex}80`
            }}
          >
            {archetypeProfile.archetype.toUpperCase()}
          </h1>
          
          {/* Subtitle 1 */}
          <h2 className="text-2xl text-white mb-2 font-medium">
            {(() => {
              // Find all lines that are not Close (Offset or Far)
              const offLines = verdicts.filter((l: LineVerdict) => l.distance !== 'Close');
              
              // Group by distance type
              const brokenLines = offLines.filter((l: LineVerdict) => l.distance === 'Far').map((l: LineVerdict) => l.line);
              const stalledLines = offLines.filter((l: LineVerdict) => l.distance === 'Offset').map((l: LineVerdict) => l.line);
              
              // Create descriptive combinations
              let description = '';
              
              if (brokenLines.length > 0) {
                description += `${brokenLines.join(', ')} Broken`;
              }
              
              if (stalledLines.length > 0) {
                if (description) description += ' — ';
                description += `${stalledLines.join(', ')} Stalled`;
              }
              
              if (!description) {
                description = 'All Lines Stable';
              }
              
              return description;
            })()}
          </h2>
        </div>

        {/* MAIN CONTENT BLOCK */}
        <div 
          className="max-w-2xl mx-auto mb-12 p-8 rounded-2xl backdrop-blur-sm"
          style={{
            background: `linear-gradient(135deg, ${archetypeColor.hex}15, ${archetypeColor.hex}25, ${archetypeColor.hex}15)`,
            border: `1px solid ${archetypeColor.hex}30`
          }}
        >
          <h3 
            className="text-2xl font-bold mb-4"
            style={{ color: archetypeColor.hex }}
          >
            What These Traits Reveal About You
          </h3>
          <div className="space-y-4 text-lg text-white/90 leading-relaxed">
            <p>
              Every answer you gave was a real reflection of your way of moving through life—not a guess, not an ideal.
            </p>
            <p>
              You didn't invent these patterns; they're the lines your experience has already drawn.
            </p>
          </div>
          
          {/* Glowing Line */}
          <div 
            className="mt-6 h-1 rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${archetypeColor.hex}, transparent)`,
              boxShadow: `0 0 10px ${archetypeColor.hex}`
            }}
          />
        </div>

        {/* Results Heat Map */}
        <div 
          className="max-w-6xl mx-auto mb-8 p-6 rounded-2xl backdrop-blur-sm"
          style={{
            background: `linear-gradient(135deg, ${archetypeColor.hex}20, ${archetypeColor.hex}30)`,
            border: `1px solid ${archetypeColor.hex}40`,
            boxShadow: `0 0 20px ${archetypeColor.hex}20`
          }}
        >
          <ResultsHeatMap lines={result.lines} />
        </div>
        
        {/* Good/Bad/Ugly Analysis */}
        <div 
          className="max-w-6xl mx-auto mb-8 p-6 rounded-2xl backdrop-blur-sm"
          style={{
            background: `linear-gradient(135deg, ${archetypeColor.hex}20, ${archetypeColor.hex}30)`,
            border: `1px solid ${archetypeColor.hex}40`,
            boxShadow: `0 0 20px ${archetypeColor.hex}20`
          }}
        >
          <GbuDiagnosticCards
            good={result.goodBadUgly.good}
            bad={result.goodBadUgly.bad}
            ugly={result.goodBadUgly.ugly || ''}
            goodFooter="Stable. Outcomes land. Clear tempo."
            badFooter="Variability enters. Delays creep in."
          />
        </div>
        
        {/* Mode-Specific Insights */}
        {selectedMode !== 'original' && result.modeSpecificInsights && (
          <div 
            className="max-w-6xl mx-auto mb-8 p-6 rounded-2xl backdrop-blur-sm"
            style={{
              background: `linear-gradient(135deg, ${archetypeColor.hex}20, ${archetypeColor.hex}30)`,
              border: `1px solid ${archetypeColor.hex}40`,
              boxShadow: `0 0 20px ${archetypeColor.hex}20`
            }}
          >
            <h3 
              className="text-xl font-semibold mb-4"
              style={{ color: archetypeColor.hex }}
            >
              {selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1)} Mode Insights
            </h3>
            <div className="space-y-2 text-base text-white/90">
              {result.modeSpecificInsights.heatAnalysis && (
                <p>{result.modeSpecificInsights.heatAnalysis}</p>
              )}
              {result.modeSpecificInsights.thirdPersonPattern && (
                <p>{result.modeSpecificInsights.thirdPersonPattern}</p>
              )}
              {result.modeSpecificInsights.betOutcome && (
                <p>{result.modeSpecificInsights.betOutcome}</p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="text-center mt-12">
          <button
            onClick={() => router.push('/quiz/test-v2')}
            className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 mr-4"
          >
            Take Quiz Again
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-4 bg-neutral-600 text-white rounded-xl hover:bg-neutral-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
