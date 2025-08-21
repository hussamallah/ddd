import type { TBType } from './types';

// After 3 base picks: A=Close, B=Stall, C=Frag
export function decideTB(A: number, B: number, C: number): TBType | null {
  const key = `${A}${B}${C}`;
  if (key === '300' || key === '030' || key === '003') return null;
  if (key === '210' || key === '201' || key === '102' || key === '120') return 'integrity_check';
  if (key === '012' || key === '021') return 'direction_lock';
  if (key === '111') return 'standard_tiebreak';
  return null; // all other 2-1-0 patterns: no TB
}

// Final tie fallback after 5 picks (two-way ties only)
export function fallbackDistance(A: number, B: number, C: number): 'Close' | 'Offset' | 'Far' {
  if (C >= 2) return 'Far';
  if (A >= 2) return 'Close';
  return 'Offset';
}
