import { decideTB, decideTieBreaker, fallbackDistance } from '../core/pointsMap';

describe('PointsMap - TieBreaker Decision Logic', () => {
  describe('decideTB function', () => {
    test('120 pattern ALWAYS triggers integrity_check TB', () => {
      expect(decideTB(1, 2, 0)).toBe('integrity_check');
    });

    test('210 pattern triggers integrity_check TB', () => {
      expect(decideTB(2, 1, 0)).toBe('integrity_check');
    });

    test('201 pattern triggers integrity_check TB', () => {
      expect(decideTB(2, 0, 1)).toBe('integrity_check');
    });

    test('102 pattern triggers integrity_check TB', () => {
      expect(decideTB(1, 0, 2)).toBe('integrity_check');
    });

    test('012 pattern triggers direction_lock TB', () => {
      expect(decideTB(0, 1, 2)).toBe('direction_lock');
    });

    test('021 pattern triggers direction_lock TB', () => {
      expect(decideTB(0, 2, 1)).toBe('direction_lock');
    });

    test('111 pattern triggers standard_tiebreak TB', () => {
      expect(decideTB(1, 1, 1)).toBe('standard_tiebreak');
    });

    test('300 pattern needs no TB', () => {
      expect(decideTB(3, 0, 0)).toBe(null);
    });

    test('030 pattern needs no TB', () => {
      expect(decideTB(0, 3, 0)).toBe(null);
    });

    test('003 pattern needs no TB', () => {
      expect(decideTB(0, 0, 3)).toBe(null);
    });
  });

  describe('decideTieBreaker function', () => {
    test('120 pattern triggers integrity_check TB', () => {
      const result = decideTieBreaker({ A: 1, B: 2, C: 0 });
      expect(result.needsTieBreaker).toBe(true);
      expect(result.type).toBe('integrity_check');
    });

    test('210 pattern triggers integrity_check TB', () => {
      const result = decideTieBreaker({ A: 2, B: 1, C: 0 });
      expect(result.needsTieBreaker).toBe(true);
      expect(result.type).toBe('integrity_check');
    });

    test('012 pattern triggers direction_lock TB', () => {
      const result = decideTieBreaker({ A: 0, B: 1, C: 2 });
      expect(result.needsTieBreaker).toBe(true);
      expect(result.type).toBe('direction_lock');
    });

    test('111 pattern triggers standard_tiebreak TB', () => {
      const result = decideTieBreaker({ A: 1, B: 1, C: 1 });
      expect(result.needsTieBreaker).toBe(true);
      expect(result.type).toBe('standard_tiebreak');
    });

    test('300 pattern needs no TB', () => {
      const result = decideTieBreaker({ A: 3, B: 0, C: 0 });
      expect(result.needsTieBreaker).toBe(false);
    });
  });

  describe('fallbackDistance function', () => {
    test('prefers C when C >= 2', () => {
      expect(fallbackDistance(0, 1, 2)).toBe('Far');
      expect(fallbackDistance(1, 0, 2)).toBe('Far');
    });

    test('prefers A when A >= 2 and C < 2', () => {
      expect(fallbackDistance(2, 1, 0)).toBe('Close');
      expect(fallbackDistance(2, 0, 1)).toBe('Close');
    });

    test('defaults to Offset when neither A nor C >= 2', () => {
      expect(fallbackDistance(1, 2, 1)).toBe('Offset');
      expect(fallbackDistance(0, 2, 1)).toBe('Offset');
    });
  });
});
