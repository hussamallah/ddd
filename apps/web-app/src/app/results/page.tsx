"use client";
import { getEvidence } from "@/lib/axis/evidence";

export default function Results() {
  const ev = getEvidence();
  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Results (raw evidence)</h1>
      <pre className="text-sm bg-black/20 p-4 rounded-lg whitespace-pre-wrap">
        {JSON.stringify(ev, null, 2)}
      </pre>
    </main>
  );
}
