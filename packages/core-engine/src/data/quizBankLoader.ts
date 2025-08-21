import quizBank from './quizBank.json';
import { BaseItem, TBBlock, LineName, BaseItemType, TBType } from '../types';

/**
 * Quiz Bank Loader - Integrates the question bank with your existing quiz system
 * This shows how to access questions exactly as your runner expects
 */

export class QuizBankLoader {
  private static instance: QuizBankLoader;
  private quizBank: typeof quizBank;

  private constructor() {
    this.quizBank = quizBank;
  }

  public static getInstance(): QuizBankLoader {
    if (!QuizBankLoader.instance) {
      QuizBankLoader.instance = new QuizBankLoader();
    }
    return QuizBankLoader.instance;
  }

  /**
   * Get a base item (micro/duelA/duelB) for a specific line
   */
  public getBaseItem(line: LineName, type: BaseItemType): BaseItem | undefined {
    const lineItems = this.quizBank.baseItems[line];
    if (!lineItems) return undefined;
    
    return lineItems[type] as BaseItem;
  }

  /**
   * Get a tiebreaker block for a specific line and type
   */
  public getTBBlock(line: LineName, type: TBType): TBBlock | undefined {
    const lineTBBlocks = this.quizBank.tbBlocks[line];
    if (!lineTBBlocks) return undefined;
    
    return lineTBBlocks[type] as TBBlock;
  }

  /**
   * Get all base items for a line (micro + duelA + duelB)
   */
  public getLineBaseItems(line: LineName): {
    micro?: BaseItem;
    duelA?: BaseItem;
    duelB?: BaseItem;
  } {
    const lineItems = this.quizBank.baseItems[line];
    if (!lineItems) return {};
    
    return {
      micro: lineItems.micro as BaseItem,
      duelA: lineItems.duelA as BaseItem,
      duelB: lineItems.duelB as BaseItem
    };
  }

  /**
   * Get all tiebreaker blocks for a line
   */
  public getLineTiebreakerBlocks(line: LineName): {
    integrity_check?: TBBlock;
    direction_lock?: TBBlock;
    standard_tiebreak?: TBBlock;
  } {
    const lineTBBlocks = this.quizBank.tbBlocks[line];
    if (!lineTBBlocks) return {};
    
    return {
      integrity_check: lineTBBlocks.integrity_check as TBBlock,
      direction_lock: lineTBBlocks.direction_lock as TBBlock,
      standard_tiebreak: lineTBBlocks.standard_tiebreak as TBBlock
    };
  }

  /**
   * Get a random frame from a base item
   */
  public getRandomFrame(line: LineName, type: BaseItemType): any {
    const item = this.getBaseItem(line, type);
    if (!item || !item.frames.length) return null;
    
    const randomIndex = Math.floor(Math.random() * item.frames.length);
    return item.frames[randomIndex];
  }

  /**
   * Get a random tiebreaker question
   */
  public getRandomTBQuestion(line: LineName, type: TBType): any {
    const tbBlock = this.getTBBlock(line, type);
    if (!tbBlock || !tbBlock.questions.length) return null;
    
    const randomIndex = Math.floor(Math.random() * tbBlock.questions.length);
    return tbBlock.questions[randomIndex];
  }

  /**
   * Get all available lines
   */
  public getAvailableLines(): LineName[] {
    return Object.keys(this.quizBank.baseItems) as LineName[];
  }

  /**
   * Get question bank metadata
   */
  public getMetadata() {
    return {
      version: this.quizBank.version,
      totalLines: this.getAvailableLines().length,
      totalBaseItems: Object.values(this.quizBank.baseItems).reduce((acc, line) => {
        return acc + Object.keys(line).length;
      }, 0),
      totalTiebreakerBlocks: Object.values(this.quizBank.tbBlocks).reduce((acc, line) => {
        return acc + Object.keys(line).length;
      }, 0)
    };
  }
}

// Export singleton instance
export const quizBankLoader = QuizBankLoader.getInstance();

// Example usage functions
export const exampleUsage = {
  /**
   * Example: Get Control line micro questions
   */
  getControlMicro: () => {
    return quizBankLoader.getBaseItem('Control', 'micro');
  },

  /**
   * Example: Get Pace line tiebreaker questions
   */
  getPaceTiebreaker: () => {
    return quizBankLoader.getTBBlock('Pace', 'standard_tiebreak');
  },

  /**
   * Example: Get all Boundary line items
   */
  getBoundaryItems: () => {
    return quizBankLoader.getLineBaseItems('Boundary');
  },

  /**
   * Example: Get random Truth duel question
   */
  getRandomTruthDuel: () => {
    return quizBankLoader.getRandomFrame('Truth', 'duelA');
  }
};
