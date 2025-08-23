'use client';

import React, { useState, useEffect } from 'react';
import type { Face, FaceDuelItem, QuizStateV2, DuelPattern } from '@/lib/types';

interface FaceDuelsComponentProps {
  quizState: QuizStateV2;
  onDuelResult: (winner: Face, pattern: DuelPattern, duelsRun: number) => void;
  duelItems: FaceDuelItem[];
}

export default function FaceDuelsComponent({ 
  quizState, 
  onDuelResult, 
  duelItems 
}: FaceDuelsComponentProps) {
  const [currentDuelIndex, setCurrentDuelIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [duelsRun, setDuelsRun] = useState(0);
  const [duelResults, setDuelResults] = useState<Array<{ winner: Face; pattern: string }>>([]);

  const currentDuel = duelItems[currentDuelIndex];
  const faceCounts = quizState.faceTriad.counts;
  const lockedFamily = quizState.familyHone.lockedFamily;

  // Reset selection when duel changes
  useEffect(() => {
    setSelectedOption(null);
  }, [currentDuelIndex]);

  const handleOptionSelect = (optionKey: string) => {
    setSelectedOption(optionKey);
  };

  const handleConfirm = () => {
    if (!selectedOption || !currentDuel) return;

    // Validate current stage
    if (quizState.stage !== 'face_duels') {
      console.warn('⚠️ FaceDuelsComponent: Ignoring duel result - wrong stage:', quizState.stage);
      return;
    }

    const winner = currentDuel.options[selectedOption].face;
    const newDuelsRun = duelsRun + 1;
    
    // Record this duel result
    const newDuelResults = [...duelResults, { 
      winner, 
      pattern: `duel_${newDuelsRun}` 
    }];
    setDuelResults(newDuelResults);
    setDuelsRun(newDuelsRun);

    // Determine if we need more duels
    if (newDuelsRun >= 2) {
      // Maximum duels reached, determine final winner
      const finalWinner = determineFinalWinner(newDuelResults, faceCounts);
      const pattern = detectDuelPattern(faceCounts);
      
      // Double-check stage before calling onDuelResult
      if (quizState.stage === 'face_duels') {
        onDuelResult(finalWinner, pattern, newDuelsRun);
      } else {
        console.warn('⚠️ Stage changed during duel processing, not recording result');
      }
    } else {
      // Move to next duel
      setCurrentDuelIndex(prev => prev + 1);
    }
  };

  const determineFinalWinner = (results: Array<{ winner: Face; pattern: string }>, counts: Record<Face, number>): Face => {
    // Simple logic: winner of the last duel, or most recent winner
    return results[results.length - 1].winner;
  };

  const detectDuelPattern = (counts: Record<Face, number>): DuelPattern => {
    const values = Object.values(counts).sort((a, b) => b - a);
    
    if (values[0] === 2 && values[1] === 1) return '2-1-0';
    if (values[0] === 2 && values[2] === 1) return '2-0-1';
    if (values[0] === 1 && values[1] === 1 && values[2] === 1) return '1-1-1';
    
    return '2-1-0'; // Default fallback
  };

  const getDuelExplanation = (): string => {
    const pattern = detectDuelPattern(faceCounts);
    
    switch (pattern) {
      case '2-1-0':
        return 'The leading archetype needs to prove itself against the runner-up.';
      case '2-0-1':
        return 'The leading archetype faces the third-place contender.';
      case '1-1-1':
        return 'All three archetypes are tied. We need duels to break the deadlock.';
      default:
        return 'Duels are needed to resolve the tie between archetypes.';
    }
  };

  if (!currentDuel) {
    return (
      <div className="text-center p-8">
        <p className="text-neutral-400">No more duel items available.</p>
      </div>
    );
  }

  // Only show content when in the face_duels stage
  if (quizState.stage !== 'face_duels') {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">
          Face Duels: {lockedFamily} Family
        </h2>
        <p className="text-neutral-300 mb-6">
          {getDuelExplanation()}
        </p>
        
        {/* Duel Progress */}
        <div className="flex justify-center mb-6">
          <div className="flex gap-2">
            {Array.from({ length: 2 }, (_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all ${
                  index < duelsRun
                    ? 'bg-green-500'
                    : index === duelsRun
                      ? 'bg-blue-500'
                      : 'bg-neutral-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Face Counts Display */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {Object.entries(faceCounts).map(([face, count]) => (
            <div 
              key={face}
              className={`text-center p-4 rounded-lg border-2 transition-all ${
                count >= 2 
                  ? 'border-green-500 bg-green-500/20' 
                  : count > 0 
                    ? 'border-blue-500 bg-blue-500/20' 
                    : 'border-neutral-600 bg-neutral-800/40'
              }`}
            >
              <div className="text-lg font-bold text-white capitalize mb-1">
                {face}
              </div>
              <div className="text-2xl font-bold text-white">{count}</div>
              <div className="text-xs text-neutral-400 mt-1">
                {count === 0 ? 'No picks' : count === 1 ? '1 pick' : `${count} picks`}
              </div>
            </div>
          ))}
        </div>

        {/* Duel Status */}
        <div className="text-center p-3 bg-yellow-500/20 border border-yellow-500/40 rounded-lg mb-6">
          <span className="text-yellow-300">
            Duel {duelsRun + 1} of 2 - {duelsRun === 0 ? 'First duel' : 'Final duel'}
          </span>
        </div>
      </div>

      {/* Current Duel */}
      <div className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-6 mb-6">
        <div className="text-center mb-6">
          <div className="text-sm text-neutral-400 mb-2">
            Duel {duelsRun + 1}
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
              className={`text-left p-4 rounded-lg border-2 transition-all ${
                selectedOption === optionKey
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-neutral-600 bg-neutral-800/40 hover:border-neutral-500 hover:bg-neutral-700/40'
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
                <div className="text-sm text-neutral-400 px-2 py-1 bg-neutral-700/60 rounded capitalize">
                  {option.face}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <button
            onClick={handleConfirm}
            disabled={!selectedOption}
            className={`px-8 py-3 rounded-lg font-medium transition-all ${
              selectedOption
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {duelsRun === 0 ? 'Confirm First Duel' : 'Confirm Final Duel'}
          </button>
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
                <span className="text-white font-medium capitalize">{result.winner}</span>
                <span className="text-green-400">✓ Won</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center text-sm text-neutral-400">
        <p>
          Choose the option that best represents your behavior in this situation.
        </p>
        <p className="mt-2">
          After {duelsRun === 0 ? '2' : '1'} duel{duelsRun === 0 ? 's' : ''}, we'll determine your final archetype.
        </p>
      </div>
    </div>
  );
}
