/**
 * RNG (Random Number Generator) system
 * Dice-based random generation for ritual triggers and modulation
 */

import type { DieType } from '../core/types.js';
import { DIE_RANGES } from '../core/types.js';

export interface RollResult {
  die: DieType;
  value: number;
  max: number;
  normalized: number; // 0.0 to 1.0
  timestamp: number;
}

export interface RollHistoryEntry extends RollResult {
  id: string;
  context?: string;
}

export class RNG {
  private _history: RollHistoryEntry[] = [];
  private _maxHistory: number = 100;
  private _seed: number | null = null;
  private _rollCount: number = 0;

  constructor(options: { maxHistory?: number; seed?: number } = {}) {
    this._maxHistory = options.maxHistory ?? 100;
    if (options.seed !== undefined) {
      this._seed = options.seed;
    }
  }

  /**
   * Roll a specific die type
   */
  roll(die: DieType, context?: string): RollResult {
    const max = DIE_RANGES[die];
    const value = this.generateRandom(1, max);
    const normalized = (value - 1) / (max - 1);

    const result: RollResult = {
      die,
      value,
      max,
      normalized,
      timestamp: Date.now(),
    };

    // Add to history
    this._rollCount++;
    const entry: RollHistoryEntry = {
      ...result,
      id: `roll_${this._rollCount}`,
      context,
    };
    this._history.push(entry);

    // Trim history if needed
    if (this._history.length > this._maxHistory) {
      this._history = this._history.slice(-this._maxHistory);
    }

    return result;
  }

  /**
   * Roll a d4 (1-4)
   */
  d4(context?: string): RollResult {
    return this.roll('d4', context);
  }

  /**
   * Roll a d6 (1-6)
   */
  d6(context?: string): RollResult {
    return this.roll('d6', context);
  }

  /**
   * Roll a d8 (1-8)
   */
  d8(context?: string): RollResult {
    return this.roll('d8', context);
  }

  /**
   * Roll a d10 (1-10)
   */
  d10(context?: string): RollResult {
    return this.roll('d10', context);
  }

  /**
   * Roll a d12 (1-12)
   */
  d12(context?: string): RollResult {
    return this.roll('d12', context);
  }

  /**
   * Roll a d20 (1-20)
   */
  d20(context?: string): RollResult {
    return this.roll('d20', context);
  }

  /**
   * Roll a d100 (1-100)
   */
  d100(context?: string): RollResult {
    return this.roll('d100', context);
  }

  /**
   * Roll a d1000 (1-1000)
   */
  d1000(context?: string): RollResult {
    return this.roll('d1000', context);
  }

  /**
   * Roll with advantage (roll twice, take higher)
   */
  rollAdvantage(die: DieType, context?: string): RollResult {
    const roll1 = this.roll(die, context ? `${context} (adv 1)` : undefined);
    const roll2 = this.roll(die, context ? `${context} (adv 2)` : undefined);
    return roll1.value >= roll2.value ? roll1 : roll2;
  }

  /**
   * Roll with disadvantage (roll twice, take lower)
   */
  rollDisadvantage(die: DieType, context?: string): RollResult {
    const roll1 = this.roll(die, context ? `${context} (dis 1)` : undefined);
    const roll2 = this.roll(die, context ? `${context} (dis 2)` : undefined);
    return roll1.value <= roll2.value ? roll1 : roll2;
  }

  /**
   * Roll multiple dice and sum
   */
  rollSum(count: number, die: DieType, context?: string): number {
    let sum = 0;
    for (let i = 0; i < count; i++) {
      sum += this.roll(die, context ? `${context} (${i + 1}/${count})` : undefined).value;
    }
    return sum;
  }

  /**
   * Roll and return a value mapped to a duality range (-1.0 to +1.0)
   */
  rollDuality(die: DieType, context?: string): number {
    const result = this.roll(die, context);
    return result.normalized * 2 - 1;
  }

  /**
   * Check if a roll passes a threshold (DC check)
   */
  check(die: DieType, dc: number, context?: string): { passed: boolean; result: RollResult } {
    const result = this.roll(die, context);
    return {
      passed: result.value >= dc,
      result,
    };
  }

  /**
   * Get the roll history
   */
  get history(): RollHistoryEntry[] {
    return [...this._history];
  }

  /**
   * Get the last N rolls
   */
  getLastRolls(count: number): RollHistoryEntry[] {
    return this._history.slice(-count);
  }

  /**
   * Get the last roll
   */
  get lastRoll(): RollHistoryEntry | undefined {
    return this._history[this._history.length - 1];
  }

  /**
   * Get statistics for a die type from history
   */
  getStats(die: DieType): {
    count: number;
    average: number;
    min: number;
    max: number;
    distribution: Map<number, number>;
  } {
    const rolls = this._history.filter((r) => r.die === die);
    if (rolls.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0, distribution: new Map() };
    }

    const values = rolls.map((r) => r.value);
    const distribution = new Map<number, number>();
    for (const v of values) {
      distribution.set(v, (distribution.get(v) ?? 0) + 1);
    }

    return {
      count: rolls.length,
      average: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      distribution,
    };
  }

  /**
   * Clear roll history
   */
  clearHistory(): this {
    this._history = [];
    return this;
  }

  /**
   * Set a seed for deterministic rolls (for testing)
   */
  setSeed(seed: number): this {
    this._seed = seed;
    return this;
  }

  /**
   * Clear seed for random rolls
   */
  clearSeed(): this {
    this._seed = null;
    return this;
  }

  /**
   * Generate a random integer in range [min, max]
   */
  private generateRandom(min: number, max: number): number {
    if (this._seed !== null) {
      // Simple seeded PRNG (Mulberry32)
      this._seed = (this._seed + 0x6d2b79f5) | 0;
      let t = this._seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      const random = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      return Math.floor(random * (max - min + 1)) + min;
    }

    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Total number of rolls made
   */
  get totalRolls(): number {
    return this._rollCount;
  }
}

/**
 * Global RNG instance for convenience
 */
export const globalRNG = new RNG();
