import type { QuizBankV2, Family, Face, FamilyHoneItem, FaceTriadItem, FaceDuelItem, LineItemV2 } from './types';

/**
 * Quiz Bank V2.7 Loader
 * Handles loading and validation of the new quiz bank format
 */
export class QuizBankV2Loader {
  private quizBank: QuizBankV2 | null = null;
  private familyHoneItems: FamilyHoneItem[] = [];
  private faceTriadItems: Record<Family, FaceTriadItem[]> = {} as Record<Family, FaceTriadItem[]>;
  private faceDuelItems: Record<Family, FaceDuelItem[]> = {} as Record<Family, FaceDuelItem[]>;
  private lineItems: LineItemV2[] = [];
  private faceTruthLines: Record<Face, string> = {} as Record<Face, string>;
  private lineNoteTemplates: Record<'C' | 'O' | 'F', string> = {} as Record<'C' | 'O' | 'F', string>;

  /**
   * Load quiz bank from JSON data
   */
  async loadQuizBank(data: any): Promise<QuizBankV2> {
    try {
      // Validate basic structure
      if (!data.version || !data.families || !data.family_hone_items) {
        throw new Error('Invalid quiz bank structure');
      }

      // Validate families
      const expectedFamilies: Family[] = ['Control', 'Pace', 'Boundary', 'Truth', 'Recognition', 'Bonding', 'Stress'];
      const providedFamilies = data.families as Family[];
      
      if (!expectedFamilies.every(f => providedFamilies.includes(f))) {
        throw new Error('Missing required families');
      }

      // Validate faces by family
      if (!data.faces_by_family) {
        throw new Error('Missing faces_by_family mapping');
      }

      // Store the validated quiz bank
      this.quizBank = data as QuizBankV2;
      
      // Initialize internal structures
      this.initializeStructures();
      
      return this.quizBank;
    } catch (error) {
      console.error('Failed to load quiz bank v2.7:', error);
      throw error;
    }
  }

  /**
   * Initialize internal data structures
   */
  private initializeStructures(): void {
    if (!this.quizBank) return;

    this.familyHoneItems = this.quizBank.family_hone_items || [];
    this.faceTriadItems = this.quizBank.face_triad_items || {};
    this.faceDuelItems = this.quizBank.face_duel_items || {} as Record<Family, FaceDuelItem[]>;
    this.lineItems = this.quizBank.line_items || [];
    this.faceTruthLines = this.quizBank.face_truth_lines || {};
    this.lineNoteTemplates = this.quizBank.line_note_templates || {
      'C': 'Stable: the move lands cleanly without extra passes.',
      'O': 'Offset: hesitation/softening adds latency here.',
      'F': 'Break: pattern derails or reverses motion under pressure.'
    };
  }

  /**
   * Get family hone items with exposure balancing
   */
  getFamilyHoneItems(currentCounts: Record<Family, number>): FamilyHoneItem[] {
    if (!this.quizBank) return [];

    // Sort families by count (descending)
    const sortedFamilies = Object.entries(currentCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([family]) => family as Family);

    // Get leader and runner-up
    const leader = sortedFamilies[0];
    const runner = sortedFamilies[1];

    // Filter items to include leader and runner-up
    const balancedItems = this.familyHoneItems.filter(item => {
      const itemFamilies = Object.values(item.options).map(opt => opt.family);
      return itemFamilies.includes(leader) || itemFamilies.includes(runner);
    });

    // If we don't have enough items, include all
    if (balancedItems.length < 3) {
      return this.familyHoneItems;
    }

    return balancedItems;
  }

  /**
   * Get face triad items for a specific family
   */
  getFaceTriadItems(family: Family): FaceTriadItem[] {
    return this.faceTriadItems[family] || [];
  }

  /**
   * Get face duel items for a specific family
   */
  getFaceDuelItems(family: Family): FaceDuelItem[] {
    return this.faceDuelItems[family] || [];
  }

  /**
   * Get line items for a specific line
   */
  getLineItems(line: string): LineItemV2[] {
    return this.lineItems.filter(item => item.line === line);
  }

  /**
   * Get truth line for a specific face
   */
  getTruthLine(face: Face): string {
    return this.faceTruthLines[face] || 'Truth emerges through action.';
  }

  /**
   * Get line note template for a token
   */
  getLineNoteTemplate(token: 'C' | 'O' | 'F'): string {
    return this.lineNoteTemplates[token] || 'Pattern observed.';
  }

  /**
   * Check if family hone is complete (any family has 3 picks)
   */
  isFamilyHoneComplete(counts: Record<Family, number>): boolean {
    return Object.values(counts).some(count => count >= 3);
  }

  /**
   * Get the locked family (first to reach 3)
   */
  getLockedFamily(counts: Record<Family, number>): Family | null {
    const locked = Object.entries(counts).find(([, count]) => count >= 3);
    return locked ? (locked[0] as Family) : null;
  }

  /**
   * Get all available faces for a family
   */
  getFacesForFamily(family: Family): Face[] {
    if (!this.quizBank?.faces_by_family) return [];
    return this.quizBank.faces_by_family[family] || [];
  }

  /**
   * Validate quiz bank integrity
   */
  validateQuizBank(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.quizBank) {
      errors.push('No quiz bank loaded');
      return { isValid: false, errors };
    }

    // Check required sections
    if (!this.quizBank.family_hone_items?.length) {
      errors.push('Missing family hone items');
    }

    if (!this.quizBank.face_triad_items) {
      errors.push('Missing face triad items');
    }

    if (!this.quizBank.line_items?.length) {
      errors.push('Missing line items');
    }

    // Check family coverage
    const families = this.quizBank.families || [];
    families.forEach(family => {
      if (!this.quizBank?.faces_by_family?.[family]?.length) {
        errors.push(`Missing faces for family: ${family}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get quiz bank metadata
   */
  getQuizBankMetadata(): { version: string; flow: string; totalItems: number } | null {
    if (!this.quizBank) return null;

    const totalItems = 
      (this.quizBank.family_hone_items?.length || 0) +
      Object.values(this.quizBank.face_triad_items || {}).reduce((sum, items) => sum + items.length, 0) +
      (this.quizBank.line_items?.length || 0);

    return {
      version: this.quizBank.version,
      flow: this.quizBank.flow,
      totalItems
    };
  }
}

/**
 * Default quiz bank loader instance
 */
export const quizBankV2Loader = new QuizBankV2Loader();

/**
 * Load quiz bank with fallback
 */
export async function loadQuizBankV2WithFallback(): Promise<QuizBankV2> {
  try {
    // Try to load from the new format first
    const response = await fetch('/api/quiz-bank-v2', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return await quizBankV2Loader.loadQuizBank(data);
    }

    // Fallback to static import of integrated quiz bank
    console.warn('API load failed, falling back to static import');
    const bankData = (await import('@/data/quiz-bank-v2.7.json')).default;
    return await quizBankV2Loader.loadQuizBank(bankData);
  } catch (error) {
    console.error('Failed to load integrated quiz bank v2.7:', error);
    throw error;
  }
}
