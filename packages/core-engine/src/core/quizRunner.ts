import { 
  LineName, 
  LineVerdict, 
  QuizResult, 
  AxisTier,
  QuizState,
  QuizItem
} from '../types';
import { LineRunner, LineRunnerConfig } from './lineRunner';

/**
 * Quiz Runner for AIT
 * Orchestrates all 7 lines in fixed order with proper state management
 */

export const LINE_ORDER: LineName[] = [
  'Control',
  'Pace', 
  'Boundary',
  'Truth',
  'Recognition',
  'Bonding',
  'Stress'
];

export interface QuizRunnerConfig {
  items: QuizItem[];
  onLineComplete?: (lineName: LineName, verdict: LineVerdict) => void;
  onQuizComplete?: (result: QuizResult) => void;
  onStateChange?: (state: QuizState) => void;
}

export class QuizRunner {
  private config: QuizRunnerConfig;
  private state: QuizState;
  private currentLineIndex: number;
  private lineRunners: Map<LineName, LineRunner>;
  private lineVerdicts: LineVerdict[];

  constructor(config: QuizRunnerConfig) {
    this.config = config;
    this.currentLineIndex = 0;
    this.lineVerdicts = [];
    this.lineRunners = new Map();
    
    this.state = {
      currentLine: LINE_ORDER[0],
      lineStates: {},
      pickLog: [],
      completed: false
    };

    // Initialize line runners for all lines
    this.initializeLineRunners();
  }

  /**
   * Initializes line runners for all 7 lines
   */
  private initializeLineRunners(): void {
    LINE_ORDER.forEach(lineName => {
      const lineItems = this.getItemsForLine(lineName);
      
      const lineRunner = new LineRunner({
        items: lineItems,
        lineName,
        onStateChange: (lineState) => {
          this.updateLineState(lineName, lineState);
        },
        onComplete: (verdict) => {
          this.handleLineComplete(lineName, verdict);
        }
      });

      this.lineRunners.set(lineName, lineRunner);
      
      // Initialize line state
      this.state.lineStates[lineName] = {
        currentStep: 'Micro',
        picks: [],
        counts: { A: 0, B: 0, C: 0 },
        tieBreakerType: undefined,
        tieBreakerPicks: [],
        completed: false
      };
    });
  }

  /**
   * Gets items for a specific line
   * In a real implementation, this would filter items by line-specific criteria
   */
  private getItemsForLine(lineName: LineName): QuizItem[] {
    // For now, return all items - in practice you'd filter by line tags
    return this.config.items;
  }

  /**
   * Gets the current line runner
   */
  getCurrentLineRunner(): LineRunner | null {
    const currentLine = this.state.currentLine;
    return this.lineRunners.get(currentLine) || null;
  }

  /**
   * Gets the current quiz state
   */
  getCurrentState(): QuizState {
    return { ...this.state };
  }

  /**
   * Records a pick for the current line
   */
  recordPick(letterChoice: string): void {
    const currentRunner = this.getCurrentLineRunner();
    if (!currentRunner) {
      throw new Error('No current line runner');
    }

    currentRunner.recordPick(letterChoice);
  }

  /**
   * Records a tiebreaker pick for the current line
   */
  recordTieBreakerPick(letterChoice: string): void {
    const currentRunner = this.getCurrentLineRunner();
    if (!currentRunner) {
      throw new Error('No current line runner');
    }

    currentRunner.recordTieBreakerPick(letterChoice);
  }

  /**
   * Advances to the next line
   */
  advanceToNextLine(): void {
    if (this.currentLineIndex >= LINE_ORDER.length - 1) {
      // Quiz is complete
      this.completeQuiz();
      return;
    }

    this.currentLineIndex++;
    const nextLine = LINE_ORDER[this.currentLineIndex];
    this.state.currentLine = nextLine;

    // Notify state change
    this.config.onStateChange?.(this.getCurrentState());
  }

  /**
   * Handles completion of a line
   */
  private handleLineComplete(lineName: LineName, verdict: LineVerdict): void {
    // Add verdict to collection
    this.lineVerdicts.push(verdict);
    
    // Update line state
    this.state.lineStates[lineName].completed = true;
    
    // Notify line completion
    this.config.onLineComplete?.(lineName, verdict);
    
    // Check if all lines are complete
    if (this.lineVerdicts.length === LINE_ORDER.length) {
      this.completeQuiz();
    }
  }

  /**
   * Updates the state of a specific line
   */
  private updateLineState(lineName: LineName, lineState: any): void {
    this.state.lineStates[lineName] = lineState;
    
    // Notify state change
    this.config.onStateChange?.(this.getCurrentState());
  }

  /**
   * Completes the quiz and generates final result
   */
  private completeQuiz(): void {
    if (this.state.completed) {
      return;
    }

    this.state.completed = true;
    
    // Generate final quiz result
    const result = this.generateQuizResult();
    
    // Notify quiz completion
    this.config.onQuizComplete?.(result);
  }

  /**
   * Generates the final quiz result with diagnostics
   */
  private generateQuizResult(): QuizResult {
    // Calculate axis tier
    const axisTier = this.calculateAxisTier();
    
    // Build diagnostics
    const diagnostics = this.buildDiagnostics();
    
    // Calculate metadata
    const totalPicks = this.calculateTotalPicks();
    const tieBreakersUsed = this.lineVerdicts.filter(v => v.tieBreakerUsed).length;
    
    return {
      axisTier,
      lineVerdicts: [...this.lineVerdicts],
      diagnostics,
      metadata: {
        totalPicks,
        tieBreakersUsed,
        completedAt: Date.now()
      }
    };
  }

  /**
   * Calculates the axis tier based on line verdicts
   */
  private calculateAxisTier(): AxisTier {
    const { lineVerdicts } = this;
    
    if (lineVerdicts.length !== 7) {
      return 'Unset';
    }
    
    // Count distances
    const distances = lineVerdicts.map(v => v.distance);
    const closeCount = distances.filter(d => d === 'Close').length;
    const farCount = distances.filter(d => d === 'Far').length;
    
    // Axis tier logic
    if (closeCount >= 5) {
      return 'Locked'; // Strong alignment
    } else if (closeCount >= 3 && farCount <= 2) {
      return 'Steady'; // Good alignment
    } else if (farCount >= 4) {
      return 'Fragmented'; // Poor alignment
    } else {
      return 'Unset'; // Mixed alignment
    }
  }

  /**
   * Builds comprehensive diagnostics
   */
  private buildDiagnostics(): QuizResult['diagnostics'] {
    const { lineVerdicts } = this;
    
    // Extract dominant patterns
    const dominantPatterns = lineVerdicts.map(v => v.reason);
    
    // Find variance lines
    const varianceLines = lineVerdicts
      .filter(v => v.variance)
      .map(v => v.line);
    
    // Calculate drift analysis
    const driftAnalysis = lineVerdicts
      .filter(v => v.driftPercentage !== undefined)
      .map(v => ({
        line: v.line,
        percentage: v.driftPercentage!
      }));
    
    // Generate law echo and protocol
    const lawEcho = this.generateLawEcho();
    const protocol24h = this.generateProtocol24h();
    
    return {
      dominantPatterns,
      varianceLines,
      driftAnalysis,
      lawEcho,
      protocol24h
    };
  }

  /**
   * Generates the law echo based on results
   */
  private generateLawEcho(): string {
    const { axisTier } = this;
    
    switch (axisTier) {
      case 'Locked':
        return 'Your axis is locked and stable. Maintain current practices.';
      case 'Steady':
        return 'Your axis shows steady alignment. Focus on consistency.';
      case 'Unset':
        return 'Your axis is unset. Seek clarity in decision-making.';
      case 'Fragmented':
        return 'Your axis is fragmented. Rebuild foundational practices.';
      default:
        return 'Axis status unclear.';
    }
  }

  /**
   * Generates the 24-hour protocol
   */
  private generateProtocol24h(): string {
    const { axisTier } = this;
    
    switch (axisTier) {
      case 'Locked':
        return 'Continue current routine. No changes needed.';
      case 'Steady':
        return 'Maintain current practices. Monitor for consistency.';
      case 'Unset':
        return 'Take time for reflection. Avoid major decisions.';
      case 'Fragmented':
        return 'Focus on basic routines. Avoid complex situations.';
      default:
        return 'Proceed with caution.';
    }
  }

  /**
   * Calculates total picks made across all lines
   */
  private calculateTotalPicks(): number {
    return this.lineVerdicts.reduce((total, verdict) => {
      return total + (verdict.tieBreakerUsed ? 5 : 3);
    }, 0);
  }

  /**
   * Gets the current line name
   */
  getCurrentLine(): LineName {
    return this.state.currentLine;
  }

  /**
   * Gets the current line index
   */
  getCurrentLineIndex(): number {
    return this.currentLineIndex;
  }

  /**
   * Gets the total number of lines
   */
  getTotalLines(): number {
    return LINE_ORDER.length;
  }

  /**
   * Checks if the quiz is complete
   */
  isComplete(): boolean {
    return this.state.completed;
  }

  /**
   * Gets all line verdicts
   */
  getLineVerdicts(): LineVerdict[] {
    return [...this.lineVerdicts];
  }

  /**
   * Resets the quiz to start over
   */
  reset(): void {
    this.currentLineIndex = 0;
    this.lineVerdicts = [];
    this.state.currentLine = LINE_ORDER[0];
    this.state.completed = false;
    
    // Reset all line runners
    this.lineRunners.forEach(runner => {
      // Note: LineRunner doesn't have a reset method yet
      // This would need to be implemented
    });
    
    // Notify state change
    this.config.onStateChange?.(this.getCurrentState());
  }
}
