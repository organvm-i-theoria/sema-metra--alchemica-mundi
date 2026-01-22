/**
 * FX Chain - Signal routing between FX units
 */

import type { IFXUnit, FXChainConfig } from './types.js';
import type { FXGodRegistry } from './gods.js';

export interface ChainConnection {
  from: string;
  to: string;
}

export class FXChain {
  private _registry: FXGodRegistry;
  private _chain: string[] = [];
  private _units: Map<string, IFXUnit> = new Map();
  private _wet: number = 1.0;
  private _enabled: boolean = true;

  constructor(registry: FXGodRegistry) {
    this._registry = registry;
  }

  /**
   * Get the wet/dry mix
   */
  get wet(): number {
    return this._wet;
  }

  /**
   * Set the wet/dry mix
   */
  setWet(value: number): this {
    this._wet = Math.max(0, Math.min(1, value));
    return this;
  }

  /**
   * Check if chain is enabled
   */
  get enabled(): boolean {
    return this._enabled;
  }

  /**
   * Enable the chain
   */
  enable(): this {
    this._enabled = true;
    return this;
  }

  /**
   * Disable the chain
   */
  disable(): this {
    this._enabled = false;
    return this;
  }

  /**
   * Add a unit to the end of the chain
   */
  add(unitId: string): this {
    const unit = this._registry.getOrCreateUnit(unitId);
    if (unit) {
      this._chain.push(unitId);
      this._units.set(unitId, unit);
      this.rebuildConnections();
    }
    return this;
  }

  /**
   * Insert a unit at a specific position
   */
  insert(unitId: string, index: number): this {
    const unit = this._registry.getOrCreateUnit(unitId);
    if (unit) {
      this._chain.splice(index, 0, unitId);
      this._units.set(unitId, unit);
      this.rebuildConnections();
    }
    return this;
  }

  /**
   * Remove a unit from the chain
   */
  remove(unitId: string): this {
    const index = this._chain.indexOf(unitId);
    if (index !== -1) {
      this._chain.splice(index, 1);
      this._units.delete(unitId);
      this.rebuildConnections();
    }
    return this;
  }

  /**
   * Move a unit to a new position
   */
  move(unitId: string, newIndex: number): this {
    const currentIndex = this._chain.indexOf(unitId);
    if (currentIndex !== -1) {
      this._chain.splice(currentIndex, 1);
      this._chain.splice(newIndex, 0, unitId);
      this.rebuildConnections();
    }
    return this;
  }

  /**
   * Swap two units in the chain
   */
  swap(unitIdA: string, unitIdB: string): this {
    const indexA = this._chain.indexOf(unitIdA);
    const indexB = this._chain.indexOf(unitIdB);
    if (indexA !== -1 && indexB !== -1) {
      [this._chain[indexA], this._chain[indexB]] = [this._chain[indexB]!, this._chain[indexA]!];
      this.rebuildConnections();
    }
    return this;
  }

  /**
   * Get a unit by ID
   */
  getUnit(unitId: string): IFXUnit | undefined {
    return this._units.get(unitId);
  }

  /**
   * Get all units in order
   */
  getUnits(): IFXUnit[] {
    return this._chain.map((id) => this._units.get(id)).filter((u): u is IFXUnit => u !== undefined);
  }

  /**
   * Get the chain order
   */
  getOrder(): string[] {
    return [...this._chain];
  }

  /**
   * Get the number of units in the chain
   */
  get length(): number {
    return this._chain.length;
  }

  /**
   * Clear the entire chain
   */
  clear(): this {
    for (const unit of this._units.values()) {
      unit.disconnect();
    }
    this._chain = [];
    this._units.clear();
    return this;
  }

  /**
   * Rebuild internal connections after chain modification
   */
  private rebuildConnections(): void {
    // Disconnect all first
    for (const unit of this._units.values()) {
      unit.disconnect();
    }

    // Reconnect in order
    for (let i = 0; i < this._chain.length - 1; i++) {
      const current = this._units.get(this._chain[i]!);
      const next = this._units.get(this._chain[i + 1]!);
      if (current && next) {
        current.connect(next);
      }
    }
  }

  /**
   * Set parameter on a specific unit in the chain
   */
  setUnitParameter(unitId: string, param: string, value: number): this {
    const unit = this._units.get(unitId);
    if (unit) {
      unit.setParameter(param, value);
    }
    return this;
  }

  /**
   * Enable/disable a specific unit
   */
  setUnitEnabled(unitId: string, enabled: boolean): this {
    const unit = this._units.get(unitId);
    if (unit) {
      unit.enabled = enabled;
    }
    return this;
  }

  /**
   * Get the configuration of this chain
   */
  getConfig(): FXChainConfig {
    const connections: ChainConnection[] = [];
    for (let i = 0; i < this._chain.length - 1; i++) {
      connections.push({
        from: this._chain[i]!,
        to: this._chain[i + 1]!,
      });
    }

    return {
      units: [...this._chain],
      connections,
      wet: this._wet,
    };
  }

  /**
   * Load configuration
   */
  loadConfig(config: FXChainConfig): this {
    this.clear();
    this._wet = config.wet;

    for (const unitId of config.units) {
      this.add(unitId);
    }

    return this;
  }

  /**
   * Create a preset chain
   */
  static createPreset(
    registry: FXGodRegistry,
    preset: 'reverb_shimmer' | 'glitch_chain' | 'clean_delay' | 'full_synth'
  ): FXChain {
    const chain = new FXChain(registry);

    switch (preset) {
      case 'reverb_shimmer':
        chain.add('filter').add('reverb').add('shimmer').add('mix');
        chain.setWet(0.7);
        break;

      case 'glitch_chain':
        chain.add('glitch').add('freeze').add('granulator').add('delay').add('mix');
        chain.setWet(0.5);
        break;

      case 'clean_delay':
        chain.add('compressor').add('delay').add('reverb').add('mix');
        chain.setWet(0.6);
        break;

      case 'full_synth':
        chain
          .add('filter')
          .add('drive')
          .add('compressor')
          .add('delay')
          .add('reverb')
          .add('shimmer')
          .add('mix');
        chain.setWet(0.8);
        break;
    }

    return chain;
  }

  /**
   * Get a formatted string representation
   */
  toString(): string {
    if (this._chain.length === 0) {
      return '[Empty Chain]';
    }

    const unitNames = this._chain.map((id) => {
      const unit = this._units.get(id);
      return unit ? `${unit.godName}` : id;
    });

    return `[${unitNames.join(' → ')}] (wet: ${(this._wet * 100).toFixed(0)}%)`;
  }
}
