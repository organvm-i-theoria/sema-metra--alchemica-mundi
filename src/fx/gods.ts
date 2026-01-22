/**
 * FX God Registry
 * Maps FX units to their mythological representations
 */

import type { FXGodDefinition } from '../core/types.js';
import { FXUnit } from './unit.js';
import type { IFXUnit } from './types.js';

export class FXGodRegistry {
  private _definitions: Map<string, FXGodDefinition> = new Map();
  private _units: Map<string, IFXUnit> = new Map();

  constructor(definitions: FXGodDefinition[]) {
    for (const def of definitions) {
      this._definitions.set(def.id, def);
    }
  }

  /**
   * Get a definition by ID
   */
  getDefinition(id: string): FXGodDefinition | undefined {
    return this._definitions.get(id);
  }

  /**
   * Get all definitions
   */
  getAllDefinitions(): FXGodDefinition[] {
    return Array.from(this._definitions.values());
  }

  /**
   * Create an FX unit from a definition
   */
  createUnit(id: string): IFXUnit | undefined {
    const definition = this._definitions.get(id);
    if (!definition) return undefined;

    const unit = new FXUnit(definition);
    this._units.set(id, unit);
    return unit;
  }

  /**
   * Get an existing unit or create a new one
   */
  getOrCreateUnit(id: string): IFXUnit | undefined {
    if (this._units.has(id)) {
      return this._units.get(id);
    }
    return this.createUnit(id);
  }

  /**
   * Get an existing unit
   */
  getUnit(id: string): IFXUnit | undefined {
    return this._units.get(id);
  }

  /**
   * Get all active units
   */
  getActiveUnits(): IFXUnit[] {
    return Array.from(this._units.values());
  }

  /**
   * Find by god name
   */
  findByGodName(godName: string): FXGodDefinition | undefined {
    const lower = godName.toLowerCase();
    for (const def of this._definitions.values()) {
      if (def.godName.toLowerCase().includes(lower)) {
        return def;
      }
    }
    return undefined;
  }

  /**
   * Find by effect type
   */
  findByEffectType(effectType: string): FXGodDefinition[] {
    const lower = effectType.toLowerCase();
    return Array.from(this._definitions.values()).filter(
      (def) => def.effectType.toLowerCase().includes(lower)
    );
  }

  /**
   * Find by Tone.js module
   */
  findByToneModule(module: string): FXGodDefinition[] {
    const lower = module.toLowerCase();
    return Array.from(this._definitions.values()).filter(
      (def) => def.toneModule.toLowerCase() === lower
    );
  }

  /**
   * Get gods by domain/role
   */
  getByRole(roleKeyword: string): FXGodDefinition[] {
    const lower = roleKeyword.toLowerCase();
    return Array.from(this._definitions.values()).filter(
      (def) => def.role.toLowerCase().includes(lower)
    );
  }

  /**
   * Clear all instantiated units
   */
  clearUnits(): void {
    for (const unit of this._units.values()) {
      unit.disconnect();
    }
    this._units.clear();
  }

  /**
   * Get the invocation/description for a god
   */
  invoke(id: string): string {
    const def = this._definitions.get(id);
    if (!def) return `Unknown god: ${id}`;

    return `
::INVOKING ${def.godName.toUpperCase()}::
Effect: ${def.effectType}
Role: ${def.role}
Module: ${def.toneModule}
    `.trim();
  }
}

/**
 * FX God name constants for easy reference
 */
export const FX_GODS = {
  FILTER: 'filter',
  COMPRESSOR: 'compressor',
  KNEE: 'knee',
  THRESHOLD: 'threshold',
  EXPANDER: 'expander',
  ENVELOPE_FOLLOWER: 'envelope_follower',
  SATURATOR: 'saturator',
  FOLD: 'fold',
  DRIVE: 'drive',
  GATE: 'gate',
  TRIGGER: 'trigger',
  REVERB: 'reverb',
  SHIMMER: 'shimmer',
  DELAY: 'delay',
  GLITCH: 'glitch',
  FREEZE: 'freeze',
  GRANULATOR: 'granulator',
  CONVOLUTION: 'convolution',
  FORMANT: 'formant',
  PITCH_SHIFT: 'pitch_shift',
  VOCODER: 'vocoder',
  WAVETABLE: 'wavetable',
  CROSSFADE: 'crossfade',
  DUCKER: 'ducker',
  MIX: 'mix',
} as const;

export type FXGodId = (typeof FX_GODS)[keyof typeof FX_GODS];
