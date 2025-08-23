'use client';

import React, { useState, useEffect } from 'react';
import { loadQuizBankV2WithFallback } from '@/lib/quizBankV2Loader';
import { QuizStateMachine } from '@/lib/quizStateMachine';
import type { QuizBankV2, QuizStateV2, Family, Face, Line, QuizResultV2 } from '@/lib/types';
import FamilyHoneComponent from '../components/FamilyHoneComponent';
import FaceTriadComponent from '../components/FaceTriadComponent';
import FaceDuelsComponent from '../components/FaceDuelsComponent';
import LinesComponentV2 from '../components/LinesComponentV2';
import ResultsComponentV2 from '../components/ResultsComponentV2';
import AnimatedStageTransition from '../components/AnimatedStageTransition';
import { composeAIR } from '../results/composeAIR';
import { generateArchetypeProfile, ARCHETYPE_COLORS } from '@/lib/archetype-generator';
import { useRouter } from 'next/navigation';

// ---------- Heat Map Results Display ----------
const ResultsHeatMap: React.FC<{
  lines: any[];
  title?: string;
}> = ({ lines, title = "7 Lines Under Pressure — You Now" }) => {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<any>(null);

  const headerCls =
    "sticky top-0 z-10 grid grid-cols-4 gap-1 rounded-lg bg-zinc-950/70 px-1 py-0.5 text-[10px] text-zinc-400 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/40";
  const rowCls =
    "group grid grid-cols-4 items-center gap-1 rounded-lg px-1 py-1 text-left transition-all duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 hover:bg-indigo-900/50 hover:ring-1 hover:ring-indigo-400";

  return (
    <div className="w-full">
      {title && (
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">{title}</h2>
      )}
      <div className="w-full">
        <div className="w-full rounded-xl bg-zinc-900/40 p-1">
          {/* Legend */}
          <div className="mb-2 text-center">
            <div className="inline-flex items-center gap-2 text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <span className="text-green-400">✅</span>
                <span>Stable</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="text-amber-400">⚠️</span>
                <span>Offset</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="text-red-400">❌</span>
                <span>Break</span>
              </span>
            </div>
          </div>

          {/* Header */}
          <div className={headerCls}>
            <div>Line</div>
            <div className="text-center">Status</div>
            <div className="text-center">Trips You</div>
            <div className="text-center">Steady Truth</div>
          </div>

          {/* Rows */}
          <div className="mt-0.5 space-y-0.5">
            {lines.map((line, idx) => (
              <button
                key={line.line}
                onClick={() => { setSelected(line); setOpen(true); }}
                className={`${rowCls} w-full ${idx % 2 === 0 ? "bg-white/0" : "bg-white/[0.03]"}`}
                aria-label={`Open ${line.line} details`}
              >
                {/* Line */}
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-white">
                    {line.line === 'Control' ? '🎯 Control' :
                     line.line === 'Pace' ? '⏰ Pace' :
                     line.line === 'Boundary' ? '🛡️ Boundary' :
                     line.line === 'Truth' ? '⚖️ Truth' :
                     line.line === 'Recognition' ? '👁️ Recognition' :
                     line.line === 'Bonding' ? '🤝 Bonding' :
                     line.line === 'Stress' ? '🔥 Stress' :
                     line.line}
                  </span>
                </div>

                {/* Status */}
                <div className="flex items-center justify-center">
                  {line.distance === 'Close' ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full px-1 py-0.5 text-[10px] font-semibold text-white bg-green-600/70">
                      ✅
                    </span>
                  ) : line.distance === 'Offset' ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full px-1 py-0.5 text-[10px] font-semibold text-white bg-amber-500/70">
                      ⚠️
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 rounded-full px-1 py-0.5 text-[10px] font-semibold text-white bg-red-600/70">
                      ❌
                    </span>
                  )}
                </div>

                {/* Trips You */}
                <div className="rounded-lg bg-zinc-800/60 p-0.5 text-center text-[10px] text-white truncate">
                  {line.slipDriver}
                </div>

                {/* Steady Truth */}
                <div className="rounded-lg bg-black/30 p-0.5 text-center text-[10px] text-white truncate">
                  {line.card.split('Truth:')[1]?.trim() || line.card.split('.').slice(-2).join('.')}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Simple Modal for line details */}
      {open && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">{selected.line} Details</h3>
              <button 
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-zinc-400 mb-2">Status</h4>
                <p className="text-white">{selected.distance}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-400 mb-2">Trips You</h4>
                <p className="text-white">{selected.slipDriver}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-400 mb-2">Full Card</h4>
                <p className="text-white">{selected.card}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const GbuDiagnosticCards: React.FC<{
  good: string;
  bad: string;
  ugly?: string;
  goodFooter?: string;
  badFooter?: string;
}> = ({ good, bad, ugly, goodFooter, badFooter }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white mb-4">Diagnostic Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Good Card */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
          <div className="text-2xl mb-3">✅</div>
          <h4 className="text-lg font-semibold text-green-300 mb-2">Stable Patterns</h4>
          <p className="text-green-200 mb-3">{good}</p>
          {goodFooter && (
            <div className="text-sm text-green-400/80 italic">{goodFooter}</div>
          )}
        </div>

        {/* Bad Card */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
          <div className="text-2xl mb-3">⚠️</div>
          <h4 className="text-lg font-semibold text-yellow-300 mb-2">Variable Patterns</h4>
          <p className="text-green-200 mb-3">{bad}</p>
          {badFooter && (
            <div className="text-sm text-yellow-400/80 italic">{badFooter}</div>
          )}
        </div>
      </div>

      {/* Ugly Card (if exists) */}
      {ugly && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <div className="text-2xl mb-3">❌</div>
          <h4 className="text-lg font-semibold text-red-300 mb-2">Break Patterns</h4>
          <p className="text-red-200">{ugly}</p>
        </div>
      )}
    </div>
  );
};

export default function TestV2Page() {
  const [mounted, setMounted] = useState(false);
  const [quizBank, setQuizBank] = useState<QuizBankV2 | null>(null);
  const [quizState, setQuizState] = useState<QuizStateV2 | null>(null);
  const [stateMachine, setStateMachine] = useState<QuizStateMachine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const router = useRouter();

  // Ensure component is mounted before rendering to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize quiz
  useEffect(() => {
    const initializeQuiz = async () => {
      try {
        setLoading(true);
        
        // Load the v2.7 quiz bank
        const bank = await loadQuizBankV2WithFallback();
        console.log('📚 Quiz Bank v2.7 loaded:', bank.version);
        console.log('🔍 Bank structure:', {
          families: bank.families?.length,
          familyHoneItems: bank.family_hone_items?.length,
          faceTriadItems: Object.values(bank.face_triad_items || {}).flat().length,
          lineItems: bank.line_items?.length,
          lineDuelItems: Object.keys(bank.line_duel_items || {}).length
        });
        
        // Validate critical data structures
        if (!bank.families || !Array.isArray(bank.families)) {
          throw new Error('Quiz bank families array is missing or invalid');
        }
        
        if (!bank.faces_by_family || typeof bank.faces_by_family !== 'object') {
          throw new Error('Quiz bank faces_by_family mapping is missing or invalid');
        }
        
        // Verify all expected families are present
        const expectedFamilies: Family[] = ['Control', 'Pace', 'Boundary', 'Truth', 'Recognition', 'Bonding', 'Stress'];
        const missingFamilies = expectedFamilies.filter(f => !bank.families.includes(f));
        if (missingFamilies.length > 0) {
          throw new Error(`Missing required families: ${missingFamilies.join(', ')}`);
        }
        
        setQuizBank(bank);
        
        // Initialize state machine with v2.7 structure
        const machine = new QuizStateMachine();
        machine.subscribe((state) => {
          console.log('🔄 State Machine Update:', state.stage);
          setQuizState(state);
        });
        
        setStateMachine(machine);
        
        // Set start time and get initial state
        machine.setStartTime(Date.now());
        const initialState = machine.getCurrentState();
        setQuizState(initialState);
        
        setLoading(false);
        
      } catch (error) {
        console.error('❌ Failed to initialize quiz:', error);
        setError('Failed to load quiz bank');
        setLoading(false);
      }
    };

    if (mounted) {
      initializeQuiz();
    }
  }, [mounted]);

  // Handle family pick with error handling
  const handleFamilyPick = (family: Family, routerItemId: string) => {
    try {
      console.log('🎯 handleFamilyPick called:', { family, routerItemId });
      
      if (!stateMachine) {
        throw new Error('State machine not initialized');
      }
      
      if (!family) {
        throw new Error('Family is undefined or null');
      }
      
      // Check if state machine is transitioning
      if (stateMachine.isTransitioningState()) {
        console.warn('⚠️ State machine is transitioning, ignoring family pick');
        return;
      }
      
      // Double-check current stage before calling recordFamilyPick
      const currentState = stateMachine.getCurrentState();
      if (currentState.stage !== 'family_hone') {
        console.warn('⚠️ Stage already changed, ignoring family pick:', { 
          requestedStage: 'family_hone', 
          currentStage: currentState.stage 
        });
        return;
      }
      
      stateMachine.recordFamilyPick(family, routerItemId);
      console.log('✅ Family pick recorded successfully');
    } catch (err) {
      console.error('❌ Error in handleFamilyPick:', err);
      setError(err instanceof Error ? err.message : 'Unknown error in family pick');
    }
  };

  // Handle face pick with error handling
  const handleFacePick = (face: Face) => {
    try {
      console.log('🎯 handleFacePick called:', { face });
      
      if (!stateMachine) {
        throw new Error('State machine not initialized');
      }
      
      if (!face) {
        throw new Error('Face is undefined or null');
      }
      
      // Check if state machine is transitioning
      if (stateMachine.isTransitioningState()) {
        console.warn('⚠️ State machine is transitioning, ignoring face pick');
        return;
      }
      
      // Double-check current stage before calling recordFacePick
      const currentState = stateMachine.getCurrentState();
      if (currentState.stage !== 'face_triad') {
        console.warn('⚠️ Stage already changed, ignoring face pick:', { 
          requestedStage: 'face_triad', 
          currentStage: currentState.stage 
        });
        return;
      }
      
      stateMachine.recordFacePick(face);
      console.log('✅ Face pick recorded successfully');
    } catch (err) {
      console.error('❌ Error in handleFacePick:', err);
      setError(err instanceof Error ? err.message : 'Unknown error in face pick');
    }
  };

  // Handle duel result with error handling
  const handleDuelResult = (winner: Face, pattern: any, duelsRun: number) => {
    try {
      console.log('🎯 handleDuelResult called:', { winner, pattern, duelsRun });
      
      if (!stateMachine) {
        throw new Error('State machine not initialized');
      }
      
      // Check if state machine is transitioning
      if (stateMachine.isTransitioningState()) {
        console.warn('⚠️ State machine is transitioning, ignoring duel result');
        return;
      }
      
      // Double-check current stage before calling recordDuelResult
      const currentState = stateMachine.getCurrentState();
      if (currentState.stage !== 'face_duels') {
        console.warn('⚠️ Stage already changed, ignoring duel result:', { 
          requestedStage: 'face_duels', 
          currentStage: currentState.stage 
        });
        return;
      }
      
      stateMachine.recordDuelResult(winner, pattern, duelsRun);
      console.log('✅ Duel result recorded successfully');
    } catch (err) {
      console.error('❌ Error in handleDuelResult:', err);
      setError(err instanceof Error ? err.message : 'Unknown error in duel result');
    }
  };

  // Handle line verdict with error handling
  const handleLineVerdict = (line: Line, token: 'C' | 'O' | 'F', severity: number, items: any) => {
    try {
      console.log('🎯 handleLineVerdict called:', { line, token, severity, items });
      
      if (!stateMachine) {
        throw new Error('State machine not initialized');
      }
      
      // Check if state machine is transitioning
      if (stateMachine.isTransitioningState()) {
        console.warn('⚠️ State machine is transitioning, ignoring line verdict');
        return;
      }
      
      // Double-check current stage before calling recordLineVerdict
      const currentState = stateMachine.getCurrentState();
      if (currentState.stage !== 'lines') {
        console.warn('⚠️ Stage already changed, ignoring line verdict:', { 
          requestedStage: 'lines', 
          currentStage: currentState.stage 
        });
        return;
      }
      
      stateMachine.recordLineVerdict(line, token, severity, items);
      console.log('✅ Line verdict recorded successfully');
    } catch (err) {
      console.error('❌ Error in handleLineVerdict:', err);
      setError(err instanceof Error ? err.message : 'Unknown error in line verdict');
    }
  };

  // Handle restart with error handling
  const handleRestart = () => {
    try {
      console.log('🔄 handleRestart called');
      
      if (!stateMachine) {
        throw new Error('State machine not initialized');
      }
      
      stateMachine.reset();
      setError(null);
      console.log('✅ Quiz restarted successfully');
    } catch (err) {
      console.error('❌ Error in handleRestart:', err);
      setError(err instanceof Error ? err.message : 'Unknown error in restart');
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Check if quiz is complete and redirect to results
  useEffect(() => {
    if (quizState?.stage === 'complete' && stateMachine) {
      const currentState = stateMachine.getCurrentState();
      const verdicts = currentState.lines.lineVerdicts;
      const selectedMode = 'original'; // Default mode for test-v2
      
      if (verdicts && verdicts.length > 0) {
        // Store results in localStorage as backup
        const results = {
          verdicts,
          selectedMode,
          timestamp: Date.now()
        };
        localStorage.setItem('quizResults', JSON.stringify(results));
        
        // Redirect to results page with data in URL params
        const encodedVerdicts = encodeURIComponent(JSON.stringify(verdicts));
        router.push(`/quiz/test-v2/results?verdicts=${encodedVerdicts}&mode=${selectedMode}`);
      }
    }
  }, [quizState?.stage, stateMachine, router]);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-32 w-32 bg-neutral-800 rounded-full mx-auto mb-4"></div>
            <div className="h-8 bg-neutral-800 rounded mb-2"></div>
            <div className="h-4 bg-neutral-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Additional validation to prevent hydration issues
  if (!quizState || !quizBank) {
    console.warn('Quiz state or bank not available during render:', { quizState: !!quizState, quizBank: !!quizBank });
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl">Quiz state or bank not available</p>
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors mt-4"
          >
            Restart Quiz
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading Quiz System...</p>
          <p className="text-neutral-400 mt-2">Initializing components and state machine</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">Quiz System Error</h1>
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 mb-6">
            <p className="text-red-300 font-mono text-sm">{error}</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={clearError}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Clear Error
            </button>
            <button
              onClick={handleRestart}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors ml-3"
            >
              Restart Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Remove the Diagnostics component from the render
  if (quizState?.stage === 'complete') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Redirecting to results...</p>
        </div>
      </div>
    );
  }

  // Render stage component based on current stage
  const renderStageComponent = () => {
    try {
      console.log('🎭 Rendering stage component for stage:', quizState.stage);
      console.log('🔍 Quiz state details:', {
        stage: quizState.stage,
        familyHone: quizState.familyHone,
        hasRouterItems: quizBank?.family_hone_items?.length || 0
      });
      
      switch (quizState.stage) {
        case 'family_hone':
          if (!quizBank?.family_hone_items) {
            console.error('❌ No family hone items available');
            return (
              <div className="text-center p-8">
                <p className="text-red-400">Error: No family hone items available</p>
              </div>
            );
          }
          
          return (
            <AnimatedStageTransition isVisible={quizState.stage === 'family_hone'}>
              <FamilyHoneComponent
                quizState={quizState}
                onFamilyPick={handleFamilyPick}
                routerItems={quizBank.family_hone_items}
                stateMachine={stateMachine}
              />
            </AnimatedStageTransition>
          );
        
        case 'face_triad':
          if (!quizState.familyHone.lockedFamily) {
            return (
              <div className="text-center p-8">
                <p className="text-red-400">Error: No family selected for face triad</p>
                <button
                  onClick={handleRestart}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors mt-4"
                >
                  Restart Quiz
                </button>
              </div>
            );
          }
          
          const triadItems = quizBank.face_triad_items[quizState.familyHone.lockedFamily] || [];
          return (
            <AnimatedStageTransition isVisible={quizState.stage === 'face_triad'}>
              <FaceTriadComponent
                quizState={quizState}
                onFacePick={handleFacePick}
                triadItems={triadItems}
              />
            </AnimatedStageTransition>
          );
        
        case 'face_duels':
          const family = quizState.faceTriad.family;
          if (!family) {
            return (
              <div className="text-center p-8">
                <p className="text-red-400">Error: No family selected for face duels</p>
                <button
                  onClick={handleRestart}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors mt-4"
                >
                  Restart Quiz
                </button>
              </div>
            );
          }
          return (
            <AnimatedStageTransition isVisible={quizState.stage === 'face_duels'}>
              <FaceDuelsComponent
                quizState={quizState}
                onDuelResult={handleDuelResult}
                duelItems={quizBank.face_duel_items[family] || []}
              />
            </AnimatedStageTransition>
          );
        
        case 'lines':
          console.log('🎭 Rendering Lines stage with data:', {
            quizBank: quizBank ? {
              version: quizBank.version,
              lineItemsCount: quizBank.line_items?.length || 0,
              lineItems: quizBank.line_items?.slice(0, 3) // Show first 3 items
            } : 'No quiz bank',
            lineDuelItems: quizBank?.line_duel_items
          });
          
          return (
            <AnimatedStageTransition isVisible={quizState.stage === 'lines'}>
              <LinesComponentV2
                quizState={quizState}
                onLineVerdict={handleLineVerdict}
                lineItems={quizBank.line_items}
                lineDuelItems={quizBank.line_duel_items}
              />
            </AnimatedStageTransition>
          );
        
        default:
          return (
            <div className="text-center p-8">
              <p className="text-neutral-400">Unknown stage: {quizState.stage}</p>
              <button
                onClick={handleRestart}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors mt-4"
              >
                Restart Quiz
              </button>
            </div>
          );
      }
    } catch (err) {
      console.error('❌ Error rendering stage component:', err);
      return (
        <div className="text-center p-8">
          <p className="text-red-400">Error rendering stage component: {err instanceof Error ? err.message : String(err)}</p>
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors mt-4"
          >
            Restart Quiz
          </button>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <div className="bg-neutral-900/60 border-b border-neutral-700 p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">Quiz v2.7 Test Page</h1>
                      <p className="text-neutral-400">
              Testing the new quiz flow: Family Hone → Face Triad → Face Duels → Lines → Results (v2.7 - No Stage Skip)
            </p>
          
          {/* Stage Indicator */}
          <div className="mt-4 flex gap-2">
            {['family_hone', 'face_triad', 'face_duels', 'lines', 'complete'].map((stage, index) => (
              <div
                key={stage}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  quizState.stage === stage
                    ? 'bg-blue-500 text-white'
                    : index < ['family_hone', 'face_triad', 'face_duels', 'lines', 'complete'].indexOf(quizState.stage)
                      ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                      : 'bg-neutral-700/60 text-neutral-400 border border-neutral-600'
                }`}
              >
                {stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </div>
            ))}
          </div>
          
          {/* Transition State Indicator */}
          {stateMachine?.isTransitioningState?.() && (
            <div className="mt-4 p-2 bg-blue-500/20 border border-blue-500/40 rounded-lg text-center">
              <span className="text-blue-300 text-sm">
                🔄 State transition in progress...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        {(() => {
          try {
            return renderStageComponent();
          } catch (err) {
            console.error('❌ Hydration error in main render:', err);
            return (
              <div className="text-center p-8">
                <p className="text-red-400">Hydration error: {err instanceof Error ? err.message : String(err)}</p>
                <button
                  onClick={handleRestart}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors mt-4"
                >
                  Restart Quiz
                </button>
              </div>
            );
          }
        })()}
      </div>

      {/* Debug Panel */}
      <details className="fixed bottom-4 right-4 bg-neutral-900/90 border border-neutral-700 rounded-lg p-4 max-w-md">
        <summary className="text-white font-semibold cursor-pointer mb-2">
          🐛 Debug Info
        </summary>
        <div className="text-xs text-neutral-300 space-y-1">
          <div><strong>Stage:</strong> {quizState.stage}</div>
          <div><strong>Family Hone:</strong> {quizState.familyHone.isComplete ? 'Complete' : 'In Progress'}</div>
          {quizState.familyHone.lockedFamily && (
            <div><strong>Locked Family:</strong> {quizState.familyHone.lockedFamily}</div>
          )}
          <div><strong>Face Triad:</strong> {quizState.faceTriad.isComplete ? 'Complete' : 'In Progress'}</div>
          {quizState.faceTriad.selectedFace && (
            <div><strong>Selected Face:</strong> {quizState.faceTriad.selectedFace}</div>
          )}
          <div><strong>Lines:</strong> {quizState.lines.isComplete ? 'Complete' : `${quizState.lines.lineVerdicts.length}/7`}</div>
          <div><strong>Quiz Complete:</strong> {quizState.isComplete ? 'Yes' : 'No'}</div>
          
          {/* Quiz Bank Debug Info */}
          {quizBank && (
            <>
              <div className="border-t border-neutral-600 mt-2 pt-2">
                <div><strong>Quiz Bank:</strong></div>
                <div><strong>Version:</strong> {quizBank.version}</div>
                <div><strong>Line Items:</strong> {quizBank.line_items?.length || 0}</div>
                <div><strong>Current Line:</strong> {quizState.stage === 'lines' ? 'Loading...' : 'N/A'}</div>
              </div>
            </>
          )}
          
          {debugInfo && (
            <>
              <div className="border-t border-neutral-600 mt-2 pt-2">
                <div><strong>Debug:</strong></div>
                <pre className="text-xs overflow-auto max-h-32 bg-neutral-800 p-2 rounded border border-neutral-600">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      </details>

      {/* Debug Controls */}
      <div className="fixed bottom-4 right-4 bg-black/80 border border-white/20 rounded-lg p-4 text-white text-sm max-w-md">
        <h3 className="font-bold mb-2">🔧 Debug Controls</h3>
        
        {/* Check Status */}
        <button
          onClick={() => {
            if (stateMachine) {
              console.log('🔍 State Machine Status:', stateMachine.getTransitioningStatus());
              console.log('📊 Current State:', quizState);
              console.log('📋 Line Verdicts:', quizState?.lines?.lineVerdicts);
              console.log('🔢 Line Count:', quizState?.lines?.lineVerdicts?.length || 0);
              console.log('📏 Total Lines Expected:', 6); // 6 lines (skipping family line)
              console.log('📊 Total Items Expected:', 12); // 6 lines × 2 items each
              console.log('✅ Should be complete:', (quizState?.lines?.lineVerdicts?.length || 0) >= 12);
            }
          }}
          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded mb-2"
        >
          Check Status
        </button>

        {/* Force Complete */}
        <button
          onClick={() => {
            if (stateMachine && quizState) {
              console.log('🚀 Force completing quiz...');
              console.log('📊 Current line verdicts:', quizState.lines.lineVerdicts);
              console.log('🔢 Count:', quizState.lines.lineVerdicts.length);
              
              // Check if we actually have all verdicts
              if (quizState.lines.lineVerdicts.length >= 12) {
                console.log('✅ All 12 line items completed, forcing transition to complete');
                // Force the completion logic
                const currentState = stateMachine.getCurrentState();
                const verdicts = currentState.lines.lineVerdicts;
                const selectedMode = 'original';
                
                if (verdicts && verdicts.length >= 12) {
                  // Store results and redirect
                  const results = {
                    verdicts,
                    selectedMode,
                    timestamp: Date.now()
                  };
                  localStorage.setItem('quizResults', JSON.stringify(results));
                  
                  const encodedVerdicts = encodeURIComponent(JSON.stringify(verdicts));
                  router.push(`/quiz/test-v2/results?verdicts=${encodedVerdicts}&mode=${selectedMode}`);
                }
              } else {
                console.log('❌ Not enough verdicts yet:', quizState.lines.lineVerdicts.length);
              }
            }
          }}
          className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded mb-2"
        >
          Force Complete
        </button>

        {/* Reset Transition Flag */}
        <button
          onClick={() => {
            if (stateMachine) {
              stateMachine.resetTransitioningFlag();
              console.log('🔄 Transition flag reset');
            }
          }}
          className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded"
        >
          Reset Transition Flag
        </button>
      </div>
    </div>
  );
}

