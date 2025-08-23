import { LineRunnerV2 } from '../LineRunnerV2';
import type { Line } from '@/lib/types';

// Mock data
const mockLineItems = [
  {
    id: 'L01',
    prompt: 'Test line prompt 1',
    line: 'Control' as Line,
    token_map: { A: 'C', B: 'O', C: 'F' }
  },
  {
    id: 'L02',
    prompt: 'Test line prompt 2',
    line: 'Control' as Line,
    token_map: { A: 'C', B: 'O', C: 'F' }
  }
];

const mockDuelItems = [
  {
    id: 'D01',
    prompt: 'Test duel prompt',
    line: 'Control' as Line,
    options: {
      A: { text: 'Option A', token: 'C' },
      B: { text: 'Option B', token: 'O' }
    }
  }
];

describe('LineRunnerV2', () => {
  let runner: LineRunnerV2;
  let mockOnItemComplete: jest.Mock;
  let mockOnLineComplete: jest.Mock;
  let mockOnDuelRequired: jest.Mock;

  beforeEach(() => {
    mockOnItemComplete = jest.fn();
    mockOnLineComplete = jest.fn();
    mockOnDuelRequired = jest.fn();
    
    runner = new LineRunnerV2({
      line: 'Control',
      items: mockLineItems,
      duelItems: mockDuelItems,
      onItemComplete: mockOnItemComplete,
      onLineComplete: mockOnLineComplete,
      onDuelRequired: mockOnDuelRequired
    });
  });

  describe('initialization', () => {
    it('should initialize with correct state', () => {
      const state = runner.getCurrentState();
      expect(state.currentItemIndex).toBe(0);
      expect(state.itemResponses).toHaveLength(0);
      expect(state.isComplete).toBe(false);
      expect(state.needsDuel).toBe(false);
    });

    it('should return first item initially', () => {
      const item = runner.getCurrentItem();
      expect(item).toBe(mockLineItems[0]);
    });
  });

  describe('item processing', () => {
    it('should process item response correctly', () => {
      runner.processItemResponse('A');
      
      expect(mockOnItemComplete).toHaveBeenCalledWith(mockLineItems[0], 'C', 0);
      expect(runner.getCurrentState().currentItemIndex).toBe(1);
    });

    it('should move to next item after response', () => {
      runner.processItemResponse('A');
      
      const item = runner.getCurrentItem();
      expect(item).toBe(mockLineItems[1]);
    });

    it('should complete line after all items', () => {
      runner.processItemResponse('A'); // First item
      runner.processItemResponse('B'); // Second item
      
      expect(mockOnLineComplete).toHaveBeenCalled();
      expect(runner.getCurrentState().isComplete).toBe(true);
    });
  });

  describe('duel detection', () => {
    it('should detect need for duel when responses disagree', () => {
      runner.processItemResponse('A'); // C token
      runner.processItemResponse('B'); // O token - different from C
      
      expect(mockOnDuelRequired).toHaveBeenCalledWith('Control', [
        { token: 'C', severity: 0 },
        { token: 'O', severity: 1 }
      ]);
      expect(runner.getCurrentState().needsDuel).toBe(true);
    });

    it('should not require duel when responses agree', () => {
      runner.processItemResponse('A'); // C token
      runner.processItemResponse('A'); // C token - same as first
      
      expect(mockOnDuelRequired).not.toHaveBeenCalled();
      expect(mockOnLineComplete).toHaveBeenCalled();
    });
  });

  describe('duel resolution', () => {
    it('should complete line after duel result', () => {
      // Setup duel requirement
      runner.processItemResponse('A'); // C token
      runner.processItemResponse('B'); // O token
      
      // Process duel result
      runner.processDuelResult('C');
      
      expect(mockOnLineComplete).toHaveBeenCalled();
      expect(runner.getCurrentState().isComplete).toBe(true);
      expect(runner.getCurrentState().needsDuel).toBe(false);
    });

    it('should generate correct verdict after duel', () => {
      runner.processItemResponse('A'); // C token
      runner.processItemResponse('B'); // O token
      
      runner.processDuelResult('F');
      
      const finalCall = mockOnLineComplete.mock.calls[0][0];
      expect(finalCall.token).toBe('F');
      expect(finalCall.severity).toBe(2);
      expect(finalCall.note).toContain('Break');
    });
  });

  describe('line skipping', () => {
    it('should skip line with correct reason', () => {
      runner.skipLine('Family line assumption');
      
      expect(mockOnLineComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'C',
          severity: 0,
          note: expect.stringContaining('Family line assumption')
        })
      );
      expect(runner.getCurrentState().isComplete).toBe(true);
    });

    it('should use default reason when none provided', () => {
      runner.skipLine();
      
      expect(mockOnLineComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          note: expect.stringContaining('Family line assumed stable')
        })
      );
    });
  });

  describe('progress tracking', () => {
    it('should calculate progress correctly', () => {
      expect(runner.getProgress()).toBe(0); // 0/2 = 0%
      
      runner.processItemResponse('A');
      expect(runner.getProgress()).toBe(50); // 1/2 = 50%
      
      runner.processItemResponse('B');
      expect(runner.getProgress()).toBe(100); // 2/2 = 100%
    });

    it('should handle edge cases in progress calculation', () => {
      const emptyRunner = new LineRunnerV2({
        line: 'Control',
        items: [],
        duelItems: [],
        onItemComplete: mockOnItemComplete,
        onLineComplete: mockOnLineComplete,
        onDuelRequired: mockOnDuelRequired
      });
      
      expect(emptyRunner.getProgress()).toBe(0);
    });
  });

  describe('state management', () => {
    it('should maintain consistent state', () => {
      const initialState = runner.getCurrentState();
      
      runner.processItemResponse('A');
      const newState = runner.getCurrentState();
      
      expect(newState.currentItemIndex).toBe(1);
      expect(newState.itemResponses).toHaveLength(1);
      expect(newState.itemResponses[0]).toEqual({ token: 'C', severity: 0 });
    });

    it('should reset correctly', () => {
      runner.processItemResponse('A');
      runner.reset();
      
      const resetState = runner.getCurrentState();
      expect(resetState.currentItemIndex).toBe(0);
      expect(resetState.itemResponses).toHaveLength(0);
      expect(resetState.isComplete).toBe(false);
    });
  });

  describe('performance metrics', () => {
    it('should generate performance metrics', () => {
      runner.processItemResponse('A');
      runner.processItemResponse('B');
      
      const metrics = runner.getPerformanceMetrics();
      
      expect(metrics.itemsProcessed).toBe(2);
      expect(metrics.duelsRequired).toBe(1);
      expect(metrics.tokenDistribution).toEqual({ C: 1, O: 1, F: 0 });
      expect(metrics.confidence).toBe('medium');
    });

    it('should calculate confidence levels correctly', () => {
      // High confidence - all responses agree
      runner.processItemResponse('A');
      runner.processItemResponse('A');
      
      const metrics = runner.getPerformanceMetrics();
      expect(metrics.confidence).toBe('high');
    });
  });

  describe('legacy compatibility', () => {
    it('should convert to legacy format', () => {
      runner.processItemResponse('A');
      runner.processItemResponse('A');
      
      const legacyFormat = runner.toLegacyFormat();
      
      expect(legacyFormat.line).toBe('Control');
      expect(legacyFormat.distance).toBe('Close');
      expect(legacyFormat.counts.base.A).toBe(2);
      expect(legacyFormat.variance).toBe(false);
    });

    it('should throw error when converting incomplete line', () => {
      expect(() => {
        runner.toLegacyFormat();
      }).toThrow('Cannot convert incomplete line to legacy format');
    });
  });

  describe('edge cases', () => {
    it('should handle single item lines', () => {
      const singleItemRunner = new LineRunnerV2({
        line: 'Control',
        items: [mockLineItems[0]],
        duelItems: [],
        onItemComplete: mockOnItemComplete,
        onLineComplete: mockOnLineComplete,
        onDuelRequired: mockOnDuelRequired
      });
      
      singleItemRunner.processItemResponse('A');
      
      expect(mockOnLineComplete).toHaveBeenCalled();
      expect(singleItemRunner.getCurrentState().isComplete).toBe(true);
    });

    it('should handle empty item lists', () => {
      const emptyRunner = new LineRunnerV2({
        line: 'Control',
        items: [],
        duelItems: [],
        onItemComplete: mockOnItemComplete,
        onLineComplete: mockOnLineComplete,
        onDuelRequired: mockOnDuelRequired
      });
      
      expect(emptyRunner.getCurrentItem()).toBeNull();
    });
  });

  describe('export functionality', () => {
    it('should export complete state', () => {
      runner.processItemResponse('A');
      runner.processItemResponse('B');
      
      const exportedState = runner.exportState();
      
      expect(exportedState.line).toBe('Control');
      expect(exportedState.state.isComplete).toBe(true);
      expect(exportedState.responses).toHaveLength(2);
      expect(exportedState.finalVerdict).toBeDefined();
    });
  });
});
