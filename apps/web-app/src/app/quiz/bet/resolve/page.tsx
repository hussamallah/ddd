"use client";
import { useState, useEffect } from 'react';
import { LINES } from "@/lib/axis/types";
import { getEvidence, addEvent } from "@/lib/axis/evidence";

export default function ResolveBets() {
  const [bets, setBets] = useState(getEvidence().filter(e => e.source==="BET"));
  
  const pass = (line: typeof LINES[number], didPass: boolean) => {
    addEvent({ line, source:"BET_RESULT", token: undefined, ts: Date.now(), meta:{ passed: didPass }});
    // Refresh bets after adding result
    setBets(getEvidence().filter(e => e.source==="BET"));
  };

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl mb-4">Resolve Bet (yes/no)</h1>
      <ul className="space-y-3">
        {LINES.map(line => (
          <li key={line} className="flex items-center justify-between border border-white/10 rounded p-3">
            <div>{line}</div>
            <div className="flex gap-2">
              <button onClick={()=>pass(line,true)} className="px-3 py-1 border rounded">Yes</button>
              <button onClick={()=>pass(line,false)} className="px-3 py-1 border rounded">No</button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
