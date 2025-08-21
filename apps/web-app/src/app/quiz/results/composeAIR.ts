// AIR Composer
// Adapts verdicts to AirInput format and calls renderAIR

import { generateAIR, generateQuizResult, type AirInput, type QuizResult } from '@/lib/air-generator';

export function composeAIR(verdicts: any[], mode?: string): QuizResult {
  // Convert verdicts to AIR format
  const airInputs: AirInput[] = verdicts.map(v => ({
    line: v.line,
    base: [v.counts.base.A, v.counts.base.B, v.counts.base.C],
    final: [v.counts.final.A, v.counts.final.B, v.counts.final.C],
    tbType: v.tb?.type,
    variance: v.variance
  }));

  // Generate AIR results for each line
  airInputs.forEach(input => {
    generateAIR(input);
  });

  // Generate full quiz result with mode support
  return generateQuizResult(verdicts, mode);
}

// Alternative function for individual line analysis
export function composeLineAIR(verdict: any): any {
  const input: AirInput = {
    line: verdict.line,
    base: [verdict.counts.base.A, verdict.counts.base.B, verdict.counts.base.C],
    final: [verdict.counts.final.A, verdict.counts.final.B, verdict.counts.final.C],
    tbType: verdict.tb?.type,
    variance: verdict.variance
  };

  return generateAIR(input);
}
