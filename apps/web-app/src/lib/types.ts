export type Token = 'CLOSE' | 'STALL' | 'FRAG';
export type Line =
  | 'Control' | 'Pace' | 'Boundary' | 'Truth' | 'Recognition' | 'Bonding' | 'Stress';

export type BaseItemType = 'micro' | 'duelA' | 'duelB';
export type TBType = 'integrity_check' | 'direction_lock' | 'standard_tiebreak';

// Enhanced Types for Quiz Modes and Multiple Frames
export type QuizMode = 'original' | 'standard' | 'heat' | 'friend' | 'bet';
export type FrameVariant = 'primary' | 'twin' | 'ladder';

export interface Option { token: Token; text: string; }
export interface Frame { 
  id: string; 
  prompt: string; 
  options: Option[]; 
  tags?: string[]; 
  variant?: FrameVariant;
  mode?: QuizMode[];
}

export interface BaseItem {
  id: string;
  line: Line;
  type: BaseItemType;
  frames: Frame[];
}

export interface TBQuestion {
  qid: string;
  frames?: Frame[];
  prompt?: string;
  options?: Option[];
  tags?: string[];
}

export interface TBBlock {
  id: string;
  line: Line;
  type: TBType;
  questions: TBQuestion[]; // exactly 2
}

export interface QuizProtection {
  locked: boolean;
  requiredCode: string;
  lockMessage: string;
  lastModified: string;
  lockedBy: string;
}

export type QuizBank = {
  version: string;
  protection?: QuizProtection;
  baseItems: Record<Line, {
    micro: BaseItem; duelA: BaseItem; duelB: BaseItem;
  }>;
  tbBlocks: Record<Line, {
    integrity_check: TBBlock;
    direction_lock: TBBlock;
    standard_tiebreak: TBBlock;
  }>;
};

export interface Counts { A: number; B: number; C: number; }

export interface LineVerdict {
  line: Line;
  distance: 'Close' | 'Offset' | 'Far';
  counts: { base: Counts; final: Counts };
  tb?: { type: TBType; used: boolean; drift?: { stallPct?: number; fragPct?: number } };
  variance: boolean; // A & C both appeared in base 3
  reason: string;    // top pressure pair (tags) inferred from non-A picks
  mode?: QuizMode;   // which mode was used for this line
  frameVariant?: FrameVariant; // which frame variant was selected
}

// Enhanced Quiz Result with mode-specific insights
export interface EnhancedQuizResult {
  mode: QuizMode;
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
  modeSpecificInsights?: {
    heatAnalysis?: string;
    thirdPersonPattern?: string;
    betOutcome?: string;
  };
}
