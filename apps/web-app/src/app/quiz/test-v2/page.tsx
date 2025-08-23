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
import ConfettiCelebration from '../components/ConfettiCelebration';

export default function TestV2Page() {
  const [mounted, setMounted] = useState(false);
  const [quizBank, setQuizBank] = useState<QuizBankV2 | null>(null);
  const [quizState, setQuizState] = useState<QuizStateV2 | null>(null);
  const [stateMachine, setStateMachine] = useState<QuizStateMachine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Ensure component is mounted before rendering to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize quiz
  useEffect(() => {
    if (!mounted) return; // Don't initialize until mounted
    
    async function initializeQuiz() {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🚀 Initializing quiz...');
        
        // Load quiz bank
        const bank = await loadQuizBankV2WithFallback();
        setQuizBank(bank);
        console.log('📚 Quiz bank loaded:', bank);
        
        // Initialize state machine
        const machine = new QuizStateMachine();
        setStateMachine(machine);
        console.log('⚙️ State machine initialized');
        
        // Set start time after mounting to prevent hydration mismatch
        machine.setStartTime(Date.now());
        
        // Subscribe to state changes
        const unsubscribe = machine.subscribe((state) => {
          console.log('📡 State change received:', state);
          setQuizState(state);
          
          // Update debug info
          setDebugInfo(machine.getDebugInfo());
          
          // Trigger confetti when quiz completes
          if (state.isComplete && !showConfetti) {
            setShowConfetti(true);
          }
        });
        
        // Get initial state
        const initialState = machine.getCurrentState();
        setQuizState(initialState);
        setDebugInfo(machine.getDebugInfo());
        console.log('📋 Initial state set:', initialState);
        
        setLoading(false);
        console.log('✅ Quiz initialization complete');
      } catch (err) {
        console.error('❌ Failed to initialize quiz:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }

    initializeQuiz();
  }, [mounted, showConfetti]);

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
      setShowConfetti(false);
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
        
        case 'complete':
          const fallbackResults: QuizResultV2 = {
            family: { 
              name: 'Control' as Family, 
              picksToLock: 0, 
              fhHistory: [], 
              routerItemsSeen: [] 
            },
            face: { 
              name: 'sovereign' as Face, 
              slug: 'sovereign', 
              triadCounts: {
                sovereign: 0, rebel: 0, catalyst: 0,
                strategist: 0, navigator: 0, visionary: 0,
                guardian: 0, equalizer: 0, sentinel: 0,
                seeker: 0, architect: 0, alchemist: 0,
                spotlight: 0, mask: 0, artisan: 0,
                provider: 0, partner: 0, servant: 0,
                diplomat: 0, wanderer: 0
              }, 
              duelsRun: 0, 
              confidence: 'low', 
              why: 'No results available' 
            },
            lines: { 
              code7: 'CCCCCCC', 
              perLine: [], 
              lineDuelLog: [] 
            },
            truthLine: 'Truth emerges through action.',
            audit: { 
              familyHoneCounts: {
                Control: 0, Pace: 0, Boundary: 0, Truth: 0, Recognition: 0, Bonding: 0, Stress: 0
              }, 
              familyHoneHistory: [], 
              faceTriadCounts: {
                sovereign: 0, rebel: 0, catalyst: 0,
                strategist: 0, navigator: 0, visionary: 0,
                guardian: 0, equalizer: 0, sentinel: 0,
                seeker: 0, architect: 0, alchemist: 0,
                spotlight: 0, mask: 0, artisan: 0,
                provider: 0, partner: 0, servant: 0,
                diplomat: 0, wanderer: 0
              }, 
              faceDuelLog: [], 
              lineItemTokens: [], 
              rulesUsed: [] 
            }
          };
          
          return (
            <AnimatedStageTransition isVisible={quizState.stage === 'complete'}>
              <Diagnostics />  // ← RESTORE THE RICH VERSION
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
          <h1 className="text-2xl font-bold text-white mb-2">Quiz v2.6 Test Page</h1>
          <p className="text-neutral-400">
            Testing the new quiz flow: Family Hone → Face Triad → Face Duels → Lines → Results
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

      {/* Confetti */}
      {showConfetti && <ConfettiCelebration isVisible={showConfetti} onComplete={() => setShowConfetti(false)} />}
    </div>
  );
}
