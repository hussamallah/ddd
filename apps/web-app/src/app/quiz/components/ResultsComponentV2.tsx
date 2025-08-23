'use client';

import React from 'react';
import type { QuizResultV2, LineVerdictV2 } from '@/lib/types';

interface ResultsComponentV2Props {
  results: QuizResultV2;
  onRestart: () => void;
}

export default function ResultsComponentV2({ results, onRestart }: ResultsComponentV2Props) {
  const getTokenColor = (token: 'C' | 'O' | 'F') => {
    switch (token) {
      case 'C': return 'text-green-400';
      case 'O': return 'text-yellow-400';
      case 'F': return 'text-red-400';
      default: return 'text-neutral-400';
    }
  };

  const getTokenBackground = (token: 'C' | 'O' | 'F') => {
    switch (token) {
      case 'C': return 'bg-green-500/20 border-green-500/40';
      case 'O': return 'bg-yellow-500/20 border-yellow-500/40';
      case 'F': return 'bg-red-500/20 border-red-500/40';
      default: return 'bg-neutral-500/20 border-neutral-500/40';
    }
  };

  const getConfidenceColor = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'low': return 'text-red-400 bg-red-500/20 border-red-500/40';
      default: return 'text-neutral-400 bg-neutral-500/20 border-neutral-500/40';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          Quiz Complete! 🎉
        </h1>
        <p className="text-xl text-neutral-300">
          Here's your archetype profile and operating lines assessment
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Left Column - Family & Face */}
        <div className="space-y-6">
          {/* Family Section */}
          <div className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-purple-400">🏠</span>
              Family: {results.family.name}
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Picks to Lock:</span>
                <span className="text-white font-semibold">{results.family.picksToLock}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Confidence:</span>
                <span className="text-green-400 font-semibold">High</span>
              </div>
            </div>
            
            {/* Family History */}
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-white mb-2">Selection History</h3>
              <div className="flex gap-2 flex-wrap">
                {results.family.fhHistory.map((family, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      family === results.family.name
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                        : 'bg-neutral-700/60 text-neutral-300 border border-neutral-600'
                    }`}
                  >
                    {family}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Face Section */}
          <div className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-blue-400">👤</span>
              Face: {results.face.name}
            </h2>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Confidence:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getConfidenceColor(results.face.confidence)}`}>
                  {results.face.confidence.charAt(0).toUpperCase() + results.face.confidence.slice(1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Duels Run:</span>
                <span className="text-white font-semibold">{results.face.duelsRun}</span>
              </div>
            </div>

            {/* Face Selection Explanation */}
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-white mb-2">Why This Face?</h3>
              <p className="text-neutral-300 leading-relaxed">
                {results.face.why}
              </p>
            </div>

            {/* Triad Counts */}
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-white mb-2">Triad Results</h3>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(results.face.triadCounts).map(([face, count]) => (
                  <div
                    key={face}
                    className={`text-center p-2 rounded-lg border ${
                      face === results.face.name
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-neutral-600 bg-neutral-800/40'
                    }`}
                  >
                    <div className="text-xs text-neutral-400 mb-1 capitalize">{face}</div>
                    <div className="text-lg font-bold text-white">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Lines & CODE_7 */}
        <div className="space-y-6">
          {/* CODE_7 Section */}
          <div className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-green-400">🔢</span>
              CODE_7: {results.lines.code7}
            </h2>
            <p className="text-neutral-300 mb-4">
              Your 7-line operating pattern. Each character represents a line's current state.
            </p>
            
            {/* Lines Grid */}
            <div className="grid grid-cols-7 gap-2">
              {results.lines.perLine.map((verdict, index) => (
                <div
                  key={verdict.line}
                  className={`text-center p-3 rounded-lg border-2 ${getTokenBackground(verdict.token)}`}
                >
                  <div className="text-xs text-neutral-400 mb-1">{verdict.line}</div>
                  <div className={`text-lg font-bold ${getTokenColor(verdict.token)}`}>
                    {verdict.token}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">
                    {verdict.severity === 0 ? 'Stable' : verdict.severity === 1 ? 'Offset' : 'Break'}
                  </div>
                </div>
              ))}
            </div>

            {/* Token Legend */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <span className="text-green-400 font-bold">C</span> = Stable
              </div>
              <div className="text-center">
                <span className="text-yellow-400 font-bold">O</span> = Offset
              </div>
              <div className="text-center">
                <span className="text-red-400 font-bold">F</span> = Break
              </div>
            </div>
          </div>

          {/* Truth Line Section */}
          <div className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-yellow-400">💡</span>
              Truth Line
            </h2>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-200 text-lg italic leading-relaxed">
                "{results.truthLine}"
              </p>
            </div>
            <p className="text-neutral-400 text-sm mt-3">
              This truth line is specific to your selected archetype and represents a core principle.
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Line Analysis */}
      <div className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Detailed Line Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.lines.perLine.map((verdict) => (
            <div
              key={verdict.line}
              className={`p-4 rounded-lg border-2 ${getTokenBackground(verdict.token)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">{verdict.line}</h3>
                <span className={`text-2xl font-bold ${getTokenColor(verdict.token)}`}>
                  {verdict.token}
                </span>
              </div>
              <p className="text-neutral-300 text-sm leading-relaxed">
                {verdict.note}
              </p>
              <div className="mt-3 text-xs text-neutral-400">
                Severity: {verdict.severity === 0 ? 'Low' : verdict.severity === 1 ? 'Medium' : 'High'}
              </div>
            </div>
          ))}
        </div>
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

      {/* Audit Trail (Collapsible) */}
      <details className="mt-12 bg-neutral-900/40 border border-neutral-700 rounded-xl p-6">
        <summary className="text-lg font-semibold text-white cursor-pointer hover:text-blue-400 transition-colors">
          📊 View Audit Trail
        </summary>
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="text-md font-semibold text-white mb-2">Family Hone Counts</h4>
            <div className="grid grid-cols-7 gap-2">
              {Object.entries(results.audit.familyHoneCounts).map(([family, count]) => (
                <div key={family} className="text-center p-2 bg-neutral-800/40 rounded border border-neutral-600">
                  <div className="text-xs text-neutral-400">{family}</div>
                  <div className="text-white font-bold">{count}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-md font-semibold text-white mb-2">Rules Used</h4>
            <div className="flex gap-2 flex-wrap">
              {results.audit.rulesUsed.map((rule, index) => (
                <span key={index} className="px-3 py-1 bg-neutral-700/60 text-neutral-300 rounded-full text-sm">
                  {rule}
                </span>
              ))}
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
