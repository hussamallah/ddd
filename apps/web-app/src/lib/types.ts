export type Token = 'CLOSE' | 'STALL' | 'FRAG';
export type Line =
  | 'Control' | 'Pace' | 'Boundary' | 'Truth' | 'Recognition' | 'Bonding' | 'Stress';

export type BaseItemType = 'micro' | 'duelA' | 'duelB';
export type TBType = 'integrity_check' | 'direction_lock' | 'standard_tiebreak';

// Enhanced Types for Quiz Modes and Multiple Frames
export type QuizMode = 'original' | 'heat' | 'friend' | 'bet';
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

// Backward compatibility: Convert v2.6 tokens to legacy format
export function convertV2TokenToLegacy(token: 'C' | 'O' | 'F'): 'Close' | 'Offset' | 'Far' {
  switch (token) {
    case 'C': return 'Close';
    case 'O': return 'Offset';
    case 'F': return 'Far';
    default: return 'Close';
  }
}

// Backward compatibility: Convert legacy tokens to v2.6 format
export function convertLegacyTokenToV2(distance: 'Close' | 'Offset' | 'Far'): 'C' | 'O' | 'F' {
  switch (distance) {
    case 'Close': return 'C';
    case 'Offset': return 'O';
    case 'Far': return 'F';
    default: return 'C';
  }
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

// New Archetype Profile System Types
export interface LineScore {
  line: 'Control' | 'Pace' | 'Boundary' | 'Truth' | 'Recognition' | 'Bonding' | 'Stress';
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

// v2.6 Quiz System Types
export type Family = 'Control' | 'Pace' | 'Boundary' | 'Truth' | 'Recognition' | 'Bonding' | 'Stress';
export type Face = 'sovereign' | 'rebel' | 'catalyst' | 'strategist' | 'navigator' | 'visionary' | 'guardian' | 'equalizer' | 'sentinel' | 'seeker' | 'architect' | 'alchemist' | 'spotlight' | 'mask' | 'artisan' | 'provider' | 'partner' | 'servant' | 'diplomat' | 'wanderer';

export interface FamilyHoneItem {
  id: string;
  prompt: string;
  options: Record<string, {
    text: string;
    family: Family;
  }>;
}

export interface FaceTriadItem {
  id: string;
  prompt: string;
  options: Record<string, {
    text: string;
    face: Face;
  }>;
}

export interface FaceDuelItem {
  id: string;
  prompt: string;
  options: Record<string, {
    text: string;
    face: Face;
  }>;
}

export interface LineItemV2 {
  id: string;
  prompt: string;
  line: Line;
  options: Record<string, string>;
  token_map: Record<string, 'C' | 'O' | 'F'>;
}

export interface LineDuelItem {
  id: string;
  prompt: string;
  line: Line;
  options: Record<string, {
    text: string;
    token: 'C' | 'O' | 'F';
  }>;
}

export interface LineVerdictV2 {
  line: Line;
  token: 'C' | 'O' | 'F';
  severity: number;
  note: string;
  items: {
    item1: { token: 'C' | 'O' | 'F'; severity: number };
    item2: { token: 'C' | 'O' | 'F'; severity: number };
  };
}

export interface FamilyHoneLogic {
  type: string;
  n: number;
  router_item_min_options: number;
  scheduler: {
    include_leader: boolean;
    include_runner: boolean;
    fill_strategy: string[];
    avoid_repeat_in_item: boolean;
  };
  update_rule: string;
  stop_condition: string;
  outputs: string[];
}

export interface QuizBankV2 {
  version: string;
  flow: string;
  families: Family[];
  faces_by_family: Record<Family, Face[]>;
  family_hone_items: FamilyHoneItem[];
  face_triad_items: Record<Family, FaceTriadItem[]>;
  face_duel_items: Record<Family, FaceDuelItem[]>;
  line_items: LineItemV2[];
  logic: {
    family_hone: FamilyHoneLogic;
    [key: string]: any;
  };
  face_truth_lines: Record<Face, string>;
  line_note_templates: Record<'C' | 'O' | 'F', string>;
  line_duel_items: Record<Line, LineDuelItem[]>;
}

export type DuelPattern = '3-0-0' | '2-1-0' | '2-0-1' | '1-1-1';

export interface DuelResult {
  faces: Face[];
  winner: Face;
}
export type QuizStage = 'family_hone' | 'face_triad' | 'face_duels' | 'lines' | 'complete';

export interface FamilyHoneState {
  counts: Record<Family, number>;
  history: Family[];
  lockedFamily?: Family;
  routerItemsSeen: string[];
  isComplete: boolean;
}

export interface FaceTriadState {
  family: Family;
  counts: Record<Face, number>;
  duelsRun: number;
  confidence: 'high' | 'medium' | 'low';
  selectedFace?: Face;
  isComplete: boolean;
}

export interface LineStateV2 {
  lineVerdicts: LineVerdictV2[];
  currentLineIndex: number;
  isComplete: boolean;
}

export interface QuizStateV2 {
  stage: 'family_hone' | 'face_triad' | 'face_duels' | 'lines' | 'complete';
  familyHone: {
    counts: Record<Family, number>;
    history: Family[];
    lockedFamily?: Family;
    routerItemsSeen: string[];
    isComplete: boolean;
  };
  faceTriad: {
    family?: Family;
    counts: Record<Face, number>;
    duelsRun: number;
    confidence: 'high' | 'medium' | 'low';
    selectedFace?: Face;
    isComplete: boolean;
  };
  lines: {
    lineVerdicts: LineVerdictV2[];
    currentLineIndex: number;
    isComplete: boolean;
  };
  startTime?: number;
  isComplete: boolean;
  results?: QuizResultV2;
}

export interface QuizResultV2 {
  family: {
    name: Family;
    picksToLock: number;
    fhHistory: Family[];
    routerItemsSeen: string[];
  };
  face: {
    name: Face;
    slug: string;
    triadCounts: Record<Face, number>;
    duelsRun: number;
    confidence: 'high' | 'medium' | 'low';
    why: string;
  };
  lines: {
    code7: string;
    perLine: LineVerdictV2[];
    lineDuelLog?: any[];
  };
  truthLine: string;
  audit: {
    familyHoneCounts: Record<Family, number>;
    familyHoneHistory: Family[];
    faceTriadCounts: Record<Face, number>;
    faceDuelLog: any[];
    lineItemTokens: any[];
    rulesUsed: string[];
  };
}
