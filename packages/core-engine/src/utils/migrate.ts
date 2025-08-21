import { LineName, BaseItemType, TBType, BaseItem, TBBlock, TBQuestion, Frame, Option, PickLog, LegacyPickLog } from '../types';

/**
 * Migration utilities for transitioning from legacy structures to spec-compliant ones
 */

export type LegacyItem = { 
  id: string; 
  frames: string[]; 
  options: string[]; // Assuming these are tokens
  tags?: any; 
};

export type LegacyPick = { 
  line: string; 
  itemId: string; 
  chosenIndex: number; 
  token: string; // Assuming this is a Token
  tags?: any; 
  timestamp: number; 
};

/**
 * Migrates a legacy item to a BaseItem
 */
export function migrateLegacyItem(
  l: LegacyItem, 
  line: LineName, 
  type: BaseItemType
): BaseItem {
  const frames: Frame[] = l.frames.map((prompt, i) => ({
    id: `f${i+1}`,
    prompt,
    options: l.options.map((token, j) => ({ 
      token: token as any, // Cast to Token type
      text: `Option ${j+1}` 
    }))
  }));
  
  return { 
    id: l.id, 
    line, 
    type, 
    frames 
  };
}

/**
 * Migrates a legacy pick to a PickLog
 */
export function migrateLegacyPick(p: LegacyPick): PickLog {
  return {
    line: p.line as LineName,
    itemId: p.itemId,
    qid: undefined,
    frameId: undefined,
    shownOrder: [], // unknown historically
    chosenIndex: p.chosenIndex,
    token: p.token as any, // Cast to Token type
    tags: p.tags,
    timestamp: p.timestamp
  };
}

/**
 * Creates a TBBlock from legacy data
 * This is a helper for creating tiebreaker blocks when migrating
 */
export function createTBBlock(
  id: string,
  line: LineName,
  type: TBType,
  questions: TBQuestion[]
): TBBlock {
  if (questions.length !== 2) {
    throw new Error(`TBBlock must have exactly 2 questions, got ${questions.length}`);
  }
  
  return {
    id,
    line,
    type,
    questions
  };
}

/**
 * Creates a TBQuestion from legacy data
 */
export function createTBQuestion(
  qid: string,
  prompt: string,
  options: string[], // Assuming these are tokens
  tags?: string[]
): TBQuestion {
  return {
    qid,
    prompt,
    options: options.map((token, i) => ({
      token: token as any, // Cast to Token type
      text: `Option ${i+1}`
    })),
    tags
  };
}

/**
 * Validates that a migrated structure matches the spec
 */
export function validateMigratedStructure(
  baseItems: Record<LineName, { micro: BaseItem; duelA: BaseItem; duelB: BaseItem }>,
  tbBlocks: Record<LineName, {
    integrity_check: TBBlock;
    direction_lock: TBBlock;
    standard_tiebreak: TBBlock;
  }>
): boolean {
  const lines: LineName[] = ['Control', 'Pace', 'Boundary', 'Truth', 'Recognition', 'Bonding', 'Stress'];
  
  for (const line of lines) {
    // Check base items
    if (!baseItems[line]?.micro || !baseItems[line]?.duelA || !baseItems[line]?.duelB) {
      console.error(`Missing base items for line: ${line}`);
      return false;
    }
    
    // Check TB blocks
    if (!tbBlocks[line]?.integrity_check || !tbBlocks[line]?.direction_lock || !tbBlocks[line]?.standard_tiebreak) {
      console.error(`Missing TB blocks for line: ${line}`);
      return false;
    }
    
    // Check TB questions count
    if (tbBlocks[line].integrity_check.questions.length !== 2) {
      console.error(`Integrity TB for ${line} must have exactly 2 questions`);
      return false;
    }
    
    if (tbBlocks[line].direction_lock.questions.length !== 2) {
      console.error(`Direction-lock TB for ${line} must have exactly 2 questions`);
      return false;
    }
    
    if (tbBlocks[line].standard_tiebreak.questions.length !== 2) {
      console.error(`Standard tiebreak TB for ${line} must have exactly 2 questions`);
      return false;
    }
  }
  
  return true;
}

/**
 * Creates a complete migration plan for a line
 */
export function createLineMigrationPlan(
  line: LineName,
  legacyItems: LegacyItem[]
): {
  baseItems: { micro: BaseItem; duelA: BaseItem; duelB: BaseItem };
  tbBlocks: {
    integrity_check: TBBlock;
    direction_lock: TBBlock;
    standard_tiebreak: TBBlock;
  };
} {
  // This is a template - you'd need to map your actual legacy items
  const microItem = legacyItems.find(item => item.tags?.type === 'micro') || legacyItems[0];
  const duelAItem = legacyItems.find(item => item.tags?.type === 'duelA') || legacyItems[1];
  const duelBItem = legacyItems.find(item => item.tags?.type === 'duelB') || legacyItems[2];
  
  const baseItems = {
    micro: migrateLegacyItem(microItem, line, 'micro'),
    duelA: migrateLegacyItem(duelAItem, line, 'duelA'),
    duelB: migrateLegacyItem(duelBItem, line, 'duelB')
  };
  
  // Create placeholder TB blocks - you'd need to populate these with actual questions
  const tbBlocks = {
    integrity_check: createTBBlock(
      `${line}_integrity`,
      line,
      'integrity_check',
      [
        createTBQuestion('q1', 'Integrity question 1', ['CLOSE', 'STALL']),
        createTBQuestion('q2', 'Integrity question 2', ['CLOSE', 'STALL'])
      ]
    ),
    direction_lock: createTBBlock(
      `${line}_direction`,
      line,
      'direction_lock',
      [
        createTBQuestion('q1', 'Direction question 1', ['STALL', 'FRAG']),
        createTBQuestion('q2', 'Direction question 2', ['STALL', 'FRAG'])
      ]
    ),
    standard_tiebreak: createTBBlock(
      `${line}_standard`,
      line,
      'standard_tiebreak',
      [
        createTBQuestion('q1', 'Standard question 1', ['CLOSE', 'STALL', 'FRAG']),
        createTBQuestion('q2', 'Standard question 2', ['CLOSE', 'STALL', 'FRAG'])
      ]
    )
  };
  
  return { baseItems, tbBlocks };
}
