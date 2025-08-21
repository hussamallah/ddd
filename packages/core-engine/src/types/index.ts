// Core Engine Types

export interface IModule {
  id: string;
  name: string;
  version: string;
  initialize(): Promise<void>;
  destroy(): Promise<void>;
  getStatus(): ModuleStatus;
}

export interface IEngine {
  modules: Map<string, IModule>;
  registerModule(module: IModule): void;
  unregisterModule(moduleId: string): void;
  getModule(moduleId: string): IModule | undefined;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export interface IEventEmitter {
  on(event: string, listener: Function): void;
  off(event: string, listener: Function): void;
  emit(event: string, ...args: any[]): void;
}

export interface ILogger {
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
}

export interface IValidator {
  validate(data: any, schema: any): ValidationResult;
}

export enum ModuleStatus {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  RUNNING = 'running',
  STOPPED = 'stopped',
  ERROR = 'error'
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface EngineConfig {
  name: string;
  version: string;
  debug?: boolean;
  modules?: IModule[];
}

export interface ModuleConfig {
  id: string;
  name: string;
  version: string;
  dependencies?: string[];
  config?: Record<string, any>;
}

// Core AIT Domain Types - Updated to match exact specification

export type Token = 'CLOSE' | 'STALL' | 'FRAG';

export type Distance = 'Close' | 'Offset' | 'Far';

export type TieBreakerType = 'integrity' | 'direction-lock' | 'ambiguity';

export type AxisTier = 'Locked' | 'Steady' | 'Unset' | 'Fragmented';

export type LineName = 'Control' | 'Pace' | 'Boundary' | 'Truth' | 'Recognition' | 'Bonding' | 'Stress';

export type LineStep = 'Micro' | 'DuelA' | 'DuelB' | 'Evaluate' | 'TieBreaker' | 'Finalize';

// New spec-aligned types
export type BaseItemType = 'micro' | 'duelA' | 'duelB';
export type TBType = 'standard_tiebreak' | 'direction_lock' | 'integrity_check';

export interface Option { 
  token: Token; 
  text: string; 
}

export interface Frame { 
  id: string; 
  prompt: string; 
  options: Option[]; 
  tags?: string[]; 
}

// Base items (Micro/DuelA/DuelB)
export interface BaseItem {
  id: string;
  line: LineName;
  type: BaseItemType;
  frames: Frame[];
}

// Tiebreaker question (inside a TB block)
export interface TBQuestion {
  qid: string;
  frames?: Frame[];           // use frames OR (prompt+options)
  prompt?: string;            // (for simple two-option DL, etc.)
  options?: Option[];         // if prompt is used instead of frames
  tags?: string[];
}

// TB block (exactly 2 questions per spec)
export interface TBBlock {
  id: string;
  line: LineName;
  type: TBType;               // 'integrity_check' | 'direction_lock' | 'standard_tiebreak'
  questions: TBQuestion[];    // length = 2
}

// Union for quiz bank entries
export type Item = BaseItem | TBBlock;

// Legacy compatibility - keeping for now
export interface QuizItem {
  id: string;
  frames: string[];
  options: Token[];
  tags: {
    status?: 'authority' | 'warmth' | 'neutral';
    pressure?: 'public' | 'private' | 'social';
    intensity?: 'low' | 'medium' | 'high';
  };
}

// Updated PickLog with spec requirements
export interface PickLog {
  line: LineName;
  itemId: string;             // for base or TB block id
  qid?: string;               // present for TB questions
  frameId?: string;           // which frame was rendered
  shownOrder: number[];       // permutation indices applied to options
  chosenIndex: number;        // index within shown order
  token: Token;
  tags?: string[];
  timestamp: number;
}

// Legacy PickLog for compatibility
export interface LegacyPickLog {
  line: LineName;
  itemId: string;
  chosenIndex: number;
  token: Token;
  tags: QuizItem['tags'];
  timestamp: number;
}

// Updated Counts structure
export interface Counts3 { 
  A: number; 
  B: number; 
  C: number; 
}       // after base 3

export interface Counts5 { 
  A: number; 
  B: number; 
  C: number; 
}       // after TB (5 total)

// Legacy Counts for compatibility
export interface Counts {
  A: number;
  B: number;
  C: number;
}

export interface LineVerdict {
  line: LineName;
  distance: Distance;
  reason: string; // dominant pressure pair
  variance: boolean; // true if base contained both CLOSE and FRAG
  driftPercentage?: number; // calculated when A=0 (B vs C split, 20% per pick)
  tieBreakerUsed: boolean;
  tieBreakerType?: TieBreakerType;
  finalCounts: Counts;
  // New spec fields
  counts?: { base: Counts3; final: Counts5; };
  tb?: { 
    type: TBType; 
    used: boolean; 
    drift?: { 
      stallPct?: number; 
      fragPct?: number 
    } 
  };
}

export interface QuizResult {
  axisTier: AxisTier;
  lineVerdicts: LineVerdict[];
  diagnostics: {
    dominantPatterns: string[];
    varianceLines: LineName[];
    driftAnalysis: {
      line: LineName;
      percentage: number;
    }[];
    lawEcho: string;
    protocol24h: string;
  };
  metadata: {
    totalPicks: number;
    tieBreakersUsed: number;
    completedAt: number;
  };
  // New spec fields
  lines?: LineVerdict[];
  lawEcho?: { held: boolean; crackedWhere?: string };
  volatility?: string;
  protocol?: string[];
}

export interface LineState {
  currentStep: LineStep;
  picks: Token[];
  counts: Counts;
  tieBreakerType?: TieBreakerType;
  tieBreakerPicks: Token[];
  completed: boolean;
}

export interface QuizState {
  currentLine: LineName;
  lineStates: Record<LineName, LineState>;
  pickLog: PickLog[];
  completed: boolean;
}
