'use client';

import type { 
  QuizResultV2, 
  Family, 
  Face, 
  Line, 
  LineVerdictV2, 
  QuizStateV2 
} from '@/lib/types';

export interface ResultsEngineConfig {
  truthLines: Partial<Record<Face, string>>;
  lineNoteTemplates: Record<'C' | 'O' | 'F', string>;
}

export class ResultsEngineV2 {
  private config: ResultsEngineConfig;

  constructor(config: ResultsEngineConfig) {
    this.config = config;
  }

  /**
   * Generate complete quiz results
   */
  generateResults(quizState: QuizStateV2): QuizResultV2 {
    const family = quizState.familyHone.lockedFamily!;
    const face = quizState.faceTriad.selectedFace!;
    const lineVerdicts = quizState.lines.lineVerdicts;

    return {
      family: this.generateFamilyResult(quizState),
      face: this.generateFaceResult(quizState),
      lines: this.generateLinesResult(lineVerdicts),
      truthLine: this.getTruthLine(face),
      audit: this.generateAuditTrail(quizState)
    };
  }

  /**
   * Generate family result
   */
  private generateFamilyResult(quizState: QuizStateV2) {
    const familyState = quizState.familyHone;
    
    return {
      name: familyState.lockedFamily!,
      picksToLock: familyState.counts[familyState.lockedFamily!] || 3,
      fhHistory: familyState.history,
      routerItemsSeen: familyState.routerItemsSeen
    };
  }

  /**
   * Generate face result
   */
  private generateFaceResult(quizState: QuizStateV2) {
    const faceState = quizState.faceTriad;
    const confidence = this.calculateFaceConfidence(quizState);
    
    return {
      name: faceState.selectedFace!,
      slug: faceState.selectedFace!.toLowerCase().replace(' ', '-'),
      confidence,
      triadCounts: faceState.counts,
      duelsRun: this.countDuelsRun(quizState),
      why: this.generateFaceExplanation(quizState)
    };
  }

  /**
   * Generate lines result
   */
  private generateLinesResult(lineVerdicts: LineVerdictV2[]) {
    const code7 = this.generateCode7(lineVerdicts);
    
    return {
      code7,
      perLine: lineVerdicts,
      lineDuelLog: []
    };
  }

  /**
   * Generate CODE_7 string
   */
  private generateCode7(lineVerdicts: LineVerdictV2[]): string {
    const lineOrder: Line[] = ['Control', 'Pace', 'Boundary', 'Truth', 'Recognition', 'Bonding', 'Stress'];
    
    return lineOrder.map(line => {
      const verdict = lineVerdicts.find(v => v.line === line);
      return verdict?.token || 'C'; // Default to 'C' if not found
    }).join('');
  }

  /**
   * Get truth line for face
   */
  private getTruthLine(face: Face): string {
    const truthLines: Partial<Record<Face, string>> = {
      'sovereign': 'Control flows through natural authority, not forced compliance.',
      'visionary': 'The pattern emerges before the plan.',
      'rebel': 'True change comes from challenging the foundation, not the surface.',
      'strategist': 'Every move should serve three purposes.',
      'navigator': 'The path reveals itself to those who move.',
      'guardian': 'Protection requires knowing what deserves defending.',
      'equalizer': 'Balance is not stillness; it is constant adjustment.',
      'sentinel': 'Vigilance is the price of integrity.',
      'seeker': 'Questions matter more than answers.',
      'architect': 'Structure serves purpose, not the reverse.',
      'alchemist': 'Transformation begins with accepting what is.',
      'spotlight': 'Recognition earned is worth more than recognition given.',
      'mask': 'Privacy is not hiding; it is choosing.',
      'artisan': 'Mastery is the art of making difficult things look simple.',
      'provider': 'Strength multiplies when shared wisely.',
      'partner': 'True collaboration requires individual wholeness.',
      'servant': 'Service without boundaries becomes servitude.',
      'diplomat': 'Harmony built on truth lasts; harmony built on comfort does not.',
      'wanderer': 'Freedom requires the courage to disappoint.',
      'catalyst': 'Change is inevitable; direction is chosen.'
    };
    
    return truthLines[face] || 'Truth emerges through authentic action.';
  }

  /**
   * Calculate face confidence level
   */
  private calculateFaceConfidence(quizState: QuizStateV2): 'high' | 'medium' | 'low' {
    const pattern = this.getTriadPattern(quizState.faceTriad.counts);
    const duelsRun = this.countDuelsRun(quizState);

    // High confidence patterns
    if (pattern === '3-0-0') return 'high';
    if ((pattern === '2-1-0' || pattern === '2-0-1') && duelsRun === 1) return 'high';

    // Medium confidence patterns  
    if ((pattern === '2-1-0' || pattern === '2-0-1') && duelsRun === 2) return 'medium';

    // Low confidence patterns
    if (pattern === '1-1-1') return 'low';

    return 'medium'; // Default
  }

  /**
   * Get triad pattern from counts
   */
  private getTriadPattern(counts: Record<Face, number>): string {
    const sortedCounts = Object.values(counts).sort((a, b) => b - a);
    
    if (sortedCounts[0] === 3) return '3-0-0';
    if (sortedCounts[0] === 2 && sortedCounts[1] === 1) return '2-1-0';
    if (sortedCounts[0] === 2 && sortedCounts[2] === 1) return '2-0-1';
    if (sortedCounts[0] === 1 && sortedCounts[1] === 1 && sortedCounts[2] === 1) return '1-1-1';
    
    return 'unknown';
  }

  /**
   * Count duels run
   */
  private countDuelsRun(quizState: QuizStateV2): number {
    // This would typically come from duel state tracking
    // For now, estimate based on pattern
    const pattern = this.getTriadPattern(quizState.faceTriad.counts);
    
    switch (pattern) {
      case '3-0-0': return 0;
      case '2-1-0':
      case '2-0-1': return 1; // Could be 2 if there was an upset
      case '1-1-1': return 2;
      default: return 0;
    }
  }

  /**
   * Generate face selection explanation
   */
  private generateFaceExplanation(quizState: QuizStateV2): string {
    const face = quizState.faceTriad.selectedFace!;
    const pattern = this.getTriadPattern(quizState.faceTriad.counts);
    const duelsRun = this.countDuelsRun(quizState);

    if (pattern === '3-0-0') {
      return `Clear and consistent ${face} preference across all triad items. No duels required.`;
    }

    if (duelsRun === 0) {
      return `Strong ${face} preference emerged from triad assessment without requiring duels.`;
    }

    if (duelsRun === 1) {
      return `${face} was confirmed through a single decisive duel after mixed triad results.`;
    }

    return `${face} emerged after multiple duels resolved close competition between archetype options.`;
  }

  /**
   * Generate audit trail
   */
  private generateAuditTrail(quizState: QuizStateV2) {
    return {
      familyHoneCounts: quizState.familyHone.counts,
      familyHoneHistory: quizState.familyHone.history,
      faceTriadCounts: quizState.faceTriad.counts,
      faceDuelLog: [],
      lineItemTokens: [],
      rulesUsed: this.getAppliedRules(quizState)
    };
  }

  /**
   * Get list of rules applied during quiz
   */
  private getAppliedRules(quizState: QuizStateV2): string[] {
    const rules: string[] = [];

    // Family hone rules
    rules.push('first-to-3 family locking');
    
    // Face triad rules
    const pattern = this.getTriadPattern(quizState.faceTriad.counts);
    rules.push(`face triad pattern: ${pattern}`);
    
    if (this.countDuelsRun(quizState) > 0) {
      rules.push('face duel resolution per §19.9');
    }

    // Line rules
    rules.push('max severity line verdicts');
    rules.push('2 items per line assessment');
    
    // Check if any line duels were run (would be recorded in audit trail)
    rules.push('max severity line verdict rule');

    // Family line handling
    if (quizState.familyHone.lockedFamily) {
      rules.push('family line assumed stable');
    }

    return rules;
  }

  /**
   * Generate performance metrics
   */
  generatePerformanceMetrics(quizState: QuizStateV2) {
    const totalItems = quizState.familyHone.routerItemsSeen.length + 
                      3 + // triad items
                      (quizState.lines.lineVerdicts.length * 2); // line items

    const completionTime = Date.now(); // Simplified - would need start time tracking
    
    return {
      totalItems,
      averageTimePerItem: completionTime / totalItems,
      familyHoneEfficiency: quizState.familyHone.counts[quizState.familyHone.lockedFamily!] / quizState.familyHone.routerItemsSeen.length,
      confidenceScore: this.calculateOverallConfidence(quizState),
      completionTime
    };
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(quizState: QuizStateV2): number {
    const faceConfidence = this.calculateFaceConfidence(quizState);
    const faceScore = faceConfidence === 'high' ? 1.0 : faceConfidence === 'medium' ? 0.7 : 0.4;
    
    // Family confidence (higher = fewer items to lock)
    const familyEfficiency = 3 / quizState.familyHone.routerItemsSeen.length;
    const familyScore = Math.min(familyEfficiency, 1.0);
    
    // Line confidence (simplified - assume high confidence for now)
    const lineScore = 0.8; // Would need variance tracking for real calculation
    
    return (faceScore + familyScore + lineScore) / 3;
  }
}
