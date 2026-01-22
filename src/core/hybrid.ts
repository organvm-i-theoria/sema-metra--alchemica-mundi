/**
 * HybridToggle class - Represents context-sensitive ritual states
 * Not binary, not spectral - emotional/mystical conditionals
 */

import type { HybridDefinition, HybridMode, HybridCondition } from './types.js';

export class HybridToggle {
  readonly id: string;
  readonly conditionA: string;
  readonly conditionB: string;
  readonly mode: HybridMode;
  readonly description: string;

  private _condition: HybridCondition = 'A';
  private _transitionProgress: number = 0; // 0.0 to 1.0 during transition

  constructor(definition: HybridDefinition) {
    this.id = definition.id;
    this.conditionA = definition.conditionA;
    this.conditionB = definition.conditionB;
    this.mode = definition.mode;
    this.description = definition.description;
  }

  /**
   * Get the current condition
   */
  get condition(): HybridCondition {
    return this._condition;
  }

  /**
   * Get the current condition label
   */
  get conditionLabel(): string {
    if (this._condition === 'transitioning') {
      return `transitioning (${(this._transitionProgress * 100).toFixed(0)}%)`;
    }
    return this._condition === 'A' ? this.conditionA : this.conditionB;
  }

  /**
   * Get transition progress (0.0 to 1.0)
   */
  get transitionProgress(): number {
    return this._transitionProgress;
  }

  /**
   * Check if currently in condition A
   */
  get isA(): boolean {
    return this._condition === 'A';
  }

  /**
   * Check if currently in condition B
   */
  get isB(): boolean {
    return this._condition === 'B';
  }

  /**
   * Check if currently transitioning
   */
  get isTransitioning(): boolean {
    return this._condition === 'transitioning';
  }

  /**
   * Set to condition A (immediate)
   */
  setA(): this {
    this._condition = 'A';
    this._transitionProgress = 0;
    return this;
  }

  /**
   * Set to condition B (immediate)
   */
  setB(): this {
    this._condition = 'B';
    this._transitionProgress = 1;
    return this;
  }

  /**
   * Begin transitioning from current state to opposite
   */
  beginTransition(): this {
    if (this._condition !== 'transitioning') {
      const startFromA = this._condition === 'A';
      this._condition = 'transitioning';
      this._transitionProgress = startFromA ? 0 : 1;
    }
    return this;
  }

  /**
   * Update transition progress (0.0 = A, 1.0 = B)
   * Automatically sets final state when reaching endpoints
   */
  updateTransition(progress: number): this {
    this._transitionProgress = Math.max(0, Math.min(1, progress));

    if (this._transitionProgress <= 0) {
      this._condition = 'A';
    } else if (this._transitionProgress >= 1) {
      this._condition = 'B';
    } else {
      this._condition = 'transitioning';
    }

    return this;
  }

  /**
   * Advance transition by a delta amount
   */
  advanceTransition(delta: number): this {
    return this.updateTransition(this._transitionProgress + delta);
  }

  /**
   * Complete transition to the nearest endpoint
   */
  completeTransition(): this {
    if (this._transitionProgress < 0.5) {
      return this.setA();
    } else {
      return this.setB();
    }
  }

  /**
   * Reset to condition A
   */
  reset(): this {
    return this.setA();
  }

  /**
   * Evaluate a ritual condition against this toggle
   * Returns a score from -1.0 (fully A) to +1.0 (fully B)
   */
  evaluate(): number {
    if (this._condition === 'A') return -1.0;
    if (this._condition === 'B') return 1.0;
    return (this._transitionProgress * 2) - 1;
  }

  /**
   * Check if the toggle matches a required condition
   */
  matches(required: 'A' | 'B'): boolean {
    return this._condition === required;
  }

  /**
   * Create a formatted string representation
   */
  toString(): string {
    return `${this.id}: ${this.conditionLabel} [${this.mode}]`;
  }

  /**
   * Export to a plain object for serialization
   */
  toJSON(): { id: string; condition: HybridCondition; transitionProgress: number } {
    return {
      id: this.id,
      condition: this._condition,
      transitionProgress: this._transitionProgress,
    };
  }

  /**
   * Restore state from a serialized object
   */
  fromJSON(data: { condition: HybridCondition; transitionProgress?: number }): this {
    this._condition = data.condition;
    this._transitionProgress = data.transitionProgress ?? (data.condition === 'B' ? 1 : 0);
    return this;
  }
}

/**
 * HybridRegistry - Manages all 15 hybrid toggles
 */
export class HybridRegistry {
  private toggles: Map<string, HybridToggle> = new Map();

  constructor(definitions: HybridDefinition[]) {
    for (const def of definitions) {
      this.toggles.set(def.id, new HybridToggle(def));
    }
  }

  /**
   * Get a toggle by ID
   */
  get(id: string): HybridToggle | undefined {
    return this.toggles.get(id);
  }

  /**
   * Get a toggle by ID, throwing if not found
   */
  getOrThrow(id: string): HybridToggle {
    const toggle = this.toggles.get(id);
    if (!toggle) {
      throw new Error(`Hybrid toggle ${id} not found`);
    }
    return toggle;
  }

  /**
   * Get all toggles
   */
  all(): HybridToggle[] {
    return Array.from(this.toggles.values());
  }

  /**
   * Get toggles by mode
   */
  byMode(mode: HybridMode): HybridToggle[] {
    return this.all().filter((t) => t.mode === mode);
  }

  /**
   * Get all toggles currently in condition A
   */
  allInA(): HybridToggle[] {
    return this.all().filter((t) => t.isA);
  }

  /**
   * Get all toggles currently in condition B
   */
  allInB(): HybridToggle[] {
    return this.all().filter((t) => t.isB);
  }

  /**
   * Get all toggles currently transitioning
   */
  allTransitioning(): HybridToggle[] {
    return this.all().filter((t) => t.isTransitioning);
  }

  /**
   * Update all transitioning toggles by a delta
   */
  tickTransitions(delta: number): this {
    for (const toggle of this.allTransitioning()) {
      toggle.advanceTransition(delta);
    }
    return this;
  }

  /**
   * Reset all toggles to condition A
   */
  resetAll(): this {
    for (const toggle of this.toggles.values()) {
      toggle.reset();
    }
    return this;
  }

  /**
   * Export all states for serialization
   */
  toJSON(): Record<string, { condition: HybridCondition; transitionProgress: number }> {
    const result: Record<string, { condition: HybridCondition; transitionProgress: number }> = {};
    for (const [id, toggle] of this.toggles) {
      result[id] = toggle.toJSON();
    }
    return result;
  }

  /**
   * Restore all states from serialized data
   */
  fromJSON(data: Record<string, { condition: HybridCondition; transitionProgress?: number }>): this {
    for (const [id, state] of Object.entries(data)) {
      const toggle = this.toggles.get(id);
      if (toggle) {
        toggle.fromJSON(state);
      }
    }
    return this;
  }

  /**
   * Get the count of toggles
   */
  get size(): number {
    return this.toggles.size;
  }
}
