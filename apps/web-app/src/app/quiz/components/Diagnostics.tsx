'use client';

import React from 'react';
import type { LineVerdict } from '@/lib/types';

interface DiagnosticsProps {
  verdicts: LineVerdict[];
  selectedMode: string;
}

export default function Diagnostics({ verdicts, selectedMode }: DiagnosticsProps) {
  const getDistanceColor = (distance: 'Close' | 'Offset' | 'Far') => {
    switch (distance) {
      case 'Close': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'Offset': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'Far': return 'text-red-400 bg-red-500/20 border-red-500/40';
      default: return 'text-neutral-400 bg-neutral-500/20 border-neutral-500/40';
    }
  };

  const getDistanceIcon = (distance: 'Close' | 'Offset' | 'Far') => {
    switch (distance) {
      case 'Close': return '✅';
      case 'Offset': return '⚠️';
      case 'Far': return '❌';
      default: return '❓';
    }
  };

  const getCountsDisplay = (counts: { A: number; B: number; C: number }) => {
    return `A:${counts.A} B:${counts.B} C:${counts.C}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          Quiz Diagnostics 🔍
        </h1>
        <p className="text-xl text-neutral-300">
          Detailed analysis of your quiz responses and operating lines
        </p>
        <div className="mt-4 inline-block px-4 py-2 bg-blue-500/20 border border-blue-500/40 rounded-lg">
          <span className="text-blue-300 text-sm font-medium">
            Mode: {selectedMode}
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-green-400 mb-2">
            {verdicts.filter(v => v.distance === 'Close').length}
          </div>
          <div className="text-neutral-400">Stable Lines</div>
        </div>
        <div className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-yellow-400 mb-2">
            {verdicts.filter(v => v.distance === 'Offset').length}
          </div>
          <div className="text-neutral-400">Offset Lines</div>
        </div>
        <div className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-red-400 mb-2">
            {verdicts.filter(v => v.distance === 'Far').length}
          </div>
          <div className="text-neutral-400">Break Lines</div>
        </div>
      </div>

      {/* Detailed Verdicts */}
      <div className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="text-purple-400">📊</span>
          Line-by-Line Analysis
        </h2>
        
        <div className="space-y-4">
          {verdicts.map((verdict, index) => (
            <div
              key={index}
              className="bg-neutral-800/40 border border-neutral-600 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getDistanceIcon(verdict.distance)}</span>
                  <h3 className="text-lg font-semibold text-white">
                    {verdict.line}
                  </h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDistanceColor(verdict.distance)}`}>
                  {verdict.distance}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-400">Base Counts: </span>
                  <span className="text-white font-mono">
                    {getCountsDisplay(verdict.counts.base)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400">Final Counts: </span>
                  <span className="text-white font-mono">
                    {getCountsDisplay(verdict.counts.final)}
                  </span>
                </div>
                {verdict.variance && (
                  <div className="md:col-span-2">
                    <span className="text-orange-400 font-medium">⚠️ Variance detected (A & C both appeared)</span>
                  </div>
                )}
                {verdict.reason && (
                  <div className="md:col-span-2">
                    <span className="text-neutral-400">Reason: </span>
                    <span className="text-white">{verdict.reason}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Insights */}
      <div className="mt-8 bg-neutral-900/60 border border-neutral-700 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <span className="text-blue-400">💡</span>
          Insights
        </h2>
        <div className="space-y-3 text-neutral-300">
          <p>
            • <strong>Stable Lines (Close):</strong> These are your core operating principles that remain consistent across different contexts.
          </p>
          <p>
            • <strong>Offset Lines (Offset):</strong> These areas show some flexibility and may vary depending on the situation.
          </p>
          <p>
            • <strong>Break Lines (Far):</strong> These represent areas where your behavior patterns may significantly differ from typical responses.
          </p>
          {verdicts.some(v => v.variance) && (
            <p className="text-orange-400">
              • <strong>Variance Detected:</strong> Some lines show mixed signals, indicating complex or evolving patterns.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
