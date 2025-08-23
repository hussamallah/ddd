'use client';

import React, { useState, useEffect } from 'react';
import type { Face, FaceTriadItem, QuizStateV2 } from '@/lib/types';

interface FaceTriadComponentProps {
  quizState: QuizStateV2;
  onFacePick: (face: Face) => void;
  triadItems: FaceTriadItem[];
}

export default function FaceTriadComponent({ 
  quizState, 
  onFacePick, 
  triadItems 
}: FaceTriadComponentProps) {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());

  const currentItem = triadItems[currentItemIndex];
  const faceCounts = quizState.faceTriad.counts;
  const isComplete = quizState.faceTriad.isComplete;
  const lockedFamily = quizState.familyHone.lockedFamily;

  // Reset selection when item changes
  useEffect(() => {
    setSelectedOption(null);
  }, [currentItemIndex]);

  const handleOptionSelect = (optionKey: string) => {
    // 🚨 ADD STAGE VALIDATION
    if (quizState.stage !== 'face_triad') {
      console.warn('⚠️ FaceTriadComponent: Ignoring pick - wrong stage:', quizState.stage);
      return;
    }
    
    setSelectedOption(optionKey);
    
    // Auto-confirm the selection after a brief delay for visual feedback
    setTimeout(() => {
      if (!currentItem) return;

      const selectedFace = currentItem.options[optionKey].face;
      onFacePick(selectedFace);
      
      // Mark this item as completed
      setCompletedItems(prev => new Set([...prev, currentItemIndex]));
      
      // Move to next item if available
      if (currentItemIndex < triadItems.length - 1) {
        setCurrentItemIndex(prev => prev + 1);
      }
    }, 300); // 300ms delay for visual feedback
  };

  const handleBack = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(prev => prev - 1);
      // Remove from completed items when going back
      setCompletedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentItemIndex - 1);
        return newSet;
      });
    }
  };

  // Get face with highest count
  const getLeadingFace = (): { face: Face; count: number } | null => {
    const entries = Object.entries(faceCounts);
    if (entries.length === 0) return null;
    
    const [face, count] = entries.reduce((max, current) => 
      current[1] > max[1] ? current : max
    );
    
    return { face: face as Face, count };
  };

  const leadingFace = getLeadingFace();
  const totalPicks = Object.values(faceCounts).reduce((sum, count) => sum + count, 0);

  if (!currentItem) {
    return (
      <div className="text-center p-8">
        <p className="text-neutral-400">No triad items available for this family.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">
          Face Selection: {lockedFamily} Family
        </h2>
        <p className="text-neutral-300 mb-6">
          Now let's identify your specific archetype within the {lockedFamily} family. 
          Answer 3 questions to determine your face.
        </p>
        
        {/* Progress Indicator */}
        <div className="flex justify-center mb-6">
          <div className="flex gap-2">
            {triadItems.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all ${
                  completedItems.has(index)
                    ? 'bg-green-500'
                    : index === currentItemIndex
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

        {/* Leading Face Indicator */}
        {leadingFace && (
          <div className="text-center p-3 bg-blue-500/20 border border-blue-500/40 rounded-lg">
            <span className="text-blue-300">
              Leading: {leadingFace.face} ({leadingFace.count}/3)
            </span>
            {leadingFace.count >= 2 && (
              <span className="text-green-400 ml-2">✓ Strong preference!</span>
            )}
          </div>
        )}

        {/* Completion Status */}
        {totalPicks >= 3 && (
          <div className="text-center p-3 bg-green-500/20 border border-green-500/40 rounded-lg">
            <span className="text-green-400">
              ✓ All 3 questions answered! Analyzing your pattern...
            </span>
          </div>
        )}
      </div>

      {/* Current Triad Item */}
      <div className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-6 mb-6">
        <div className="text-center mb-6">
          <div className="text-sm text-neutral-400 mb-2">
            Question {currentItemIndex + 1} of {triadItems.length}
          </div>
          <h3 className="text-xl font-semibold text-white leading-relaxed">
            {currentItem.prompt}
          </h3>
        </div>

        {/* Options Grid */}
        <div className="grid gap-3 mb-6">
          {Object.entries(currentItem.options).map(([optionKey, option]) => (
            <button
              key={optionKey}
              onClick={() => handleOptionSelect(optionKey)}
              disabled={completedItems.has(currentItemIndex)}
              className={`text-left p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                selectedOption === optionKey
                  ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/25'
                  : completedItems.has(currentItemIndex)
                    ? 'border-neutral-500 bg-neutral-700/40 cursor-not-allowed'
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
                <div className="text-sm text-neutral-400 px-2 py-1 bg-neutral-700/60 rounded capitalize">
                  {option.face}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={currentItemIndex === 0}
            className={`px-4 py-2 rounded-lg transition-all ${
              currentItemIndex === 0
                ? 'text-neutral-500 cursor-not-allowed'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            ← Previous
          </button>
          
          {/* Selection Feedback */}
          <div className="text-center text-sm text-blue-400">
            <p>Selection will be confirmed automatically...</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-neutral-400">
        <p>
          <span className="text-blue-400 font-medium">Click once</span> on the option that best describes your typical behavior in this situation.
        </p>
        <p className="mt-2">
          After 3 questions, we'll determine if duels are needed to finalize your face.
        </p>
      </div>

      {/* Pattern Analysis */}
      {totalPicks >= 3 && !isComplete && (
        <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/40 rounded-lg text-center">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">
            Pattern Analysis
          </h3>
          <p className="text-yellow-300">
            Analyzing your 3 picks to determine if duels are needed...
          </p>
        </div>
      )}
    </div>
  );
}
