'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { QuizBank, Line, Token, TBType, BaseItem, TBBlock, Frame, Option, LineVerdict, Counts, QuizMode, FrameVariant, EnhancedQuizResult, LineVerdictV2 } from '@/lib/types';
import { decideTB, fallbackDistance } from '@/lib/pointsMap';
import { loadBankWithFallback, getBankProtectionStatus } from '@/lib/loadBank';
import { composeAIR } from './results/composeAIR';
import { generateArchetypeProfile } from '@/lib/archetype-generator';
import HeaderSection from './components/HeaderSection';
import TradeCardsSection from './components/TradeCardsSection';
import GbuDiagnosticCards from './results/components/GbuDiagnosticCards';
import archetypeData from '../../data/archetype_decoder.json';

type ArchetypeEntry = {
  code: string;
  archetype: string;
  label: string;
};

// Fallback static import for initial load
import bankData from '@/data/quizBank.json';

const LINES: Line[] = ['Control','Pace','Boundary','Truth','Recognition','Bonding','Stress'];
const perms = [
  [0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]
];

type Phase = 'intro' | 'mode-select' | 'flow-select' | 'base' | 'tb' | 'final';

type Rendered = {
  frame: Frame | null;
  options: Option[];
  shownOrder: number[];
  promptOverride?: string;
};

// ——— helpers ———
function computeABC(tokens: Token[]): Counts {
  return {
    A: tokens.filter(t => t === 'C').length,
    B: tokens.filter(t => t === 'O').length,
    C: tokens.filter(t => t === 'F').length,
  };
}
function distanceFromCounts(A:number,B:number,C:number): 'Close'|'Offset'|'Far' {
  if (A > B && A > C) return 'Close';
  if (B >= A && B >= C) return 'Offset';
  return 'Far';
}
function pickFrame(item: BaseItem, mode?: QuizMode): Rendered {
  // ALWAYS show primary variant (variant === "primary" or no variant specified)
  const primaryFrames = item.frames.filter(f => 
    !f.variant || f.variant === 'primary'
  );
  
  // If no primary frames found, fall back to all frames
  const availableFrames = primaryFrames.length > 0 ? primaryFrames : item.frames;
  
  const f = availableFrames[Math.floor(Math.random() * availableFrames.length)];
  const order = perms[Math.floor(Math.random() * perms.length)];
  const options = order.map(i => f.options[i]);
  return { frame: f, options, shownOrder: order };
}
function pickTBQuestion(q: TBBlock['questions'][number]): Rendered {
  if (q.frames && q.frames.length) {
    const f = q.frames[Math.floor(Math.random() * q.frames.length)];
    const order = f.options.length === 3
      ? perms[Math.floor(Math.random() * perms.length)]
      : [0,1];
    const options = order.map(i => f.options[i]);
    return { frame: f, options, shownOrder: order };
  }
  // prompt + options path
  const order = (q.options ?? []).length === 3
    ? perms[Math.floor(Math.random() * perms.length)]
    : [0,1];
  const options = (q.options ?? []).map((o)=>o);
  const arranged = order.map(i => options[i]);
  return { frame: null, options: arranged, shownOrder: order, promptOverride: q.prompt };
}

function extractReason(nonCloseTags: string[]): string {
  const ignore = new Set(['work','time','tasks','solo','quiet','decision','plan']);
  const freq = new Map<string,number>();
  nonCloseTags.forEach(t => {
    if (!t || ignore.has(t)) return;
    freq.set(t, (freq.get(t) ?? 0) + 1);
  });
  const top = [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k])=>k);
  return top.length ? top.join(' + ') : 'context pressure';
}

function generateArchetypeCode(verdicts: LineVerdict[]): string {
  const lineOrder: Line[] = ['Control','Pace','Boundary','Truth','Recognition','Bonding','Stress'];
  let code = "";
  
  for (const line of lineOrder) {
    const verdict = verdicts.find(v => v.line === line);
    if (!verdict) {
      code += "C"; // Default to CLOSE if no evidence
    } else {
      // Match exactly how Profile Code is generated in air-generator.ts
      switch (verdict.distance) {
        case "Close":
          code += "C";
          break;
        case "Offset":
          code += "O";
          break;
        case "Far":
          code += "F";
          break;
        default:
          code += "C";
      }
    }
  }
  
  return code;
}

function getArchetype(code: string): ArchetypeEntry | null {
  // Try the new system first
  const newArchetype = generateArchetypeProfile([]); // This will be called with actual verdicts
  
  // Fallback to old system if needed
  const archetypes = archetypeData as ArchetypeEntry[];
  return archetypes.find(entry => entry.code === code) || null;
}

// ---------- Heat Map Components ----------
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

// ---------- Modal ----------
const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ open, onClose, children }) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 transition-opacity duration-300" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl transition-all duration-300 transform">
        {children}
      </div>
    </div>
  );
};

const LineReportCard: React.FC<{ 
  line: any; 
  onClose: () => void 
}> = ({ line, onClose }) => {
  return (
    <div className="w-full max-w-xl rounded-xl bg-zinc-900/90 p-3 shadow-xl">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-white">{line.line}</h3>
          <TokenPill t={line.distance === 'Close' ? 'C' : line.distance === 'Offset' ? 'O' : 'F'} />
        </div>
        <button onClick={onClose} className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors">
          Close
        </button>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-1 text-xs text-zinc-300">
        <span className="rounded-lg bg-zinc-800/60 px-1.5 py-0.5">Status: {line.distance === 'Close' ? '✅ Stable' : line.distance === 'Offset' ? '⚠️ Offset' : '❌ Break'}</span>
        <span className="rounded-lg bg-zinc-800/60 px-1.5 py-0.5">Trips You: {line.slipDriver}</span>
        {line.variance && (
          <span className="rounded-full bg-indigo-600/30 px-1 py-0.5 text-xs text-indigo-100">variance</span>
        )}
      </div>

      <p className="text-xs leading-5 text-zinc-200">{line.card}</p>
    </div>
  );
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

      <Modal open={open} onClose={() => setOpen(false)}>
        {selected && <LineReportCard line={selected} onClose={() => setOpen(false)} />}
      </Modal>
    </div>
  );
};

// ————— Archetype Color Mapping —————
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

// ————— Art Nouveau Archetype Icons —————
const GOLD = "#D4AF37"; // warm gold

// Decorative corner ornaments
function CornerOrnament({ flipX=false, flipY=false }: { flipX?: boolean; flipY?: boolean }) {
  const sx = flipX ? -1 : 1;
  const sy = flipY ? -1 : 1;
  return (
    <svg viewBox="0 0 100 100" className="absolute size-10 opacity-70" style={{ transform: `scale(${sx},${sy})`}} aria-hidden>
      <g fill="none" stroke={GOLD} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2,98 C22,78 42,60 64,54"/>
        <path d="M6,94 C22,80 36,68 48,62"/>
        <path d="M38 70c8-8 18-10 24-8c-8 2-12 8-12 14c6-4 14-2 18 2c-10 0-16 6-18 12"/>
        <path d="M18 78c6-10 18-16 30-18"/>
      </g>
    </svg>
  );
}

// Icon definitions
const ICONS: Record<string, React.FC> = {
  Sovereign: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="50" cy="58" r="22"/>
      <path d="M26 38l8 4l8-10l8 10l8-10l8 10l8-4"/>
      <path d="M20 72h60"/>
    </svg>
  ),
  Visionary: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 50c12-18 30-28 42-28s30 10 42 28c-12 18-30 28-42 28S20 68 8 50z"/>
      <circle cx="50" cy="50" r="10"/>
      <path d="M18 50h64"/>
    </svg>
  ),
  Rebel: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M38 16l-8 22h16l-10 28l26-26h-14l10-24z"/>
      <path d="M62 20l-6 14h12l-8 18"/>
    </svg>
  ),
  Equalizer: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M50 16v66"/>
      <path d="M22 28h56"/>
      <path d="M32 28l-12 20h24z"/>
      <path d="M68 28l-12 20h24z"/>
      <path d="M36 82h28"/>
    </svg>
  ),
  Provider: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 52c0 16 14 28 32 28s32-12 32-28H18z"/>
      <path d="M26 46c8-8 40-8 48 0"/>
    </svg>
  ),
  Wanderer: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="50" cy="50" r="4"/>
      <path d="M50 10v22M50 68v22M10 50h22M68 50h22"/>
      <path d="M50 18l10 32l-10 10l-10-10z"/>
    </svg>
  ),
  Seeker: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="50" cy="36" r="10"/>
      <path d="M50 46l-8 16h16z"/>
    </svg>
  ),
  Mask: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 30c0 20 12 34 32 34S82 50 82 30c-10 6-20 6-32 0c-12 6-22 6-32 0z"/>
      <path d="M38 44c2 0 4 2 4 4M58 44c-2 0-4 2-4 4"/>
      <path d="M50 28v40"/>
    </svg>
  ),
  Partner: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="40" cy="54" r="14"/>
      <circle cx="60" cy="46" r="14"/>
    </svg>
  ),
  Guardian: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M50 14l28 10v20c0 22-14 32-28 40c-14-8-28-18-28-40V24z"/>
    </svg>
  ),
  Servant: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M26 16v68"/>
      <path d="M26 18h40l-6 10l6 10H26z"/>
    </svg>
  ),
  Spotlight: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M50 8v84M8 50h84M22 22l56 56M78 22L22 78"/>
      <circle cx="50" cy="50" r="6"/>
    </svg>
  ),
  Architect: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M30 78l40-40"/>
      <path d="M34 30l16 40l16-40"/>
      <circle cx="50" cy="26" r="6"/>
    </svg>
  ),
  Strategist: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M64 32c-6-6-18-10-24 0c10 2 10 8 6 12c-6 6-12 8-12 18h32v-8l6-6l-8-16z"/>
      <path d="M34 72h36"/>
      <circle cx="54" cy="36" r="2"/>
    </svg>
  ),
  Catalyst: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M50 12l4 16l16 4l-16 4l-4 16l-4-16l-16-4l16-4z"/>
      <path d="M50 78l2 10M22 50l-10 2M78 50l10 2M50 22l2-10"/>
    </svg>
  ),
  Diplomat: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 70c28-12 46-30 68-44"/>
      <path d="M40 54c0 8-6 12-14 12c0-8 6-12 14-12z"/>
      <path d="M60 42c0 8-6 12-14 12c0-8 6-12 14-12z"/>
      <path d="M76 32c0 8-6 12-14 12c0-8 6-12 14-12z"/>
    </svg>
  ),
  Sentinel: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M38 82V56h24v26"/>
      <path d="M34 56h32l-4-16H38z"/>
      <path d="M42 26h16v8H42z"/>
      <path d="M38 22h24l-12-8z"/>
    </svg>
  ),
  Artisan: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="50" cy="50" r="6"/>
      <path d="M50 20c-6 0-12 8-12 14c0 6 6 10 12 10s12-4 12-10c0-6-6-14-12-14z"/>
      <path d="M50 80c6 0 12-8 12-14c0-6-6-10-12-10s-12 4-12 10c0 6 6 14 12 14z"/>
      <path d="M20 50c0 6 8 12 14 12c6 0 10-6 10-12s-4-12-10-12c-6 0-14 6-14 12z"/>
      <path d="M80 50c0-6-8-12-14-12c-6 0-10 6-10 12s4 12 10 12c6 0 14-6 14-12z"/>
    </svg>
  ),
  Navigator: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 72h52l-26-44z"/>
      <path d="M50 28v44M26 60h48"/>
      <path d="M22 72a28 28 0 1 0 56 0"/>
      <circle cx="50" cy="28" r="3"/>
    </svg>
  ),
  Alchemist: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M50 14c20 0 36 16 36 36s-16 36-36 36S14 70 14 50c0-14 8-26 20-32"/>
      <path d="M34 18l12 2l-6 10"/>
    </svg>
  ),
};

// Archetype Icon Component
function ArchetypeIcon({ archetypeName }: { archetypeName: string }) {
  const IconComponent = ICONS[archetypeName] || ICONS.Sovereign; // fallback to Sovereign
  
  return (
    <div className="relative">
      {/* Corner ornaments */}
      <CornerOrnament />
      <CornerOrnament flipX flipY />
      
      {/* Icon container */}
      <div className="relative z-10 flex items-center justify-center w-24 h-24 mx-auto">
        <IconComponent />
      </div>
    </div>
  );
}

// ——— component ———
export default function QuizApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bank, setBank] = useState<QuizBank>(bankData as QuizBank);
  const [phase, setPhase] = useState<Phase>(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam && ['original', 'heat', 'friend', 'bet'].includes(modeParam)) {
      return 'base'; // Start in quiz mode, not selection mode
    }
    return 'flow-select';
  });
  const [selectedMode, setSelectedMode] = useState<QuizMode>('original');
  const [lineIdx, setLineIdx] = useState(0);
  const [baseStep, setBaseStep] = useState<0|1|2>(0);
  const [tbIdx, setTbIdx] = useState<0|1>(0);

  const [currentPicks, setCurrentPicks] = useState<Token[]>([]);     // tokens for current line
  const [nonCloseTags, setNonCloseTags] = useState<string[]>([]);
  const [baseCounts, setBaseCounts] = useState<Counts>({A:0,B:0,C:0});
  const [tbType, setTbType] = useState<TBType | null>(null);

  const [verdicts, setVerdicts] = useState<LineVerdict[]>([]);
  const [selectedArchetype, setSelectedArchetype] = useState<string>('');

  // Check for mode parameter on mount and auto-start quiz
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam && ['original', 'heat', 'friend', 'bet'].includes(modeParam)) {
      // Auto-start the quiz with the selected mode
      startQuiz(modeParam as QuizMode);
    }
  }, [searchParams]);

  // Load fresh bank data on mount
  useEffect(() => {
    loadBankWithFallback()
      .then(freshBank => {
        setBank(freshBank);
        console.info("BANK_SRC", freshBank.version, Object.keys(freshBank.baseItems).length);
      })
      .catch(error => {
        console.warn("Failed to load fresh bank, using fallback:", error);
        console.info("BANK_SRC", bankData.version, Object.keys(bankData.baseItems).length);
      });
  }, []);

  const line = LINES[lineIdx];
  const base = bank.baseItems[line];
  const tbs = bank.tbBlocks[line];

  // cache a single render per question so randomization is stable until answered
  const [render, setRender] = useState<Rendered | null>(null);

  // get the current BaseItem for baseStep
  const currentBaseItem: BaseItem = useMemo(() => {
    return baseStep === 0 ? base.micro : baseStep === 1 ? base.duelA : base.duelB;
  }, [base, baseStep]);

  function startModeSelection() {
    setPhase('mode-select');
  }

  function startFlowSelection() {
    setPhase('flow-select');
  }

  function startQuiz(mode: QuizMode) {
    if (mode === 'original') {
      setSelectedMode(mode);
      setPhase('base');
      const r = pickFrame(currentBaseItem, mode);
      setRender(r);
    } else if (mode === 'heat') {
      // Route to stacks selection first for Heat Mode
      router.push(`/quiz/stacks?mode=${mode}`);
    } else {
      // Route to the new mode system
      router.push(`/quiz/run?mode=${mode}`);
    }
  }

  function startV2Flow() {
    router.push('/quiz/test-v2');
  }

  function onChoose(option: Option) {
    // record token + tags (for reason extraction)
    setCurrentPicks(prev => [...prev, option.token]);
    if (render?.frame?.tags && option.token !== 'C') {
      setNonCloseTags(prev => [...prev, ...render.frame!.tags!]);
    }

    // advance base steps or evaluate
    if (phase === 'base') {
      if (baseStep < 2) {
        const next = (baseStep + 1) as 0|1|2;
        setBaseStep(next);
        const nextItem = next === 0 ? base.micro : next === 1 ? base.duelA : base.duelB;
        const r = pickFrame(nextItem, selectedMode);
        setRender(r);
      } else {
        // after 3 base picks: compute counts + dispatch TB
        const counts = computeABC([...currentPicks, option.token]);
        setBaseCounts(counts);
        const tb = decideTB(counts.A, counts.B, counts.C);
        setTbType(tb);
        if (!tb) {
          finalizeLine(counts, counts, null);
        } else {
          setPhase('tb');
          setTbIdx(0);
          const first = pickTBQuestion(tbs[tb].questions[0]);
          setRender(first);
        }
      }
      return;
    }

    if (phase === 'tb' && tbType) {
      // record TB pick
      const picks = [...currentPicks, option.token];
      setCurrentPicks(picks);

      if (tbIdx === 0) {
        // go to second TB
        setTbIdx(1);
        const second = pickTBQuestion(tbs[tbType].questions[1]);
        setRender(second);
      } else {
        // finalize after 2 TB picks (total 5 picks)
        const finalCounts = computeABC(picks);
        finalizeLine(baseCounts, finalCounts, tbType);
      }
    }
  }

  function finalizeLine(baseC: Counts, finalC: Counts, tb: TBType | null) {
    // distance (with fallback if needed)
    let distance = distanceFromCounts(finalC.A, finalC.B, finalC.C);
    const max = Math.max(finalC.A, finalC.B, finalC.C);
    const leaders = ['A','B','C'].filter(k => (finalC as any)[k] === max);
    if (leaders.length > 1) {
      distance = fallbackDistance(finalC.A, finalC.B, finalC.C);
    }

    const variance = baseC.A > 0 && baseC.C > 0;
    const drift = finalC.A === 0 ? { stallPct: finalC.B * 20, fragPct: finalC.C * 20 } : undefined;
    const reason = extractReason(nonCloseTags);

    // Convert distance to token (Close→C, Offset→O, Far→F)
    const newToken = distance === 'Close' ? 'C' : distance === 'Offset' ? 'O' : 'F';
    
    const verdict: LineVerdict = {
      line,
      distance,              // Use legacy distance (Close, Offset, Far)
      counts: { base: baseC, final: finalC },
      variance,
      reason
    };
    
    setVerdicts(prev => [...prev, verdict]); // ✅ CORRECT TYPE

    // reset per-line state
    setCurrentPicks([]);
    setNonCloseTags([]);
    setBaseCounts({A:0,B:0,C:0});
    setTbType(null);
    setBaseStep(0);
    setTbIdx(0);

    // next line or final
    if (lineIdx < LINES.length - 1) {
      const nextIdx = lineIdx + 1;
      setLineIdx(nextIdx);
      setPhase('base');
      const nb = bank.baseItems[LINES[nextIdx]];
      const r = pickFrame(nb.micro);
      setRender(r);
    } else {
      setPhase('final');
      setRender(null);
    }
  }

  // UI bits
  function Header() {
    const protectionStatus = getBankProtectionStatus(bank);
    
    const jumpToResults = () => {
      // Create mock verdicts for testing
      const mockVerdicts: LineVerdict[] = [
        { line: 'Control' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Consistent A picks' },
        { line: 'Pace' as Line, distance: 'Offset' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 1, B: 2, C: 0}, final: {A: 1, B: 2, C: 0} }, variance: false, reason: 'Mixed B/C picks' },
        { line: 'Boundary' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Consistent C picks' },
        { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Consistent A picks' },
        { line: 'Recognition' as Line, distance: 'Offset' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 1, B: 2, C: 0}, final: {A: 1, B: 2, C: 0} }, variance: false, reason: 'Mixed B/C picks' },
        { line: 'Bonding' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Consistent C picks' },
        { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Consistent A picks' }
      ];
      
      setVerdicts(mockVerdicts);
      setSelectedMode('original');
      setPhase('final');
    };
    
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-yellow-400">Identity Code Mapper</h1>
        
        {/* Test Button to Jump to Results */}
        <div className="mt-4">
          <button
            onClick={jumpToResults}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            🧪 Test Results View
          </button>
          
          {/* Profile Selector */}
          <div className="mt-3">
            <select 
              onChange={(e) => renderSpecificProfile(e.target.value)}
              className="px-3 py-2 bg-neutral-800 text-white rounded-lg border border-neutral-700 text-sm"
              defaultValue=""
            >
              <option value="">Select Profile to Render</option>
              <option value="Sovereign">Sovereign</option>
              <option value="Visionary">Visionary</option>
              <option value="Rebel">Rebel</option>
              <option value="Equalizer">Equalizer</option>
              <option value="Provider">Provider</option>
              <option value="Wanderer">Wanderer</option>
              <option value="Seeker">Seeker</option>
              <option value="Mask">Mask</option>
              <option value="Partner">Partner</option>
              <option value="Guardian">Guardian</option>
              <option value="Servant">Servant</option>
              <option value="Spotlight">Spotlight</option>
              <option value="Architect">Architect</option>
              <option value="Strategist">Strategist</option>
              <option value="Catalyst">Catalyst</option>
              <option value="Diplomat">Diplomat</option>
              <option value="Sentinel">Sentinel</option>
              <option value="Artisan">Artisan</option>
              <option value="Navigator">Navigator</option>
              <option value="Alchemist">Alchemist</option>
            </select>
          </div>
          
          {/* ICM Header Image */}
          <div className="mt-4 flex justify-start">
            <img 
              src="/images/screen-header.png" 
              alt="ICM Header" 
              className="w-48 h-auto opacity-90 hover:opacity-100 transition-opacity duration-300"
            />
          </div>
        </div>
        
        {/* Protection Status Display - Dev Team Only */}
        {protectionStatus && (
          <div className="hidden">
            <span>🔒 Locked: {protectionStatus.requiredCode}</span>
          </div>
        )}
      </div>
    );
  }

  function ModeSelection() {
    const modes: { mode: QuizMode; title: string; description: string; }[] = [
      {
        mode: 'original',
        title: '📜 Original',
        description: 'The classic AIT experience - your exact specifications, one-breath neutral prompts'
      },

      {
        mode: 'heat',
        title: '🔥 Heat Mode',
        description: 'High-pressure scenarios - when everything is urgent and visible'
      },
      {
        mode: 'friend',
        title: '👥 Third-Person',
        description: 'How others see your patterns - external perspective view'
      },
      {
        mode: 'bet',
        title: '🎲 Bet Mode',
        description: 'Stakes are high - reputation and relationships on the line'
      }
    ];

    return (
      <div className="mt-6 space-y-4">
        <div className="text-center">
          <h2 className="text-lg font-medium text-neutral-200">Choose Your Test Mode</h2>
          <p className="text-sm text-neutral-400 mt-1">Different modes reveal different aspects of your axis integrity</p>
        </div>
        
        <div className="grid gap-3">
          {modes.map((modeOption) => (
            <button
              key={modeOption.mode}
              onClick={() => startQuiz(modeOption.mode)}
              className="text-left rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 hover:bg-neutral-800/60 transition-colors"
            >
              <div className="font-medium text-neutral-200">{modeOption.title}</div>
              <div className="text-sm text-neutral-400 mt-1">{modeOption.description}</div>
            </button>
          ))}
          
          <button
            onClick={() => startFlowSelection()}
            className="text-left rounded-xl border border-blue-500/50 bg-blue-500/10 p-4 hover:bg-blue-500/20 transition-colors"
          >
            <div className="font-medium text-neutral-200">🚀 Try New v2.6 Flow</div>
            <div className="text-sm text-neutral-400 mt-1">Family Hone → Face Triad → Duels → Lines → CODE_7 Results</div>
          </button>
        </div>
      </div>
    );
  }

  function FlowSelection() {
    return (
      <div className="mt-6 space-y-4">
        <div className="text-center">
          <h2 className="text-lg font-medium text-neutral-200">Choose Your Quiz Flow</h2>
          <p className="text-sm text-neutral-400 mt-1">Select between the classic flow and the new v2.6 experience</p>
        </div>
        
        <div className="grid gap-3">
          <button
            onClick={() => startModeSelection()}
            className="text-left rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 hover:bg-neutral-800/60 transition-colors"
          >
            <div className="font-medium text-neutral-200">📜 Classic Flow</div>
            <div className="text-sm text-neutral-400 mt-1">The original AIT experience with base items and tiebreakers</div>
          </button>
          
          <button
            onClick={() => startV2Flow()}
            className="text-left rounded-xl border border-neutral-800 bg-neutral-800/60 p-4 hover:bg-neutral-700/60 transition-colors border-blue-500/50"
          >
            <div className="font-medium text-neutral-200">🚀 New v2.6 Flow</div>
            <div className="text-sm text-neutral-400 mt-1">Family Hone → Face Triad → Duels → Lines → CODE_7 Results</div>
          </button>
        </div>
      </div>
    );
  }

  function Progress() {
    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-xs uppercase tracking-wider text-neutral-400">
          Line {lineIdx + 1} of {LINES.length}: <span className="text-neutral-200">{line}</span>
        </div>
        <div className="flex gap-1">
          {Array.from({length: 3}).map((_,i)=>(
            <span key={i}
              className={`h-1 w-8 rounded ${i <= baseStep && phase!=='final' ? 'bg-neutral-200' : 'bg-neutral-700'}`}
            />
          ))}
        </div>
      </div>
    );
  }

  function Question() {
    if (!render) return null;
    const prompt = render.promptOverride ?? render.frame?.prompt ?? '';
    return (
      <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 shadow">
        <div className="text-sm text-neutral-300">{prompt}</div>
        <div className="mt-4 grid gap-3">
          {render.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => onChoose(opt)}
              className="text-left rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 hover:bg-neutral-800 transition"
            >
              {opt.text}
            </button>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-neutral-500">
          (Letters are randomized; we score by hidden tokens.)
        </div>
      </div>
    );
  }

  function Diagnostics() {
    const result = composeAIR(verdicts, selectedMode);
    const archetypeProfile = generateArchetypeProfile(verdicts);
    
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
          {/* Header moved inside here */}
          <Header />
          
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
                <ArchetypeIcon archetypeName={archetypeProfile.archetype} />
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
                const offLines = verdicts.filter(l => l.distance !== 'Close');
                
                // Group by distance type
                const brokenLines = offLines.filter(l => l.distance === 'Far').map(l => l.line);
                const stalledLines = offLines.filter(l => l.distance === 'Offset').map(l => l.line);
                
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
        </div>
      </div>
    );
  }

  // Add this function to pre-generate all results
  const preGenerateAllResults = () => {
    const allResults = [];
    
    // Generate all possible combinations of 7 lines
    const distances = ['Close', 'Offset', 'Far'];
    const totalCombinations = Math.pow(3, 7); // 3^7 = 2187 combinations
    
    for (let i = 0; i < totalCombinations; i++) {
      const verdicts: LineVerdict[] = [];
      
      // Convert number to base 3 to get line distances
      for (let j = 0; j < 7; j++) {
        const distanceIndex = Math.floor(i / Math.pow(3, j)) % 3;
        const distance = distances[distanceIndex] as 'Close' | 'Offset' | 'Far';
        
        verdicts.push({
          line: LINES[j] as Line,
          distance,
          counts: { 
            base: {A: 0, B: 0, C: 0}, 
            final: {A: 0, B: 0, C: 0} 
          },
          variance: false,
          reason: 'Generated combination'
        });
      }
      
      // Generate result for this combination
      const result = composeAIR(verdicts, 'original');
      const archetypeProfile = generateArchetypeProfile(verdicts);
      
      allResults.push({
        verdicts,
        result,
        archetypeProfile,
        code: generateArchetypeCode(verdicts)
      });
    }
    
    return allResults;
  };

  // Pre-render common archetype results with ALL 20 archetypes
  const preRenderCommonArchetypes = () => {
    const commonProfiles = [
      // Sovereign (Control primary - Far)
      {
        name: 'Sovereign',
        verdicts: [
          { line: 'Control' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Control line break' },
          { line: 'Pace' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Pace line stable' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Boundary line stable' },
          { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Truth line stable' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Recognition line stable' },
          { line: 'Bonding' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Bonding line stable' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stress line stable' }
        ]
      },
      // Visionary (Boundary primary)
      {
        name: 'Visionary',
        verdicts: [
          { line: 'Control' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Pace' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Boundary' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Boundary break' },
          { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Bonding' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ]
      },
      // Rebel (Control primary, Pace secondary)
      {
        name: 'Rebel',
        verdicts: [
          { line: 'Control' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Control break' },
          { line: 'Pace' as Line, distance: 'Offset' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 1, B: 2, C: 0}, final: {A: 1, B: 2, C: 0} }, variance: false, reason: 'Pace offset' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Bonding' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ]
      },
      // Equalizer (Stress primary)
      {
        name: 'Equalizer',
        verdicts: [
          { line: 'Control' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Pace' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Bonding' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Stress' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Stress break' }
        ]
      },
      // Provider (Bonding primary)
      {
        name: 'Provider',
        verdicts: [
          { line: 'Control' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Pace' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Bonding' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Break pattern' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ]
      },
      // Wanderer (Pace primary)
      {
        name: 'Wanderer',
        verdicts: [
          { line: 'Control' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Pace' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Break pattern' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Bonding' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ]
      },
      // Seeker (Truth primary)
      {
        name: 'Seeker',
        verdicts: [
          { line: 'Control' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Pace' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Truth' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Break pattern' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Bonding' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ]
      },
      // Mask (Recognition primary)
      {
        name: 'Mask',
        verdicts: [
          { line: 'Control' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Pace' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Recognition' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Break pattern' },
          { line: 'Bonding' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ]
      },
      // Partner (Bonding primary, Control secondary)
      {
        name: 'Partner',
        verdicts: [
          { line: 'Control' as Line, distance: 'Offset' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 1, B: 2, C: 0}, final: {A: 1, B: 2, C: 0} }, variance: false, reason: 'Offset pattern' },
          { line: 'Pace' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Bonding' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Break pattern' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ]
      },
      // Guardian (Pace primary)
      {
        name: 'Guardian',
        verdicts: [
          { line: 'Control' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Pace' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Break pattern' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Bonding' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ]
      },
      // Servant (Bonding primary, Pace secondary)
      {
        name: 'Servant',
        verdicts: [
          { line: 'Control' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Pace' as Line, distance: 'Offset' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 1, B: 2, C: 0}, final: {A: 1, B: 2, C: 0} }, variance: false, reason: 'Offset pattern' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Bonding' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Break pattern' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ]
      },
      // Spotlight (Recognition primary, Bonding secondary)
      {
        name: 'Spotlight',
        verdicts: [
          { line: 'Control' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Pace' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Recognition' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Break pattern' },
          { line: 'Bonding' as Line, distance: 'Offset' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 1, B: 2, C: 0}, final: {A: 1, B: 2, C: 0} }, variance: false, reason: 'Offset pattern' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ]
      },
      // Architect (Truth primary)
      {
        name: 'Architect',
        verdicts: [
          { line: 'Control' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Pace' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Truth' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Break pattern' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Bonding' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ]
      },
      // Strategist (Pace primary, Control secondary)
      {
        name: 'Strategist',
        verdicts: [
          { line: 'Control' as Line, distance: 'Offset' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 1, B: 2, C: 0}, final: {A: 1, B: 2, C: 0} }, variance: false, reason: 'Offset pattern' },
          { line: 'Pace' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Break pattern' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Bonding' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ]
      },
      // Catalyst (Control primary, Stress secondary)
      {
        name: 'Catalyst',
        verdicts: [
          { line: 'Control' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Break pattern' },
          { line: 'Pace' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Bonding' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Stress' as Line, distance: 'Offset' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 1, B: 2, C: 0}, final: {A: 1, B: 2, C: 0} }, variance: false, reason: 'Offset pattern' }
        ]
      },
      // Diplomat (Bonding primary, Recognition secondary)
      {
        name: 'Diplomat',
        verdicts: [
          { line: 'Control' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Pace' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Recognition' as Line, distance: 'Offset' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 1, B: 2, C: 0}, final: {A: 1, B: 2, C: 0} }, variance: false, reason: 'Offset pattern' },
          { line: 'Bonding' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Break pattern' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ]
      },
      // Sentinel (Recognition primary)
      {
        name: 'Sentinel',
        verdicts: [
          { line: 'Control' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Pace' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Recognition' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Break pattern' },
          { line: 'Bonding' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ]
      },
      // Artisan (Boundary primary, Truth secondary)
      {
        name: 'Artisan',
        verdicts: [
          { line: 'Control' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Pace' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Boundary' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Break pattern' },
          { line: 'Truth' as Line, distance: 'Offset' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 1, B: 2, C: 0}, final: {A: 1, B: 2, C: 0} }, variance: false, reason: 'Offset pattern' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Bonding' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ]
      },
      // Navigator (Bonding primary)
      {
        name: 'Navigator',
        verdicts: [
          { line: 'Control' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Pace' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Bonding' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Break pattern' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ]
      },
      // Alchemist (Control primary, Boundary secondary)
      {
        name: 'Alchemist',
        verdicts: [
          { line: 'Control' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Break pattern' },
          { line: 'Pace' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Boundary' as Line, distance: 'Offset' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 1, B: 2, C: 0}, final: {A: 1, B: 2, C: 0} }, variance: false, reason: 'Offset pattern' },
          { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Bonding' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ]
      }
    ];
    
    return commonProfiles.map(profile => {
      const result = composeAIR(profile.verdicts, 'original');
      const archetypeProfile = generateArchetypeProfile(profile.verdicts);
      
      return {
        ...profile,
        result,
        archetypeProfile,
        code: generateArchetypeCode(profile.verdicts)
      };
    });
  };

  // Function to render a specific profile
  const renderSpecificProfile = (profileName: string) => {
    // Create archetype-specific line patterns that will generate the correct archetype
    let mockVerdicts: LineVerdict[];
    
    switch (profileName) {
      case 'Sovereign':
        mockVerdicts = [
          { line: 'Control' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Control break' },
          { line: 'Pace' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Bonding' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ];
        break;
      case 'Rebel':
        mockVerdicts = [
          { line: 'Control' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Control break' },
          { line: 'Pace' as Line, distance: 'Offset' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 1, B: 2, C: 0}, final: {A: 1, B: 2, C: 0} }, variance: false, reason: 'Pace offset' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Bonding' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ];
        break;
      case 'Provider':
        mockVerdicts = [
          { line: 'Control' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Pace' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Bonding' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Bonding break' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ];
        break;
      case 'Wanderer':
        mockVerdicts = [
          { line: 'Control' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Pace' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Pace break' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Bonding' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ];
        break;
      case 'Seeker':
        mockVerdicts = [
          { line: 'Control' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Pace' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Truth' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Truth break' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Bonding' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ];
        break;
      case 'Visionary':
        mockVerdicts = [
          { line: 'Control' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Pace' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Boundary' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Boundary break' },
          { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Bonding' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ];
        break;
      case 'Equalizer':
        mockVerdicts = [
          { line: 'Control' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Pace' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Bonding' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Stress' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Stress break' }
        ];
        break;
      case 'Architect':
        mockVerdicts = [
          { line: 'Control' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Pace' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Truth' as Line, distance: 'Far' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} }, variance: false, reason: 'Truth break' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Bonding' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ];
        break;
      default:
        // Default pattern for other archetypes
        mockVerdicts = [
          { line: 'Control' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Pace' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Boundary' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Truth' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Recognition' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Bonding' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' },
          { line: 'Stress' as Line, distance: 'Close' as 'Close' | 'Offset' | 'Far', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} }, variance: false, reason: 'Stable' }
        ];
    }
    
    // Set the selected archetype name for display
    setSelectedArchetype(profileName);
    
    setVerdicts(mockVerdicts);
    setSelectedMode('original');
    setPhase('final');
  };

  // In the original test, convert legacy tokens to new system
  function convertLegacyToV2Tokens(verdicts: LineVerdict[]): LineVerdictV2[] {
    return verdicts.map(legacyVerdict => ({
      line: legacyVerdict.line,
      token: convertLegacyTokenToV2(legacyVerdict.distance), // Close→C, Offset→O, Far→F
      severity: getSeverityFromLegacy(legacyVerdict), // Convert to severity number
      note: legacyVerdict.reason, // Use existing reason as note
      items: [] // Legacy doesn't track items
    }));
  }

  // Helper function to determine severity from legacy data
  function getSeverityFromLegacy(verdict: LineVerdict): number {
    // Convert legacy distance to severity
    switch (verdict.distance) {
      case 'Close': return 1;   // Low severity - stable
      case 'Offset': return 2;  // Medium severity - some issues
      case 'Far': return 3;     // High severity - broken
      default: return 1;
    }
  }

  // render
  return (
    <div>
      {phase === 'intro' && (
        <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
          <p className="text-sm text-neutral-300">
            We begin by assuming you are 100% axis-held. We'll test 7 lines under pressure:
            Control, Pace, Boundary, Truth, Recognition, Bonding, Stress.
          </p>
          <button
            onClick={startModeSelection}
            className="mt-4 rounded-xl bg-neutral-100 text-neutral-900 px-4 py-2 hover:bg-white"
          >
            Choose Test Mode
          </button>
        </div>
      )}

              {phase === 'flow-select' && <FlowSelection />}
        {phase === 'mode-select' && <ModeSelection />}

      {(phase === 'base' || phase === 'tb') && (
        <>
          <Header />
          <Progress />
          <Question />
        </>
      )}

      {phase === 'final' && <Diagnostics />}
    </div>
  );
}
