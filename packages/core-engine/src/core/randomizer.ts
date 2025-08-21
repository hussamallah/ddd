import { QuizItem, Token, BaseItem, Frame, Option, TBQuestion } from '../types';

/**
 * Randomizer for AIT - Updated to match spec requirements
 * Handles frame selection and letter permutation while keeping tokens stable
 * Records frameId and shownOrder for audit trail
 */

export interface RandomizedItem {
  item: QuizItem;
  selectedFrame: string;
  letterPermutation: string[]; // ['A', 'B', 'C'] in random order
  tokenOrder: Token[]; // Tokens in the same order as letters
}

export interface RenderedBaseItem {
  frame: Frame;
  options: Option[];
  shownOrder: number[];
}

export interface RenderedTBQuestion {
  prompt: string;
  frameId?: string;
  options: Option[];
  shownOrder: number[];
}

/**
 * Generates all possible permutations of [0,1,2]
 * Used for consistent randomization across runs
 */
export function generatePermutations(): number[][] {
  return [
    [0, 1, 2], // ABC
    [0, 2, 1], // ACB
    [1, 0, 2], // BAC
    [1, 2, 0], // BCA
    [2, 0, 1], // CAB
    [2, 1, 0]  // CBA
  ];
}

/**
 * Randomizes a quiz item by selecting a random frame and permuting letters
 * Letters change, tokens stay stable (CLOSE/STALL/FRAG remain the same)
 * Legacy compatibility function
 */
export function randomizeItem(item: QuizItem, seed?: number): RandomizedItem {
  // Use seed for consistent randomization if provided
  const random = seed ? seededRandom(seed) : Math.random;
  
  // Randomly select a frame
  const frameIndex = Math.floor(random() * item.frames.length);
  const selectedFrame = item.frames[frameIndex];
  
  // Generate random letter permutation
  const permutations = generatePermutations();
  const permutationIndex = Math.floor(random() * permutations.length);
  const permutation = permutations[permutationIndex];
  
  // Map tokens to letters based on permutation
  const letterPermutation = permutation.map(index => ['A', 'B', 'C'][index]);
  const tokenOrder = permutation.map(index => item.options[index]);
  
  return {
    item,
    selectedFrame,
    letterPermutation,
    tokenOrder
  };
}

/**
 * Renders a BaseItem according to spec requirements
 * Returns frame, options, and shownOrder for logging
 */
export function renderBaseItem(item: BaseItem): RenderedBaseItem {
  const frame: Frame = item.frames[Math.floor(Math.random() * item.frames.length)];
  const order = generatePermutations()[Math.floor(Math.random() * generatePermutations().length)];
  const options: Option[] = order.map(i => frame.options[i]);
  return { frame, options, shownOrder: order };
}

/**
 * Renders a TBQuestion according to spec requirements
 * Handles both frames[] and (prompt+options) paths
 */
export function renderTBQuestion(q: TBQuestion): RenderedTBQuestion {
  if (q.frames && q.frames.length) {
    const f = q.frames[Math.floor(Math.random() * q.frames.length)];
    const order = (f.options.length === 3)
      ? generatePermutations()[Math.floor(Math.random() * generatePermutations().length)]
      : [0, 1]; // two-choice DL
    const opts = order.map(i => f.options[i]);
    return { prompt: f.prompt, frameId: f.id, options: opts, shownOrder: order };
  }
  
  // prompt+options path
  const order = (q.options!.length === 3)
    ? generatePermutations()[Math.floor(Math.random() * generatePermutations().length)]
    : [0, 1];
  const opts = order.map(i => q.options![i]);
  return { prompt: q.prompt!, frameId: undefined, options: opts, shownOrder: order };
}

/**
 * Creates a seeded random number generator
 * Ensures consistent results across runs with the same seed
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

/**
 * Randomizes multiple items with consistent letter mapping
 * Useful for ensuring letters don't change meaning mid-line
 */
export function randomizeItems(
  items: QuizItem[], 
  lineSeed: number
): RandomizedItem[] {
  return items.map((item, index) => {
    // Use line seed + item index for consistent randomization
    const itemSeed = lineSeed + index * 1000;
    return randomizeItem(item, itemSeed);
  });
}

/**
 * Gets the token for a specific letter choice
 * Maps UI letters back to actual tokens
 */
export function getTokenForLetter(
  letter: string, 
  randomizedItem: RandomizedItem
): Token {
  const letterIndex = randomizedItem.letterPermutation.indexOf(letter);
  if (letterIndex === -1) {
    throw new Error(`Invalid letter: ${letter}`);
  }
  return randomizedItem.tokenOrder[letterIndex];
}

/**
 * Gets the letter for a specific token
 * Maps tokens back to UI letters
 */
export function getLetterForToken(
  token: Token, 
  randomizedItem: RandomizedItem
): string {
  const tokenIndex = randomizedItem.tokenOrder.indexOf(token);
  if (tokenIndex === -1) {
    throw new Error(`Invalid token: ${token}`);
  }
  return randomizedItem.letterPermutation[tokenIndex];
}

/**
 * Creates a consistent seed for a specific line
 * Ensures same randomization across sessions for the same line
 */
export function createLineSeed(lineName: string): number {
  let hash = 0;
  for (let i = 0; i < lineName.length; i++) {
    const char = lineName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
