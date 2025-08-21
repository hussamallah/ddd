"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** Minimal inline types/helpers to avoid cross-app imports */
type LineKey = "CONTROL"|"PACE"|"BOUNDARY"|"TRUTH"|"RECOGNITION"|"BONDING"|"STRESS";
type Binary = "A"|"B";
type Token = "CLOSE"|"STALL"|"FRAG";
const LINES: LineKey[] = ["CONTROL","PACE","BOUNDARY","TRUTH","RECOGNITION","BONDING","STRESS"];
const mapABtoToken = (line: LineKey, choice: Binary): Token => {
  switch (line) {
    case "CONTROL":      return choice==="A" ? "CLOSE" : "STALL";   // Enforce vs Negotiate
    case "PACE":         return choice==="A" ? "CLOSE" : "FRAG";    // Focus vs Thread
    case "BOUNDARY":     return choice==="A" ? "CLOSE" : "STALL";   // No vs Explain
    case "TRUTH":        return choice==="A" ? "CLOSE" : "STALL";   // Lock vs Delay
    case "RECOGNITION":  return choice==="A" ? "CLOSE" : "FRAG";    // Receipt vs Stage
    case "BONDING":      return choice==="A" ? "CLOSE" : "STALL";   // Line vs Soften
    case "STRESS":       return choice==="A" ? "CLOSE" : "FRAG";    // Sequence vs Hop
  }
};

type HeatEvent = {
  type: "HEAT";
  runId: string;
  line: LineKey;
  choice: "A"|"B";
  token: Token;
  charge: 0|1|2;
  latencyMs: number;
  hesitated: boolean;
  ts: number;
  stacks: { time?: true; exposure?: true; irreversibility?: true };
};

const KEY = "evidence.v2";
const readStore = () => JSON.parse(localStorage.getItem(KEY) || "[]");
const writeStore = (arr: any[]) => localStorage.setItem(KEY, JSON.stringify(arr));

const HESITATE_MS = 2000;
const TOTAL_TIME_MS = 30000;

export default function RunPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const mode = (sp.get("mode") ?? "heat") as "heat"|"friend"|"bet";
  const stacksParam = sp.get("stacks") || "time";
  const runId = useMemo(() => (crypto as any).randomUUID?.() ?? String(Date.now()), []);
  
  // Parse stacks from URL
  const stacks = useMemo(() => {
    const stackList = stacksParam.split(",");
    return {
      time: stackList.includes("time"),
      exposure: stackList.includes("exposure"),
      irreversibility: stackList.includes("irreversibility"),
    };
  }, [stacksParam]);

  const [state, setState] = useState<Record<LineKey,{
    choice?: Binary, 
    charge?: 0|1|2,
    rowStartTime?: number,
    hesitated?: boolean
  }>>(
    Object.fromEntries(LINES.map(l=>[l,{choice:undefined, charge:0}])) as any
  );

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_TIME_MS);
  const [isActive, setIsActive] = useState(false);
  const startTime = useRef<number>(0);
  const rowStartTimes = useRef<Record<LineKey, number>>({} as Record<LineKey, number>);

  // Start timer when component mounts
  useEffect(() => {
    if (stacks.time) {
      startTime.current = performance.now();
      setIsActive(true);
      
      // Set initial row start times
      LINES.forEach(line => {
        rowStartTimes.current[line] = performance.now();
      });
    }
  }, [stacks.time]);

  // Timer countdown
  useEffect(() => {
    if (!isActive || !stacks.time) return;

    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime.current;
      const remaining = Math.max(0, TOTAL_TIME_MS - elapsed);
      
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        setIsActive(false);
        submit(); // Auto-submit when timer expires
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, stacks.time]);

  // Hesitation detection for each row
  useEffect(() => {
    if (!stacks.time) return;

    const timeouts: Record<LineKey, NodeJS.Timeout> = {} as any;

    LINES.forEach(line => {
      const row = state[line];
      if (!row?.choice && !row?.hesitated) {
        timeouts[line] = setTimeout(() => {
          // Auto-select B if hesitated
          setState(prev => ({
            ...prev,
            [line]: {
              ...prev[line],
              choice: "B",
              hesitated: true,
              charge: prev[line]?.charge || 0
            }
          }));
        }, HESITATE_MS);
      }
    });

    return () => {
      Object.values(timeouts).forEach(clearTimeout);
    };
  }, [state, stacks.time]);

  const setChoice = (line: LineKey, choice: Binary) => {
    const latencyMs = Math.round(performance.now() - (rowStartTimes.current[line] || performance.now()));
    
    setState(s => ({
      ...s, 
      [line]: {
        ...s[line], 
        choice,
        rowStartTime: rowStartTimes.current[line],
        hesitated: false
      }
    }));

    // Reset row start time for next interaction
    rowStartTimes.current[line] = performance.now();
  };

  const setCharge = (line: LineKey, charge:0|1|2) =>
    setState(s => ({...s, [line]: {...s[line], charge}}));

  const selectedCount = LINES.reduce((n,l)=> n + (state[l].choice ? 1 : 0), 0);

  const submit = () => {
    const buf = readStore();
    let wrote = 0;
    
    for (const line of LINES) {
      const row = state[line];
      if (!row?.choice) continue;
      
      const latencyMs = row.rowStartTime 
        ? Math.round(performance.now() - row.rowStartTime)
        : 0;

      buf.push({
        type: "HEAT",
        runId,
        line,
        choice: row.choice,
        token: mapABtoToken(line, row.choice),
        charge: row.charge ?? 0,
        latencyMs,
        hesitated: row.hesitated ?? false,
        ts: Date.now(),
        stacks
      } as HeatEvent);
      wrote++;
    }
    
    writeStore(buf);
    router.push(`/quiz/results?run=${runId}`);
  };

  const LABELS: Record<LineKey,[string,string]> = {
    CONTROL:["Enforce","Negotiate"],
    PACE:["Focus","Thread"],
    BOUNDARY:["No","Explain"],
    TRUTH:["Lock","Delay"],
    RECOGNITION:["Receipt","Stage"],
    BONDING:["Line","Soften"],
    STRESS:["Sequence","Hop"],
  };

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Heat Scan — one word per line</h1>
        {stacks.time && (
          <div className="text-lg font-mono">
            {formatTime(timeRemaining)}
          </div>
        )}
      </div>

      <div className="text-sm opacity-70 mb-4">
        Close eyes. One hand on the tense spot.<br />
        Answer in ≤2s. Hesitation = right option.
      </div>

      <div className="text-sm opacity-70 mb-4">
        Selected: {selectedCount}/7
        <button
          type="button"
          className="ml-3 underline"
          onClick={()=>{ localStorage.removeItem(KEY); }}>
          Clear stored evidence
        </button>
      </div>

      {/* Stack badges */}
      {(stacks.exposure || stacks.irreversibility) && (
        <div className="flex gap-2 mb-4">
          {stacks.exposure && (
            <span className="px-2 py-1 text-xs rounded bg-amber-600/30 border border-amber-600/50">
              Receipt required
            </span>
          )}
          {stacks.irreversibility && (
            <span className="px-2 py-1 text-xs rounded bg-rose-600/30 border border-rose-600/50">
              Step armed
            </span>
          )}
        </div>
      )}

      <ul className="space-y-5">
        {LINES.map(line=>{
          const [A,B] = LABELS[line];
          const row = state[line];
          const hesitated = row?.hesitated;
          
          return (
            <li key={line} className={`rounded-xl border p-4 ${
              hesitated ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/10'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium">{line}</div>
                <div className="flex items-center gap-2">
                  {[0,1,2].map(c=>(
                    <button
                      key={c}
                      type="button"
                      onClick={()=>setCharge(line, c as 0|1|2)}
                      className={`w-2.5 h-2.5 rounded-full ${row.charge===c?'bg-white':'bg-white/20'}`}
                      aria-label={`charge-${c}`} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={()=>setChoice(line,"A")}
                  disabled={!!row?.choice}
                  className={`px-3 py-2 rounded-full border ${
                    row.choice==="A"
                      ?'border-white bg-white/10'
                      :'border-white/20 hover:border-white/60 disabled:opacity-50'
                  }`}>
                  {A}
                </button>
                <button
                  type="button"
                  onClick={()=>setChoice(line,"B")}
                  disabled={!!row?.choice}
                  className={`px-3 py-2 rounded-full border ${
                    row.choice==="B"
                      ?'border-white bg-white/10'
                      :'border-white/20 hover:border-white/60 disabled:opacity-50'
                  }`}>
                  {B}
                </button>
              </div>
              {hesitated && (
                <div className="text-xs text-amber-400 mt-2">
                  Auto-selected (hesitation)
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex gap-4">
        <button
          type="button"
          onClick={submit}
          className="px-4 py-2 rounded-lg border border-white/20 hover:border-white/60">
          Save & View Results
        </button>
        <button
          type="button"
          onClick={() => setState(Object.fromEntries(LINES.map(l=>[l,{choice:undefined, charge:0}])) as any)}
          className="px-4 py-2 rounded-lg border border-white/20 hover:border-white/60">
          Reset
        </button>
      </div>
    </main>
  );
}
