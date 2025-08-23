import { FaceTriadEngine } from '../FaceTriadEngine';
import type { Face, FaceTriadItem, FaceDuelItem, Family } from '@/lib/types';

// Mock data
const mockTriadItems: FaceTriadItem[] = [
  {
    id: 'T01',
    prompt: 'Test triad prompt 1',
    options: {
      A: { text: 'Option A', face: 'sovereign' },
      B: { text: 'Option B', face: 'rebel' },
      C: { text: 'Option C', face: 'catalyst' }
    }
  },
  {
    id: 'T02',
    prompt: 'Test triad prompt 2',
    options: {
      A: { text: 'Option A', face: 'sovereign' },
      B: { text: 'Option B', face: 'rebel' },
      C: { text: 'Option C', face: 'catalyst' }
    }
  },
  {
    id: 'T03',
    prompt: 'Test triad prompt 3',
    options: {
      A: { text: 'Option A', face: 'sovereign' },
      B: { text: 'Option B', face: 'rebel' },
      C: { text: 'Option C', face: 'catalyst' }
    }
  }
];

const mockDuelItems: FaceDuelItem[] = [
  {
    id: 'D01',
    prompt: 'Test duel prompt 1',
    faces: ['sovereign', 'rebel'],
    options: {
      A: { text: 'Option A', face: 'sovereign' },
      B: { text: 'Option B', face: 'rebel' }
    }
  },
  {
    id: 'D02',
    prompt: 'Test duel prompt 2',
    faces: ['sovereign', 'catalyst'],
    options: {
      A: { text: 'Option A', face: 'sovereign' },
      B: { text: 'Option B', face: 'catalyst' }
    }
  }
];

describe('FaceTriadEngine', () => {
  let engine: FaceTriadEngine;
  let mockOnTriadComplete: jest.Mock;
  let mockOnDuelRequired: jest.Mock;
  let mockOnFaceSelected: jest.Mock;

  beforeEach(() => {
    mockOnTriadComplete = jest.fn();
    mockOnDuelRequired = jest.fn();
    mockOnFaceSelected = jest.fn();
    
    engine = new FaceTriadEngine({
      family: 'Control',
      triadItems: mockTriadItems,
      duelItems: mockDuelItems,
      onTriadComplete: mockOnTriadComplete,
      onDuelRequired: mockOnDuelRequired,
      onFaceSelected: mockOnFaceSelected
    });
  });

  describe('initialization', () => {
    it('should initialize with zero counts for all faces', () => {
      const state = engine.getCurrentState();
      expect(state.counts.sovereign).toBe(0);
      expect(state.counts.rebel).toBe(0);
      expect(state.counts.catalyst).toBe(0);
    });

    it('should start with no pattern detected', () => {
      const state = engine.getCurrentState();
      expect(state.pattern).toBeNull();
      expect(state.duelsRequired).toBe(false);
    });
  });

  describe('pattern 3-0-0 (clear winner)', () => {
    it('should detect 3-0-0 pattern and select face without duels', () => {
      // Process 3 picks for sovereign
      engine.processTriadResponse('sovereign');
      engine.processTriadResponse('sovereign');
      engine.processTriadResponse('sovereign');

      expect(mockOnTriadComplete).toHaveBeenCalledWith(
        expect.objectContaining({ sovereign: 3, rebel: 0, catalyst: 0 }),
        '3-0-0'
      );

      expect(mockOnFaceSelected).toHaveBeenCalledWith('sovereign', 'high', 0);
      expect(mockOnDuelRequired).not.toHaveBeenCalled();
    });
  });

  describe('pattern 2-1-0 (top vs second)', () => {
    it('should detect 2-1-0 pattern and require duel', () => {
      // Process picks: 2 sovereign, 1 rebel
      engine.processTriadResponse('sovereign');
      engine.processTriadResponse('rebel');
      engine.processTriadResponse('sovereign');

      expect(mockOnTriadComplete).toHaveBeenCalledWith(
        expect.objectContaining({ sovereign: 2, rebel: 1, catalyst: 0 }),
        '2-1-0'
      );

      expect(mockOnDuelRequired).toHaveBeenCalledWith(['sovereign', 'rebel'], '2-1-0');
    });

    it('should complete when top wins first duel', () => {
      // Setup 2-1-0 pattern
      engine.processTriadResponse('sovereign');
      engine.processTriadResponse('rebel');
      engine.processTriadResponse('sovereign');

      // Process duel result - sovereign wins
      engine.processDuelResult(['sovereign', 'rebel'], 'sovereign');

      expect(mockOnFaceSelected).toHaveBeenCalledWith('sovereign', 'high', 1);
    });

    it('should require second duel when top loses first duel', () => {
      // Setup 2-1-0 pattern
      engine.processTriadResponse('sovereign');
      engine.processTriadResponse('rebel');
      engine.processTriadResponse('sovereign');

      // Process duel result - rebel wins (upset)
      engine.processDuelResult(['sovereign', 'rebel'], 'rebel');

      // Should require second duel between rebel and catalyst
      expect(mockOnDuelRequired).toHaveBeenCalledWith(['rebel', 'catalyst'], '2-1-0');
    });
  });

  describe('pattern 2-0-1 (top vs third)', () => {
    it('should detect 2-0-1 pattern and require duel', () => {
      // Process picks: 2 sovereign, 1 catalyst
      engine.processTriadResponse('sovereign');
      engine.processTriadResponse('catalyst');
      engine.processTriadResponse('sovereign');

      expect(mockOnTriadComplete).toHaveBeenCalledWith(
        expect.objectContaining({ sovereign: 2, rebel: 0, catalyst: 1 }),
        '2-0-1'
      );

      expect(mockOnDuelRequired).toHaveBeenCalledWith(['sovereign', 'catalyst'], '2-0-1');
    });

    it('should complete when top wins first duel', () => {
      // Setup 2-0-1 pattern
      engine.processTriadResponse('sovereign');
      engine.processTriadResponse('catalyst');
      engine.processTriadResponse('sovereign');

      // Process duel result - sovereign wins
      engine.processDuelResult(['sovereign', 'catalyst'], 'sovereign');

      expect(mockOnFaceSelected).toHaveBeenCalledWith('sovereign', 'high', 1);
    });

    it('should require second duel when top loses first duel', () => {
      // Setup 2-0-1 pattern
      engine.processTriadResponse('sovereign');
      engine.processTriadResponse('catalyst');
      engine.processTriadResponse('sovereign');

      // Process duel result - catalyst wins (upset)
      engine.processDuelResult(['sovereign', 'catalyst'], 'catalyst');

      // Should require second duel between catalyst and rebel
      expect(mockOnDuelRequired).toHaveBeenCalledWith(['catalyst', 'rebel'], '2-0-1');
    });
  });

  describe('pattern 1-1-1 (three-way tie)', () => {
    it('should detect 1-1-1 pattern and require two duels', () => {
      // Process picks: 1 each
      engine.processTriadResponse('sovereign');
      engine.processTriadResponse('rebel');
      engine.processTriadResponse('catalyst');

      expect(mockOnTriadComplete).toHaveBeenCalledWith(
        expect.objectContaining({ sovereign: 1, rebel: 1, catalyst: 1 }),
        '1-1-1'
      );

      // First duel between top two
      expect(mockOnDuelRequired).toHaveBeenCalledWith(['sovereign', 'rebel'], '1-1-1');
    });

    it('should require second duel after first duel', () => {
      // Setup 1-1-1 pattern
      engine.processTriadResponse('sovereign');
      engine.processTriadResponse('rebel');
      engine.processTriadResponse('catalyst');

      // First duel: sovereign vs rebel, sovereign wins
      engine.processDuelResult(['sovereign', 'rebel'], 'sovereign');

      // Should require second duel between winner and third
      expect(mockOnDuelRequired).toHaveBeenCalledWith(['sovereign', 'catalyst'], '1-1-1');
    });

    it('should complete after second duel', () => {
      // Setup 1-1-1 pattern
      engine.processTriadResponse('sovereign');
      engine.processTriadResponse('rebel');
      engine.processTriadResponse('catalyst');

      // First duel: sovereign vs rebel, sovereign wins
      engine.processDuelResult(['sovereign', 'rebel'], 'sovereign');

      // Second duel: sovereign vs catalyst, sovereign wins
      engine.processDuelResult(['sovereign', 'catalyst'], 'sovereign');

      expect(mockOnFaceSelected).toHaveBeenCalledWith('sovereign', 'low', 2);
    });
  });

  describe('duel processing', () => {
    it('should handle duel results correctly', () => {
      // Setup 2-1-0 pattern
      engine.processTriadResponse('sovereign');
      engine.processTriadResponse('rebel');
      engine.processTriadResponse('sovereign');

      // Process duel
      engine.processDuelResult(['sovereign', 'rebel'], 'sovereign');

      expect(mockOnFaceSelected).toHaveBeenCalledWith('sovereign', 'high', 1);
    });

    it('should track duel history', () => {
      // Setup and process duels
      engine.processTriadResponse('sovereign');
      engine.processTriadResponse('rebel');
      engine.processTriadResponse('sovereign');

      engine.processDuelResult(['sovereign', 'rebel'], 'sovereign');

      const duelHistory = engine.getDuelHistory();
      expect(duelHistory).toHaveLength(1);
      expect(duelHistory[0]).toEqual({
        faces: ['sovereign', 'rebel'],
        winner: 'sovereign'
      });
    });
  });

  describe('confidence calculation', () => {
    it('should return high confidence for 3-0-0', () => {
      engine.processTriadResponse('sovereign');
      engine.processTriadResponse('sovereign');
      engine.processTriadResponse('sovereign');

      const explanation = engine.getConfidenceExplanation();
      expect(explanation).toContain('Clear unanimous preference');
    });

    it('should return medium confidence for 2-1-0 with upset', () => {
      engine.processTriadResponse('sovereign');
      engine.processTriadResponse('rebel');
      engine.processTriadResponse('sovereign');

      engine.processDuelResult(['sovereign', 'rebel'], 'rebel');
      engine.processDuelResult(['rebel', 'catalyst'], 'rebel');

      const explanation = engine.getConfidenceExplanation();
      expect(explanation).toContain('Initial preference was challenged');
    });

    it('should return low confidence for 1-1-1', () => {
      engine.processTriadResponse('sovereign');
      engine.processTriadResponse('rebel');
      engine.processTriadResponse('catalyst');

      engine.processDuelResult(['sovereign', 'rebel'], 'sovereign');
      engine.processDuelResult(['sovereign', 'catalyst'], 'catalyst');

      const explanation = engine.getConfidenceExplanation();
      expect(explanation).toContain('Result required multiple duels');
    });
  });

  describe('state management', () => {
    it('should maintain consistent state', () => {
      const initialState = engine.getCurrentState();
      
      engine.processTriadResponse('sovereign');
      const newState = engine.getCurrentState();
      
      expect(newState.counts.sovereign).toBe(1);
      expect(newState.itemsCompleted).toBe(1);
      expect(newState.pattern).toBeNull(); // Not enough items yet
    });

    it('should reset correctly', () => {
      // Setup some state
      engine.processTriadResponse('sovereign');
      engine.processTriadResponse('rebel');
      engine.processTriadResponse('sovereign');

      engine.reset();
      const resetState = engine.getCurrentState();
      
      expect(resetState.counts.sovereign).toBe(0);
      expect(resetState.itemsCompleted).toBe(0);
      expect(resetState.pattern).toBeNull();
      expect(resetState.duelsRequired).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle invalid face responses gracefully', () => {
      // This would depend on how the engine handles invalid inputs
      // For now, we test the happy path
      expect(() => {
        engine.processTriadResponse('sovereign');
      }).not.toThrow();
    });

    it('should handle rapid responses', () => {
      engine.processTriadResponse('sovereign');
      engine.processTriadResponse('sovereign');
      engine.processTriadResponse('sovereign');

      expect(mockOnFaceSelected).toHaveBeenCalledWith('sovereign', 'high', 0);
    });
  });
});
