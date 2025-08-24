// AIR Generator Engine
// Maps (base→final) patterns to C/O/F, Axis Tier, Hold Rate, Primary Drift
// Auto-generates 6-8 sentence diagnostic cards per line

// Import the integrated quiz bank for diagnostic cards
import type { QuizBankV2 } from './types';

export interface AirInput {
  line: string;
  base: [number, number, number]; // [A, B, C] counts
  final: [number, number, number]; // [A, B, C] counts
  tbType?: string;
  variance?: boolean;
}

export interface AirOutput {
  distance: 'C' | 'O' | 'F';
  axisTier: 'Solid' | 'Steady' | 'Mixed' | 'Unstable';
  holdRate: number;
  primaryDrift: 'Stall' | 'Fragment';
  card: string;
}

export interface QuizResult {
  axisTier: 'Solid' | 'Steady' | 'Mixed' | 'Unstable';
  profileCode: string;
  aRate: number;
  primaryDrift: 'Stall' | 'Fragment';
  farLines: number;
  lines: LineVerdict[];
  goodBadUgly: {
    good: string[];
    bad: string[];
    ugly?: string;
  };
  mode?: string;
  modeSpecificInsights?: {
    heatAnalysis?: string;
    thirdPersonPattern?: string;
    betOutcome?: string;
  };
}

export interface LineVerdict {
  line: string;
  distance: 'Close' | 'Offset' | 'Far';
  base: string;
  final: string;
  slipDriver: string;
  variance: boolean;
  card: string;
}

// Core mapping logic
function mapPatternToDistance(base: [number, number, number], final: [number, number, number]): 'C' | 'O' | 'F' {
  const [a, b, c] = final;
  const max = Math.max(a, b, c);
  
  if (a === max && a > b && a > c) return 'C';
  if (b === max && b >= a && b >= c) return 'O';
  return 'F';
}

function calculateAxisTier(aRate: number): 'Solid' | 'Steady' | 'Mixed' | 'Unstable' {
  if (aRate >= 0.70) return 'Solid';
  if (aRate >= 0.60) return 'Steady';
  if (aRate >= 0.45) return 'Mixed';
  return 'Unstable';
}

function determinePrimaryDrift(lines: LineVerdict[]): 'Stall' | 'Fragment' {
  let stallCount = 0;
  let fragmentCount = 0;
  
  lines.forEach(line => {
    if (line.distance === 'Offset') stallCount++;
    if (line.distance === 'Far') fragmentCount++;
  });
  
  return stallCount >= fragmentCount ? 'Stall' : 'Fragment';
}

// Convert A-B-C counts to base pattern string (e.g., [3,0,0] -> "300")
function countsToPattern(counts: [number, number, number]): string {
  return counts.join('');
}

// Find the matching card from the integrated quiz bank
function findCardFromDatabase(line: string, basePattern: string, slipDriver: string, quizBank?: QuizBankV2): string {
  // Safety check - ensure quiz bank is available
  if (!quizBank?.diagnostic_cards?.cards) {
    console.warn('Diagnostic cards not available, using fallback');
    return `Database unavailable. ${slipDriver} affects your performance. **Truth:** your pattern is clear.`;
  }
  
  // Find the card that matches the line and base pattern
  const matchingCard = quizBank.diagnostic_cards.cards.find((card: { line: string; base_pattern: string; paragraph: string }) => 
    card.line === line && card.base_pattern === basePattern
  );
  
  if (matchingCard) {
    return matchingCard.paragraph;
  }
  
  // Fallback if no exact match found
  return `No specific card found for ${line} with pattern ${basePattern}. ${slipDriver} affects your performance. **Truth:** your pattern is clear.`;
}

// Diagnostic card generation using the integrated quiz bank
function generateCard(line: string, distance: 'Close' | 'Offset' | 'Far', slipDriver: string, baseCounts?: [number, number, number], quizBank?: QuizBankV2): string {
  // If we have base counts, try to find the exact pattern match
  if (baseCounts) {
    const basePattern = countsToPattern(baseCounts);
    return findCardFromDatabase(line, basePattern, slipDriver, quizBank);
  }
  
  // Fallback to distance-based lookup if no base counts provided
  const distanceMap = { 'Close': '300', 'Offset': '030', 'Far': '003' };
  const fallbackPattern = distanceMap[distance];
  return findCardFromDatabase(line, fallbackPattern, slipDriver, quizBank);
}

// Main AIR generation function
export function generateAIR(input: AirInput): AirOutput {
  const [baseA, baseB, baseC] = input.base;
  const [finalA, finalB, finalC] = input.final;
  
  const distance = mapPatternToDistance(input.base, input.final);
  const holdRate = finalA / (finalA + finalB + finalC);
  const axisTier = calculateAxisTier(holdRate);
  const primaryDrift = finalB >= finalC ? 'Stall' : 'Fragment';
  
  const distanceMap = { 'C': 'Close', 'O': 'Offset', 'F': 'Far' };
  const card = generateCard(input.line, distanceMap[distance] as 'Close' | 'Offset' | 'Far', 'context pressure', input.base);
  
  return {
    distance,
    axisTier,
    holdRate,
    primaryDrift,
    card
  };
}

// Generate Good/Bad/Ugly analysis from integrated quiz bank
function generateGoodBadUglyFromQuizBank(lines: LineVerdict[]): { good: string[]; bad: string[]; ugly?: string } {
  const good: string[] = [];
  const bad: string[] = [];
  const ugly: string[] = [];
  
  lines.forEach(line => {
    // Convert distance to base pattern for lookup
    const distanceMap = { 'Close': '300', 'Offset': '030', 'Far': '003' };
    const basePattern = distanceMap[line.distance];
    
    // For now, use simplified analysis based on distance
    if (line.distance === 'Close') {
      good.push(`${line.line} Stable`);
    } else if (line.distance === 'Offset') {
      bad.push(`${line.line} Variable`);
    } else {
      ugly.push(`${line.line} Broken`);
    }
  });
  
  return {
    good: good.slice(0, 3), // Limit to 3 items
    bad: bad.slice(0, 3),
    ugly: ugly.length > 0 ? ugly[0] : undefined
  };
}

// Generate mode-specific insights
function generateModeInsights(mode: string, verdicts: any[], aRate: number, farLines: number): any {
  const insights: any = {};
  
  switch (mode) {
    case 'heat':
      insights.heatAnalysis = farLines >= 3 
        ? "Under high pressure, your axis fragments across multiple lines. The heat reveals where your foundation needs reinforcement."
        : aRate >= 0.70 
        ? "Heat mode shows solid axis integrity. You maintain control even when everything is urgent and visible."
        : "Moderate heat response. Some lines hold under pressure, others need strengthening for high-stakes situations.";
      break;
      
    case 'friend':
      insights.thirdPersonPattern = aRate >= 0.70
        ? "Your external presentation matches your internal axis. Others see consistent, reliable patterns."
        : farLines >= 2
        ? "External pressure creates performance gaps. Your public patterns don't match your private capabilities."
        : "Mixed external presentation. Some lines show well publicly, others reveal internal-external misalignment.";
      break;
      
    case 'bet':
      insights.betOutcome = farLines >= 3
        ? "High-stakes situations reveal axis fragility. When reputation is on the line, multiple systems fail."
        : aRate >= 0.80
        ? "Bet mode confirms solid axis integrity. You perform better when stakes are highest."
        : "Variable performance under stakes. Some lines strengthen with pressure, others weaken.";
      break;
  }
  
  return insights;
}

// Generate full quiz result
export function generateQuizResult(verdicts: any[], mode?: string): QuizResult {
  const lines: LineVerdict[] = verdicts.map(v => {
    const base = `${v.counts.base.A}-${v.counts.base.B}-${v.counts.base.C}`;
    const final = `${v.counts.final.A}-${v.counts.final.B}-${v.counts.final.C}`;
    
    // Convert base counts to pattern for card lookup
    const baseCounts: [number, number, number] = [v.counts.base.A, v.counts.base.B, v.counts.base.C];
    
    return {
      line: v.line,
      distance: v.distance,
      base,
      final,
      slipDriver: v.reason || 'context pressure',
      variance: v.variance,
      card: generateCard(v.line, v.distance, v.reason || 'context pressure', baseCounts)
    };
  });
  
  const totalA = lines.reduce((sum, line) => sum + parseInt(line.final.split('-')[0]), 0);
  const totalB = lines.reduce((sum, line) => sum + parseInt(line.final.split('-')[1]), 0);
  const totalC = lines.reduce((sum, line) => sum + parseInt(line.final.split('-')[2]), 0);
  const total = totalA + totalB + totalC;
  
  const aRate = total > 0 ? totalA / total : 0;
  const axisTier = calculateAxisTier(aRate);
  const primaryDrift = determinePrimaryDrift(lines);
  const farLines = lines.filter(l => l.distance === 'Far').length;
  
  const profileCode = lines.map(l => l.distance === 'Close' ? 'C' : l.distance === 'Offset' ? 'O' : 'F').join(' ');
  
  // Generate Good/Bad/Ugly analysis from integrated quiz bank
  const goodBadUgly = generateGoodBadUglyFromQuizBank(lines);
  
  console.log('=== AIR Generator Debug ===');
  console.log('Lines:', lines);
  console.log('Final GoodBadUgly:', goodBadUgly);
  console.log('=== End Debug ===');
  
  const result: QuizResult = {
    axisTier,
    profileCode,
    aRate,
    primaryDrift,
    farLines,
    lines,
    goodBadUgly
  };

  // Add mode-specific insights if mode is provided
  if (mode && mode !== 'standard') {
    result.mode = mode;
    if (mode !== 'original') {
      result.modeSpecificInsights = generateModeInsights(mode, verdicts, aRate, farLines);
    }
  }

  return result;
}
