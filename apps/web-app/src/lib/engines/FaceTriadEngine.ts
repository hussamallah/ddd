'use client';

import type { Face, FaceTriadItem, FaceDuelItem, Family } from '@/lib/types';

export type DuelPattern = '3-0-0' | '2-1-0' | '2-0-1' | '1-1-1';

export interface FaceTriadConfig {
  family: Family;
  triadItems: FaceTriadItem[];
  duelItems: FaceDuelItem[];
  onTriadComplete: (counts: Record<Face, number>, pattern: DuelPattern) => void;
  onDuelRequired: (faces: Face[], pattern: DuelPattern) => void;
  onFaceSelected: (face: Face, confidence: 'high' | 'medium' | 'low', duelsRun: number) => void;
}

export interface TriadState {
  counts: Record<Face, number>;
  itemsCompleted: number;
  pattern: DuelPattern | null;
  duelsRequired: boolean;
  selectedFace: Face | null;
  confidence: 'high' | 'medium' | 'low' | null;
}

export class FaceTriadEngine {
  private config: FaceTriadConfig;
  private state: TriadState;
  private duelResults: Array<{ faces: Face[], winner: Face }>;

  constructor(config: FaceTriadConfig) {
    this.config = config;
    this.duelResults = [];
    
    // Initialize counts for family faces
    const familyFaces = this.getFacesForFamily(config.family);
    const initialCounts = {} as Record<Face, number>;
    familyFaces.forEach(face => {
      initialCounts[face] = 0;
    });

    this.state = {
      counts: initialCounts,
      itemsCompleted: 0,
      pattern: null,
      duelsRequired: false,
      selectedFace: null,
      confidence: null
    };
  }

  /**
   * Get faces for a family
   */
  private getFacesForFamily(family: Family): Face[] {
    const faceMap: Partial<Record<Family, Face[]>> = {
      'Control': ['sovereign', 'rebel', 'catalyst'],
      'Pace': ['strategist', 'navigator', 'visionary'],
      'Boundary': ['guardian', 'equalizer', 'sentinel'],
      'Truth': ['seeker', 'architect', 'alchemist'],
      'Recognition': ['spotlight', 'mask', 'artisan'],
      'Bonding': ['provider', 'partner', 'servant'],
      'Stress': ['diplomat', 'wanderer', 'catalyst']
    };
    return faceMap[family] || [];
  }

  /**
   * Process a triad item response
   */
  processTriadResponse(face: Face): void {
    // Update counts
    this.state.counts[face]++;
    this.state.itemsCompleted++;

    // Check if triad is complete (3 items)
    if (this.state.itemsCompleted >= 3) {
      this.evaluateTriadPattern();
    }
  }

  /**
   * Evaluate the triad pattern and determine next steps
   */
  private evaluateTriadPattern(): void {
    const counts = Object.values(this.state.counts);
    const sortedCounts = counts.sort((a, b) => b - a);
    
    // Determine pattern
    if (sortedCounts[0] === 3) {
      this.state.pattern = '3-0-0';
    } else if (sortedCounts[0] === 2 && sortedCounts[1] === 1) {
      this.state.pattern = '2-1-0';
    } else if (sortedCounts[0] === 2 && sortedCounts[2] === 1) {
      this.state.pattern = '2-0-1';
    } else if (sortedCounts[0] === 1 && sortedCounts[1] === 1 && sortedCounts[2] === 1) {
      this.state.pattern = '1-1-1';
    }

    // Apply duel rules based on pattern
    this.applyDuelRules();
  }

  /**
   * Apply duel rules based on the detected pattern
   */
  private applyDuelRules(): void {
    if (!this.state.pattern) return;

    const faces = this.getFacesForFamily(this.config.family);
    const sortedFaces = faces.sort((a, b) => this.state.counts[b] - this.state.counts[a]);

    switch (this.state.pattern) {
      case '3-0-0':
        // Clear winner, no duel needed
        this.selectFace(sortedFaces[0], 'high', 0);
        break;

      case '2-1-0':
        // Duel between top 2
        this.state.duelsRequired = true;
        this.config.onDuelRequired([sortedFaces[0], sortedFaces[1]], this.state.pattern);
        break;

      case '2-0-1':
        // Duel between 1st and 3rd
        this.state.duelsRequired = true;
        this.config.onDuelRequired([sortedFaces[0], sortedFaces[2]], this.state.pattern);
        break;

      case '1-1-1':
        // Two-stage duel process
        this.state.duelsRequired = true;
        this.config.onDuelRequired([sortedFaces[0], sortedFaces[1]], this.state.pattern);
        break;
    }

    this.config.onTriadComplete(this.state.counts, this.state.pattern);
  }

  /**
   * Process a duel result
   */
  processDuelResult(faces: Face[], winner: Face): void {
    this.duelResults.push({ faces, winner });

    // Handle different patterns
    if (this.state.pattern === '2-1-0' || this.state.pattern === '2-0-1') {
      // Single duel scenarios
      if (this.isDuelWinnerTop(faces, winner)) {
        this.selectFace(winner, 'high', 1);
      } else {
        // Upset, need second duel
        const otherFaces = this.getFacesForFamily(this.config.family)
          .filter(f => !faces.includes(f));
        if (otherFaces.length > 0) {
          this.config.onDuelRequired([winner, otherFaces[0]], this.state.pattern);
        }
      }
    } else if (this.state.pattern === '1-1-1') {
      // Two-stage duel
      if (this.duelResults.length === 1) {
        // First duel complete, need second duel
        const remainingFaces = this.getFacesForFamily(this.config.family)
          .filter(f => !faces.includes(f));
        if (remainingFaces.length > 0) {
          this.config.onDuelRequired([winner, remainingFaces[0]], this.state.pattern);
        }
      } else {
        // Final duel complete
        this.selectFace(winner, 'low', 2);
      }
    }
  }

  /**
   * Check if duel winner was the top face from triad
   */
  private isDuelWinnerTop(faces: Face[], winner: Face): boolean {
    const sortedFaces = faces.sort((a, b) => this.state.counts[b] - this.state.counts[a]);
    return winner === sortedFaces[0];
  }

  /**
   * Select the final face
   */
  private selectFace(face: Face, confidence: 'high' | 'medium' | 'low', duelsRun: number): void {
    this.state.selectedFace = face;
    this.state.confidence = confidence;
    this.config.onFaceSelected(face, confidence, duelsRun);
  }

  /**
   * Get current state
   */
  getCurrentState(): TriadState {
    return { ...this.state };
  }

  /**
   * Get duel history
   */
  getDuelHistory() {
    return [...this.duelResults];
  }

  /**
   * Get confidence explanation
   */
  getConfidenceExplanation(): string {
    if (!this.state.confidence || !this.state.pattern) return '';

    switch (this.state.confidence) {
      case 'high':
        return this.state.pattern === '3-0-0' 
          ? 'Clear unanimous preference across all triad items'
          : 'Top choice won the decisive duel, confirming initial preference';
      
      case 'medium':
        return 'Initial preference was challenged but ultimately confirmed through duel resolution';
      
      case 'low':
        return 'Result required multiple duels to resolve, indicating close competition between faces';
      
      default:
        return '';
    }
  }

  /**
   * Reset engine state
   */
  reset(): void {
    const familyFaces = this.getFacesForFamily(this.config.family);
    const initialCounts = {} as Record<Face, number>;
    familyFaces.forEach(face => {
      initialCounts[face] = 0;
    });

    this.state = {
      counts: initialCounts,
      itemsCompleted: 0,
      pattern: null,
      duelsRequired: false,
      selectedFace: null,
      confidence: null
    };
    
    this.duelResults = [];
  }
}
