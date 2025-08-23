'use client';

import type { Family, FamilyHoneItem, FamilyHoneLogic } from '@/lib/types';

export interface FamilyHoneConfig {
  items: FamilyHoneItem[];
  logic: FamilyHoneLogic;
  onFamilyPick: (family: Family, itemId: string) => void;
  onComplete: (lockedFamily: Family, counts: Record<Family, number>) => void;
}

export interface ExposureState {
  familyExposure: Record<Family, number>;
  totalItems: number;
  balanceThreshold: number;
}

export class FamilyHoneEngine {
  private config: FamilyHoneConfig;
  private familyCounts: Record<Family, number>;
  private exposureState: ExposureState;
  private itemHistory: string[];
  private isComplete: boolean;

  constructor(config: FamilyHoneConfig) {
    this.config = config;
    this.familyCounts = {} as Record<Family, number>;
    this.itemHistory = [];
    this.isComplete = false;
    
    // Initialize family counts
    const families: Family[] = ['Control', 'Pace', 'Boundary', 'Truth', 'Recognition', 'Bonding', 'Stress'];
    families.forEach(family => {
      this.familyCounts[family] = 0;
    });

    // Initialize exposure tracking
    this.exposureState = {
      familyExposure: { ...this.familyCounts },
      totalItems: 0,
      balanceThreshold: 0.2 // 20% deviation threshold
    };
  }

  /**
   * Get the next router item based on exposure balancing
   */
  getNextRouterItem(): FamilyHoneItem | null {
    if (this.isComplete) return null;

    // Filter out previously seen items
    const availableItems = this.config.items.filter(item => 
      !this.itemHistory.includes(item.id)
    );

    if (availableItems.length === 0) {
      console.warn('No more available router items');
      return availableItems[0] || null;
    }

    // Apply exposure balancing logic
    const balancedItem = this.selectBalancedItem(availableItems);
    return balancedItem;
  }

  /**
   * Select item based on exposure balancing algorithm
   */
  private selectBalancedItem(items: FamilyHoneItem[]): FamilyHoneItem {
    // Get current leader and runner-up
    const sortedCounts = Object.entries(this.familyCounts)
      .sort(([,a], [,b]) => b - a);
    
    const leader = sortedCounts[0][0] as Family;
    const runnerUp = sortedCounts[1][0] as Family;

    // Find items that include leader and runner-up
    const preferredItems = items.filter(item => {
      const families = Object.values(item.options).map(option => option.family);
      return families.includes(leader) && families.includes(runnerUp);
    });

    if (preferredItems.length > 0) {
      // Select from preferred items, prioritizing under-exposed families
      return this.selectByExposure(preferredItems);
    }

    // Fallback to any available item
    return this.selectByExposure(items);
  }

  /**
   * Select item based on family exposure levels
   */
  private selectByExposure(items: FamilyHoneItem[]): FamilyHoneItem {
    // Calculate exposure scores for each item
    const itemScores = items.map(item => {
      const families = Object.values(item.options).map(option => option.family);
      
      // Calculate average exposure of families in this item
      const exposureSum = families.reduce((sum, family) => 
        sum + this.exposureState.familyExposure[family], 0
      );
      const avgExposure = exposureSum / families.length;
      
      // Lower exposure = higher score (we want to balance)
      const exposureScore = 1 / (avgExposure + 1);
      
      return {
        item,
        score: exposureScore,
        avgExposure
      };
    });

    // Sort by score (higher is better)
    itemScores.sort((a, b) => b.score - a.score);
    
    return itemScores[0].item;
  }

  /**
   * Process a family pick
   */
  processFamilyPick(family: Family, itemId: string): void {
    if (this.isComplete) return;

    // Update counts
    this.familyCounts[family]++;
    this.itemHistory.push(itemId);
    
    // Update exposure tracking
    this.updateExposureState(itemId);

    // Check completion condition
    if (this.familyCounts[family] >= this.config.logic.n) {
      this.isComplete = true;
      this.config.onComplete(family, { ...this.familyCounts });
    } else {
      this.config.onFamilyPick(family, itemId);
    }
  }

  /**
   * Update exposure state after an item is shown
   */
  private updateExposureState(itemId: string): void {
    const item = this.config.items.find(i => i.id === itemId);
    if (!item) return;

    const families = Object.values(item.options).map(option => option.family);
    families.forEach(family => {
      this.exposureState.familyExposure[family]++;
    });
    
    this.exposureState.totalItems++;
  }

  /**
   * Get current state
   */
  getCurrentState() {
    return {
      familyCounts: { ...this.familyCounts },
      itemHistory: [...this.itemHistory],
      isComplete: this.isComplete,
      exposureState: { ...this.exposureState }
    };
  }

  /**
   * Get exposure balance report
   */
  getExposureReport() {
    const avgExposure = this.exposureState.totalItems / 7; // 7 families
    const deviations = Object.entries(this.exposureState.familyExposure)
      .map(([family, exposure]) => ({
        family: family as Family,
        exposure,
        deviation: Math.abs(exposure - avgExposure) / avgExposure
      }));

    const maxDeviation = Math.max(...deviations.map(d => d.deviation));
    const isBalanced = maxDeviation <= this.exposureState.balanceThreshold;

    return {
      avgExposure,
      deviations,
      maxDeviation,
      isBalanced,
      totalItems: this.exposureState.totalItems
    };
  }
}
