import { TBType } from '../types';

// Critical Points Map for TieBreaker Decisions
// This defines when and what type of tiebreaker is needed

export interface Counts {
  A: number;
  B: number;
  C: number;
}

export interface TieBreakerDecision {
  needsTieBreaker: boolean;
  type?: TBType;
  reason: string;
}

/**
 * Decides if a tiebreaker is needed based on ABC counts
 * CRITICAL: 120 pattern ALWAYS triggers 'integrity_check' TB (along with 210, 201, 102)
 * Order A B C = Close, Stall, Fragment
 */
export function decideTieBreaker(counts: Counts): TieBreakerDecision {
  const { A, B, C } = counts;
  
  // No tiebreaker needed - clear winner
  if (A > B && A > C) {
    return { needsTieBreaker: false, reason: 'A is clearly dominant' };
  }
  if (B > A && B > C) {
    return { needsTieBreaker: false, reason: 'B is clearly dominant' };
  }
  if (C > A && C > B) {
    return { needsTieBreaker: false, reason: 'C is clearly dominant' };
  }
  
  // Tiebreaker scenarios
  
  // Integrity TieBreaker (CRITICAL REQUIREMENT)
  // Patterns: 120, 210, 201, 102
  if ((A === 1 && B === 2 && C === 0) ||
      (A === 2 && B === 1 && C === 0) ||
      (A === 2 && B === 0 && C === 1) ||
      (A === 1 && B === 0 && C === 2)) {
    return {
      needsTieBreaker: true,
      type: 'integrity_check',
      reason: 'Integrity pattern detected - need to determine axis vs deviate'
    };
  }
  
  // Direction-lock TieBreaker
  // Patterns: 012, 021
  if ((A === 0 && B === 1 && C === 2) ||
      (A === 0 && B === 2 && C === 1)) {
    return {
      needsTieBreaker: true,
      type: 'direction_lock',
      reason: 'Direction-lock pattern - need to determine STALL vs FRAG'
    };
  }
  
  // Ambiguity TieBreaker
  // Pattern: 111
  if (A === 1 && B === 1 && C === 1) {
    return {
      needsTieBreaker: true,
      type: 'standard_tiebreak',
      reason: 'Ambiguity pattern - need to break the three-way tie'
    };
  }
  
  // Edge cases
  if (A === 0 && B === 0 && C === 3) {
    return { needsTieBreaker: false, reason: 'C is clearly dominant (3-0-0)' };
  }
  if (A === 3 && B === 0 && C === 0) {
    return { needsTieBreaker: false, reason: 'A is clearly dominant (3-0-0)' };
  }
  if (A === 0 && B === 3 && C === 0) {
    return { needsTieBreaker: false, reason: 'B is clearly dominant (0-3-0)' };
  }
  
  // Default case - should not happen with 3 picks
  return { needsTieBreaker: false, reason: 'Unexpected count pattern' };
}

/**
 * Alternative implementation matching the spec exactly
 * Order A B C = Close, Stall, Fragment
 */
export function decideTB(A: number, B: number, C: number): TBType | null {
  const key = `${A}${B}${C}`;
  if (key === '300' || key === '030' || key === '003') return null;
  if (key === '210' || key === '201' || key === '102' || key === '120') return 'integrity_check';
  if (key === '012' || key === '021') return 'direction_lock';
  if (key === '111') return 'standard_tiebreak';
  return null; // all other 2-1-0 majorities need no TB
}

/**
 * Fallback after 5 picks (exact ties): prefer C, else A, else B
 */
export function fallbackDistance(A: number, B: number, C: number): 'Close' | 'Offset' | 'Far' {
  if (C >= 2) return 'Far';
  if (A >= 2) return 'Close';
  return 'Offset';
}

/**
 * Validates that the counts make sense for a 3-pick scenario
 */
export function validateCounts(counts: Counts): boolean {
  const { A, B, C } = counts;
  const total = A + B + C;
  return total === 3 && A >= 0 && B >= 0 && C >= 0;
}

/**
 * Gets the dominant token from counts (when no tiebreaker needed)
 */
export function getDominantToken(counts: Counts): string | null {
  const { A, B, C } = counts;
  
  if (A > B && A > C) return 'A';
  if (B > A && B > C) return 'B';
  if (C > A && C > B) return 'C';
  
  return null; // Tiebreaker needed
}
