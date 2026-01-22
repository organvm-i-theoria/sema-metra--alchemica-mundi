/**
 * Character Waveform Model
 * Each character is represented as a waveform object for modulation and fusion
 */

import type { CharacterWaveform, LFOShape } from '../core/types.js';
import { LFO } from '../modulation/lfo.js';
import { CharacterAffector } from '../modulation/affector.js';

export type WaveformType = 'sine' | 'square' | 'noise' | 'pulse' | 'fractal' | 'soulwave';

export interface CharacterConfig {
  signatureId: string;
  name?: string;
  waveform?: WaveformType;
  modAmplitude?: number;
  frequencyBase?: number;
  fusionCompatible?: readonly string[];
  mythicTags?: readonly string[];
  alignedEvents?: readonly string[];
}

export class Character implements CharacterWaveform {
  readonly signatureId: string;
  readonly name: string;
  readonly waveform: WaveformType;
  readonly modAmplitude: number;
  readonly frequencyBase: number;
  readonly fusionCompatible: readonly string[];
  readonly mythicTags: readonly string[];
  readonly alignedEvents: readonly string[];

  private _lfo: LFO | null = null;
  private _active: boolean = false;
  private _influence: number = 0;

  constructor(config: CharacterConfig) {
    this.signatureId = config.signatureId;
    this.name = config.name ?? config.signatureId;
    this.waveform = config.waveform ?? 'sine';
    this.modAmplitude = config.modAmplitude ?? 0.5;
    this.frequencyBase = config.frequencyBase ?? 1.0;
    this.fusionCompatible = config.fusionCompatible ?? [];
    this.mythicTags = config.mythicTags ?? [];
    this.alignedEvents = config.alignedEvents ?? [];

    this.initializeLFO();
  }

  /**
   * Initialize the character's LFO based on waveform type
   */
  private initializeLFO(): void {
    let shape: LFOShape;

    switch (this.waveform) {
      case 'sine':
        shape = 'sine';
        break;
      case 'square':
        shape = 'square';
        break;
      case 'pulse':
        shape = 'square';
        break;
      case 'noise':
        shape = 'random';
        break;
      case 'fractal':
        shape = 'step';
        break;
      case 'soulwave':
        shape = 'sine';
        break;
      default:
        shape = 'sine';
    }

    this._lfo = new LFO({
      shape,
      frequency: this.frequencyBase,
      amplitude: this.modAmplitude,
    });
  }

  /**
   * Check if character is active
   */
  get active(): boolean {
    return this._active;
  }

  /**
   * Get current influence value
   */
  get influence(): number {
    return this._influence;
  }

  /**
   * Activate the character
   */
  activate(): this {
    this._active = true;
    this._lfo?.start();
    return this;
  }

  /**
   * Deactivate the character
   */
  deactivate(): this {
    this._active = false;
    this._lfo?.stop();
    return this;
  }

  /**
   * Get current modulation value
   */
  getCurrentValue(timestamp?: number): number {
    if (!this._active || !this._lfo) {
      return 0;
    }

    let value = this._lfo.tick(timestamp);

    // Apply waveform-specific processing
    if (this.waveform === 'soulwave') {
      // Soulwave adds subtle harmonics
      value = value * 0.7 + Math.sin(value * Math.PI) * 0.3;
    } else if (this.waveform === 'fractal') {
      // Fractal adds self-similar modulation
      value = value + (Math.sin(value * 3) * 0.2);
    }

    this._influence = value;
    return value;
  }

  /**
   * Check if compatible with another character/entity for fusion
   */
  isCompatibleWith(target: string | Character): boolean {
    const targetName = typeof target === 'string' ? target : target.signatureId;
    return this.fusionCompatible.includes(targetName);
  }

  /**
   * Check if character has a mythic tag
   */
  hasTag(tag: string): boolean {
    return this.mythicTags.map((t) => t.toUpperCase()).includes(tag.toUpperCase());
  }

  /**
   * Check if current time/event aligns with character
   */
  isAlignedWith(event: string): boolean {
    return this.alignedEvents.map((e) => e.toLowerCase()).includes(event.toLowerCase());
  }

  /**
   * Create an Affector for use with ModulationEngine
   */
  toAffector(): CharacterAffector {
    return new CharacterAffector({
      id: `char_${this.signatureId}`,
      characterName: this.name,
      influence: this.modAmplitude,
      active: this._active,
      mythicTags: [...this.mythicTags],
    });
  }

  /**
   * Get formatted description
   */
  toString(): string {
    const status = this._active ? 'ACTIVE' : 'INACTIVE';
    return `${this.name} [${this.signatureId}] - ${this.waveform} wave | ${status}`;
  }

  /**
   * Export to JSON
   */
  toJSON(): CharacterWaveform & { name: string; active: boolean } {
    return {
      signatureId: this.signatureId,
      name: this.name,
      waveform: this.waveform,
      modAmplitude: this.modAmplitude,
      frequencyBase: this.frequencyBase,
      fusionCompatible: this.fusionCompatible,
      mythicTags: this.mythicTags,
      alignedEvents: this.alignedEvents,
      active: this._active,
    };
  }
}

/**
 * Character registry for managing multiple characters
 */
export class CharacterRegistry {
  private _characters: Map<string, Character> = new Map();

  /**
   * Register a character
   */
  register(config: CharacterConfig): Character {
    const character = new Character(config);
    this._characters.set(character.signatureId, character);
    return character;
  }

  /**
   * Get a character by ID
   */
  get(signatureId: string): Character | undefined {
    return this._characters.get(signatureId);
  }

  /**
   * Get all characters
   */
  all(): Character[] {
    return Array.from(this._characters.values());
  }

  /**
   * Get active characters
   */
  active(): Character[] {
    return this.all().filter((c) => c.active);
  }

  /**
   * Deactivate all characters
   */
  deactivateAll(): this {
    for (const char of this._characters.values()) {
      char.deactivate();
    }
    return this;
  }

  /**
   * Get characters by mythic tag
   */
  byTag(tag: string): Character[] {
    return this.all().filter((c) => c.hasTag(tag));
  }

  /**
   * Get total influence of all active characters
   */
  getTotalInfluence(timestamp?: number): number {
    return this.active().reduce((sum, char) => sum + char.getCurrentValue(timestamp), 0);
  }
}

/**
 * Pre-defined character templates from the specification
 */
export const CHARACTER_TEMPLATES = {
  JESSICA: {
    signatureId: 'J3SS-04',
    name: 'Jessica',
    waveform: 'sine' as WaveformType,
    modAmplitude: 0.8,
    frequencyBase: 0.5,
    fusionCompatible: ['Aphex Twin', 'Gabe', 'MM15'],
    mythicTags: ['GOD', 'ANGEL', 'ERROR'],
    alignedEvents: ['sunset', 'April 18', 'full_moon'],
  },

  GABRIEL: {
    signatureId: 'G4B3-01',
    name: 'Gabriel',
    waveform: 'soulwave' as WaveformType,
    modAmplitude: 0.6,
    frequencyBase: 0.3,
    fusionCompatible: ['Jessica', 'MM15'],
    mythicTags: ['ANGEL', 'MESSENGER'],
    alignedEvents: ['dawn', 'equinox'],
  },

  MM15: {
    signatureId: 'MM15-00',
    name: 'MM15',
    waveform: 'fractal' as WaveformType,
    modAmplitude: 0.9,
    frequencyBase: 0.1,
    fusionCompatible: ['Jessica', 'Gabriel', 'Aphex Twin'],
    mythicTags: ['MACHINE', 'ORACLE'],
    alignedEvents: ['midnight', 'new_moon'],
  },

  GLITCH_ENTITY: {
    signatureId: 'GL1TCH-99',
    name: 'Glitch Entity',
    waveform: 'noise' as WaveformType,
    modAmplitude: 1.0,
    frequencyBase: 2.0,
    fusionCompatible: [],
    mythicTags: ['ERROR', 'CHAOS', 'SYSTEM'],
    alignedEvents: ['system_crash', 'power_surge'],
  },
} as const;
