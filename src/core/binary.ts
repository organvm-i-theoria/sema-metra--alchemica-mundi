/**
 * BinaryGate class - Represents a strict on/off binary state
 */

import type { BinaryDefinition, BinaryDomain, BinaryState } from './types.js';

export class BinaryGate {
  readonly id: string;
  readonly stateA: string;
  readonly stateB: string;
  readonly domain: BinaryDomain;
  readonly signalType: string;

  private _state: BinaryState = 'A';
  private _locked: boolean = false;

  constructor(definition: BinaryDefinition) {
    this.id = definition.id;
    this.stateA = definition.stateA;
    this.stateB = definition.stateB;
    this.domain = definition.domain;
    this.signalType = definition.signalType;
  }

  /**
   * Get the current state ('A' or 'B')
   */
  get state(): BinaryState {
    return this._state;
  }

  /**
   * Get the current state label (e.g., "on" or "off")
   */
  get stateLabel(): string {
    return this._state === 'A' ? this.stateA : this.stateB;
  }

  /**
   * Check if currently in state A
   */
  get isA(): boolean {
    return this._state === 'A';
  }

  /**
   * Check if currently in state B
   */
  get isB(): boolean {
    return this._state === 'B';
  }

  /**
   * Check if the gate is locked
   */
  get locked(): boolean {
    return this._locked;
  }

  /**
   * Set to state A
   */
  setA(): this {
    if (!this._locked) {
      this._state = 'A';
    }
    return this;
  }

  /**
   * Set to state B
   */
  setB(): this {
    if (!this._locked) {
      this._state = 'B';
    }
    return this;
  }

  /**
   * Set state by label (matches stateA or stateB)
   */
  setByLabel(label: string): this {
    const lower = label.toLowerCase();
    if (lower === this.stateA.toLowerCase()) {
      return this.setA();
    } else if (lower === this.stateB.toLowerCase()) {
      return this.setB();
    }
    return this;
  }

  /**
   * Toggle between states
   */
  toggle(): this {
    if (!this._locked) {
      this._state = this._state === 'A' ? 'B' : 'A';
    }
    return this;
  }

  /**
   * Lock the gate to prevent changes
   */
  lock(): this {
    this._locked = true;
    return this;
  }

  /**
   * Unlock the gate to allow changes
   */
  unlock(): this {
    this._locked = false;
    return this;
  }

  /**
   * Reset to initial state (A)
   */
  reset(): this {
    if (!this._locked) {
      this._state = 'A';
    }
    return this;
  }

  /**
   * Check if the gate passes (is in state A)
   * Used for ritual logic where "pass" typically means state A
   */
  passes(): boolean {
    return this._state === 'A';
  }

  /**
   * Check if the gate matches a required state
   */
  matches(requiredState: BinaryState): boolean {
    return this._state === requiredState;
  }

  /**
   * Create a formatted string representation
   */
  toString(): string {
    const lockStatus = this._locked ? ' [LOCKED]' : '';
    return `${this.id}: ${this.stateLabel} (${this._state})${lockStatus}`;
  }

  /**
   * Export to a plain object for serialization
   */
  toJSON(): { id: string; state: BinaryState; locked: boolean } {
    return {
      id: this.id,
      state: this._state,
      locked: this._locked,
    };
  }

  /**
   * Restore state from a serialized object
   */
  fromJSON(data: { state: BinaryState; locked?: boolean }): this {
    this._state = data.state;
    this._locked = data.locked ?? false;
    return this;
  }
}

/**
 * BinaryRegistry - Manages all 32 binary gates
 */
export class BinaryRegistry {
  private gates: Map<string, BinaryGate> = new Map();

  constructor(definitions: BinaryDefinition[]) {
    for (const def of definitions) {
      this.gates.set(def.id, new BinaryGate(def));
    }
  }

  /**
   * Get a gate by ID
   */
  get(id: string): BinaryGate | undefined {
    return this.gates.get(id);
  }

  /**
   * Get a gate by ID, throwing if not found
   */
  getOrThrow(id: string): BinaryGate {
    const gate = this.gates.get(id);
    if (!gate) {
      throw new Error(`Binary gate ${id} not found`);
    }
    return gate;
  }

  /**
   * Get all gates
   */
  all(): BinaryGate[] {
    return Array.from(this.gates.values());
  }

  /**
   * Get gates by domain
   */
  byDomain(domain: BinaryDomain): BinaryGate[] {
    return this.all().filter((g) => g.domain === domain);
  }

  /**
   * Get gates by signal type
   */
  bySignalType(signalType: string): BinaryGate[] {
    return this.all().filter((g) => g.signalType === signalType);
  }

  /**
   * Find gate by state label
   */
  findByLabel(label: string): BinaryGate | undefined {
    const lower = label.toLowerCase();
    return this.all().find(
      (g) => g.stateA.toLowerCase() === lower || g.stateB.toLowerCase() === lower
    );
  }

  /**
   * Get all gates in state A
   */
  allInStateA(): BinaryGate[] {
    return this.all().filter((g) => g.isA);
  }

  /**
   * Get all gates in state B
   */
  allInStateB(): BinaryGate[] {
    return this.all().filter((g) => g.isB);
  }

  /**
   * Reset all gates to state A
   */
  resetAll(): this {
    for (const gate of this.gates.values()) {
      gate.unlock().reset();
    }
    return this;
  }

  /**
   * Export all states for serialization
   */
  toJSON(): Record<string, { state: BinaryState; locked: boolean }> {
    const result: Record<string, { state: BinaryState; locked: boolean }> = {};
    for (const [id, gate] of this.gates) {
      result[id] = gate.toJSON();
    }
    return result;
  }

  /**
   * Restore all states from serialized data
   */
  fromJSON(data: Record<string, { state: BinaryState; locked?: boolean }>): this {
    for (const [id, state] of Object.entries(data)) {
      const gate = this.gates.get(id);
      if (gate) {
        gate.fromJSON(state);
      }
    }
    return this;
  }

  /**
   * Get the count of gates
   */
  get size(): number {
    return this.gates.size;
  }
}
