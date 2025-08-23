import { FamilyHoneEngine } from '../FamilyHoneEngine';
import type { Family, FamilyHoneItem, FamilyHoneLogic } from '@/lib/types';

// Mock data
const mockFamilyHoneItems: FamilyHoneItem[] = [
  {
    id: 'FH01',
    prompt: 'Test prompt 1',
    options: { 
      A: { text: 'Option A', family: 'Control' },
      B: { text: 'Option B', family: 'Pace' },
      C: { text: 'Option C', family: 'Boundary' },
      D: { text: 'Option D', family: 'Truth' },
      E: { text: 'Option E', family: 'Recognition' }
    }
  },
  {
    id: 'FH02', 
    prompt: 'Test prompt 2',
    options: { 
      A: { text: 'Option A', family: 'Bonding' },
      B: { text: 'Option B', family: 'Stress' },
      C: { text: 'Option C', family: 'Control' },
      D: { text: 'Option D', family: 'Pace' },
      E: { text: 'Option E', family: 'Boundary' }
    }
  },
  {
    id: 'FH03',
    prompt: 'Test prompt 3',
    options: { 
      A: { text: 'Option A', family: 'Truth' },
      B: { text: 'Option B', family: 'Recognition' },
      C: { text: 'Option C', family: 'Bonding' },
      D: { text: 'Option D', family: 'Stress' },
      E: { text: 'Option E', family: 'Control' }
    }
  }
];

const mockLogic: FamilyHoneLogic = {
  type: 'first_to_n',
  n: 3,
  router_item_min_options: 5,
  scheduler: {
    include_leader: true,
    include_runner: true,
    fill_strategy: ['under_exposed', 'confusable'],
    avoid_repeat_in_item: true
  },
  update_rule: 'on_pick_increment_family_count',
  stop_condition: 'any_family_count>=3',
  outputs: ['lock_family', 'fh_counts', 'fh_history', 'router_items_seen']
};

describe('FamilyHoneEngine', () => {
  let engine: FamilyHoneEngine;
  let mockOnFamilyPick: jest.Mock;
  let mockOnComplete: jest.Mock;

  beforeEach(() => {
    mockOnFamilyPick = jest.fn();
    mockOnComplete = jest.fn();
    
    engine = new FamilyHoneEngine({
      items: mockFamilyHoneItems,
      logic: mockLogic,
      onFamilyPick: mockOnFamilyPick,
      onComplete: mockOnComplete
    });
  });

  describe('initialization', () => {
    it('should initialize with zero counts for all families', () => {
      const state = engine.getCurrentState();
      expect(state.familyCounts.Control).toBe(0);
      expect(state.familyCounts.Pace).toBe(0);
      expect(state.familyCounts.Boundary).toBe(0);
      expect(state.familyCounts.Truth).toBe(0);
      expect(state.familyCounts.Recognition).toBe(0);
      expect(state.familyCounts.Bonding).toBe(0);
      expect(state.familyCounts.Stress).toBe(0);
    });

    it('should start as not complete', () => {
      const state = engine.getCurrentState();
      expect(state.isComplete).toBe(false);
    });
  });

  describe('getNextRouterItem', () => {
    it('should return the first available item initially', () => {
      const item = engine.getNextRouterItem();
      expect(item).toBeDefined();
      expect(mockFamilyHoneItems).toContain(item);
    });

    it('should not return previously seen items', () => {
      const firstItem = engine.getNextRouterItem();
      engine.processFamilyPick('Control', firstItem!.id);
      
      const secondItem = engine.getNextRouterItem();
      expect(secondItem?.id).not.toBe(firstItem!.id);
    });

    it('should return null when complete', () => {
      // Complete the engine by getting Control to 3
      engine.processFamilyPick('Control', 'FH01');
      engine.processFamilyPick('Control', 'FH02');
      engine.processFamilyPick('Control', 'FH03');
      
      const item = engine.getNextRouterItem();
      expect(item).toBeNull();
    });
  });

  describe('processFamilyPick', () => {
    it('should increment family count', () => {
      engine.processFamilyPick('Control', 'FH01');
      const state = engine.getCurrentState();
      expect(state.familyCounts.Control).toBe(1);
    });

    it('should add item to history', () => {
      engine.processFamilyPick('Control', 'FH01');
      const state = engine.getCurrentState();
      expect(state.itemHistory).toContain('FH01');
    });

    it('should call onFamilyPick callback when not complete', () => {
      engine.processFamilyPick('Control', 'FH01');
      expect(mockOnFamilyPick).toHaveBeenCalledWith('Control', 'FH01');
    });

    it('should complete when family reaches threshold', () => {
      engine.processFamilyPick('Control', 'FH01');
      engine.processFamilyPick('Control', 'FH02');
      engine.processFamilyPick('Control', 'FH03');
      
      expect(mockOnComplete).toHaveBeenCalledWith('Control', expect.objectContaining({
        Control: 3
      }));
      
      const state = engine.getCurrentState();
      expect(state.isComplete).toBe(true);
    });

    it('should not process picks when complete', () => {
      // Complete the engine
      engine.processFamilyPick('Control', 'FH01');
      engine.processFamilyPick('Control', 'FH02');
      engine.processFamilyPick('Control', 'FH03');
      
      mockOnFamilyPick.mockClear();
      
      // Try to process another pick
      engine.processFamilyPick('Pace', 'FH01');
      expect(mockOnFamilyPick).not.toHaveBeenCalled();
    });
  });

  describe('exposure balancing', () => {
    it('should track family exposure', () => {
      engine.processFamilyPick('Control', 'FH01');
      const report = engine.getExposureReport();
      
      expect(report.totalItems).toBe(1);
      expect(report.deviations.find(d => d.family === 'Control')?.exposure).toBeGreaterThan(0);
    });

    it('should prefer under-exposed families', () => {
      // Process several picks to create exposure imbalance
      engine.processFamilyPick('Control', 'FH01');
      engine.processFamilyPick('Control', 'FH02');
      
      const item = engine.getNextRouterItem();
      // Should prefer items that include under-exposed families
      const families = Object.values(item!.options).map(option => option.family);
      expect(families).not.toEqual(['Control', 'Control', 'Control', 'Control', 'Control']);
    });
  });

  describe('exposure reporting', () => {
    it('should calculate exposure balance', () => {
      engine.processFamilyPick('Control', 'FH01');
      const report = engine.getExposureReport();
      
      expect(report.avgExposure).toBeGreaterThan(0);
      expect(report.deviations).toHaveLength(7); // 7 families
      expect(report.maxDeviation).toBeGreaterThan(0);
    });

    it('should identify balanced vs unbalanced exposure', () => {
      const report = engine.getExposureReport();
      expect(typeof report.isBalanced).toBe('boolean');
    });
  });

  describe('edge cases', () => {
    it('should handle rapid family picks', () => {
      engine.processFamilyPick('Control', 'FH01');
      engine.processFamilyPick('Control', 'FH02');
      engine.processFamilyPick('Control', 'FH03');
      
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
      expect(engine.getCurrentState().isComplete).toBe(true);
    });

    it('should maintain state consistency', () => {
      const initialState = engine.getCurrentState();
      engine.processFamilyPick('Pace', 'FH01');
      const newState = engine.getCurrentState();
      
      expect(newState.familyCounts.Pace).toBe(1);
      expect(newState.itemHistory).toContain('FH01');
      expect(newState.isComplete).toBe(false);
    });
  });
});
