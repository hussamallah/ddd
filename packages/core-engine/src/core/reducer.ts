import { Token, Distance, Counts, Counts3, Counts5 } from '../types';
import { Counts as LegacyCounts, decideTieBreaker } from './pointsMap';

/**
 * Core Reducer Logic for AIT - Updated to match spec requirements
 * Handles ABC computation, tiebreaker application, and distance calculation
 */

/**
 * Computes ABC counts from an array of token picks
 * Letters are UI only; always score by token (CLOSE/STALL/FRAG)
 * Spec-compliant version
 */
export function computeABC(tokens: Token[]): Counts3 {
  return {
    A: tokens.filter(t => t === 'CLOSE').length,
    B: tokens.filter(t => t === 'STALL').length,
    C: tokens.filter(t => t === 'FRAG').length
  };
}

/**
 * Legacy computeABC function for backward compatibility
 */
export function computeABCLegacy(picks: Token[]): LegacyCounts {
  const counts: LegacyCounts = { A: 0, B: 0, C: 0 };
  
  picks.forEach(token => {
    switch (token) {
      case 'CLOSE':
        counts.A++;
        break;
      case 'STALL':
        counts.B++;
        break;
      case 'FRAG':
        counts.C++;
        break;
    }
  });
  
  return counts;
}

/**
 * Calculates distance from final ABC counts
 * Based on the distribution pattern after all picks
 * Spec-compliant version
 */
export function distanceFromCounts(A: number, B: number, C: number): Distance {
  if (A > B && A > C) return 'Close';
  if (B >= A && B >= C) return 'Offset';
  return 'Far';
}

/**
 * Applies tiebreaker picks to base counts and returns final result
 * TBs are capped at 2 questions maximum per line
 */
export function applyTieBreaker(
  baseCounts: Counts, 
  tbPicks: Token[]
): { finalCounts: Counts; distance: Distance } {
  if (tbPicks.length > 2) {
    throw new Error('Tiebreaker cannot exceed 2 questions');
  }
  
  // Add tiebreaker picks to base counts
  const finalCounts = { ...baseCounts };
  tbPicks.forEach(token => {
    switch (token) {
      case 'CLOSE':
        finalCounts.A++;
        break;
      case 'STALL':
        finalCounts.B++;
        break;
      case 'FRAG':
        finalCounts.C++;
        break;
    }
  });
  
  // Calculate distance from final counts
  const distance = distanceFromCounts(finalCounts.A, finalCounts.B, finalCounts.C);
  
  return { finalCounts, distance };
}

/**
 * Legacy distance calculation function for backward compatibility
 */
export function distanceFromCountsLegacy(counts: Counts): Distance {
  const { A, B, C } = counts;
  const total = A + B + C;
  
  if (total !== 5) {
    throw new Error(`Expected 5 total picks, got ${total}`);
  }
  
  // Calculate percentages
  const aPercent = (A / total) * 100;
  const bPercent = (B / total) * 100;
  const cPercent = (C / total) * 100;
  
  // Distance classification logic
  if (aPercent >= 60 || bPercent >= 60 || cPercent >= 60) {
    return 'Close'; // One token dominates (60%+)
  }
  
  if (aPercent >= 40 || bPercent >= 40 || cPercent >= 40) {
    return 'Offset'; // One token is strong but not dominant (40-59%)
  }
  
  return 'Far'; // No token is particularly strong (<40%)
}

/**
 * Determines if variance flag should be set
 * True if base contained both CLOSE and FRAG (indicating mixed pressure)
 */
export function hasVariance(basePicks: Token[]): boolean {
  const hasClose = basePicks.includes('CLOSE');
  const hasFrag = basePicks.includes('FRAG');
  return hasClose && hasFrag;
}

/**
 * Calculates drift percentage when A=0
 * Represents B vs C split from 5 picks total
 * 20% per pick (1 pick = 20%, 2 picks = 40%, etc.)
 */
export function calculateDriftPercentage(
  baseCounts: Counts, 
  finalCounts: Counts
): number | undefined {
  const { A: baseA } = baseCounts;
  const { A: finalA } = finalCounts;
  
  // Only calculate drift when A=0 in base
  if (baseA !== 0) {
    return undefined;
  }
  
  // Drift is the percentage of B vs C in the final result
  const { B, C } = finalCounts;
  const total = B + C;
  
  if (total === 0) {
    return 0;
  }
  
  // Return the percentage of the dominant non-A token
  return Math.max(B, C) / total * 100;
}

/**
 * Extracts dominant pressure pair from missed choices
 * Used for building diagnostic reasons per line
 */
export function extractDominantPressurePair(
  picks: Token[], 
  correctToken: Token
): string {
  const incorrectPicks = picks.filter(pick => pick !== correctToken);
  
  if (incorrectPicks.length === 0) {
    return 'Perfect alignment';
  }
  
  // Count incorrect choices
  const counts = { CLOSE: 0, STALL: 0, FRAG: 0 };
  incorrectPicks.forEach(token => counts[token]++);
  
  // Find dominant incorrect pattern
  const dominant = Object.entries(counts)
    .filter(([_, count]) => count > 0)
    .sort(([_, a], [__, b]) => b - a)[0];
  
  if (!dominant) {
    return 'Mixed pressure';
  }
  
  const [token, count] = dominant;
  const percentage = (count / incorrectPicks.length) * 100;
  
  return `${token} pressure (${percentage.toFixed(0)}%)`;
}
