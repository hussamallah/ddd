'use client';

import React, { useState, useMemo } from 'react';
import { generateQuizResult } from '@/lib/air-generator';
import HeaderSection from './HeaderSection';
import TradeCardsSection from './TradeCardsSection';
import GoodBadUglySection from './GoodBadUglySection';

type Line = "Control" | "Pace" | "Boundary" | "Truth" | "Recognition" | "Bonding" | "Stress";
const ALL_LINES: Line[] = ["Control", "Pace", "Boundary", "Truth", "Recognition", "Bonding", "Stress"];

type ArchetypeEntry = {
  code: string;
  archetype: string;
  label: string;
};

// -------------------------------
// Utils: stars, colors, mixing
// -------------------------------

function starsBar(n: number) { 
  return "★".repeat(n) + "☆".repeat(5 - n); 
}

function gradient(styleColor: string) {
  return {
    background: `linear-gradient(180deg, ${styleColor}1f 0%, #0b0b0b 100%)`,
    borderColor: styleColor,
    boxShadow: `0 1px 0 ${styleColor}40 inset, 0 2px 14px ${styleColor}33`
  } as React.CSSProperties;
}

function tint(styleColor: string) { 
  return { color: styleColor } as React.CSSProperties; 
}

function goldCardStyle() {
  return {
    background: "radial-gradient(120% 120% at 0% 0%, rgba(245,158,11,0.15) 0%, rgba(0,0,0,0) 60%), linear-gradient(180deg, rgba(245,158,11,0.08) 0%, rgba(11,11,11,1) 100%)",
    borderColor: "#f59e0b",
    boxShadow: "0 1px 0 rgba(245,158,11,0.55) inset, 0 0 18px rgba(245,158,11,0.5), 0 0 40px rgba(245,158,11,0.24)"
  } as React.CSSProperties;
}

function goldOutlineButtonStyle() {
  return {
    background: "rgba(17,17,17,0.7)", 
    color: "#fcd34d", 
    borderColor: "#f59e0b",
    boxShadow: "0 0 0 1px rgba(245,158,11,0.35) inset, 0 0 20px rgba(245,158,11,0.16)"
  } as React.CSSProperties;
}

// Deterministic base color for any archetype name
function colorFromString(s: string) {
  let h = 0; 
  for (let i = 0; i < s.length; i++) { 
    h = (h * 31 + s.charCodeAt(i)) >>> 0; 
  }
  const hue = h % 360; 
  const sat = 68; 
  const light = 56;
  return hslToHex(hue, sat, light);
}

function hslToHex(h: number, s: number, l: number) {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(Math.min(k(n) - 3, 9 - k(n), 1), -1);
  const r = Math.round(255 * f(0));
  const g = Math.round(255 * f(8));
  const b = Math.round(255 * f(4));
  return "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("");
}

function getArchetypeColor(name: string) {
  const ARCHETYPE_COLORS: Record<string, string> = {
    Sovereign: "#f59e0b", Visionary: "#6366f1", Rebel: "#f43f5e", Equalizer: "#10b981",
    Provider: "#06b6d4", Wanderer: "#8b5cf6", Seeker: "#22d3ee", Mask: "#64748b",
    Partner: "#ec4899", Guardian: "#22c55e", Servant: "#3b82f6", Spotlight: "#eab308",
    Architect: "#7c3aed", Sentinel: "#16a34a", Catalyst: "#0ea5e9", Navigator: "#14b8a6",
  };
  return ARCHETYPE_COLORS[name] || colorFromString(name || "fallback");
}

// -------------------------------
// Components
// -------------------------------

type TraitCardProps = { 
  theme: string; 
  title: string; 
  emoji: string; 
  stars?: number; 
  body: string; 
  question: string; 
};

const TraitCard: React.FC<TraitCardProps> = ({ theme, title, emoji, stars, body, question }) => {
  return (
    <div className="rounded-2xl p-4 border bg-neutral-950 text-neutral-100" style={gradient(theme)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg" style={tint(theme)}>{emoji}</span>
          <h3 className="font-semibold tracking-tight">{title}</h3>
        </div>
        {typeof stars === "number" && (
          <span className="text-sm opacity-90" style={tint(theme)}>{starsBar(stars)}</span>
        )}
      </div>
      <p className="text-sm leading-6 opacity-95">{body}</p>
      <p className="text-sm mt-2 italic opacity-90">→ {question}</p>
    </div>
  );
};

type CompatProps = { theme: string };
const CompatibilityCard: React.FC<CompatProps> = ({ theme }) => {
  return (
    <div className="rounded-2xl p-4 border bg-neutral-950 text-neutral-100" style={goldCardStyle()}>
      <div className="space-y-2">
        <h3 className="text-base md:text-lg font-semibold tracking-tight" style={{ color: '#fcd34d' }}>Invite Someone You Trust — Unlock for $1</h3>
        <div className="text-2xl" aria-hidden style={{ color: '#fde68a' }}>🔍</div>
        <p className="text-sm leading-6" style={{ opacity: 0.95, color: '#fde68a' }}>Friend, partner, rival, or teammate—see what really happens when your archetypes meet.</p>
        <div className="text-lg flex items-center gap-1" aria-label="five stars" role="img" style={{ color: '#fcd34d' }}>
          <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
        </div>
        <div className="pt-1">
          <p className="text-sm font-medium" style={{ color: '#fcd34d' }}>You'll get:</p>
          <ul className="list-disc pl-5 text-sm mt-2 space-y-1">
            <li>Results revealed side-by-side</li>
            <li>Shared strengths decoded</li>
            <li>Potential clash zones mapped</li>
            <li>Compatibility score</li>
            <li>Key blind spot for each</li>
            <li>Pro tip for breakthrough communication</li>
            <li>Team or duo summary, unique to your match</li>
          </ul>
        </div>
        <p className="text-sm mt-2" style={{ opacity: 0.95, color: '#fde68a' }}>All for just $1—see your real connection, not just the surface.</p>
      </div>
    </div>
  );
};

// -------------------------------
// Main Component
// -------------------------------

interface ChamberUniverseLayoutProps {
  archetype?: ArchetypeEntry;
  themeColor?: string;
  result?: any; // The actual quiz result from generateQuizResult
}

export default function ChamberUniverseLayout({ archetype, themeColor = "#6366f1", result }: ChamberUniverseLayoutProps) {
  const [showFullDiagnostic, setShowFullDiagnostic] = useState(false);
  
  // Use provided result or generate from archetype
  const diagnosticResult = useMemo(() => {
    if (result) return result;
    
    if (archetype) {
      const lines = ['Control', 'Pace', 'Boundary', 'Truth', 'Recognition', 'Bonding', 'Stress'];
      const verdicts = lines.map((line, index) => {
        const distance = archetype.code[index] === 'C' ? 'Close' : archetype.code[index] === 'O' ? 'Offset' : 'Far';
        
        let baseCounts, finalCounts;
        if (distance === 'Close') {
          baseCounts = { A: 3, B: 0, C: 0 };
          finalCounts = { A: 3, B: 0, C: 0 };
        } else if (distance === 'Offset') {
          baseCounts = { A: 0, B: 3, C: 0 };
          finalCounts = { A: 0, B: 3, C: 0 };
        } else {
          baseCounts = { A: 0, B: 0, C: 3 };
          finalCounts = { A: 0, B: 0, C: 3 };
        }

        return {
          line,
          distance,
          counts: { base: baseCounts, final: finalCounts },
          reason: 'context pressure',
          variance: false
        };
      });

      return generateQuizResult(verdicts, 'standard');
    }
    
    return null;
  }, [archetype, result]);

  // Convert distance to stars (Close=5, Offset=3, Far=1)
  const getStarsFromDistance = (distance: string) => {
    switch (distance) {
      case 'Close': return 5;
      case 'Offset': return 3;
      case 'Far': return 1;
      default: return 3;
    }
  };

  const LINE_EMOJI: Record<Line, string> = {
    Control: "🧱", Pace: "⏱", Boundary: "🧊", Truth: "🤔", Recognition: "🔦", Bonding: "🤝", Stress: "🔥",
  };

  const QUESTIONS: Record<Line, string> = {
    Control: "What decision stands if no one agrees yet?",
    Pace: "What do you deliver before you think again?",
    Boundary: "Where does one rule end the negotiation?",
    Truth: "What's the next state in 7 words, then the first step?",
    Recognition: "What single sentence makes them align or exit?",
    Bonding: "What standard protects you and the bond?",
    Stress: "Under pressure, what's the smallest move that changes the board?",
  };

  const headerTitle = archetype ? `🌌 ${archetype.archetype}` : "🌌 Your Results";

  if (!diagnosticResult) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 backdrop-blur border-b border-neutral-800/60 bg-neutral-950/70">
        <div className="w-full px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="text-lg font-semibold tracking-tight">
            <span style={tint(themeColor)}>{headerTitle}</span>
          </div>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {archetype && <span className="text-xs opacity-80">Code: {archetype.code}</span>}
            <button
              onClick={() => setShowFullDiagnostic(!showFullDiagnostic)}
              className="rounded-xl border px-4 py-2 text-sm font-medium bg-neutral-900/60 hover:bg-neutral-900 transition"
              style={{ borderColor: themeColor }}
            >
              {showFullDiagnostic ? 'Hide' : 'Show'} Full Diagnostic
            </button>
          </div>
        </div>
      </div>

      {/* Grid - TRUE Full Screen Layout */}
      <div className="h-[calc(100vh-80px)] w-full p-2">
        <div className="h-full w-full grid gap-2 grid-cols-8">
          {ALL_LINES.map((line) => {
            const lineResult = diagnosticResult.lines.find(l => l.line === line);
            const stars = lineResult ? getStarsFromDistance(lineResult.distance) : 3;
            const body = lineResult ? lineResult.card : "Loading...";
            
            return (
              <TraitCard 
                key={line} 
                theme={themeColor} 
                title={line} 
                emoji={LINE_EMOJI[line]} 
                stars={stars} 
                body={body} 
                question={QUESTIONS[line]} 
              />
            );
          })}
          {/* 8th card: Compatibility */}
          <CompatibilityCard theme={themeColor} />
        </div>
      </div>

      {/* Full Diagnostic Results */}
      {showFullDiagnostic && (
        <div className="w-full px-4 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Full Diagnostic Results</h2>
            <button
              onClick={() => setShowFullDiagnostic(false)}
              className="px-4 py-2 bg-neutral-700 text-white rounded-xl hover:bg-neutral-600 transition-colors text-sm"
            >
              Hide Results
            </button>
          </div>
          
          {archetype && (
            /* Archetype Header */
            <div className="rounded-2xl border border-purple-800 bg-purple-950/20 p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-300 mb-2">{archetype.archetype}</div>
                <div className="text-lg text-purple-200 mb-2">{archetype.label}</div>
                <div className="text-sm text-purple-400 font-mono">Profile Code: {archetype.code}</div>
              </div>
            </div>
          )}

          {/* Header Section */}
          <HeaderSection result={diagnosticResult} />
          
          {/* Seven Trade Cards */}
          <TradeCardsSection lines={diagnosticResult.lines} />
          
          {/* Good/Bad/Ugly Analysis - KEEP AS IS */}
          <GoodBadUglySection analysis={diagnosticResult.goodBadUgly} />
        </div>
      )}

      {/* Bottom CTA Buttons */}
      <div className="w-full px-4 pb-6">
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={() => setShowFullDiagnostic(!showFullDiagnostic)}
            className="rounded-xl border px-4 py-2 text-sm font-medium bg-neutral-900/60 hover:bg-neutral-900 transition" 
            style={{ borderColor: themeColor }}
          >
            <span className="mr-1">📊</span> {showFullDiagnostic ? 'Hide' : 'Show'} Full Diagnostic
          </button>
          <button className="rounded-xl border px-4 py-2 text-sm font-semibold hover:opacity-95 transition" style={goldOutlineButtonStyle()}>
            <span className="mr-1">💡</span> Get Compatibility Report — $1
          </button>
        </div>
      </div>
    </div>
  );
}
