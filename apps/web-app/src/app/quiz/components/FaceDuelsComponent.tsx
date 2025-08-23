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

  // Fix the duel logic to match the pattern rules:

  const handleConfirm = () => {
    if (!selectedOption || !currentDuel) return;

    const winner = currentDuel.options[selectedOption].face;
    const newDuelsRun = duelsRun + 1;
    
    console.log('🎯 handleConfirm called:', {
      selectedOption,
      winner,
      newDuelsRun,
      currentDuelIndex,
      duelItems: duelItems.length,
      faceCounts
    });
    
    // Record this duel result
    const newDuelResults = [...duelResults, { winner, pattern: `duel_${newDuelsRun}` }];
    setDuelResults(newDuelResults);
    setDuelsRun(newDuelsRun);

    // Check the pattern to determine how many duels needed
    const pattern = detectDuelPattern(faceCounts);
    console.log('🎯 Duel pattern detected:', pattern);
    
    if (pattern === '2-0-1') {
      console.log('🎯 Processing 2-0-1 pattern');
      if (newDuelsRun === 1) {
        // First duel: 2nd vs 3rd place
        // Get the 2nd place face from counts
        const secondPlaceFace = Object.entries(faceCounts).find(([face, count]) => count === 1)?.[0];
        console.log('🎯 Second place face:', secondPlaceFace);
        
        if (winner === secondPlaceFace) {
          // 2nd place won - advance to lines
          console.log('🎯 2nd place won, advancing to lines');
          onDuelResult(winner, pattern, newDuelsRun);
        } else {
          // 3rd place won - need final question
          console.log('🎯 3rd place won, moving to next duel');
          if (currentDuelIndex + 1 < duelItems.length) {
            setCurrentDuelIndex(prev => prev + 1);
          } else {
            console.error('❌ No more duel items available for 2-0-1 pattern');
            // Fallback: use the winner we have
            onDuelResult(winner, pattern, newDuelsRun);
          }
        }
      } else if (newDuelsRun === 2) {
        // Final question completed - determine winner
        console.log('🎯 Final duel completed, determining winner');
        const finalWinner = determineFinalWinner(newDuelResults, faceCounts);
        onDuelResult(finalWinner, pattern, newDuelsRun);
      }
    } else if (pattern === '2-1-0') {
      console.log('🎯 Processing 2-1-0 pattern - only 1 duel needed');
      // Only 1 duel needed
      onDuelResult(winner, pattern, newDuelsRun);
    } else if (pattern === '1-1-1') {
      console.log('🎯 Processing 1-1-1 pattern - need 2 duels');
      // Need 2 duels
      if (newDuelsRun >= 2) {
        const finalWinner = determineFinalWinner(newDuelResults, faceCounts);
        onDuelResult(finalWinner, pattern, newDuelsRun);
      } else {
        console.log('🎯 Moving to next duel for 1-1-1 pattern');
        if (currentDuelIndex + 1 < duelItems.length) {
          setCurrentDuelIndex(prev => prev + 1);
        } else {
          console.error('❌ No more duel items available for 1-1-1 pattern');
          // Fallback: use the winner we have
          onDuelResult(winner, pattern, newDuelsRun);
        }
      }
    } else {
      console.log('🎯 Unknown pattern, using default behavior');
      // Default behavior for unknown patterns
      if (newDuelsRun >= 2) {
        const finalWinner = determineFinalWinner(newDuelResults, faceCounts);
        onDuelResult(finalWinner, pattern, newDuelsRun);
      } else {
        console.log('🎯 Moving to next duel for unknown pattern');
        if (currentDuelIndex + 1 < duelItems.length) {
          setCurrentDuelIndex(prev => prev + 1);
        } else {
          console.error('❌ No more duel items available for unknown pattern');
          // Fallback: use the winner we have
          onDuelResult(winner, pattern, newDuelsRun);
        }
      }
    }
  };

  const determineFinalWinner = (results: Array<{ winner: Face; pattern: string }>, counts: Record<Face, number>): Face => {
    // Simple logic: winner of the last duel, or most recent winner
    return results[results.length - 1].winner;
  };

  const detectDuelPattern = (counts: Record<Face, number>): DuelPattern => {
    const values = Object.values(counts).sort((a, b) => b - a);
    
    console.log('🔍 detectDuelPattern - Face counts:', counts);
    console.log('🔍 detectDuelPattern - Sorted values:', values);
    
    // Handle all possible patterns
    if (values[0] === 2 && values[1] === 1 && values[2] === 0) return '2-1-0';
    if (values[0] === 2 && values[1] === 0 && values[2] === 1) return '2-0-1';
    if (values[0] === 1 && values[1] === 1 && values[2] === 1) return '1-1-1';
    
    // Additional patterns that might occur
    if (values[0] === 3 && values[1] === 0 && values[2] === 0) return '3-0-0';
    
    // For edge cases, map to closest valid pattern
    if (values[0] === 1 && values[1] === 1 && values[2] === 0) {
      console.log('⚠️ detectDuelPattern - Mapping 1-1-0 to 1-1-1 pattern');
      return '1-1-1';
    }
    if (values[0] === 1 && values[1] === 0 && values[2] === 0) {
      console.log('⚠️ detectDuelPattern - Mapping 1-0-0 to 1-1-1 pattern');
      return '1-1-1';
    }
    
    console.log('⚠️ detectDuelPattern - No specific pattern matched, using default');
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
          <div className="text-xs text-yellow-400 mt-1">
            Question {currentDuelIndex + 1} of {duelItems.length} available
          </div>
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
        <div className="flex justify-center gap-4">
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
          
          {/* Debug Button */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => {
                console.log('🔍 FaceDuelsComponent Debug Info:', {
                  currentDuelIndex,
                  duelItems: duelItems.length,
                  duelsRun,
                  selectedOption,
                  faceCounts,
                  pattern: detectDuelPattern(faceCounts),
                  duelResults
                });
              }}
              className="px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-all"
            >
              Debug
            </button>
          )}
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

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-neutral-800/40 border border-neutral-600 rounded-lg">
          <h4 className="text-sm font-semibold text-neutral-300 mb-2">Debug Info</h4>
          <div className="text-xs text-neutral-400 space-y-1">
            <div>Current Duel Index: {currentDuelIndex}</div>
            <div>Total Duel Items: {duelItems.length}</div>
            <div>Duels Run: {duelsRun}</div>
            <div>Selected Option: {selectedOption || 'None'}</div>
            <div>Face Counts: {JSON.stringify(faceCounts)}</div>
            <div>Pattern: {detectDuelPattern(faceCounts)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
