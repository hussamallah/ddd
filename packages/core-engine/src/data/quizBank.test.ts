import { quizBankLoader, exampleUsage } from './quizBankLoader';

/**
 * Test file demonstrating question bank integration
 * Run with: npm test -- quizBank.test.ts
 */

describe('Quiz Bank Integration Tests', () => {
  test('should load question bank successfully', () => {
    const metadata = quizBankLoader.getMetadata();
    
    expect(metadata.version).toBe('Axis QuizBank v1.2');
    expect(metadata.totalLines).toBe(7); // Control, Pace, Boundary, Truth, Recognition, Bonding, Stress
    expect(metadata.totalBaseItems).toBe(21); // 7 lines × 3 types (micro, duelA, duelB)
    expect(metadata.totalTiebreakerBlocks).toBe(21); // 7 lines × 3 types (integrity_check, direction_lock, standard_tiebreak)
  });

  test('should access Control line micro questions', () => {
    const controlMicro = quizBankLoader.getBaseItem('Control', 'micro');
    
    expect(controlMicro).toBeDefined();
    expect(controlMicro?.line).toBe('Control');
    expect(controlMicro?.type).toBe('micro');
    expect(controlMicro?.frames).toHaveLength(2);
    expect(controlMicro?.frames[0].options).toHaveLength(3);
    expect(controlMicro?.frames[0].options[0].token).toBe('CLOSE');
  });

  test('should access Pace line tiebreaker questions', () => {
    const paceTiebreaker = quizBankLoader.getTBBlock('Pace', 'standard_tiebreak');
    
    expect(paceTiebreaker).toBeDefined();
    expect(paceTiebreaker?.line).toBe('Pace');
    expect(paceTiebreaker?.type).toBe('standard_tiebreak');
    expect(paceTiebreaker?.questions).toHaveLength(2); // Exactly 2 questions per spec
  });

  test('should get all Boundary line items', () => {
    const boundaryItems = quizBankLoader.getLineBaseItems('Boundary');
    
    expect(boundaryItems.micro).toBeDefined();
    expect(boundaryItems.duelA).toBeDefined();
    expect(boundaryItems.duelB).toBeDefined();
    expect(boundaryItems.micro?.line).toBe('Boundary');
    expect(boundaryItems.duelA?.line).toBe('Boundary');
    expect(boundaryItems.duelB?.line).toBe('Boundary');
  });

  test('should get random Truth duel question', () => {
    const randomTruthDuel = quizBankLoader.getRandomFrame('Truth', 'duelA');
    
    expect(randomTruthDuel).toBeDefined();
    expect(randomTruthDuel?.options).toHaveLength(3);
    expect(['CLOSE', 'STALL', 'FRAG']).toContain(randomTruthDuel?.options[0].token);
  });

  test('should get all available lines', () => {
    const lines = quizBankLoader.getAvailableLines();
    
    expect(lines).toHaveLength(7);
    expect(lines).toContain('Control');
    expect(lines).toContain('Pace');
    expect(lines).toContain('Boundary');
    expect(lines).toContain('Truth');
    expect(lines).toContain('Recognition');
    expect(lines).toContain('Bonding');
    expect(lines).toContain('Stress');
  });

  test('should access example usage functions', () => {
    const controlMicro = exampleUsage.getControlMicro();
    const paceTiebreaker = exampleUsage.getPaceTiebreaker();
    const boundaryItems = exampleUsage.getBoundaryItems();
    const randomTruthDuel = exampleUsage.getRandomTruthDuel();
    
    expect(controlMicro).toBeDefined();
    expect(paceTiebreaker).toBeDefined();
    expect(boundaryItems).toBeDefined();
    expect(randomTruthDuel).toBeDefined();
  });

  test('should validate question structure matches types', () => {
    // Test that all questions have required fields
    const controlMicro = quizBankLoader.getBaseItem('Control', 'micro');
    
    if (controlMicro) {
      controlMicro.frames.forEach(frame => {
        expect(frame.id).toBeDefined();
        expect(frame.prompt).toBeDefined();
        expect(frame.options).toBeDefined();
        expect(frame.options.length).toBe(3);
        
        frame.options.forEach(option => {
          expect(option.token).toBeDefined();
          expect(option.text).toBeDefined();
          expect(['CLOSE', 'STALL', 'FRAG']).toContain(option.token);
        });
      });
    }
  });

  test('should validate tiebreaker structure', () => {
    // Test that all tiebreaker blocks have exactly 2 questions
    const lines = quizBankLoader.getAvailableLines();
    
    lines.forEach(line => {
      const tbTypes: Array<'integrity_check' | 'direction_lock' | 'standard_tiebreak'> = [
        'integrity_check',
        'direction_lock', 
        'standard_tiebreak'
      ];
      
      tbTypes.forEach(tbType => {
        const tbBlock = quizBankLoader.getTBBlock(line, tbType);
        if (tbBlock) {
          expect(tbBlock.questions).toHaveLength(2);
          expect(tbBlock.line).toBe(line);
          expect(tbBlock.type).toBe(tbType);
        }
      });
    });
  });

  test('should validate Recognition TB pair has A/B/C coverage', () => {
    // Test that Recognition standard_tiebreak pair covers all tokens
    const recognitionTB = quizBankLoader.getTBBlock('Recognition', 'standard_tiebreak');
    
    expect(recognitionTB).toBeDefined();
    expect(recognitionTB?.questions).toHaveLength(2);
    
    // Collect all tokens from both questions
    const allTokens = new Set<string>();
    recognitionTB?.questions.forEach(question => {
      if (question.frames) {
        question.frames.forEach(frame => {
          frame.options.forEach(option => {
            allTokens.add(option.token);
          });
        });
      } else if (question.options) {
        question.options.forEach(option => {
          allTokens.add(option.token);
        });
      }
    });
    
    // Should have CLOSE, STALL, and FRAG available across the pair
    expect(allTokens).toContain('CLOSE');
    expect(allTokens).toContain('STALL');
    expect(allTokens).toContain('FRAG');
    expect(allTokens.size).toBe(3);
  });
});
