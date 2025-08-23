// True Archetype Profile Naming System
// Implements 6×Stable projection for 100% archetype coverage

import type { Line } from './types';

export interface LineScore {
  line: Line;
  token: 'C' | 'O' | 'F'; // C=Stable, O=Offset, F=Break
  tier: 'C+' | 'C' | 'O+' | 'O-' | 'F'; // Tie resolution tiers
  rawCounts: { A: number; B: number; C: number };
}

export interface ProjectionResult {
  projectedCode: string; // Always 6×Stable + 1 non-Stable
  primaryLine: string;
  secondaryLine?: string;
  flips: { OtoC: number; FtoC: number };
  envelope: '6C';
}

export interface ArchetypeProfile {
  name: string; // Public-facing name
  machineKey: string; // Dev/internal key
  badges: string[]; // Optional precision badges
  primaryLine: string;
  secondaryLine?: string;
  archetype: string;
  projection: ProjectionResult;
}

// Ground rules (already locked)
const LINE_ORDER: Line[] = ['Control', 'Pace', 'Boundary', 'Truth', 'Recognition', 'Bonding', 'Stress'];
const LINE_SHORT = ['C', 'P', 'B', 'T', 'R', 'N', 'S'];
const SEVERITY_RANK = { 'F': 3, 'O': 2, 'C': 1 };
const LINE_TIEBREAK = { 'Control': 7, 'Boundary': 6, 'Truth': 5, 'Recognition': 4, 'Pace': 3, 'Bonding': 2, 'Stress': 1 };

// Archetype colors for theming
export const ARCHETYPE_COLORS: Record<string, { name: string; hex: string }> = {
  "Sovereign": { "name": "Imperial Purple", "hex": "#6B2F8A" },
  "Visionary": { "name": "Indigo", "hex": "#3F51B5" },
  "Rebel": { "name": "Crimson", "hex": "#C62828" },
  "Equalizer": { "name": "Teal", "hex": "#00897B" },
  "Provider": { "name": "Sage Green", "hex": "#5E8C6A" },
  "Wanderer": { "name": "Turquoise", "hex": "#1ABC9C" },
  "Seeker": { "name": "Midnight Blue", "hex": "#0D47A1" },
  "Mask": { "name": "Charcoal", "hex": "#2E3138" },
  "Partner": { "name": "Rose", "hex": "#D81B60" },
  "Guardian": { "name": "Forest Green", "hex": "#1B5E20" },
  "Servant": { "name": "Ochre", "hex": "#A9782B" },
  "Spotlight": { "name": "Marigold", "hex": "#F9A825" },
  "Architect": { "name": "Blueprint Blue", "hex": "#355AA6" },
  "Strategist": { "name": "Navy", "hex": "#1A2A44" },
  "Catalyst": { "name": "Flame Orange", "hex": "#EF6C00" },
  "Diplomat": { "name": "Olive", "hex": "#6B8E23" },
  "Sentinel": { "name": "Blue-Gray", "hex": "#455A64" },
  "Artisan": { "name": "Terracotta", "hex": "#C65D3A" },
  "Navigator": { "name": "Cerulean", "hex": "#2A9DF4" },
  "Alchemist": { "name": "Citrine", "hex": "#C59A1F" }
};

// Archetype family routing (extended from your 20 canon)
const ARCHETYPE_FAMILIES = {
  'Control': {
    default: 'Sovereign',
    routes: {
      'Stress': 'Catalyst',
      'Boundary': 'Visionary',
      'Truth': 'Architect',
      'Recognition': 'Sentinel',
      'Pace': 'Guardian',
      'Bonding': 'Navigator'
    }
  },
  'Pace': {
    default: 'Guardian',
    routes: {
      'Control': 'Sovereign',
      'Boundary': 'Visionary',
      'Truth': 'Architect',
      'Recognition': 'Sentinel',
      'Bonding': 'Navigator',
      'Stress': 'Equalizer'
    }
  },
  'Boundary': {
    default: 'Visionary',
    routes: {
      'Control': 'Sovereign',
      'Pace': 'Guardian',
      'Truth': 'Architect',
      'Recognition': 'Sentinel',
      'Bonding': 'Navigator',
      'Stress': 'Equalizer'
    }
  },
  'Truth': {
    default: 'Architect',
    routes: {
      'Control': 'Sovereign',
      'Pace': 'Guardian',
      'Boundary': 'Visionary',
      'Recognition': 'Sentinel',
      'Bonding': 'Navigator',
      'Stress': 'Equalizer'
    }
  },
  'Recognition': {
    default: 'Sentinel',
    routes: {
      'Control': 'Sovereign',
      'Pace': 'Guardian',
      'Boundary': 'Visionary',
      'Truth': 'Architect',
      'Bonding': 'Navigator',
      'Stress': 'Equalizer'
    }
  },
  'Bonding': {
    default: 'Navigator',
    routes: {
      'Control': 'Sovereign',
      'Pace': 'Guardian',
      'Boundary': 'Visionary',
      'Truth': 'Architect',
      'Recognition': 'Sentinel',
      'Stress': 'Equalizer'
    }
  },
  'Stress': {
    default: 'Equalizer',
    routes: {
      'Control': 'Sovereign',
      'Pace': 'Guardian',
      'Boundary': 'Visionary',
      'Truth': 'Architect',
      'Recognition': 'Sentinel',
      'Bonding': 'Navigator'
    }
  }
};

// Archetype short codes
const ARCHETYPE_SHORTS = {
  'Sovereign': 'SOV',
  'Visionary': 'VIS',
  'Rebel': 'REB',
  'Equalizer': 'EQL',
  'Provider': 'PRO',
  'Wanderer': 'WAN',
  'Seeker': 'SEK',
  'Mask': 'MSK',
  'Partner': 'PRT',
  'Guardian': 'GRD',
  'Servant': 'SRV',
  'Spotlight': 'SPT',
  'Architect': 'ARC',
  'Sentinel': 'STR',
  'Catalyst': 'CAT',
  'Navigator': 'NAV',
  'Alchemist': 'ALC'
};

/**
 * Convert raw quiz verdicts to LineScore objects
 */
export function convertVerdictsToLineScores(verdicts: any[]): LineScore[] {
  return LINE_ORDER.map(line => {
    const verdict = verdicts.find(v => v.line === line);
    if (!verdict) {
      return {
        line,
        token: 'C',
        tier: 'C',
        rawCounts: { A: 0, B: 0, C: 0 }
      };
    }

    // Determine token from distance
    let token: 'C' | 'O' | 'F';
    let tier: 'C+' | 'C' | 'O+' | 'O-' | 'F';
    
    switch (verdict.distance) {
      case 'Close':
        token = 'C';
        tier = verdict.counts?.final?.A === 3 ? 'C+' : 'C';
        break;
      case 'Offset':
        token = 'O';
        tier = verdict.counts?.final?.B === 3 ? 'O+' : 'O-';
        break;
      case 'Far':
        token = 'F';
        tier = 'F';
        break;
      default:
        token = 'C';
        tier = 'C';
    }

    return {
      line,
      token,
      tier,
      rawCounts: verdict.counts?.final || { A: 0, B: 0, C: 0 }
    };
  });
}

/**
 * Rank lines by severity (F > O > C) with tie-breaking
 */
export function rankLinesBySeverity(lineScores: LineScore[]): { primary: LineScore; secondary?: LineScore } {
  // Sort by severity, then by tier, then by tiebreak order
  const sorted = [...lineScores].sort((a, b) => {
    // First by token severity
    if (SEVERITY_RANK[a.token] !== SEVERITY_RANK[b.token]) {
      return SEVERITY_RANK[b.token] - SEVERITY_RANK[a.token];
    }
    
    // Then by tier (if same token)
    if (a.token === b.token) {
      const tierRank = { 'C+': 5, 'C': 4, 'O+': 3, 'O-': 2, 'F': 1 };
      if (tierRank[a.tier] !== tierRank[b.tier]) {
        return tierRank[b.tier] - tierRank[a.tier];
      }
    }
    
    // Finally by line tiebreak order
    return LINE_TIEBREAK[b.line] - LINE_TIEBREAK[a.line];
  });

  return {
    primary: sorted[0],
    secondary: sorted[1]?.token !== 'C' ? sorted[1] : undefined
  };
}

/**
 * Project to 6×Stable envelope, leaving Primary non-Stable
 */
export function projectToStableEnvelope(lineScores: LineScore[], primary: LineScore): ProjectionResult {
  const projected = [...lineScores];
  let OtoC = 0;
  let FtoC = 0;

  // Project all lines to Stable (C) except Primary
  projected.forEach(line => {
    if (line.line !== primary.line) {
      if (line.token === 'O') {
        line.token = 'C';
        OtoC++;
      } else if (line.token === 'F') {
        line.token = 'C';
        FtoC++;
      }
    }
  });

  // Build projected code
  const projectedCode = projected.map(line => line.token).join('');

  return {
    projectedCode,
    primaryLine: primary.line,
    secondaryLine: lineScores.find(l => l.line !== primary.line && l.token !== 'C')?.line,
    flips: { OtoC, FtoC },
    envelope: '6C'
  };
}

/**
 * Determine archetype family and specific archetype
 */
export function determineArchetype(primary: LineScore, secondary?: LineScore): { archetype: string; viaSecondary: boolean } {
  const family = ARCHETYPE_FAMILIES[primary.line as keyof typeof ARCHETYPE_FAMILIES];
  if (!family) {
    return { archetype: 'Unknown', viaSecondary: false };
  }

  // Check if secondary line routes to a specific archetype
  if (secondary && family.routes[secondary.line as keyof typeof family.routes]) {
    return {
      archetype: family.routes[secondary.line as keyof typeof family.routes],
      viaSecondary: true
    };
  }

  // Use default archetype for the family
  return {
    archetype: family.default,
    viaSecondary: false
  };
}

/**
 * Generate the public-facing archetype name
 */
export function generateArchetypeName(
  archetype: string,
  primary: LineScore,
  secondary?: LineScore,
  viaSecondary: boolean = false
): string {
  const tokenWord = primary.token === 'O' ? 'Offset' : 'Break';
  let name = `${archetype} — ${primary.line} ${tokenWord}`;
  
  if (viaSecondary && secondary) {
    name += ` (via ${secondary.line})`;
  }
  
  return name;
}

/**
 * Generate precision badges
 */
export function generateBadges(
  lineScores: LineScore[],
  projection: ProjectionResult,
  primary: LineScore,
  secondary?: LineScore
): string[] {
  const badges: string[] = [];
  
  // ENV badge
  badges.push(`[ENV: ${projection.envelope}]`);
  
  // GRADE badge for Primary
  badges.push(`[GRADE: ${LINE_SHORT[LINE_ORDER.indexOf(primary.line)]}=${primary.tier}]`);
  
  // SEC badge if Secondary exists
  if (secondary) {
    badges.push(`[SEC: ${LINE_SHORT[LINE_ORDER.indexOf(secondary.line)]}=${secondary.tier}]`);
  }
  
  // FLIPS badge
  const flipParts = [];
  if (projection.flips.OtoC > 0) flipParts.push(`O→C x${projection.flips.OtoC}`);
  if (projection.flips.FtoC > 0) flipParts.push(`F→C x${projection.flips.FtoC}`);
  if (flipParts.length > 0) {
    badges.push(`[FLIPS: ${flipParts.join(', ')}]`);
  }
  
  return badges;
}

/**
 * Generate machine key for developers
 */
export function generateMachineKey(
  archetype: string,
  primary: LineScore,
  projection: ProjectionResult,
  secondary?: LineScore
): string {
  const archShort = ARCHETYPE_SHORTS[archetype as keyof typeof ARCHETYPE_SHORTS] || 'UNK';
  const priLine = LINE_SHORT[LINE_ORDER.indexOf(primary.line)];
  const secLine = secondary ? LINE_SHORT[LINE_ORDER.indexOf(secondary.line)] : '-';
  const secTok = secondary ? secondary.token : '-';
  
  return `ARCH=${archShort}; PRI=${priLine}:${primary.token}; SEC=${secLine}:${secTok}; ENV=${projection.envelope}; FLIP=O${projection.flips.OtoC},F${projection.flips.FtoC}`;
}

/**
 * Main function: Generate complete archetype profile from quiz verdicts
 */
export function generateArchetypeProfile(verdicts: any[]): ArchetypeProfile {
  // Convert verdicts to line scores
  const lineScores = convertVerdictsToLineScores(verdicts);
  
  // Rank lines by severity
  const { primary, secondary } = rankLinesBySeverity(lineScores);
  
  // Project to stable envelope
  const projection = projectToStableEnvelope(lineScores, primary);
  
  // Determine archetype
  const { archetype, viaSecondary } = determineArchetype(primary, secondary);
  
  // Generate name
  const name = generateArchetypeName(archetype, primary, secondary, viaSecondary);
  
  // Generate badges
  const badges = generateBadges(lineScores, projection, primary, secondary);
  
  // Generate machine key
  const machineKey = generateMachineKey(archetype, primary, projection, secondary);
  
  return {
    name,
    machineKey,
    badges,
    primaryLine: primary.line,
    secondaryLine: secondary?.line,
    archetype,
    projection
  };
}

/**
 * Legacy compatibility: Generate archetype code (C/O/F pattern)
 */
export function generateArchetypeCode(verdicts: any[]): string {
  const lineScores = convertVerdictsToLineScores(verdicts);
  return lineScores.map(line => line.token).join(' ');
}

/**
 * Get archetype from existing decoder (fallback)
 */
export function getArchetypeFromDecoder(code: string): any {
  // This would integrate with your existing archetype_decoder.json
  // For now, return null to use the new system
  return null;
}
