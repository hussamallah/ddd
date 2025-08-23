import type { 
  QuizBank, 
  LineVerdict, 
  EnhancedQuizResult,
  QuizBankV2,
  QuizResultV2,
  Line
} from '../types';
import { 
  migrateLineVerdictToV2, 
  migrateLineVerdictToV1, 
  migrateQuizResultToV2, 
  migrateQuizResultToV1,
  detectQuizFormat,
  createHybridQuizBank
} from '../migration/v1ToV2';
import { FamilyHoneEngine } from '../engines/FamilyHoneEngine';
import { FaceTriadEngine } from '../engines/FaceTriadEngine';
import { LineRunnerV2 } from '../engines/LineRunnerV2';
import { ResultsEngineV2 } from '../engines/ResultsEngineV2';

/**
 * Quiz System Bridge
 * Maintains backward compatibility between v1 and v2.7 quiz systems
 */

export interface QuizSystemConfig {
  enableV1: boolean;
  enableV2: boolean;
  autoMigrate: boolean;
  hybridMode: boolean;
}

export interface QuizSystemState {
  currentFormat: 'v1' | 'v2.7' | 'hybrid';
  v1Bank: QuizBank | null;
  v2Bank: QuizBankV2 | null;
  hybridBank: any | null;
  migrationHistory: Array<{
    timestamp: string;
    fromFormat: string;
    toFormat: string;
    success: boolean;
    warnings: string[];
  }>;
}

export class QuizSystemBridge {
  private config: QuizSystemConfig;
  private state: QuizSystemState;
  private v2Engines: {
    familyHone: FamilyHoneEngine | null;
    faceTriad: FaceTriadEngine | null;
    lineRunners: Map<Line, LineRunnerV2>;
    results: ResultsEngineV2 | null;
  };

  constructor(config: QuizSystemConfig) {
    this.config = config;
    this.state = {
      currentFormat: 'v1',
      v1Bank: null,
      v2Bank: null,
      hybridBank: null,
      migrationHistory: []
    };
    
    this.v2Engines = {
      familyHone: null,
      faceTriad: null,
      lineRunners: new Map(),
      results: null
    };
  }

  /**
   * Load quiz bank and detect format
   */
  async loadQuizBank(data: any): Promise<QuizSystemState> {
    const format = detectQuizFormat(data);
    
    try {
      switch (format) {
        case 'v1':
          await this.loadV1Bank(data);
          break;
        case 'v2.6':
          await this.loadV2Bank(data);
          break;
        case 'hybrid':
          await this.loadHybridBank(data);
          break;
        default:
          throw new Error(`Unknown quiz format: ${format}`);
      }

      this.state.currentFormat = format;
      this.recordMigration(format, format, true, []);
      
      return this.state;
    } catch (error) {
      console.error('Failed to load quiz bank:', error);
      throw error;
    }
  }

  /**
   * Load v1 quiz bank
   */
  private async loadV1Bank(data: any): Promise<void> {
    if (!this.config.enableV1) {
      throw new Error('V1 quiz system is disabled');
    }

    this.state.v1Bank = data as QuizBank;
    
    // Auto-migrate to v2 if enabled
    if (this.config.autoMigrate && this.config.enableV2) {
      await this.migrateV1ToV2();
    }
  }

  /**
   * Load v2.7 quiz bank
   */
  private async loadV2Bank(data: any): Promise<void> {
    if (!this.config.enableV2) {
      throw new Error('V2.7 quiz system is disabled');
    }

    this.state.v2Bank = data as QuizBankV2;
    this.initializeV2Engines();
  }

  /**
   * Load hybrid quiz bank
   */
  private async loadHybridBank(data: any): Promise<void> {
    if (!this.config.hybridMode) {
      throw new Error('Hybrid mode is disabled');
    }

    this.state.hybridBank = data;
    this.state.v1Bank = data.v1;
    this.state.v2Bank = data.v2;
    this.initializeV2Engines();
  }

  /**
   * Migrate v1 bank to v2.6
   */
  async migrateV1ToV2(): Promise<void> {
    if (!this.state.v1Bank || !this.config.enableV2) {
      throw new Error('Cannot migrate: v1 bank not loaded or v2 disabled');
    }

    try {
      // Create hybrid bank
      this.state.hybridBank = createHybridQuizBank(this.state.v1Bank, {} as QuizBankV2);
      this.state.currentFormat = 'hybrid';
      
      this.recordMigration('v1', 'hybrid', true, ['Partial migration - v2 data incomplete']);
      
      // Initialize v2 engines with partial data
      this.initializeV2Engines();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.recordMigration('v1', 'v2.6', false, [errorMessage]);
      throw error;
    }
  }

  /**
   * Initialize v2.6 engines
   */
  private initializeV2Engines(): void {
    if (!this.state.v2Bank) return;

    // Initialize family hone engine
    this.v2Engines.familyHone = new FamilyHoneEngine({
      items: this.state.v2Bank.family_hone_items,
      logic: this.state.v2Bank.logic.family_hone,
      onFamilyPick: (family, itemId) => {
        console.log(`Family pick: ${family} for item ${itemId}`);
      },
      onComplete: (lockedFamily, counts) => {
        console.log(`Family locked: ${lockedFamily} with counts:`, counts);
      }
    });

    // Initialize results engine
    this.v2Engines.results = new ResultsEngineV2({
      truthLines: this.state.v2Bank.face_truth_lines,
      lineNoteTemplates: this.state.v2Bank.line_note_templates
    });

    // Initialize line runners
    const lines: Line[] = ['Control', 'Pace', 'Boundary', 'Truth', 'Recognition', 'Bonding', 'Stress'];
    lines.forEach(line => {
      const lineItems = this.state.v2Bank!.line_items.filter(item => item.line === line);
      const duelItems = this.state.v2Bank!.line_duel_items[line] || [];
      
      this.v2Engines.lineRunners.set(line, new LineRunnerV2({
        line,
        items: lineItems,
        duelItems,
        onItemComplete: (item, token, severity) => {
          console.log(`Line ${line} item complete: ${token} (${severity})`);
        },
        onLineComplete: (verdict) => {
          console.log(`Line ${line} complete: ${verdict.token}`);
        },
        onDuelRequired: (line, items) => {
          console.log(`Line ${line} duel required for items:`, items);
        }
      }));
    });
  }

  /**
   * Run quiz in specified format
   */
  async runQuiz(format: 'v1' | 'v2.6' | 'hybrid'): Promise<any> {
    const isEnabled = format === 'v1' ? this.config.enableV1 : 
                     format === 'v2.6' ? this.config.enableV2 : 
                     this.config.hybridMode;
    
    if (!isEnabled) {
      throw new Error(`${format} quiz system is disabled`);
    }

    switch (format) {
      case 'v1':
        return this.runV1Quiz();
      case 'v2.6':
        return this.runV2Quiz();
      case 'hybrid':
        return this.runHybridQuiz();
      default:
        throw new Error(`Unknown format: ${format}`);
    }
  }

  /**
   * Run v1 quiz (placeholder)
   */
  private async runV1Quiz(): Promise<EnhancedQuizResult> {
    // This would integrate with existing v1 quiz system
    throw new Error('V1 quiz system not yet integrated');
  }

  /**
   * Run v2.6 quiz
   */
  private async runV2Quiz(): Promise<QuizResultV2> {
    if (!this.v2Engines.familyHone || !this.v2Engines.results) {
      throw new Error('V2.6 engines not initialized');
    }

    // This would run the full v2.6 flow
    // For now, return a mock result
    return {
      family: {
        name: 'Control',
        picksToLock: 3,
        fhHistory: ['Control'],
        routerItemsSeen: ['mock-item']
      },
      face: {
        name: 'sovereign',
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
        why: 'Mock v2.6 result'
      },
      lines: {
        code7: 'CCCCCCC',
        perLine: []
      },
      truthLine: 'Mock truth line',
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
        rulesUsed: ['mock_v2.6']
      }
    };
  }

  /**
   * Run hybrid quiz
   */
  private async runHybridQuiz(): Promise<any> {
    // Run both systems and compare results
    const v1Result = await this.runV1Quiz();
    const v2Result = await this.runV2Quiz();
    
    return {
      v1: v1Result,
      v2: v2Result,
      comparison: this.compareResults(v1Result, v2Result),
      format: 'hybrid'
    };
  }

  /**
   * Compare v1 and v2 results
   */
  private compareResults(v1Result: any, v2Result: any): any {
    // This would provide detailed comparison between formats
    return {
      compatible: true,
      differences: [],
      warnings: ['Comparison not yet implemented']
    };
  }

  /**
   * Record migration attempt
   */
  private recordMigration(fromFormat: string, toFormat: string, success: boolean, warnings: string[]): void {
    this.state.migrationHistory.push({
      timestamp: new Date().toISOString(),
      fromFormat,
      toFormat,
      success,
      warnings
    });
  }

  /**
   * Get current system state
   */
  getSystemState(): QuizSystemState {
    return { ...this.state };
  }

  /**
   * Get v2 engine status
   */
  getV2EngineStatus(): any {
    return {
      familyHone: !!this.v2Engines.familyHone,
      faceTriad: !!this.v2Engines.faceTriad,
      lineRunners: Array.from(this.v2Engines.lineRunners.keys()),
      results: !!this.v2Engines.results
    };
  }

  /**
   * Reset system state
   */
  reset(): void {
    this.state = {
      currentFormat: 'v1',
      v1Bank: null,
      v2Bank: null,
      hybridBank: null,
      migrationHistory: []
    };
    
    this.v2Engines = {
      familyHone: null,
      faceTriad: null,
      lineRunners: new Map(),
      results: null
    };
  }
}
