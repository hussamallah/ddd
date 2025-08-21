import { 
  LineStep, 
  Token, 
  LineName, 
  TieBreakerType,
  LineState,
  LineVerdict,
  Distance
} from '../types';
import { computeABC, applyTieBreaker, hasVariance, calculateDriftPercentage } from './reducer';
import { decideTieBreaker } from './pointsMap';
import { createLineSeed, randomizeItems, RandomizedItem } from './randomizer';
import { QuizItem } from '../types';

/**
 * Line State Machine for AIT
 * Manages the flow: Micro → DuelA → DuelB → Evaluate → (TieBreaker?) → Finalize
 */

export interface LineRunnerConfig {
  items: QuizItem[];
  lineName: LineName;
  onStateChange?: (state: LineState) => void;
  onComplete?: (verdict: LineVerdict) => void;
}

export class LineRunner {
  private config: LineRunnerConfig;
  private state: LineState;
  private randomizedItems: RandomizedItem[];
  private lineSeed: number;

  constructor(config: LineRunnerConfig) {
    this.config = config;
    this.lineSeed = createLineSeed(config.lineName);
    this.randomizedItems = randomizeItems(config.items, this.lineSeed);
    
    this.state = {
      currentStep: 'Micro',
      picks: [],
      counts: { A: 0, B: 0, C: 0 },
      tieBreakerType: undefined,
      tieBreakerPicks: [],
      completed: false
    };
  }

  /**
   * Gets the current state
   */
  getCurrentState(): LineState {
    return { ...this.state };
  }

  /**
   * Gets the current randomized item for display
   */
  getCurrentItem(): RandomizedItem | null {
    const stepIndex = this.getStepIndex();
    if (stepIndex < this.randomizedItems.length) {
      return this.randomizedItems[stepIndex];
    }
    return null;
  }

  /**
   * Records a pick and advances the state machine
   */
  recordPick(letterChoice: string): void {
    const currentItem = this.getCurrentItem();
    if (!currentItem) {
      throw new Error('No current item available');
    }

    // Convert letter to token
    const token = this.getTokenForLetter(letterChoice, currentItem);
    
    // Add to picks
    this.state.picks.push(token);
    
    // Advance state based on current step
    this.advanceState();
    
    // Notify state change
    this.config.onStateChange?.(this.getCurrentState());
  }

  /**
   * Records a tiebreaker pick
   */
  recordTieBreakerPick(letterChoice: string): void {
    if (this.state.currentStep !== 'TieBreaker') {
      throw new Error('Not in tiebreaker state');
    }

    const currentItem = this.getCurrentItem();
    if (!currentItem) {
      throw new Error('No current item available');
    }

    // Convert letter to token
    const token = this.getTokenForLetter(letterChoice, currentItem);
    
    // Add to tiebreaker picks
    this.state.tieBreakerPicks.push(token);
    
    // Check if tiebreaker is complete
    if (this.state.tieBreakerPicks.length >= 2) {
      this.finalizeTieBreaker();
    }
    
    // Notify state change
    this.config.onStateChange?.(this.getCurrentState());
  }

  /**
   * Gets the next step based on current state and picks
   */
  private getNextStep(): LineStep {
    const { currentStep, picks } = this.state;
    
    switch (currentStep) {
      case 'Micro':
        return 'DuelA';
      case 'DuelA':
        return 'DuelB';
      case 'DuelB':
        return 'Evaluate';
      case 'Evaluate':
        // Check if tiebreaker is needed
        if (picks.length === 3) {
          const counts = computeABC(picks);
          const decision = decideTieBreaker(counts);
          
          if (decision.needsTieBreaker) {
            this.state.tieBreakerType = decision.type;
            return 'TieBreaker';
          }
        }
        return 'Finalize';
      case 'TieBreaker':
        return 'Finalize';
      case 'Finalize':
        return 'Finalize';
      default:
        throw new Error(`Unknown step: ${currentStep}`);
    }
  }

  /**
   * Advances the state machine to the next step
   */
  private advanceState(): void {
    const nextStep = this.getNextStep();
    this.state.currentStep = nextStep;
    
    // Update counts if we have 3 picks
    if (this.state.picks.length === 3) {
      this.state.counts = computeABC(this.state.picks);
    }
    
    // Check if line is complete
    if (nextStep === 'Finalize') {
      this.completeLine();
    }
  }

  /**
   * Finalizes the tiebreaker and computes final result
   */
  private finalizeTieBreaker(): void {
    if (!this.state.tieBreakerType) {
      throw new Error('No tiebreaker type set');
    }

    // Apply tiebreaker to base counts
    const baseCounts = this.state.counts;
    const tbPicks = this.state.tieBreakerPicks;
    
    const { finalCounts, distance } = applyTieBreaker(baseCounts, tbPicks);
    
    // Update state
    this.state.counts = finalCounts;
    this.state.currentStep = 'Finalize';
    
    // Complete the line
    this.completeLine();
  }

  /**
   * Completes the line and generates verdict
   */
  private completeLine(): void {
    if (this.state.completed) {
      return;
    }

    this.state.completed = true;
    
    // Generate final verdict
    const verdict = this.generateVerdict();
    
    // Notify completion
    this.config.onComplete?.(verdict);
  }

  /**
   * Generates the final line verdict
   */
  private generateVerdict(): LineVerdict {
    const { lineName } = this.config;
    const { picks, counts, tieBreakerType, tieBreakerPicks } = this.state;
    
    // Calculate distance from final counts
    let distance: Distance;
    if (tieBreakerPicks.length > 0) {
      const { finalCounts } = applyTieBreaker(counts, tieBreakerPicks);
      distance = this.calculateDistance(finalCounts);
    } else {
      distance = this.calculateDistance(counts);
    }
    
    // Determine variance flag
    const variance = hasVariance(picks.slice(0, 3)); // Base picks only
    
    // Calculate drift percentage if applicable
    let driftPercentage: number | undefined;
    if (counts.A === 0 && tieBreakerPicks.length > 0) {
      const { finalCounts } = applyTieBreaker(counts, tieBreakerPicks);
      driftPercentage = calculateDriftPercentage(counts, finalCounts);
    }
    
    // Extract reason (dominant pressure pair)
    const reason = this.extractReason();
    
    return {
      line: lineName,
      distance,
      reason,
      variance,
      driftPercentage,
      tieBreakerUsed: tieBreakerPicks.length > 0,
      tieBreakerType,
      finalCounts: counts
    };
  }

  /**
   * Calculates distance from counts
   */
  private calculateDistance(counts: { A: number; B: number; C: number }): Distance {
    const { A, B, C } = counts;
    const total = A + B + C;
    
    if (total !== 3 && total !== 5) {
      throw new Error(`Invalid total picks: ${total}`);
    }
    
    // Calculate percentages
    const aPercent = (A / total) * 100;
    const bPercent = (B / total) * 100;
    const cPercent = (C / total) * 100;
    
    // Distance classification
    if (aPercent >= 60 || bPercent >= 60 || cPercent >= 60) {
      return 'Close';
    }
    
    if (aPercent >= 40 || bPercent >= 40 || cPercent >= 40) {
      return 'Offset';
    }
    
    return 'Far';
  }

  /**
   * Extracts the reason for the line result
   */
  private extractReason(): string {
    const { picks, counts } = this.state;
    
    if (picks.length === 0) {
      return 'No picks recorded';
    }
    
    // Find dominant token
    const { A, B, C } = counts;
    let dominantToken: string;
    
    if (A > B && A > C) dominantToken = 'CLOSE';
    else if (B > A && B > C) dominantToken = 'STALL';
    else if (C > A && C > B) dominantToken = 'FRAG';
    else dominantToken = 'Mixed';
    
    return `${dominantToken} pressure dominant`;
  }

  /**
   * Gets the step index for item selection
   */
  private getStepIndex(): number {
    switch (this.state.currentStep) {
      case 'Micro': return 0;
      case 'DuelA': return 1;
      case 'DuelB': return 2;
      case 'TieBreaker': return 3; // First TB item
      default: return -1;
    }
  }

  /**
   * Gets the token for a letter choice
   */
  private getTokenForLetter(letter: string): Token {
    const currentItem = this.getCurrentItem();
    if (!currentItem) {
      throw new Error('No current item available');
    }
    
    const letterIndex = currentItem.letterPermutation.indexOf(letter);
    if (letterIndex === -1) {
      throw new Error(`Invalid letter: ${letter}`);
    }
    
    return currentItem.tokenOrder[letterIndex];
  }

  /**
   * Checks if the line is complete
   */
  isComplete(): boolean {
    return this.state.completed;
  }

  /**
   * Gets the current step
   */
  getCurrentStep(): LineStep {
    return this.state.currentStep;
  }

  /**
   * Gets the number of picks made
   */
  getPickCount(): number {
    return this.state.picks.length;
  }

  /**
   * Gets the tiebreaker type if applicable
   */
  getTieBreakerType(): TieBreakerType | undefined {
    return this.state.tieBreakerType;
  }
}
