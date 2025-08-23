'use client';

import React, { useState } from 'react';
import type { Line, LineDuelItem } from '@/lib/types';

interface LineDuelsComponentProps {
  line: Line;
  duelItems: LineDuelItem[];
  onDuelResult: (winner: 'C' | 'O' | 'F') => void;
}

export default function LineDuelsComponent({ 
  line, 
  duelItems, 
  onDuelResult 
}: LineDuelsComponentProps) {
  const [currentDuelIndex, setCurrentDuelIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [duelResults, setDuelResults] = useState<Array<{ winner: 'C' | 'O' | 'F'; pattern: string }>>([]);

  const currentDuel = duelItems[currentDuelIndex];

  const handleOptionSelect = (optionKey: string) => {
    setSelectedOption(optionKey);
    
    // Auto-confirm the selection after a brief delay for visual feedback
    setTimeout(() => {
      if (!currentDuel) return;

      const winner = currentDuel.options[optionKey].token;
      const newDuelResults = [...duelResults, {
        winner,
        pattern: `duel_${duelResults.length + 1}`
      }];
      setDuelResults(newDuelResults);

      // If we have enough duels or this is the last one, determine final result
      if (duelResults.length >= 1 || currentDuelIndex >= duelItems.length - 1) {
        const finalWinner = determineFinalWinner(newDuelResults);
        onDuelResult(finalWinner);
      } else {
        // Move to next duel
        setCurrentDuelIndex(prev => prev + 1);
        setSelectedOption(null);
      }
    }, 300); // 300ms delay for visual feedback
  };

  const determineFinalWinner = (results: Array<{ winner: 'C' | 'O' | 'F'; pattern: string }>): 'C' | 'O' | 'F' => {
    // Simple logic: prefer the most severe token (F > O > C)
    const hasF = results.some(r => r.winner === 'F');
    const hasO = results.some(r => r.winner === 'O');
    
    if (hasF) return 'F';
    if (hasO) return 'O';
    return 'C';
  };

  if (!currentDuel) {
    return (
      <div className="text-center p-8">
        <p className="text-neutral-400">No duel items available for {line} line.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">
          Line Duel: {line}
        </h2>
        <p className="text-neutral-300 mb-6">
          We need to resolve an edge case in your {line} line. Choose the option that best represents your behavior.
        </p>
        
        {/* Duel Progress */}
        <div className="flex justify-center mb-6">
          <div className="flex gap-2">
            {duelItems.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all ${
                  index < currentDuelIndex
                    ? 'bg-green-500'
                    : index === currentDuelIndex
                      ? 'bg-blue-500'
                      : 'bg-neutral-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Current Duel */}
      <div className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-6 mb-6">
        <div className="text-center mb-6">
          <div className="text-sm text-neutral-400 mb-2">
            Duel {currentDuelIndex + 1} of {duelItems.length}
          </div>
          <h3 className="text-xl font-semibold text-white leading-relaxed">
            {currentDuel.prompt}
          </h3>
        </div>

        {/* Duel Options */}
        <div className="grid gap-3 mb-6">
          {Object.entries(currentDuel.options).map(([optionKey, option]) => (
            <button
              key={optionKey}
              onClick={() => handleOptionSelect(optionKey)}
              className={`text-left p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                selectedOption === optionKey
                  ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/25'
                  : 'border-neutral-600 bg-neutral-800/40 hover:border-blue-400 hover:bg-blue-500/10 hover:shadow-md hover:shadow-blue-500/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedOption === optionKey
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-neutral-500'
                  }`}>
                    {selectedOption === optionKey && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <span className="text-lg font-medium text-white">
                    {optionKey}. {option.text}
                  </span>
                </div>
                <div className={`text-sm px-2 py-1 rounded ${
                  option.token === 'C'
                    ? 'text-green-400 bg-green-500/20'
                    : option.token === 'O'
                      ? 'text-yellow-400 bg-yellow-500/20'
                      : 'text-red-400 bg-red-500/20'
                }`}>
                  {option.token}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Selection Feedback */}
        <div className="text-center p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center justify-center gap-2 text-blue-400">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <p className="font-medium">Selection will be confirmed automatically...</p>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Duel History */}
      {duelResults.length > 0 && (
        <div className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Duel History</h3>
          <div className="space-y-3">
            {duelResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-neutral-800/40 rounded-lg">
                <span className="text-neutral-300">Duel {index + 1}:</span>
                <span className={`font-medium ${
                  result.winner === 'C' ? 'text-green-400' : 
                  result.winner === 'O' ? 'text-yellow-400' : 
                  'text-red-400'
                }`}>
                  {result.winner} won
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center text-sm text-neutral-400">
        <p>
          <span className="text-blue-400 font-medium">Click once</span> on the option that best represents your behavior.
        </p>
        <p className="mt-2">
          C = Stable, O = Offset, F = Break. We'll use the most severe result.
        </p>
      </div>
    </div>
  );
}
