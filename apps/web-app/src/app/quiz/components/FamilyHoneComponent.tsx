'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { QuizStateV2, Family, FamilyHoneItem } from '@/lib/types';
import type { QuizStateMachine } from '@/lib/quizStateMachine';

interface FamilyHoneComponentProps {
  quizState: QuizStateV2;
  onFamilyPick: (family: Family, routerItemId: string) => void;
  routerItems: FamilyHoneItem[];
  stateMachine?: QuizStateMachine | null;
}

export default function FamilyHoneComponent({ 
  quizState, 
  onFamilyPick, 
  routerItems,
  stateMachine
}: FamilyHoneComponentProps) {
  console.log('🔍 FamilyHoneComponent render:', { 
    stage: quizState?.stage, 
    hasQuizState: !!quizState, 
    hasRouterItems: !!routerItems 
  });

  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup timeouts and prevent stale updates
  useEffect(() => {
    console.log('🔍 FamilyHoneComponent mounted');
    isMountedRef.current = true;
    
    return () => {
      console.log('🔍 FamilyHoneComponent unmounting');
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Reset selection when stage changes (only if quizState exists)
  useEffect(() => {
    if (quizState && quizState.stage !== 'family_hone') {
      setSelectedOption(null);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [quizState?.stage]);

  // Reset selection when item changes
  useEffect(() => {
    setSelectedOption(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [currentItemIndex]);

  // Validate props to prevent runtime errors
  if (!quizState || !routerItems || !Array.isArray(routerItems)) {
    console.error('FamilyHoneComponent: Invalid props received:', { quizState, routerItems });
    return (
      <div className="text-center p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-800 rounded mb-4"></div>
          <div className="h-4 bg-neutral-800 rounded mb-2"></div>
          <div className="h-4 bg-neutral-800 rounded mb-6"></div>
        </div>
      </div>
    );
  }

  // Now it's safe to access quizState properties
  const currentItem = routerItems[currentItemIndex];
  const familyCounts = quizState.familyHone?.counts || {};
  const isComplete = quizState.familyHone?.isComplete || false;

  const handleOptionSelect = (optionKey: string) => {
    // Prevent multiple selections
    if (selectedOption !== null) {
      console.log('⚠️ Option already selected, ignoring click');
      return;
    }
    
    // Check if state machine is transitioning
    if (stateMachine?.isTransitioningState?.()) {
      console.log('⚠️ State machine is transitioning, ignoring click');
      return;
    }
    
    // Validate current stage
    if (quizState.stage !== 'family_hone') {
      console.warn('⚠️ FamilyHoneComponent: Ignoring pick - wrong stage:', quizState.stage);
      return;
    }
    
    setSelectedOption(optionKey);
    
    // Auto-confirm the selection after a brief delay for visual feedback
    timeoutRef.current = setTimeout(() => {
      // Check if component is still mounted and stage hasn't changed
      if (!isMountedRef.current || quizState.stage !== 'family_hone') {
        console.warn('⚠️ FamilyHoneComponent: Component unmounted or stage changed during delay, ignoring pick');
        if (isMountedRef.current) {
          setSelectedOption(null); // Reset selection
        }
        return;
      }
      
      if (!currentItem) {
        setSelectedOption(null); // Reset selection
        return;
      }

      const selectedFamily = currentItem.options[optionKey]?.family;
      if (!selectedFamily) {
        console.error('Invalid option structure:', currentItem.options[optionKey]);
        setSelectedOption(null); // Reset selection
        return;
      }
      
      // Double-check stage before calling onFamilyPick
      if (quizState.stage === 'family_hone') {
        onFamilyPick(selectedFamily, currentItem.id);
        
        // Move to next item if family hone is not complete
        if (!isComplete) {
          setCurrentItemIndex(prev => prev + 1);
        }
      } else {
        console.warn('⚠️ Stage changed after final validation, not recording family pick');
      }
      
      // Reset selection after a longer delay to prevent rapid clicking
      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setSelectedOption(null);
        }
      }, 1000);
    }, 300);
  };

  const handleSkip = () => {
    // Prevent skipping during transitions
    if (stateMachine?.isTransitioningState?.()) {
      console.log('⚠️ State machine is transitioning, ignoring skip');
      return;
    }
    
    // Move to next item without recording a pick
    setCurrentItemIndex(prev => prev + 1);
  };

  // Get family with highest count
  const getLeadingFamily = (): { family: Family; count: number } | null => {
    const entries = Object.entries(familyCounts);
    if (entries.length === 0) return null;
    
    const [family, count] = entries.reduce((max, current) => 
      current[1] > max[1] ? current : max
    );
    
    return { family: family as Family, count };
  };

  const leadingFamily = getLeadingFamily();

  // Only show content when in the family_hone stage
  if (quizState.stage !== 'family_hone') {
    return null;
  }

  if (!currentItem) {
    return (
      <div className="text-center p-8">
        <p className="text-neutral-400">No more router items available.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">
          Family Hone Stage
        </h2>
        <p className="text-neutral-300 mb-6">
          We're identifying your primary behavioral family. Answer honestly - there are no right or wrong choices.
        </p>
        
        {/* Transition State Indicator */}
        {stateMachine?.isTransitioningState?.() && (
          <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/40 rounded-lg text-center">
            <span className="text-blue-300 text-sm">
              🔄 Processing your selection...
            </span>
          </div>
        )}
        
        {/* Family Counts Display */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {Object.entries(familyCounts).map(([family, count]) => (
            <div 
              key={family}
              className={`text-center p-3 rounded-lg border-2 transition-all ${
                count >= 3 
                  ? 'border-green-500 bg-green-500/20' 
                  : count > 0 
                    ? 'border-blue-500 bg-blue-500/20' 
                    : 'border-neutral-600 bg-neutral-800/40'
              }`}
            >
              <div className="text-xs text-neutral-400 mb-1">{family}</div>
              <div className="text-lg font-bold text-white">{count}</div>
              {count >= 3 && (
                <div className="text-xs text-green-400 mt-1">🔒 Locked</div>
              )}
            </div>
          ))}
        </div>

        {/* Leading Family Indicator */}
        {leadingFamily && (
          <div className="text-center p-3 bg-blue-500/20 border border-blue-500/40 rounded-lg">
            <span className="text-blue-300">
              Leading: {leadingFamily.family} ({leadingFamily.count}/3)
            </span>
            {leadingFamily.count >= 3 && (
              <span className="text-green-400 ml-2">✓ Family Locked!</span>
            )}
          </div>
        )}
      </div>

      {/* Current Router Item */}
      <div className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-6 mb-6">
        <div className="text-center mb-6">
          <div className="text-sm text-neutral-400 mb-2">
            Router Item {currentItemIndex + 1} of {routerItems.length}
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
              disabled={selectedOption !== null || stateMachine?.isTransitioningState?.()}
              className={`text-left p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                selectedOption === optionKey
                  ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/25'
                  : stateMachine?.isTransitioningState?.()
                    ? 'border-neutral-500 bg-neutral-700/40 cursor-not-allowed opacity-50'
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
                <div className="text-sm text-neutral-400 px-2 py-1 bg-neutral-700/60 rounded">
                  {option.family}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleSkip}
            disabled={stateMachine?.isTransitioningState?.()}
            className={`px-4 py-2 transition-colors ${
              stateMachine?.isTransitioningState?.()
                ? 'text-neutral-500 cursor-not-allowed'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Skip this item
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
          We'll continue until one family reaches 3 selections.
        </p>
      </div>

      {/* Completion Status */}
      {isComplete && (
        <div className="mt-6 p-4 bg-green-500/20 border border-green-500/40 rounded-lg text-center">
          <h3 className="text-lg font-semibold text-green-400 mb-2">
            Family Hone Complete!
          </h3>
          <p className="text-green-300">
            Your primary family has been identified. Moving to face selection...
          </p>
        </div>
      )}
    </div>
  );
}
