"use client";
import { getEvidence } from "@/lib/axis/evidence";

export default function Results() {
  const ev = getEvidence();
  return (
    <main className="max-w-xl mx-auto px-3 py-5">
      <h1 className="text-xl font-semibold mb-3">Results (raw evidence)</h1>
      <pre className="text-xs bg-black/20 p-2 rounded-lg whitespace-pre-wrap">
        {JSON.stringify(ev, null, 2)}
      </pre>
    </main>
  );
}
