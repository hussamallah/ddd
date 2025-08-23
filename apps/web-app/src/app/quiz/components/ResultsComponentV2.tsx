'use client';

import React from 'react';
import type { QuizResultV2, LineVerdictV2 } from '@/lib/types';
import GbuDiagnosticCards from './GbuDiagnosticCards';

interface ResultsComponentV2Props {
  results: QuizResultV2;
  onRestart: () => void;
}

// Archetype color mapping (copied from original QuizApp)
const ARCHETYPE_COLORS: Record<string, { name: string; hex: string }> = {
  "Sovereign": { "name": "Imperial Purple", "hex": "#6B2F8A" },
  "Rebel": { "name": "Crimson Red", "hex": "#DC2626" },
  "Catalyst": { "name": "Emerald Green", "hex": "#059669" },
  "Strategist": { "name": "Sapphire Blue", "hex": "#2563EB" },
  "Navigator": { "name": "Teal Blue", "hex": "#0D9488" },
  "Visionary": { "name": "Indigo Purple", "hex": "#4F46E5" },
  "Guardian": { "name": "Forest Green", "hex": "#166534" },
  "Equalizer": { "name": "Amber Gold", "hex": "#D97706" },
  "Sentinel": { "name": "Slate Gray", "hex": "#475569" },
  "Seeker": { "name": "Rose Pink", "hex": "#E11D48" },
  "Architect": { "name": "Violet Purple", "hex": "#7C3AED" },
  "Alchemist": { "name": "Copper Orange", "hex": "#EA580C" },
  "Spotlight": { "name": "Yellow Gold", "hex": "#CA8A04" },
  "Mask": { "name": "Neutral Gray", "hex": "#6B7280" },
  "Artisan": { "name": "Cyan Blue", "hex": "#0891B2" },
  "Provider": { "name": "Lime Green", "hex": "#65A30D" },
  "Partner": { "name": "Sky Blue", "hex": "#0284C7" },
  "Servant": { "name": "Pink Rose", "hex": "#DB2777" },
  "Diplomat": { "name": "Mint Green", "hex": "#10B981" },
  "Wanderer": { "name": "Lavender Purple", "hex": "#8B5CF6" }
};

// Archetype Icon Component (copied from original QuizApp)
function ArchetypeIcon({ archetypeName }: { archetypeName: string }) {
  const IconComponent = () => {
    switch (archetypeName.toLowerCase()) {
      case 'sovereign': return <span className="text-4xl"></span>;
      case 'rebel': return <span className="text-4xl"></span>;
      case 'catalyst': return <span className="text-4xl">⚡</span>;
      case 'strategist': return <span className="text-4xl"></span>;
      case 'navigator': return <span className="text-4xl"></span>;
      case 'visionary': return <span className="text-4xl"></span>;
      case 'guardian': return <span className="text-4xl">🛡️</span>;
      case 'equalizer': return <span className="text-4xl">⚖️</span>;
      case 'sentinel': return <span className="text-4xl"></span>;
      case 'seeker': return <span className="text-4xl"></span>;
      case 'architect': return <span className="text-4xl">🏗️</span>;
      case 'alchemist': return <span className="text-4xl"></span>;
      case 'spotlight': return <span className="text-4xl"></span>;
      case 'mask': return <span className="text-4xl"></span>;
      case 'artisan': return <span className="text-4xl"></span>;
      case 'provider': return <span className="text-4xl"></span>;
      case 'partner': return <span className="text-4xl"></span>;
      case 'servant': return <span className="text-4xl"></span>;
      case 'diplomat': return <span className="text-4xl">🕊️</span>;
      case 'wanderer': return <span className="text-4xl">🚶</span>;
      default: return <span className="text-4xl">⭐</span>;
    }
  };

  return (
    <div className="flex items-center justify-center w-16 h-16">
      <IconComponent />
    </div>
  );
}

// Results Heat Map Component (copied from original QuizApp)
const ResultsHeatMap: React.FC<{
  lines: LineVerdictV2[];
  title?: string;
}> = ({ lines, title = "7 Lines Under Pressure — You Now" }) => {
  const getTokenColor = (token: 'C' | 'O' | 'F') => {
    switch (token) {
      case 'C': return 'bg-emerald-600/70';
      case 'O': return 'bg-amber-500/70';
      case 'F': return 'bg-rose-600/70';
      default: return 'bg-neutral-600/70';
    }
  };

  const getTokenLabel = (token: 'C' | 'O' | 'F') => {
    switch (token) {
      case 'C': return 'Stable';
      case 'O': return 'Offset';
      case 'F': return 'Break';
      default: return 'Unknown';
    }
  };

  const getTokenIcon = (token: 'C' | 'O' | 'F') => {
    switch (token) {
      case 'C': return '✅';
      case 'O': return '⚠️';
      case 'F': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="w-full">
      {title && (
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">{title}</h2>
      )}
      <div className="w-full">
        <div className="rounded-xl border border-zinc-700/50 bg-zinc-950/50 p-4 backdrop-blur-sm">
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
          <div className="grid grid-cols-4 gap-2 rounded-xl bg-zinc-950/70 px-2 py-1 text-[11px] text-zinc-400 backdrop-blur">
            <div>Line</div>
            <div className="text-center">Status</div>
            <div className="text-center">Token</div>
            <div className="text-center">Severity</div>
          </div>

          {/* Rows */}
          <div className="mt-1 space-y-0.5">
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="grid grid-cols-4 items-center gap-2 rounded-xl px-2 py-2 text-left bg-zinc-900/30 hover:bg-zinc-800/50 transition-colors"
              >
                {/* Line Name */}
                <div className="text-sm font-medium text-white">{line.line}</div>

                {/* Status */}
                <div className="text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTokenColor(line.token)}`}>
                    <span>{getTokenIcon(line.token)}</span>
                    <span className="text-white">{getTokenLabel(line.token)}</span>
                  </span>
                </div>

                {/* Token */}
                <div className="text-center">
                  <span className={`inline-block w-6 h-6 rounded-full ${getTokenColor(line.token)} text-white text-xs font-bold flex items-center justify-center`}>
                    {line.token}
                  </span>
                </div>

                {/* Severity */}
                <div className="text-center">
                  <span className="text-xs text-zinc-300">
                    {line.severity === 0 ? 'Low' : line.severity === 1 ? 'Medium' : 'High'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ResultsComponentV2({ results, onRestart }: ResultsComponentV2Props) {
  // Get the archetype color
  const archetypeColor = ARCHETYPE_COLORS[results.face.name] || ARCHETYPE_COLORS.Sovereign;
  
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
              <ArchetypeIcon archetypeName={results.face.name} />
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
            {results.face.name.toUpperCase()}
          </h1>
          
          {/* Subtitle */}
          <h2 className="text-2xl text-white mb-2 font-medium">
            {results.face.slug}
          </h2>
          
          {/* Profile Code */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-800/30 px-3 py-1.5 border border-purple-500/30">
              <span className="text-purple-300 font-mono text-xs">Profile Code:</span>
              <span className="text-purple-100 font-bold font-mono text-base">{results.lines.code7}</span>
            </div>
            
            {/* Confidence Level */}
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-800/30 px-3 py-1.5 border border-emerald-500/30">
              <span className="text-emerald-300 font-mono text-xs">Confidence:</span>
              <span className="text-emerald-100 font-bold text-base capitalize">{results.face.confidence}</span>
            </div>
          </div>
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
          <ResultsHeatMap lines={results.lines.perLine} />
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
            good={results.face.why}
            bad="Pattern variability under pressure"
            ugly="Line breakdowns and reversals"
            goodFooter="Stable. Outcomes land. Clear tempo."
            badFooter="Variability enters. Delays creep in."
          />
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <button
            onClick={onRestart}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105"
          >
            Take Quiz Again
          </button>
          <div className="text-sm text-neutral-400">
            <p>Your results have been saved. You can retake the quiz anytime to see how your patterns change.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
