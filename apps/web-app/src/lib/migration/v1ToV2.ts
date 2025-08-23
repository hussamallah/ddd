import type { 
  QuizBank, 
  LineVerdict, 
  EnhancedQuizResult,
  QuizBankV2,
  LineVerdictV2,
  QuizResultV2
} from '../types';
import { convertV2TokenToLegacy, convertLegacyTokenToV2 } from '../types';

/**
 * Migration utilities for converting between v1 and v2.6 quiz formats
 */

export interface MigrationResult {
  success: boolean;
  migratedData: any;
  warnings: string[];
  errors: string[];
}

/**
 * Convert v1 LineVerdict to v2.6 LineVerdictV2
 */
export function migrateLineVerdictToV2(legacyVerdict: LineVerdict): LineVerdictV2 {
  return {
    line: legacyVerdict.line,
    token: convertLegacyTokenToV2(legacyVerdict.distance),
    severity: legacyVerdict.distance === 'Close' ? 0 : legacyVerdict.distance === 'Offset' ? 1 : 2,
    note: legacyVerdict.reason,
    items: {
      item1: { 
        token: convertLegacyTokenToV2(legacyVerdict.distance), 
        severity: legacyVerdict.distance === 'Close' ? 0 : legacyVerdict.distance === 'Offset' ? 1 : 2 
      },
      item2: { 
        token: convertLegacyTokenToV2(legacyVerdict.distance), 
        severity: legacyVerdict.distance === 'Close' ? 0 : legacyVerdict.distance === 'Offset' ? 1 : 2 
      }
    }
  };
}

/**
 * Convert v2.6 LineVerdictV2 to v1 LineVerdict
 */
export function migrateLineVerdictToV1(v2Verdict: LineVerdictV2): LineVerdict {
  return {
    line: v2Verdict.line,
    distance: convertV2TokenToLegacy(v2Verdict.token),
    counts: {
      base: { A: v2Verdict.token === 'C' ? 2 : 0, B: v2Verdict.token === 'O' ? 2 : 0, C: v2Verdict.token === 'F' ? 2 : 0 },
      final: { A: v2Verdict.token === 'C' ? 2 : 0, B: v2Verdict.token === 'O' ? 2 : 0, C: v2Verdict.token === 'F' ? 2 : 0 },
    },
    variance: false, // Would need to be calculated from actual responses
    reason: v2Verdict.note,
    mode: 'original',
    frameVariant: 'primary'
  };
}

/**
 * Convert v1 EnhancedQuizResult to v2.6 QuizResultV2
 */
export function migrateQuizResultToV2(legacyResult: EnhancedQuizResult): Partial<QuizResultV2> {
  // This is a partial migration since v1 doesn't have family/face concepts
  const migratedLines = legacyResult.lines.map(migrateLineVerdictToV2);
  
  return {
    family: {
      name: 'Control' as any, // Default family
      picksToLock: 3,
      fhHistory: ['Control'],
      routerItemsSeen: ['migrated-item']
    },
    face: {
      name: 'sovereign' as any, // Default face
      slug: 'sovereign',
      triadCounts: { 
        'sovereign': 3, 'rebel': 0, 'catalyst': 0,
        'strategist': 0, 'navigator': 0, 'visionary': 0,
        'guardian': 0, 'equalizer': 0, 'sentinel': 0,
        'seeker': 0, 'architect': 0, 'alchemist': 0,
        'spotlight': 0, 'mask': 0, 'artisan': 0,
        'provider': 0, 'partner': 0, 'servant': 0,
        'diplomat': 0, 'wanderer': 0
      },
      duelsRun: 0,
      confidence: 'high',
      why: 'Migrated from v1 quiz result'
    },
    lines: {
      code7: migratedLines.map(v => v.token).join(''),
      perLine: migratedLines
    },
    truthLine: 'Migrated from v1 system',
    audit: {
      familyHoneCounts: { 'Control': 3, 'Pace': 0, 'Boundary': 0, 'Truth': 0, 'Recognition': 0, 'Bonding': 0, 'Stress': 0 },
      familyHoneHistory: ['Control'],
      faceTriadCounts: { 
        'sovereign': 3, 'rebel': 0, 'catalyst': 0,
        'strategist': 0, 'navigator': 0, 'visionary': 0,
        'guardian': 0, 'equalizer': 0, 'sentinel': 0,
        'seeker': 0, 'architect': 0, 'alchemist': 0,
        'spotlight': 0, 'mask': 0, 'artisan': 0,
        'provider': 0, 'partner': 0, 'servant': 0,
        'diplomat': 0, 'wanderer': 0
      },
      faceDuelLog: [],
      lineItemTokens: [],
      rulesUsed: ['v1_migration', 'default_family_assignment']
    }
  };
}

/**
 * Convert v2.6 QuizResultV2 to v1 EnhancedQuizResult
 */
export function migrateQuizResultToV1(v2Result: QuizResultV2): EnhancedQuizResult {
  const migratedLines = v2Result.lines.perLine.map(migrateLineVerdictToV1);
  
  // Calculate legacy metrics
  const aRate = migratedLines.filter(l => l.distance === 'Close').length / migratedLines.length;
  const farLines = migratedLines.filter(l => l.distance === 'Far').length;
  
  return {
    mode: 'original',
    axisTier: aRate > 0.7 ? 'Solid' : aRate > 0.5 ? 'Steady' : aRate > 0.3 ? 'Mixed' : 'Unstable',
    profileCode: migratedLines.map(l => l.distance === 'Close' ? 'C' : l.distance === 'Offset' ? 'O' : 'F').join(' '),
    aRate,
    primaryDrift: farLines > 3 ? 'Fragment' : 'Stall',
    farLines,
    lines: migratedLines,
    goodBadUgly: {
      good: ['Migrated from v2.6 system'],
      bad: ['Limited v1 compatibility'],
      ugly: 'Some features may not translate perfectly'
    }
  };
}

/**
 * Validate migration compatibility
 */
export function validateMigrationCompatibility(v1Data: any, v2Data: any): MigrationResult {
  const result: MigrationResult = {
    success: true,
    migratedData: null,
    warnings: [],
    errors: []
  };

  // Check v1 data structure
  if (!v1Data.version || !v1Data.baseItems) {
    result.errors.push('Invalid v1 quiz bank structure');
    result.success = false;
  }

  // Check v2 data structure
  if (!v2Data.version || !v2Data.families || !v2Data.family_hone_items) {
    result.errors.push('Invalid v2.6 quiz bank structure');
    result.success = false;
  }

  // Check for potential compatibility issues
  if (v1Data.version && v1Data.version.includes('v2')) {
    result.warnings.push('Data appears to already be v2 format');
  }

  if (v2Data.version && !v2Data.version.includes('v2.6')) {
    result.warnings.push('v2 data may not be v2.6 format');
  }

  return result;
}

/**
 * Create hybrid quiz bank that supports both formats
 */
export function createHybridQuizBank(v1Bank: QuizBank, v2Bank: QuizBankV2): any {
  return {
    version: 'hybrid-v1-v2.6',
    v1: v1Bank,
    v2: v2Bank,
    migration: {
      timestamp: new Date().toISOString(),
      supportedFormats: ['v1', 'v2.6'],
      conversionFunctions: {
        v1ToV2: 'migrateLineVerdictToV2',
        v2ToV1: 'migrateLineVerdictToV1'
      }
    }
  };
}

/**
 * Get quiz format version
 */
export function detectQuizFormat(data: any): 'v1' | 'v2.6' | 'hybrid' | 'unknown' {
  if (data.version?.includes('v2.6')) return 'v2.6';
  if (data.version?.includes('hybrid')) return 'hybrid';
  if (data.baseItems && data.tbBlocks) return 'v1';
  return 'unknown';
}
