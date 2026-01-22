/**
 * Fusion signal generator
 * Combines duality states to generate fusion signals/outputs
 */

import type { SemaMetra } from '../core/system.js';

export interface FusionInput {
  dualityId: number;
  weight?: number;
}

export interface FusionResult {
  signal: string;
  score: number;
  inputs: Array<{ dualityId: number; value: number; contribution: number }>;
  characteristics: FusionCharacteristics;
}

export interface FusionCharacteristics {
  polarity: 'positive' | 'negative' | 'neutral';
  intensity: 'low' | 'medium' | 'high' | 'extreme';
  alignment: 'harmonic' | 'dissonant' | 'mixed';
  dominantPole: string | null;
}

/**
 * FusionEngine - Generates fusion signals from duality combinations
 */
export class FusionEngine {
  private _signalMap: Map<string, (score: number, chars: FusionCharacteristics) => string>;

  constructor() {
    this._signalMap = new Map();
    this.initializeDefaultSignals();
  }

  /**
   * Initialize default signal mappings
   */
  private initializeDefaultSignals(): void {
    // High positive harmonics
    this._signalMap.set('high_positive_harmonic', () => 'SH1MM3R_ASCEND');
    this._signalMap.set('extreme_positive_harmonic', () => 'D1V1N3_OVERFLOW');

    // High negative harmonics
    this._signalMap.set('high_negative_harmonic', () => 'V01D_DESCENT');
    this._signalMap.set('extreme_negative_harmonic', () => 'ABY55_CALL');

    // Dissonant combinations
    this._signalMap.set('high_positive_dissonant', () => 'GL1TCH_BURST');
    this._signalMap.set('high_negative_dissonant', () => 'FR4CTUR3_SP1RAL');
    this._signalMap.set('extreme_dissonant', () => 'CH40S_T34R');

    // Neutral states
    this._signalMap.set('neutral_harmonic', () => 'EQU1L1BR1UM');
    this._signalMap.set('neutral_mixed', () => 'L1MB0_DR1FT');

    // Default fallback
    this._signalMap.set('default', () => 'S1GN4L_FLUX');
  }

  /**
   * Generate a fusion from multiple duality inputs
   */
  fuse(inputs: FusionInput[], matrix: SemaMetra): FusionResult {
    const inputDetails: Array<{ dualityId: number; value: number; contribution: number }> = [];
    let totalScore = 0;
    let totalWeight = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let dominantPole: string | null = null;
    let maxIntensity = 0;

    for (const input of inputs) {
      const duality = matrix.dualities.get(input.dualityId);
      if (!duality) continue;

      const weight = input.weight ?? 1;
      const value = duality.value;
      const contribution = value * weight;

      inputDetails.push({
        dualityId: input.dualityId,
        value,
        contribution,
      });

      totalScore += contribution;
      totalWeight += weight;

      if (value > 0.3) positiveCount++;
      if (value < -0.3) negativeCount++;

      if (Math.abs(value) > maxIntensity) {
        maxIntensity = Math.abs(value);
        dominantPole = value > 0 ? duality.rightPole : duality.leftPole;
      }
    }

    // Normalize score
    const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    // Determine characteristics
    const characteristics = this.calculateCharacteristics(
      normalizedScore,
      positiveCount,
      negativeCount,
      maxIntensity,
      dominantPole
    );

    // Generate signal name
    const signal = this.generateSignal(normalizedScore, characteristics);

    return {
      signal,
      score: normalizedScore,
      inputs: inputDetails,
      characteristics,
    };
  }

  /**
   * Quick fusion of two dualities
   */
  fusePair(
    dualityIdA: number,
    dualityIdB: number,
    matrix: SemaMetra
  ): FusionResult {
    return this.fuse(
      [
        { dualityId: dualityIdA, weight: 1 },
        { dualityId: dualityIdB, weight: 1 },
      ],
      matrix
    );
  }

  /**
   * Calculate fusion characteristics
   */
  private calculateCharacteristics(
    score: number,
    positiveCount: number,
    negativeCount: number,
    maxIntensity: number,
    dominantPole: string | null
  ): FusionCharacteristics {
    // Polarity
    let polarity: 'positive' | 'negative' | 'neutral';
    if (score > 0.2) polarity = 'positive';
    else if (score < -0.2) polarity = 'negative';
    else polarity = 'neutral';

    // Intensity
    let intensity: 'low' | 'medium' | 'high' | 'extreme';
    if (maxIntensity >= 0.9) intensity = 'extreme';
    else if (maxIntensity >= 0.7) intensity = 'high';
    else if (maxIntensity >= 0.4) intensity = 'medium';
    else intensity = 'low';

    // Alignment
    let alignment: 'harmonic' | 'dissonant' | 'mixed';
    if (positiveCount > 0 && negativeCount > 0) {
      alignment = Math.abs(positiveCount - negativeCount) <= 1 ? 'dissonant' : 'mixed';
    } else {
      alignment = 'harmonic';
    }

    return {
      polarity,
      intensity,
      alignment,
      dominantPole,
    };
  }

  /**
   * Generate signal name from score and characteristics
   */
  private generateSignal(score: number, chars: FusionCharacteristics): string {
    // Build key for signal lookup
    const key = `${chars.intensity}_${chars.polarity}_${chars.alignment}`;

    // Try specific key first
    let signalFn = this._signalMap.get(key);
    if (signalFn) {
      return signalFn(score, chars);
    }

    // Try intensity + alignment
    const fallbackKey = `${chars.intensity}_${chars.alignment}`;
    signalFn = this._signalMap.get(fallbackKey);
    if (signalFn) {
      return signalFn(score, chars);
    }

    // Default
    signalFn = this._signalMap.get('default')!;
    return signalFn(score, chars);
  }

  /**
   * Register a custom signal mapping
   */
  registerSignal(
    key: string,
    generator: (score: number, chars: FusionCharacteristics) => string
  ): this {
    this._signalMap.set(key, generator);
    return this;
  }

  /**
   * Create a named fusion signal (static output)
   */
  static namedSignal(name: string): (score: number, chars: FusionCharacteristics) => string {
    return () => name;
  }
}

/**
 * Pre-defined fusion combinations for common rituals
 */
export const FUSION_PRESETS = {
  // Divine + Glitch = Shimmer Fracture
  devotionGate: (matrix: SemaMetra): FusionResult => {
    const engine = new FusionEngine();
    engine.registerSignal('default', () => 'SH1MM3R_FR4CTURE');
    return engine.fuse([{ dualityId: 13 }, { dualityId: 7 }], matrix);
  },

  // Chaos + Order = Synth Base
  chaosOrder: (matrix: SemaMetra): FusionResult => {
    const engine = new FusionEngine();
    engine.registerSignal('default', () => 'SYNTH_B4S3_MOD');
    return engine.fuse([{ dualityId: 4 }], matrix);
  },

  // Dream + Awake = Sleep Wave
  dreamWake: (matrix: SemaMetra): FusionResult => {
    const engine = new FusionEngine();
    engine.registerSignal('default', () => 'SL33PW4V3_MODE');
    return engine.fuse([{ dualityId: 21 }, { dualityId: 46 }], matrix);
  },

  // Archive + Erasure = Memory Gate
  memoryGate: (matrix: SemaMetra): FusionResult => {
    const engine = new FusionEngine();
    engine.registerSignal('default', () => 'M3M0RY_G4T3');
    return engine.fuse([{ dualityId: 40 }], matrix);
  },
} as const;
