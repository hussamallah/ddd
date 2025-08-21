# Question Bank Integration

This directory contains the integrated question bank for the Axis Quiz system.

## Files

- **`quizBank.json`** - The complete question bank with 35 questions across 7 lines (v1.2 - fixed Recognition TB balance)
- **`quizBankLoader.ts`** - Utility class for accessing questions
- **`quizBank.test.ts`** - Integration tests demonstrating usage

## Structure

The question bank follows the exact data contract your quiz system expects:

### Base Items
- **`baseItems[Line].micro`** - Micro questions for each line
- **`baseItems[Line].duelA`** - Duel A questions for each line  
- **`baseItems[Line].duelB`** - Duel B questions for each line

### Tiebreaker Blocks
- **`tbBlocks[Line].integrity_check`** - Integrity check questions (2 per line)
- **`tbBlocks[Line].direction_lock`** - Direction lock questions (2 per line)
- **`tbBlocks[Line].standard_tiebreak`** - Standard tiebreaker questions (2 per line)

## Usage

### Basic Access

```typescript
import { quizBankLoader } from './data/quizBankLoader';

// Get Control line micro questions
const controlMicro = quizBankLoader.getBaseItem('Control', 'micro');

// Get Pace line tiebreaker questions
const paceTiebreaker = quizBankLoader.getTBBlock('Pace', 'standard_tiebreak');

// Get all Boundary line items
const boundaryItems = quizBankLoader.getLineBaseItems('Boundary');
```

### Integration with Quiz Runner

```typescript
import { quizBankLoader } from './data/quizBankLoader';

// In your quiz runner, replace hardcoded items with:
const getItemsForLine = (lineName: LineName) => {
  const lineItems = quizBankLoader.getLineBaseItems(lineName);
  
  // Convert to your existing QuizItem format if needed
  return [
    lineItems.micro,
    lineItems.duelA, 
    lineItems.duelB
  ].filter(Boolean);
};
```

### Random Question Selection

```typescript
// Get random frame from Control micro
const randomControlFrame = quizBankLoader.getRandomFrame('Control', 'micro');

// Get random tiebreaker question
const randomTBQuestion = quizBankLoader.getRandomTBQuestion('Truth', 'integrity_check');
```

## Key Features

✅ **Perfect Integration** - Matches your existing types exactly  
✅ **Token Scoring** - Each option has the `token` field your scoring needs  
✅ **Tag Extraction** - Frame `tags` enable "pressure pair" diagnostics  
✅ **TB Consistency** - Every tiebreak block has exactly 2 questions  
✅ **Line Organization** - Matches your `Line` enum structure  

## Testing

Run the integration tests:

```bash
npm test -- quizBank.test.ts
```

## Data Validation

The question bank validates:
- All 7 lines have complete micro/duelA/duelB sets
- All tiebreaker blocks have exactly 2 questions
- All options have valid CLOSE/STALL/FRAG tokens
- All frames have proper tags for diagnostics
- **TB pair balance**: Each standard_tiebreak pair provides A/B/C coverage across both questions

## Next Steps

1. ✅ Question bank is loaded and accessible
2. ✅ Integration utilities are ready
3. ✅ Tests validate the structure
4. 🔄 Update your quiz runner to use `quizBankLoader`
5. 🔄 Add Zod schema for runtime validation (optional)

The question bank is **already integration-ready** - no refactoring needed, just start using it!
