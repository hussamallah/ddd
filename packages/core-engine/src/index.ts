// Core Engine Exports - Updated to match spec requirements

// Core types
export * from './types';

// Core engine functions
export * from './core/pointsMap';
export * from './core/reducer';
export * from './core/randomizer';
export * from './core/lineRunner';
export * from './core/quizRunner';
export * from './core/diagnostics';

// Migration utilities
export * from './utils/migrate';

// Legacy compatibility exports
export { 
  decideTieBreaker as decideTieBreakerLegacy,
  computeABCLegacy,
  distanceFromCountsLegacy
} from './core/reducer';

// Re-export core functions with new names for clarity
export { 
  decideTB,
  fallbackDistance,
  computeABC,
  distanceFromCounts
} from './core';

// Main engine classes
export { LineRunner } from './core/lineRunner';
export { QuizRunner } from './core/quizRunner';

// Utility functions
export { buildDiagnostics, analyzeLine } from './core/diagnostics';
