"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Stack = "time" | "exposure" | "irreversibility";

export default function StacksPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const mode = sp.get("mode") || "heat";
  
  const [stacks, setStacks] = useState<Record<Stack, boolean>>({
    time: true, // default ON
    exposure: false,
    irreversibility: false,
  });

  const toggleStack = (stack: Stack) => {
    setStacks(prev => ({ ...prev, [stack]: !prev[stack] }));
  };

  const selectedCount = Object.values(stacks).filter(Boolean).length;
  const canBegin = selectedCount >= 1;

  const beginScan = () => {
    const stackParams = Object.entries(stacks)
      .filter(([_, enabled]) => enabled)
      .map(([stack, _]) => stack)
      .join(",");
    
    router.push(`/quiz/run?mode=${mode}&stacks=${stackParams}`);
  };

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Choose your heat (pick ≥1)</h1>

      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between p-4 rounded-lg border border-white/20">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="time"
              checked={stacks.time}
              onChange={() => toggleStack("time")}
              className="w-4 h-4"
            />
            <label htmlFor="time" className="font-medium">Time</label>
          </div>
          <div className="text-sm opacity-70 text-right">
            30s total. Each pair ≤2s.<br />
            If you hesitate, the <strong>right</strong> option auto-selects.
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-white/20">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="exposure"
              checked={stacks.exposure}
              onChange={() => toggleStack("exposure")}
              className="w-4 h-4"
            />
            <label htmlFor="exposure" className="font-medium">Exposure</label>
          </div>
          <div className="text-sm opacity-70 text-right">
            You will post <strong>one artifact</strong> at the end.
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-white/20">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="irreversibility"
              checked={stacks.irreversibility}
              onChange={() => toggleStack("irreversibility")}
              className="w-4 h-4"
            />
            <label htmlFor="irreversibility" className="font-medium">Irreversibility</label>
          </div>
          <div className="text-sm opacity-70 text-right">
            Pre-arm one tiny step you can actually ship<br />
            (DM, commit, post).
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg border border-white/20 hover:border-white/60">
          Back
        </button>
        
        <button
          type="button"
          onClick={beginScan}
          disabled={!canBegin}
          className={`px-6 py-2 rounded-lg border ${
            canBegin 
              ? "border-white/20 hover:border-white/60 bg-white/10" 
              : "border-white/10 opacity-50 cursor-not-allowed"
          }`}>
          Begin {stacks.time ? "(30s)" : ""}
        </button>
      </div>
    </main>
  );
}
