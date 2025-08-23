'use client';

import type { Line } from '@/lib/types';

// Define the types we need for v2.6
export interface LineItemV2 {
  id: string;
  prompt: string;
  line: Line;
  token_map: Record<string, 'C' | 'O' | 'F'>;
}

export interface LineDuelItem {
  id: string;
  prompt: string;
  line: Line;
  options: Record<string, {
    text: string;
    token: 'C' | 'O' | 'F';
  }>;
}

export interface LineVerdictV2 {
  line: Line;
  token: 'C' | 'O' | 'F';
  severity: number;
  note: string;
  items: {
    item1: { token: 'C' | 'O' | 'F'; severity: number };
    item2: { token: 'C' | 'O' | 'F'; severity: number };
  };
}

export interface LineRunnerV2Config {
  line: Line;
  items: LineItemV2[];
  duelItems?: LineDuelItem[];
  onItemComplete: (item: LineItemV2, token: 'C' | 'O' | 'F', severity: number) => void;
  onLineComplete: (verdict: LineVerdictV2) => void;
  onDuelRequired: (line: Line, items: Array<{ token: 'C' | 'O' | 'F'; severity: number }>) => void;
}

export interface LineState {
  currentItemIndex: number;
  itemResponses: Array<{ token: 'C' | 'O' | 'F'; severity: number }>;
  isComplete: boolean;
  needsDuel: boolean;
  finalVerdict: LineVerdictV2 | null;
}

export class LineRunnerV2 {
  private config: LineRunnerV2Config;
  private state: LineState;

  constructor(config: LineRunnerV2Config) {
    this.config = config;
    this.state = {
      currentItemIndex: 0,
      itemResponses: [],
      isComplete: false,
      needsDuel: false,
      finalVerdict: null
    };
  }

  /**
   * Get the current item to present
   */
  getCurrentItem(): LineItemV2 | null {
    if (this.state.currentItemIndex >= this.config.items.length) {
      return null;
    }
    return this.config.items[this.state.currentItemIndex];
  }

  /**
   * Process a response to the current item
   */
  processItemResponse(selectedOption: string): void {
    const currentItem = this.getCurrentItem();
    if (!currentItem) return;

    const token = currentItem.token_map[selectedOption];
    const severity = this.getTokenSeverity(token);

    // Record response
    this.state.itemResponses.push({ token, severity });
    
    // Notify callback
    this.config.onItemComplete(currentItem, token, severity);

    // Move to next item or complete line
    this.state.currentItemIndex++;
    
    if (this.state.currentItemIndex >= this.config.items.length) {
      this.completeLine();
    }
  }

  /**
   * Get severity level for a token
   */
  private getTokenSeverity(token: 'C' | 'O' | 'F'): number {
    switch (token) {
      case 'C': return 0; // Stable
      case 'O': return 1; // Offset  
      case 'F': return 2; // Break
      default: return 0;
    }
  }

  /**
   * Complete the line assessment
   */
  private completeLine(): void {
    if (this.state.itemResponses.length < 2) {
      console.warn(`Line ${this.config.line} completed with less than 2 responses`);
      return;
    }

    // Check if duel is needed
    if (this.checkIfDuelNeeded()) {
      this.state.needsDuel = true;
      this.config.onDuelRequired(this.config.line, this.state.itemResponses);
      return;
    }

    // Generate final verdict using max severity rule
    const verdict = this.generateLineVerdict();
    this.state.finalVerdict = verdict;
    this.state.isComplete = true;
    
    this.config.onLineComplete(verdict);
  }

  /**
   * Check if a duel is needed based on response pattern
   */
  private checkIfDuelNeeded(): boolean {
    if (this.state.itemResponses.length < 2) return false;

    const tokens = this.state.itemResponses.map(r => r.token);
    const severities = this.state.itemResponses.map(r => r.severity);

    // Check for conflicting patterns that might need clarification
    const hasStable = tokens.includes('C');
    const hasBreak = tokens.includes('F');
    const hasConflict = hasStable && hasBreak;

    // Check for equal severity with different tokens
    const maxSeverity = Math.max(...severities);
    const maxSeverityCount = severities.filter(s => s === maxSeverity).length;
    const hasEqualMaxSeverity = maxSeverityCount > 1;
    
    const maxSeverityTokens = this.state.itemResponses
      .filter(r => r.severity === maxSeverity)
      .map(r => r.token);
    const hasEqualSeverityConflict = hasEqualMaxSeverity && new Set(maxSeverityTokens).size > 1;

    // Trigger duel for complex cases
    return hasConflict || hasEqualSeverityConflict;
  }

  /**
   * Generate line verdict using max severity rule
   */
  private generateLineVerdict(): LineVerdictV2 {
    // Use max severity rule
    const maxSeverity = Math.max(...this.state.itemResponses.map(r => r.severity));
    const maxSeverityResponse = this.state.itemResponses.find(r => r.severity === maxSeverity)!;

    // Generate note based on pattern
    const note = this.generateLineNote(maxSeverityResponse.token, maxSeverity);

    return {
      line: this.config.line,
      token: maxSeverityResponse.token,
      severity: maxSeverity,
      note,
      items: {
        item1: this.state.itemResponses[0],
        item2: this.state.itemResponses[1]
      }
    };
  }

  /**
   * Generate note for line verdict
   */
  private generateLineNote(token: 'C' | 'O' | 'F', severity: number): string {
    const lineNotes = {
      'C': `${this.config.line} line operates stably with consistent patterns under pressure.`,
      'O': `${this.config.line} line shows offset patterns with hesitation or softening under pressure.`,
      'F': `${this.config.line} line breaks or reverses patterns when pressure increases.`
    };

    return lineNotes[token];
  }



  /**
   * Process duel result (called after duel resolution)
   */
  processDuelResult(winner: 'C' | 'O' | 'F'): void {
    const severity = this.getTokenSeverity(winner);
    const note = this.generateLineNote(winner, severity);

    const verdict: LineVerdictV2 = {
      line: this.config.line,
      token: winner,
      severity,
      note,
      items: {
        item1: this.state.itemResponses[0],
        item2: this.state.itemResponses[1]
      }
    };

    this.state.finalVerdict = verdict;
    this.state.isComplete = true;
    this.state.needsDuel = false;

    this.config.onLineComplete(verdict);
  }

  /**
   * Get current state
   */
  getCurrentState(): LineState {
    return { ...this.state };
  }

  /**
   * Get progress percentage
   */
  getProgress(): number {
    return (this.state.currentItemIndex / this.config.items.length) * 100;
  }

  /**
   * Reset the runner
   */
  reset(): void {
    this.state = {
      currentItemIndex: 0,
      itemResponses: [],
      isComplete: false,
      needsDuel: false,
      finalVerdict: null
    };
  }

  /**
   * Skip line (for family line)
   */
  skipLine(reason: string = 'Family line assumed stable'): void {
    const verdict: LineVerdictV2 = {
      line: this.config.line,
      token: 'C',
      severity: 0,
      note: `${this.config.line} line assumed stable (${reason}).`,
      items: {
        item1: { token: 'C', severity: 0 },
        item2: { token: 'C', severity: 0 }
      }
    };

    this.state.finalVerdict = verdict;
    this.state.isComplete = true;
    
    this.config.onLineComplete(verdict);
  }

  /**
   * Convert to legacy LineVerdict format for backward compatibility
   */
  toLegacyFormat(): any {
    if (!this.state.finalVerdict) {
      throw new Error('Cannot convert incomplete line to legacy format');
    }

    const verdict = this.state.finalVerdict;
    return {
      line: verdict.line,
      distance: this.tokenToLegacyDistance(verdict.token),
      counts: {
        base: this.createLegacyCounts(verdict.token),
        final: this.createLegacyCounts(verdict.token)
      },
      tb: { type: 'standard_tiebreak', used: false },
      variance: this.state.itemResponses.length > 1 && 
                new Set(this.state.itemResponses.map(r => r.token)).size > 1,
      reason: verdict.note,
      mode: 'original',
      frameVariant: 'primary'
    };
  }

  /**
   * Convert v2.6 token to legacy distance format
   */
  private tokenToLegacyDistance(token: 'C' | 'O' | 'F'): 'Close' | 'Offset' | 'Far' {
    switch (token) {
      case 'C': return 'Close';
      case 'O': return 'Offset';
      case 'F': return 'Far';
      default: return 'Close';
    }
  }

  /**
   * Create legacy counts format
   */
  private createLegacyCounts(token: 'C' | 'O' | 'F'): { A: number; B: number; C: number } {
    switch (token) {
      case 'C': return { A: 2, B: 0, C: 0 };
      case 'O': return { A: 0, B: 2, C: 0 };
      case 'F': return { A: 0, B: 0, C: 2 };
      default: return { A: 2, B: 0, C: 0 };
    }
  }

  /**
   * Get performance metrics for this line
   */
  getPerformanceMetrics() {
    return {
      itemsProcessed: this.state.itemResponses.length,
      duelsRequired: this.state.needsDuel ? 1 : 0,
      completionTime: Date.now(), // Would need start time tracking
      tokenDistribution: this.getTokenDistribution(),
      confidence: this.calculateConfidence()
    };
  }

  /**
   * Get token distribution across responses
   */
  private getTokenDistribution(): Record<'C' | 'O' | 'F', number> {
    const distribution = { C: 0, O: 0, F: 0 };
    this.state.itemResponses.forEach(response => {
      distribution[response.token]++;
    });
    return distribution;
  }

  /**
   * Calculate confidence level for this line
   */
  private calculateConfidence(): 'high' | 'medium' | 'low' {
    if (this.state.itemResponses.length < 2) return 'low';
    
    const tokens = this.state.itemResponses.map(r => r.token);
    const uniqueTokens = new Set(tokens);
    
    if (uniqueTokens.size === 1) return 'high'; // All responses agree
    if (uniqueTokens.size === 2) return 'medium'; // Some disagreement
    return 'low'; // High disagreement
  }

  /**
   * Export line state for debugging/analysis
   */
  exportState() {
    return {
      line: this.config.line,
      state: this.getCurrentState(),
      performance: this.getPerformanceMetrics(),
      responses: this.state.itemResponses,
      finalVerdict: this.state.finalVerdict
    };
  }
}
