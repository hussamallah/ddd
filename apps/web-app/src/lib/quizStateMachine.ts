import type { 
  QuizStateV2, 
  QuizStage, 
  Family, 
  Face, 
  Line,
  FamilyHoneState, 
  FaceTriadState, 
  LineStateV2,
  QuizResultV2,
  DuelResult,
  DuelPattern
} from './types';

/**
 * Quiz State Machine for v2.6 Flow
 * Manages transitions between: Family Hone → Face Triad → Face Duels → Lines → Complete
 */
export class QuizStateMachine {
  private state: QuizStateV2;
  private listeners: Set<(state: QuizStateV2) => void> = new Set();
  private isTransitioning: boolean = false;

  constructor() {
    this.state = this.createInitialState();
    console.log('🚀 QuizStateMachine initialized with state:', this.state);
  }

  /**
   * Create initial quiz state
   */
  private createInitialState(): QuizStateV2 {
    const families: Family[] = ['Control', 'Pace', 'Boundary', 'Truth', 'Recognition', 'Bonding', 'Stress'];
    
    const initialState: QuizStateV2 = {
      stage: 'family_hone',
      familyHone: {
        counts: families.reduce((acc, family) => ({ ...acc, [family]: 0 }), {} as Record<Family, number>),
        history: [],
        routerItemsSeen: [],
        lockedFamily: undefined,
        isComplete: false
      },
      faceTriad: {
        family: undefined,
        counts: {} as Record<Face, number>,
        duelsRun: 0,
        confidence: 'medium',
        selectedFace: undefined,
        isComplete: false
      },
      lines: {
        lineVerdicts: [],
        currentLineIndex: 0,
        isComplete: false
      },
      startTime: undefined, // Will be set when mounted on client
      isComplete: false
    };

    console.log('📋 Initial state created:', initialState);
    return initialState;
  }

  /**
   * Get current state (immutable)
   */
  getCurrentState(): QuizStateV2 {
    return { ...this.state };
  }

  /**
   * Check if state machine is currently transitioning
   */
  isTransitioningState(): boolean {
    return this.isTransitioning;
  }

  /**
   * Get current transitioning status for debugging
   */
  getTransitioningStatus(): { isTransitioning: boolean; stage: string } {
    return {
      isTransitioning: this.isTransitioning,
      stage: this.state.stage
    };
  }

  /**
   * Reset transitioning flag (for emergency use)
   */
  resetTransitioningFlag(): void {
    console.warn('⚠️ Resetting transitioning flag');
    this.isTransitioning = false;
  }

  /**
   * Set start time (called after mounting to prevent hydration mismatch)
   */
  setStartTime(startTime: number): void {
    this.updateState({ startTime });
    console.log('⏰ Start time set:', startTime);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: QuizStateV2) => void): () => void {
    this.listeners.add(listener);
    console.log('👥 Listener subscribed, total listeners:', this.listeners.size);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
      console.log('👋 Listener unsubscribed, total listeners:', this.listeners.size);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    console.log('📢 Notifying listeners of state change:', this.state);
    this.listeners.forEach((listener, index) => {
      try {
        listener(this.getCurrentState());
      } catch (error) {
        console.error(`❌ Error in listener ${index}:`, error);
      }
    });
  }

  /**
   * Update state and notify listeners
   */
  private updateState(updates: Partial<QuizStateV2>): void {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };
    console.log('🔄 State updated:', { old: oldState, new: this.state });
    
    // Reset transitioning flag after state update is complete
    if (this.isTransitioning) {
      console.log('✅ Resetting transitioning flag after state update');
      this.isTransitioning = false;
    }
    
    this.notifyListeners();
  }

  /**
   * Record a family pick in family hone stage
   */
  recordFamilyPick(family: Family, routerItemId: string): void {
    console.log('🔍 recordFamilyPick called:', { family, routerItemId, currentStage: this.state.stage });
    
    // Prevent recording picks during transitions
    if (this.isTransitioning) {
      console.warn('⚠️ Transition in progress, ignoring family pick');
      return;
    }
    
    // Validate current stage
    if (this.state.stage !== 'family_hone') {
      const error = `Cannot record family pick outside of family hone stage. Current stage: ${this.state.stage}`;
      console.error('❌ Stage validation failed:', error);
      throw new Error(error);
    }

    // Validate family
    if (!family) {
      const error = 'Family cannot be undefined or null';
      console.error('❌ Family validation failed:', error);
      throw new Error(error);
    }

    const newCounts = { ...this.state.familyHone.counts };
    newCounts[family] += 1;

    const newHistory = [...this.state.familyHone.history, family];
    const newRouterItemsSeen = [...this.state.familyHone.routerItemsSeen, routerItemId];

    // Check if family hone is complete
    const isComplete = Object.values(newCounts).some(count => count >= 3);
    const lockedFamily = isComplete ? family : undefined;

    console.log('📊 Family hone update:', { newCounts, isComplete, lockedFamily });

    // Update family hone state
    this.updateState({
      familyHone: {
        ...this.state.familyHone,
        counts: newCounts,
        history: newHistory,
        routerItemsSeen: newRouterItemsSeen,
        lockedFamily,
        isComplete
      }
    });

    // If family hone is complete, transition to face triad with a small delay to prevent race conditions
    if (isComplete && lockedFamily) {
      console.log('🚀 Family hone complete, transitioning to face triad for family:', lockedFamily);
      // Use setTimeout to prevent race conditions with component re-renders
      setTimeout(() => {
        // Double-check stage before transitioning
        if (this.state.stage === 'family_hone' && !this.isTransitioning) {
          this.transitionToFaceTriad(lockedFamily);
        } else {
          console.warn('⚠️ Stage already changed or transition in progress, skipping transition to face triad');
        }
      }, 100);
      
      // Set a timeout to ensure transitioning flag doesn't get stuck
      setTimeout(() => {
        if (this.isTransitioning) {
          console.warn('⚠️ Transition flag stuck after family hone completion, auto-resetting');
          this.isTransitioning = false;
        }
      }, 6000); // 6 second timeout (after the 100ms delay + 5s transition timeout)
    }
  }

  /**
   * Transition to face triad stage
   */
  private transitionToFaceTriad(family: Family): void {
    console.log('🔍 transitionToFaceTriad called:', { family, currentStage: this.state.stage });
    
    // Prevent multiple rapid transitions
    if (this.isTransitioning) {
      console.warn('⚠️ Transition already in progress, skipping');
      return;
    }
    
    // Validate current stage
    if (this.state.stage !== 'family_hone') {
      const error = `Can only transition to face triad from family hone stage. Current stage: ${this.state.stage}`;
      console.error('❌ Stage validation failed:', error);
      throw new Error(error);
    }

    // Validate family hone completion
    if (!this.state.familyHone.isComplete) {
      const error = `Family hone must be complete before transitioning to face triad. Completion status: ${this.state.familyHone.isComplete}`;
      console.error('❌ Family hone validation failed:', error);
      throw new Error(error);
    }

    // Set transitioning flag
    this.isTransitioning = true;
    
    // Set a timeout to automatically reset the flag if it gets stuck
    const resetTimeout = setTimeout(() => {
      if (this.isTransitioning) {
        console.warn('⚠️ Transition flag stuck, auto-resetting');
        this.isTransitioning = false;
      }
    }, 5000); // 5 second timeout
    
    try {
      // Get faces for the family
      const faces = this.getFacesForFamily(family);
      console.log('👥 Faces for family:', { family, faces });
      
      if (faces.length === 0) {
        const error = `No faces found for family: ${family}`;
        console.error('❌ Face validation failed:', error);
        throw new Error(error);
      }
      
      // Initialize face counts
      const faceCounts = faces.reduce((acc, face) => ({ ...acc, [face]: 0 }), {} as Record<Face, number>);
      console.log('📊 Initial face counts:', faceCounts);

      // Transition to face triad stage
      this.updateState({
        stage: 'face_triad',
        faceTriad: {
          family,
          counts: faceCounts,
          duelsRun: 0,
          confidence: 'medium',
          selectedFace: undefined,
          isComplete: false
        }
      });
      
      console.log('✅ Successfully transitioned to face_triad stage');
    } finally {
      // Clear the timeout and reset transitioning flag
      clearTimeout(resetTimeout);
      this.isTransitioning = false;
    }
  }

  /**
   * Record a face pick in face triad stage
   */
  recordFacePick(face: Face): void {
    console.log('🔍 recordFacePick called:', { face, currentStage: this.state.stage });
    
    // Prevent recording face picks during transitions
    if (this.isTransitioning) {
      console.warn('⚠️ Transition in progress, ignoring face pick');
      return;
    }
    
    // Validate current stage
    if (this.state.stage !== 'face_triad') {
      const error = `Cannot record face pick outside of face triad stage. Current stage: ${this.state.stage}`;
      console.error('❌ Stage validation failed:', error);
      throw new Error(error);
    }

    // Validate face
    if (!face) {
      const error = 'Face cannot be undefined or null';
      console.error('❌ Face validation failed:', error);
      throw new Error(error);
    }

    // Validate family is set
    if (!this.state.faceTriad.family) {
      const error = 'Face triad family not set';
      console.error('❌ Family validation failed:', error);
      throw new Error(error);
    }

    const newCounts = { ...this.state.faceTriad.counts };
    newCounts[face] += 1;

    console.log('📊 Face triad update:', { newCounts, face });

    // Update face triad state
    this.updateState({
      faceTriad: {
        ...this.state.faceTriad,
        counts: newCounts
      }
    });

    // Check if face triad is complete (3 picks)
    const totalPicks = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
    if (totalPicks >= 3) {
      console.log('🚀 Face triad complete, analyzing pattern...');
      this.completeFaceTriad();
    }
  }

  /**
   * Complete face triad and determine if duels are needed
   */
  private completeFaceTriad(): void {
    const counts = this.state.faceTriad.counts;
    const pattern = this.detectDuelPattern(counts);

    console.log('🎯 Face triad pattern detected:', pattern);

    if (pattern === '3-0-0') {
      // No duels needed, face is clear
      const winner = Object.entries(counts).find(([, count]) => count === 3)?.[0] as Face;
      this.completeFaceSelection(winner, pattern, 0, 'high');
    } else {
      // Duels needed
      this.transitionToFaceDuels();
    }
  }

  /**
   * Detect duel pattern from face counts
   */
  private detectDuelPattern(counts: Record<Face, number>): DuelPattern {
    const values = Object.values(counts).sort((a, b) => b - a);
    
    if (values[0] === 3) return '3-0-0';
    if (values[0] === 2 && values[1] === 1) return '2-1-0';
    if (values[0] === 2 && values[2] === 1) return '2-0-1';
    if (values[0] === 1 && values[1] === 1 && values[2] === 1) return '1-1-1';
    
    throw new Error(`Unexpected face count pattern: ${values.join('-')}`);
  }

  /**
   * Transition to face duels stage
   */
  private transitionToFaceDuels(): void {
    console.log('🔍 transitionToFaceDuels called');
    
    if (this.state.stage !== 'face_triad') {
      throw new Error('Can only transition to face duels from face triad stage');
    }

    // Set transitioning flag
    this.isTransitioning = true;
    
    // Set a timeout to automatically reset the flag if it gets stuck
    const resetTimeout = setTimeout(() => {
      if (this.isTransitioning) {
        console.warn('⚠️ Transition flag stuck in face duels transition, auto-resetting');
        this.isTransitioning = false;
      }
    }, 5000); // 5 second timeout
    
    try {
      this.updateState({
        stage: 'face_duels'
      });
      
      console.log('✅ Successfully transitioned to face_duels stage');
    } finally {
      // Clear the timeout and reset transitioning flag
      clearTimeout(resetTimeout);
      this.isTransitioning = false;
    }
  }

  /**
   * Record duel result
   */
  recordDuelResult(winner: Face, pattern: DuelPattern, duelsRun: number): void {
    console.log('🔍 recordDuelResult called:', { winner, pattern, duelsRun });
    
    // Prevent recording duel results during transitions
    if (this.isTransitioning) {
      console.warn('⚠️ Transition in progress, ignoring duel result');
      return;
    }
    
    if (this.state.stage !== 'face_duels') {
      throw new Error('Cannot record duel result outside of face duels stage');
    }

    this.completeFaceSelection(winner, pattern, duelsRun, 'medium');
  }

  /**
   * Complete face selection and transition to lines
   */
  private completeFaceSelection(face: Face, pattern: DuelPattern, duelsRun: number, confidence: 'high' | 'medium' | 'low'): void {
    console.log('🔍 completeFaceSelection called:', { face, pattern, duelsRun, confidence });
    
    this.updateState({
      stage: 'lines',
      faceTriad: {
        ...this.state.faceTriad,
        selectedFace: face,
        duelsRun,
        confidence,
        isComplete: true
      }
    });
    
    console.log('✅ Successfully transitioned to lines stage');
  }

  /**
   * Record line verdict
   */
  recordLineVerdict(line: Line, token: 'C' | 'O' | 'F', severity: number, items: any): void {
    console.log('🔍 recordLineVerdict called:', { line, token, severity, items });
    
    // Prevent recording line verdicts during transitions
    if (this.isTransitioning) {
      console.warn('⚠️ Transition in progress, ignoring line verdict');
      return;
    }
    
    if (this.state.stage !== 'lines') {
      throw new Error('Cannot record line verdict outside of lines stage');
    }

    const note = this.generateLineNote(token);
    const newLineVerdicts = [...this.state.lines.lineVerdicts, { 
      line, 
      token, 
      severity, 
      note,
      items 
    }];
    
    this.updateState({
      lines: {
        ...this.state.lines,
        lineVerdicts: newLineVerdicts
      }
    });

    // Check if all lines are complete (6 lines total, skipping family line)
    const uniqueLines = new Set(newLineVerdicts.map(v => v.line));
    console.log(`🔍 Line completion check: ${uniqueLines.size}/6 lines completed (${newLineVerdicts.length} total verdicts)`);
    console.log(`🔍 Completed lines:`, Array.from(uniqueLines));
    
    if (uniqueLines.size >= 6) {
      console.log('🎯 All 6 lines completed, transitioning to complete stage');
      this.completeLines();
    } else {
      console.log(`📊 Line progress: ${uniqueLines.size}/6 lines completed (${newLineVerdicts.length} total verdicts)`);
    }
  }

  /**
   * Generate line note based on token
   */
  private generateLineNote(token: 'C' | 'O' | 'F'): string {
    // According to JSON: line_note_templates
    const notes = {
      'C': 'Stable: the move lands cleanly without extra passes.',
      'O': 'Offset: hesitation/softening adds latency here.',
      'F': 'Break: pattern derails or reverses motion under pressure.'
    };
    return notes[token];
  }

  /**
   * Complete lines and generate results
   */
  private completeLines(): void {
    console.log('🔍 completeLines called');
    
    this.updateState({
      stage: 'complete',
      lines: {
        ...this.state.lines,
        isComplete: true
      },
      isComplete: true
    });
    
    console.log('✅ Quiz completed successfully');
  }

  /**
   * Get available faces for a family
   */
  private getFacesForFamily(family: Family): Face[] {
    const familyFaces: Record<Family, Face[]> = {
      'Control': ['sovereign', 'rebel', 'catalyst'],
      'Pace': ['strategist', 'navigator', 'visionary'],
      'Boundary': ['guardian', 'equalizer', 'sentinel'],
      'Truth': ['seeker', 'architect', 'alchemist'],
      'Recognition': ['spotlight', 'mask', 'artisan'],
      'Bonding': ['provider', 'partner', 'servant'],
      'Stress': ['diplomat', 'wanderer', 'catalyst']
    };
    
    return familyFaces[family] || [];
  }

  /**
   * Reset quiz state (for new quiz)
   */
  reset(): void {
    console.log('🔄 Resetting quiz state');
    this.state = this.createInitialState();
    this.notifyListeners();
  }

  /**
   * Get current stage
   */
  getCurrentStage(): QuizStage {
    return this.state.stage;
  }

  /**
   * Check if quiz is complete
   */
  isComplete(): boolean {
    return this.state.isComplete;
  }

  /**
   * Get debug info
   */
  getDebugInfo(): any {
    return {
      stage: this.state.stage,
      familyHone: {
        isComplete: this.state.familyHone.isComplete,
        lockedFamily: this.state.familyHone.lockedFamily,
        counts: this.state.familyHone.counts
      },
      faceTriad: {
        family: this.state.faceTriad.family,
        isComplete: this.state.faceTriad.isComplete,
        counts: this.state.faceTriad.counts
      },
      lines: {
        isComplete: this.state.lines.isComplete,
        verdictsCount: this.state.lines.lineVerdicts.length
      }
    };
  }
}
