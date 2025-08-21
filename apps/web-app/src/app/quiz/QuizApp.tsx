'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { QuizBank, Line, Token, TBType, BaseItem, TBBlock, Frame, Option, LineVerdict, Counts, QuizMode, FrameVariant, EnhancedQuizResult } from '@/lib/types';
import { decideTB, fallbackDistance } from '@/lib/pointsMap';
import { loadBankWithFallback, getBankProtectionStatus } from '@/lib/loadBank';
import { composeAIR } from './results/composeAIR';
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

type Phase = 'intro' | 'mode-select' | 'base' | 'tb' | 'final';

type Rendered = {
  frame: Frame | null;
  options: Option[];
  shownOrder: number[];
  promptOverride?: string;
};

// ——— helpers ———
function computeABC(tokens: Token[]): Counts {
  return {
    A: tokens.filter(t => t === 'CLOSE').length,
    B: tokens.filter(t => t === 'STALL').length,
    C: tokens.filter(t => t === 'FRAG').length,
  };
}
function distanceFromCounts(A:number,B:number,C:number): 'Close'|'Offset'|'Far' {
  if (A > B && A > C) return 'Close';
  if (B >= A && B >= C) return 'Offset';
  return 'Far';
}
function pickFrame(item: BaseItem, mode?: QuizMode): Rendered {
  // Filter frames by mode if specified
  let availableFrames = item.frames;
  if (mode && mode !== 'friend' && mode !== 'heat' && mode !== 'bet') {
    const modeFrames = item.frames.filter(f => 
      !f.mode || f.mode.includes(mode) || (mode !== 'original' && f.mode.includes('standard'))
    );
    if (modeFrames.length > 0) {
      availableFrames = modeFrames;
    }
  }
  
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
    <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-900/90 p-5 ring-1 ring-white/10 shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-white">{line.line}</h3>
          <TokenPill t={line.distance === 'Close' ? 'C' : line.distance === 'Offset' ? 'O' : 'F'} />
        </div>
        <button onClick={onClose} className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors">
          Close
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
        <span className="rounded-lg bg-zinc-800/60 px-2 py-1">Status: {line.distance === 'Close' ? '✅ Stable' : line.distance === 'Offset' ? '⚠️ Offset' : '❌ Break'}</span>
        <span className="rounded-lg bg-zinc-800/60 px-2 py-1">Trips You: {line.slipDriver}</span>
        {line.variance && (
          <span className="rounded-full bg-indigo-600/30 px-2 py-0.5 text-xs text-indigo-100">variance</span>
        )}
      </div>

      <p className="text-sm leading-6 text-zinc-200">{line.card}</p>
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

      <Modal open={open} onClose={() => setOpen(false)}>
        {selected && <LineReportCard line={selected} onClose={() => setOpen(false)} />}
      </Modal>
    </div>
  );
};

// ——— component ———
export default function QuizApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bank, setBank] = useState<QuizBank>(bankData as QuizBank);
  const [phase, setPhase] = useState<Phase>(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam && ['original', 'standard', 'heat', 'friend', 'bet'].includes(modeParam)) {
      return 'base'; // Start in quiz mode, not selection mode
    }
    return 'mode-select';
  });
  const [selectedMode, setSelectedMode] = useState<QuizMode>('standard');
  const [lineIdx, setLineIdx] = useState(0);
  const [baseStep, setBaseStep] = useState<0|1|2>(0);
  const [tbIdx, setTbIdx] = useState<0|1>(0);

  const [currentPicks, setCurrentPicks] = useState<Token[]>([]);     // tokens for current line
  const [nonCloseTags, setNonCloseTags] = useState<string[]>([]);
  const [baseCounts, setBaseCounts] = useState<Counts>({A:0,B:0,C:0});
  const [tbType, setTbType] = useState<TBType | null>(null);

  const [verdicts, setVerdicts] = useState<LineVerdict[]>([]);

  // Check for mode parameter on mount and auto-start quiz
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam && ['original', 'standard', 'heat', 'friend', 'bet'].includes(modeParam)) {
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

  function startQuiz(mode: QuizMode) {
    if (mode === 'original' || mode === 'standard') {
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

  function onChoose(option: Option) {
    // record token + tags (for reason extraction)
    setCurrentPicks(prev => [...prev, option.token]);
    if (render?.frame?.tags && option.token !== 'CLOSE') {
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

    const verdict: LineVerdict = {
      line,
      distance,
      counts: { base: baseC, final: finalC },
      tb: tb ? { type: tb, used: true, drift } : undefined,
      variance,
      reason
    };

    setVerdicts(prev => [...prev, verdict]);

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
    
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-yellow-400">Identity Code Mapper</h1>
        
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
        mode: 'standard',
        title: '🎯 Standard',
        description: 'Classic AIT - test your axis integrity under normal pressure'
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
    
    // Generate archetype code and get archetype
    const archetypeCode = generateArchetypeCode(verdicts);
    const archetype = getArchetype(archetypeCode);
    
    return (
      <div className="space-y-6">
        {/* PROMINENT ARCHETYPE HEADLINE */}
        <div className="text-center mb-8">
          {archetype ? (
            <div className="space-y-4">
              {/* Main Archetype Display */}
              <div className="backdrop-blur-xl bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-3xl border border-purple-500/30 p-6 shadow-2xl">
                <div className="text-5xl mb-3">🎭</div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
                  {archetype.archetype}
                </h1>
                <p className="text-lg text-purple-200 mb-3 max-w-xl mx-auto leading-relaxed">
                  {archetype.label}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                  {/* Profile Code */}
                  <div className="inline-flex items-center gap-2 rounded-full bg-purple-800/30 px-3 py-1.5 border border-purple-500/30">
                    <span className="text-purple-300 font-mono text-xs">Profile Code:</span>
                    <span className="text-purple-100 font-bold font-mono text-base">{archetypeCode}</span>
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
              
              {/* Archetype Description */}
              <div className="max-w-4xl mx-auto">
                <div className="rounded-2xl border border-blue-800/30 bg-blue-950/20 p-6">
                  <h3 className="text-2xl font-semibold text-blue-200 mb-4 text-center">🌟 Your Archetype Profile</h3>
                  <p className="text-blue-100 text-center text-lg leading-relaxed mb-6">
                    This archetype represents your core behavioral patterns under pressure. 
                    Understanding it helps you leverage your strengths and navigate your challenges.
                  </p>
                  
                  {/* Archetype Traits Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="font-semibold text-blue-100 flex items-center gap-2">
                        <span className="text-lg">👑</span>
                        <span>Leadership Style</span>
                      </div>
                      <div className="text-blue-300 text-xs">How you take charge and guide others</div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-semibold text-blue-100 flex items-center gap-2">
                        <span className="text-lg">🎯</span>
                        <span>Core Motivation</span>
                      </div>
                      <div className="text-blue-300 text-xs">What drives your decisions and actions</div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-semibold text-blue-100 flex items-center gap-2">
                        <span className="text-lg">⚡</span>
                        <span>Energy Pattern</span>
                      </div>
                      <div className="text-blue-300 text-xs">How you maintain momentum and focus</div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-semibold text-blue-100 flex items-center gap-2">
                        <span className="text-lg">🛡️</span>
                        <span>Defense Mechanism</span>
                      </div>
                      <div className="text-blue-300 text-xs">How you protect yourself under stress</div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-semibold text-blue-100 flex items-center gap-2">
                        <span className="text-lg">🤝</span>
                        <span>Relationship Approach</span>
                      </div>
                      <div className="text-blue-300 text-xs">How you connect and collaborate</div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-semibold text-blue-100 flex items-center gap-2">
                        <span className="text-lg">🚀</span>
                        <span>Growth Direction</span>
                      </div>
                      <div className="text-blue-300 text-xs">Where you're evolving and developing</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="backdrop-blur-xl bg-gradient-to-r from-red-900/40 to-orange-900/40 rounded-3xl border border-red-500/30 p-8 shadow-2xl">
              <div className="text-6xl mb-4">❓</div>
              <h1 className="text-4xl font-bold mb-3 text-red-300">Archetype Not Found</h1>
              <p className="text-xl text-red-200 mb-4">
                We couldn't match your pattern to a known archetype
              </p>
              <div className="inline-flex items-center gap-2 rounded-full bg-red-800/30 px-4 py-2 border border-red-500/30">
                <span className="text-red-300 font-mono text-sm">Generated Code:</span>
                <span className="text-red-100 font-bold font-mono text-lg">{archetypeCode}</span>
              </div>
            </div>
          )}
        </div>
        

        
        {/* Heat Map Results Display */}
        <ResultsHeatMap lines={result.lines} />
        
        {/* Good/Bad/Ugly Analysis */}
        <GbuDiagnosticCards
          good={result.goodBadUgly.good}
          bad={result.goodBadUgly.bad}
          ugly={result.goodBadUgly.ugly || ''}
          goodFooter="Stable. Outcomes land. Clear tempo."
          badFooter="Variability enters. Delays creep in."
        />
        
        {/* Mode-Specific Insights */}
        {selectedMode !== 'standard' && selectedMode !== 'original' && result.modeSpecificInsights && (
          <div className="rounded-2xl border border-blue-800 bg-blue-950/20 p-4">
            <h3 className="text-lg font-semibold text-blue-200 mb-3">
              {selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1)} Mode Insights
            </h3>
            <div className="space-y-2 text-sm text-blue-100">
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
    );
  }

  // render
  return (
    <div>
      <Header />
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

      {phase === 'mode-select' && <ModeSelection />}

      {(phase === 'base' || phase === 'tb') && (
        <>
          <Progress />
          <Question />
        </>
      )}

      {phase === 'final' && <Diagnostics />}
    </div>
  );
}
