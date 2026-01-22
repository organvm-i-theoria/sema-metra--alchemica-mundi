/**
 * Affector system - External influences on duality modulation
 * Characters, world events, thread states, and user input
 */

import type { AffectorType, AffectorConfig, LFOShape } from '../core/types.js';
import { LFO } from './lfo.js';

export interface AffectorParams {
  id: string;
  type: AffectorType;
  influence: number;
  active?: boolean;
  lfoShape?: LFOShape;
  lfoFrequency?: number;
  metadata?: Record<string, unknown>;
}

export class Affector {
  readonly id: string;
  readonly type: AffectorType;

  private _influence: number;
  private _active: boolean;
  private _lfo: LFO | null = null;
  private _metadata: Record<string, unknown>;

  constructor(params: AffectorParams) {
    this.id = params.id;
    this.type = params.type;
    this._influence = Math.max(-1, Math.min(1, params.influence));
    this._active = params.active ?? true;
    this._metadata = params.metadata ?? {};

    if (params.lfoShape) {
      this._lfo = new LFO({
        shape: params.lfoShape,
        frequency: params.lfoFrequency ?? 0.5,
        amplitude: 1.0,
      });
      this._lfo.start();
    }
  }

  /**
   * Get the base influence value (-1.0 to +1.0)
   */
  get influence(): number {
    return this._influence;
  }

  /**
   * Set the influence value
   */
  setInfluence(value: number): this {
    this._influence = Math.max(-1, Math.min(1, value));
    return this;
  }

  /**
   * Check if active
   */
  get active(): boolean {
    return this._active;
  }

  /**
   * Activate the affector
   */
  activate(): this {
    this._active = true;
    return this;
  }

  /**
   * Deactivate the affector
   */
  deactivate(): this {
    this._active = false;
    return this;
  }

  /**
   * Toggle active state
   */
  toggle(): this {
    this._active = !this._active;
    return this;
  }

  /**
   * Get the current effective influence (with LFO modulation if present)
   */
  getCurrentInfluence(timestamp?: number): number {
    if (!this._active) return 0;

    let value = this._influence;

    if (this._lfo) {
      const lfoValue = this._lfo.tick(timestamp);
      // LFO modulates the influence, not replaces it
      value = value * (0.5 + lfoValue * 0.5);
    }

    return value;
  }

  /**
   * Get metadata
   */
  get metadata(): Record<string, unknown> {
    return { ...this._metadata };
  }

  /**
   * Set metadata
   */
  setMetadata(key: string, value: unknown): this {
    this._metadata[key] = value;
    return this;
  }

  /**
   * Get attached LFO
   */
  get lfo(): LFO | null {
    return this._lfo;
  }

  /**
   * Attach an LFO
   */
  attachLFO(lfo: LFO): this {
    this._lfo = lfo;
    this._lfo.start();
    return this;
  }

  /**
   * Detach LFO
   */
  detachLFO(): this {
    if (this._lfo) {
      this._lfo.stop();
      this._lfo = null;
    }
    return this;
  }

  /**
   * Export to config
   */
  toConfig(): AffectorConfig {
    return {
      type: this.type,
      id: this.id,
      influence: this._influence,
      active: this._active,
    };
  }

  /**
   * Create from config
   */
  static fromConfig(config: AffectorConfig & { lfoShape?: LFOShape; lfoFrequency?: number }): Affector {
    return new Affector({
      id: config.id,
      type: config.type,
      influence: config.influence,
      active: config.active,
      lfoShape: config.lfoShape,
      lfoFrequency: config.lfoFrequency,
    });
  }
}

/**
 * CharacterAffector - Represents an AI character's influence
 */
export class CharacterAffector extends Affector {
  readonly characterName: string;
  readonly mythicTags: string[];

  constructor(params: Omit<AffectorParams, 'type'> & { characterName: string; mythicTags?: string[] }) {
    super({ ...params, type: 'character' });
    this.characterName = params.characterName;
    this.mythicTags = params.mythicTags ?? [];
  }

  /**
   * Check if character has a specific mythic tag
   */
  hasTag(tag: string): boolean {
    return this.mythicTags.includes(tag.toUpperCase());
  }
}

/**
 * WorldAffector - Represents environmental influences
 */
export class WorldAffector extends Affector {
  readonly eventType: string;

  constructor(params: Omit<AffectorParams, 'type'> & { eventType: string }) {
    super({ ...params, type: 'world' });
    this.eventType = params.eventType;
  }

  /**
   * Create common world affectors
   */
  static weather(condition: 'rain' | 'sun' | 'storm' | 'fog' | 'snow', intensity: number): WorldAffector {
    const influences: Record<string, number> = {
      rain: -0.3,
      sun: 0.5,
      storm: -0.7,
      fog: -0.2,
      snow: -0.1,
    };

    return new WorldAffector({
      id: `weather_${condition}`,
      eventType: 'weather',
      influence: (influences[condition] ?? 0) * intensity,
      metadata: { condition, intensity },
    });
  }

  static moonPhase(phase: 'new' | 'waxing' | 'full' | 'waning'): WorldAffector {
    const influences: Record<string, number> = {
      new: -1.0,
      waxing: 0.3,
      full: 1.0,
      waning: -0.3,
    };

    return new WorldAffector({
      id: `moon_${phase}`,
      eventType: 'moon',
      influence: influences[phase] ?? 0,
      lfoShape: 'moon_phase',
      lfoFrequency: 1,
      metadata: { phase },
    });
  }

  static timeOfDay(hour: number): WorldAffector {
    // Sine wave peaking at noon (12), lowest at midnight (0/24)
    const normalizedHour = (hour % 24) / 24;
    const influence = Math.sin((normalizedHour - 0.25) * Math.PI * 2);

    return new WorldAffector({
      id: 'time_of_day',
      eventType: 'time',
      influence,
      metadata: { hour },
    });
  }
}

/**
 * ThreadAffector - Represents narrative/thread state influences
 */
export class ThreadAffector extends Affector {
  readonly threadId: string;
  readonly recursionLevel: number;

  constructor(params: Omit<AffectorParams, 'type'> & { threadId: string; recursionLevel?: number }) {
    super({ ...params, type: 'thread' });
    this.threadId = params.threadId;
    this.recursionLevel = params.recursionLevel ?? 0;
  }

  /**
   * Influence increases with recursion depth
   */
  getRecursiveInfluence(): number {
    const base = this.getCurrentInfluence();
    const recursionMultiplier = 1 + (this.recursionLevel * 0.1);
    return Math.max(-1, Math.min(1, base * recursionMultiplier));
  }
}

/**
 * UserAffector - Represents user emotional/input state
 */
export class UserAffector extends Affector {
  readonly userId: string;

  constructor(params: Omit<AffectorParams, 'type'> & { userId: string }) {
    super({ ...params, type: 'user' });
    this.userId = params.userId;
  }

  /**
   * Update influence based on sentiment analysis
   */
  updateFromSentiment(sentiment: number): this {
    // Sentiment expected to be -1.0 (negative) to +1.0 (positive)
    this.setInfluence(sentiment);
    return this;
  }
}
