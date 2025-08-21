import { computeABC, distanceFromCounts, applyTieBreaker, hasVariance, calculateDriftPercentage } from '../core/reducer';

describe('Reducer - Core Logic', () => {
  describe('computeABC function', () => {
    test('counts CLOSE tokens as A', () => {
      expect(computeABC(['CLOSE', 'CLOSE', 'CLOSE'])).toEqual({ A: 3, B: 0, C: 0 });
    });

    test('counts STALL tokens as B', () => {
      expect(computeABC(['STALL', 'STALL', 'STALL'])).toEqual({ A: 0, B: 3, C: 0 });
    });

    test('counts FRAG tokens as C', () => {
      expect(computeABC(['FRAG', 'FRAG', 'FRAG'])).toEqual({ A: 0, B: 0, C: 3 });
    });

    test('counts mixed tokens correctly', () => {
      expect(computeABC(['CLOSE', 'STALL', 'FRAG'])).toEqual({ A: 1, B: 1, C: 1 });
    });

    test('handles empty array', () => {
      expect(computeABC([])).toEqual({ A: 0, B: 0, C: 0 });
    });
  });

  describe('distanceFromCounts function', () => {
    test('returns Close when A > B and A > C', () => {
      expect(distanceFromCounts(3, 0, 0)).toBe('Close');
      expect(distanceFromCounts(2, 1, 0)).toBe('Close');
    });

    test('returns Offset when B >= A and B >= C', () => {
      expect(distanceFromCounts(0, 3, 0)).toBe('Offset');
      expect(distanceFromCounts(1, 2, 0)).toBe('Offset');
      expect(distanceFromCounts(1, 1, 0)).toBe('Offset');
    });

    test('returns Far when C > A and C > B', () => {
      expect(distanceFromCounts(0, 0, 3)).toBe('Far');
      expect(distanceFromCounts(1, 0, 2)).toBe('Far');
    });

    test('handles ties correctly', () => {
      expect(distanceFromCounts(1, 1, 1)).toBe('Offset'); // B >= A, B >= C
      expect(distanceFromCounts(2, 2, 1)).toBe('Close');  // A > B, A > C
    });
  });

  describe('applyTieBreaker function', () => {
    test('adds tiebreaker picks to base counts', () => {
      const baseCounts = { A: 1, B: 2, C: 0 };
      const tbPicks = ['CLOSE', 'STALL'];
      
      const result = applyTieBreaker(baseCounts, tbPicks);
      
      expect(result.finalCounts).toEqual({ A: 2, B: 3, C: 0 });
      expect(result.distance).toBe('Offset'); // B >= A, B >= C
    });

    test('enforces 2 question limit', () => {
      const baseCounts = { A: 1, B: 1, C: 1 };
      const tbPicks = ['CLOSE', 'STALL', 'FRAG']; // 3 picks - should throw
      
      expect(() => applyTieBreaker(baseCounts, tbPicks)).toThrow('Tiebreaker cannot exceed 2 questions');
    });

    test('handles empty tiebreaker picks', () => {
      const baseCounts = { A: 2, B: 1, C: 0 };
      const tbPicks: string[] = [];
      
      const result = applyTieBreaker(baseCounts, tbPicks);
      
      expect(result.finalCounts).toEqual({ A: 2, B: 1, C: 0 });
      expect(result.distance).toBe('Close'); // A > B, A > C
    });
  });

  describe('hasVariance function', () => {
    test('returns true when both CLOSE and FRAG present', () => {
      expect(hasVariance(['CLOSE', 'STALL', 'FRAG'])).toBe(true);
      expect(hasVariance(['CLOSE', 'FRAG'])).toBe(true);
    });

    test('returns false when only CLOSE present', () => {
      expect(hasVariance(['CLOSE', 'CLOSE', 'STALL'])).toBe(false);
    });

    test('returns false when only FRAG present', () => {
      expect(hasVariance(['STALL', 'FRAG', 'FRAG'])).toBe(false);
    });

    test('returns false when neither CLOSE nor FRAG present', () => {
      expect(hasVariance(['STALL', 'STALL', 'STALL'])).toBe(false);
    });
  });

  describe('calculateDriftPercentage function', () => {
    test('returns undefined when A > 0 in base', () => {
      const baseCounts = { A: 1, B: 1, C: 1 };
      const finalCounts = { A: 2, B: 2, C: 1 };
      
      expect(calculateDriftPercentage(baseCounts, finalCounts)).toBeUndefined();
    });

    test('calculates drift when A = 0 in base', () => {
      const baseCounts = { A: 0, B: 1, C: 2 };
      const finalCounts = { A: 0, B: 2, C: 3 };
      
      // B dominates: 2/(2+3) * 100 = 40%
      expect(calculateDriftPercentage(baseCounts, finalCounts)).toBe(60); // C dominates
    });

    test('handles edge case when B + C = 0', () => {
      const baseCounts = { A: 0, B: 0, C: 0 };
      const finalCounts = { A: 0, B: 0, C: 0 };
      
      expect(calculateDriftPercentage(baseCounts, finalCounts)).toBe(0);
    });
  });
});
