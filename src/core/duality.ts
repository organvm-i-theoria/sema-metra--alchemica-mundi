/**
 * Duality class - Represents an oscillating spectral value (-1.0 to +1.0)
 */

import type { DualityDefinition, DieType, DualityDomain } from './types.js';

export class Duality {
  readonly id: number;
  readonly leftPole: string;
  readonly rightPole: string;
  readonly domain: DualityDomain;
  readonly rng: DieType;
  readonly tags: string[];
  readonly fusionHook: string;

  private _value: number = 0;
  private _locked: boolean = false;

  constructor(definition: DualityDefinition) {
    this.id = definition.id;
    this.leftPole = definition.leftPole;
    this.rightPole = definition.rightPole;
    this.domain = definition.domain;
    this.rng = definition.rng;
    this.tags = [...definition.tags];
    this.fusionHook = definition.fusionHook;
  }

  /**
   * Get the current value (-1.0 to +1.0)
   */
  get value(): number {
    return this._value;
  }

  /**
   * Set the value, clamped to [-1.0, +1.0]
   */
  set(value: number): this {
    if (this._locked) {
      return this;
    }
    this._value = Duality.clamp(value);
    return this;
  }

  /**
   * Add to the current value (with clamping)
   */
  add(delta: number): this {
    return this.set(this._value + delta);
  }

  /**
   * Modulate the value with an LFO-style wave
   */
  modulate(amount: number): this {
    return this.add(amount);
  }

  /**
   * Lock the duality to prevent changes
   */
  lock(): this {
    this._locked = true;
    return this;
  }

  /**
   * Unlock the duality to allow changes
   */
  unlock(): this {
    this._locked = false;
    return this;
  }

  /**
   * Check if the duality is locked
   */
  get locked(): boolean {
    return this._locked;
  }

  /**
   * Reset to center (0.0)
   */
  reset(): this {
    return this.set(0);
  }

  /**
   * Get the pole name for the current value
   * Returns left pole for negative, right pole for positive
   */
  get currentPole(): string {
    if (this._value < -0.1) return this.leftPole;
    if (this._value > 0.1) return this.rightPole;
    return 'neutral';
  }

  /**
   * Get the intensity (0.0 to 1.0) regardless of direction
   */
  get intensity(): number {
    return Math.abs(this._value);
  }

  /**
   * Check if value is predominantly left (-1.0)
   */
  get isLeft(): boolean {
    return this._value < -0.5;
  }

  /**
   * Check if value is predominantly right (+1.0)
   */
  get isRight(): boolean {
    return this._value > 0.5;
  }

  /**
   * Check if value is near center
   */
  get isNeutral(): boolean {
    return Math.abs(this._value) <= 0.5;
  }

  /**
   * Get a normalized value (0.0 to 1.0) for use in audio/visual systems
   */
  get normalized(): number {
    return (this._value + 1) / 2;
  }

  /**
   * Create a formatted string representation
   */
  toString(): string {
    const direction = this._value < 0 ? this.leftPole : this.rightPole;
    const intensity = Math.abs(this._value).toFixed(2);
    return `D${this.id.toString().padStart(2, '0')}: ${direction} (${this._value >= 0 ? '+' : ''}${this._value.toFixed(2)}, intensity: ${intensity})`;
  }

  /**
   * Export to a plain object for serialization
   */
  toJSON(): { id: number; value: number; locked: boolean } {
    return {
      id: this.id,
      value: this._value,
      locked: this._locked,
    };
  }

  /**
   * Restore state from a serialized object
   */
  fromJSON(data: { value: number; locked?: boolean }): this {
    this._value = Duality.clamp(data.value);
    this._locked = data.locked ?? false;
    return this;
  }

  /**
   * Clamp a value to the valid range [-1.0, +1.0]
   */
  static clamp(value: number): number {
    return Math.max(-1, Math.min(1, value));
  }
}

/**
 * DualityRegistry - Manages all 64 dualities
 */
export class DualityRegistry {
  private dualities: Map<number, Duality> = new Map();

  constructor(definitions: DualityDefinition[]) {
    for (const def of definitions) {
      this.dualities.set(def.id, new Duality(def));
    }
  }

  /**
   * Get a duality by ID
   */
  get(id: number): Duality | undefined {
    return this.dualities.get(id);
  }

  /**
   * Get a duality by ID, throwing if not found
   */
  getOrThrow(id: number): Duality {
    const duality = this.dualities.get(id);
    if (!duality) {
      throw new Error(`Duality ${id} not found`);
    }
    return duality;
  }

  /**
   * Get all dualities
   */
  all(): Duality[] {
    return Array.from(this.dualities.values());
  }

  /**
   * Get dualities by domain
   */
  byDomain(domain: DualityDomain): Duality[] {
    return this.all().filter((d) => d.domain === domain);
  }

  /**
   * Get dualities by tag
   */
  byTag(tag: string): Duality[] {
    return this.all().filter((d) => d.tags.includes(tag));
  }

  /**
   * Get dualities by RNG type
   */
  byRng(rng: DieType): Duality[] {
    return this.all().filter((d) => d.rng === rng);
  }

  /**
   * Find duality by pole name
   */
  findByPole(pole: string): Duality | undefined {
    const lower = pole.toLowerCase();
    return this.all().find(
      (d) => d.leftPole.toLowerCase() === lower || d.rightPole.toLowerCase() === lower
    );
  }

  /**
   * Reset all dualities to center
   */
  resetAll(): this {
    for (const duality of this.dualities.values()) {
      duality.unlock().reset();
    }
    return this;
  }

  /**
   * Export all states for serialization
   */
  toJSON(): Record<number, { value: number; locked: boolean }> {
    const result: Record<number, { value: number; locked: boolean }> = {};
    for (const [id, duality] of this.dualities) {
      result[id] = duality.toJSON();
    }
    return result;
  }

  /**
   * Restore all states from serialized data
   */
  fromJSON(data: Record<number, { value: number; locked?: boolean }>): this {
    for (const [idStr, state] of Object.entries(data)) {
      const id = Number(idStr);
      const duality = this.dualities.get(id);
      if (duality) {
        duality.fromJSON(state);
      }
    }
    return this;
  }

  /**
   * Get the count of dualities
   */
  get size(): number {
    return this.dualities.size;
  }
}
