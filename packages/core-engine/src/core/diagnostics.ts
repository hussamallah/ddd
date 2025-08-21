import { 
  LineVerdict, 
  QuizResult, 
  LineName, 
  Token,
  Distance
} from '../types';

/**
 * Diagnostics Builder for AIT
 * Extracts insights and builds comprehensive profiles from quiz results
 */

export interface PressureAnalysis {
  dominantToken: Token;
  percentage: number;
  pressureType: 'authority' | 'warmth' | 'social' | 'mixed';
  intensity: 'low' | 'medium' | 'high';
}

export interface LineAnalysis {
  line: LineName;
  distance: Distance;
  pressureAnalysis: PressureAnalysis;
  variance: boolean;
  driftPercentage?: number;
  tieBreakerType?: string;
  recommendation: string;
}

export interface AxisProfile {
  overallTier: string;
  dominantPatterns: string[];
  pressureDistribution: Record<Token, number>;
  varianceLines: LineName[];
  driftAnalysis: {
    line: LineName;
    percentage: number;
    interpretation: string;
  }[];
  recommendations: string[];
  lawEcho: string;
  protocol24h: string;
}

/**
 * Builds comprehensive diagnostics from quiz results
 */
export function buildDiagnostics(result: QuizResult): AxisProfile {
  const { lineVerdicts, axisTier } = result;
  
  // Analyze pressure distribution across all lines
  const pressureDistribution = analyzePressureDistribution(lineVerdicts);
  
  // Extract dominant patterns
  const dominantPatterns = extractDominantPatterns(lineVerdicts);
  
  // Find variance lines
  const varianceLines = lineVerdicts
    .filter(v => v.variance)
    .map(v => v.line);
  
  // Analyze drift patterns
  const driftAnalysis = analyzeDriftPatterns(lineVerdicts);
  
  // Generate recommendations
  const recommendations = generateRecommendations(lineVerdicts, axisTier);
  
  // Build law echo and protocol
  const lawEcho = buildLawEcho(axisTier, lineVerdicts);
  const protocol24h = buildProtocol24h(axisTier, lineVerdicts);
  
  return {
    overallTier: axisTier,
    dominantPatterns,
    pressureDistribution,
    varianceLines,
    driftAnalysis,
    recommendations,
    lawEcho,
    protocol24h
  };
}

/**
 * Analyzes pressure distribution across all lines
 */
function analyzePressureDistribution(lineVerdicts: LineVerdict[]): Record<Token, number> {
  const distribution: Record<Token, number> = {
    CLOSE: 0,
    STALL: 0,
    FRAG: 0
  };
  
  lineVerdicts.forEach(verdict => {
    const { finalCounts } = verdict;
    const total = finalCounts.A + finalCounts.B + finalCounts.C;
    
    if (total > 0) {
      distribution.CLOSE += finalCounts.A / total;
      distribution.STALL += finalCounts.B / total;
      distribution.FRAG += finalCounts.C / total;
    }
  });
  
  // Normalize to percentages
  const totalLines = lineVerdicts.length;
  Object.keys(distribution).forEach(key => {
    distribution[key as Token] = (distribution[key as Token] / totalLines) * 100;
  });
  
  return distribution;
}

/**
 * Extracts dominant patterns from line verdicts
 */
function extractDominantPatterns(lineVerdicts: LineVerdict[]): string[] {
  const patterns: string[] = [];
  
  // Group by distance
  const distanceGroups = groupBy(lineVerdicts, 'distance');
  
  if (distanceGroups.Close && distanceGroups.Close.length >= 3) {
    patterns.push(`Strong ${distanceGroups.Close.length}/7 Close alignment`);
  }
  
  if (distanceGroups.Far && distanceGroups.Far.length >= 3) {
    patterns.push(`Multiple ${distanceGroups.Far.length}/7 Far patterns`);
  }
  
  // Look for specific line patterns
  const controlPace = lineVerdicts.filter(v => 
    ['Control', 'Pace'].includes(v.line)
  );
  
  if (controlPace.every(v => v.distance === 'Close')) {
    patterns.push('Control-Pace foundation strong');
  }
  
  if (controlPace.every(v => v.distance === 'Far')) {
    patterns.push('Control-Pace foundation weak');
  }
  
  return patterns;
}

/**
 * Analyzes drift patterns when A=0
 */
function analyzeDriftPatterns(lineVerdicts: LineVerdict[]): {
  line: LineName;
  percentage: number;
  interpretation: string;
}[] {
  return lineVerdicts
    .filter(v => v.driftPercentage !== undefined)
    .map(v => ({
      line: v.line,
      percentage: v.driftPercentage!,
      interpretation: interpretDriftPercentage(v.driftPercentage!)
    }));
}

/**
 * Interprets drift percentage values
 */
function interpretDriftPercentage(percentage: number): string {
  if (percentage >= 80) {
    return 'Strong directional preference';
  } else if (percentage >= 60) {
    return 'Moderate directional preference';
  } else if (percentage >= 40) {
    return 'Balanced directional preference';
  } else {
    return 'Weak directional preference';
  }
}

/**
 * Generates actionable recommendations
 */
function generateRecommendations(lineVerdicts: LineVerdict[], axisTier: string): string[] {
  const recommendations: string[] = [];
  
  // Base recommendations on axis tier
  switch (axisTier) {
    case 'Locked':
      recommendations.push('Maintain current practices and routines');
      recommendations.push('Monitor for any signs of rigidity');
      break;
      
    case 'Steady':
      recommendations.push('Focus on consistency in daily practices');
      recommendations.push('Identify areas for incremental improvement');
      break;
      
    case 'Unset':
      recommendations.push('Take time for reflection and self-assessment');
      recommendations.push('Avoid major decisions until clarity emerges');
      recommendations.push('Establish basic daily routines');
      break;
      
    case 'Fragmented':
      recommendations.push('Focus on foundational practices only');
      recommendations.push('Avoid complex situations and decisions');
      recommendations.push('Seek external support if needed');
      break;
  }
  
  // Line-specific recommendations
  const weakLines = lineVerdicts.filter(v => v.distance === 'Far');
  if (weakLines.length > 0) {
    const lineNames = weakLines.map(v => v.line).join(', ');
    recommendations.push(`Focus on strengthening: ${lineNames}`);
  }
  
  // Variance recommendations
  const varianceLines = lineVerdicts.filter(v => v.variance);
  if (varianceLines.length > 0) {
    recommendations.push('Address mixed pressure patterns in key areas');
  }
  
  return recommendations;
}

/**
 * Builds the law echo message
 */
function buildLawEcho(axisTier: string, lineVerdicts: LineVerdict[]): string {
  const baseMessage = getBaseLawEcho(axisTier);
  
  // Add specific insights
  const insights: string[] = [];
  
  // Check for strong foundation
  const foundationLines = lineVerdicts.filter(v => 
    ['Control', 'Pace'].includes(v.line)
  );
  
  if (foundationLines.every(v => v.distance === 'Close')) {
    insights.push('Your foundation is solid');
  } else if (foundationLines.some(v => v.distance === 'Far')) {
    insights.push('Your foundation needs attention');
  }
  
  // Check for stress handling
  const stressLine = lineVerdicts.find(v => v.line === 'Stress');
  if (stressLine && stressLine.distance === 'Close') {
    insights.push('You handle stress well');
  } else if (stressLine && stressLine.distance === 'Far') {
    insights.push('Stress management needs work');
  }
  
  if (insights.length > 0) {
    return `${baseMessage} ${insights.join('. ')}.`;
  }
  
  return baseMessage;
}

/**
 * Gets the base law echo message
 */
function getBaseLawEcho(axisTier: string): string {
  switch (axisTier) {
    case 'Locked':
      return 'Your axis is locked and stable';
    case 'Steady':
      return 'Your axis shows steady alignment';
    case 'Unset':
      return 'Your axis is currently unset';
    case 'Fragmented':
      return 'Your axis is fragmented and needs rebuilding';
    default:
      return 'Your axis status is unclear';
  }
}

/**
 * Builds the 24-hour protocol
 */
function buildProtocol24h(axisTier: string, lineVerdicts: LineVerdict[]): string {
  const baseProtocol = getBaseProtocol(axisTier);
  
  // Add specific actions based on current state
  const actions: string[] = [];
  
  // Check immediate needs
  const currentLine = lineVerdicts[lineVerdicts.length - 1];
  if (currentLine && currentLine.distance === 'Far') {
    actions.push('Focus on basic routines today');
  }
  
  // Check for variance
  if (lineVerdicts.some(v => v.variance)) {
    actions.push('Avoid complex decisions');
  }
  
  if (actions.length > 0) {
    return `${baseProtocol} ${actions.join('. ')}.`;
  }
  
  return baseProtocol;
}

/**
 * Gets the base 24-hour protocol
 */
function getBaseProtocol(axisTier: string): string {
  switch (axisTier) {
    case 'Locked':
      return 'Continue current routine';
    case 'Steady':
      return 'Maintain current practices';
    case 'Unset':
      return 'Take time for reflection';
    case 'Fragmented':
      return 'Focus on basic routines';
    default:
      return 'Proceed with caution';
  }
}

/**
 * Groups array items by a specific property
 */
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const value = String(item[key]);
    if (!groups[value]) {
      groups[value] = [];
    }
    groups[value].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Analyzes a specific line in detail
 */
export function analyzeLine(verdict: LineVerdict): LineAnalysis {
  const { line, distance, finalCounts, variance, driftPercentage, tieBreakerType } = verdict;
  
  // Determine dominant token
  const { A, B, C } = finalCounts;
  let dominantToken: Token;
  let percentage: number;
  
  if (A > B && A > C) {
    dominantToken = 'CLOSE';
    percentage = (A / (A + B + C)) * 100;
  } else if (B > A && B > C) {
    dominantToken = 'STALL';
    percentage = (B / (A + B + C)) * 100;
  } else if (C > A && C > B) {
    dominantToken = 'FRAG';
    percentage = (C / (A + B + C)) * 100;
  } else {
    dominantToken = 'CLOSE'; // Default
    percentage = 33.3;
  }
  
  // Determine pressure type and intensity
  const pressureType = determinePressureType(dominantToken, percentage);
  const intensity = determineIntensity(percentage);
  
  // Generate recommendation
  const recommendation = generateLineRecommendation(line, distance, dominantToken, variance);
  
  return {
    line,
    distance,
    pressureAnalysis: {
      dominantToken,
      percentage,
      pressureType,
      intensity
    },
    variance,
    driftPercentage,
    tieBreakerType,
    recommendation
  };
}

/**
 * Determines pressure type based on token and percentage
 */
function determinePressureType(token: Token, percentage: number): 'authority' | 'warmth' | 'social' | 'mixed' {
  if (percentage >= 60) {
    switch (token) {
      case 'CLOSE': return 'authority';
      case 'STALL': return 'warmth';
      case 'FRAG': return 'social';
    }
  }
  return 'mixed';
}

/**
 * Determines intensity based on percentage
 */
function determineIntensity(percentage: number): 'low' | 'medium' | 'high' {
  if (percentage >= 60) return 'high';
  if (percentage >= 40) return 'medium';
  return 'low';
}

/**
 * Generates line-specific recommendations
 */
function generateLineRecommendation(
  line: LineName, 
  distance: Distance, 
  dominantToken: Token, 
  variance: boolean
): string {
  const baseRecommendation = getBaseLineRecommendation(line, distance);
  
  if (variance) {
    return `${baseRecommendation} Address mixed pressure patterns.`;
  }
  
  return baseRecommendation;
}

/**
 * Gets base recommendation for a line
 */
function getBaseLineRecommendation(line: LineName, distance: Distance): string {
  switch (line) {
    case 'Control':
      return distance === 'Close' ? 'Maintain control practices' : 'Strengthen control foundation';
    case 'Pace':
      return distance === 'Close' ? 'Continue current pace' : 'Establish consistent pace';
    case 'Boundary':
      return distance === 'Close' ? 'Maintain boundaries' : 'Set clearer boundaries';
    case 'Truth':
      return distance === 'Close' ? 'Continue truth practices' : 'Focus on authenticity';
    case 'Recognition':
      return distance === 'Close' ? 'Maintain recognition' : 'Improve self-awareness';
    case 'Bonding':
      return distance === 'Close' ? 'Continue bonding' : 'Strengthen connections';
    case 'Stress':
      return distance === 'Close' ? 'Maintain stress management' : 'Develop stress resilience';
    default:
      return 'Focus on this area';
  }
}
