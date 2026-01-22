/**
 * LFO (Low Frequency Oscillator) implementation
 * Supports multiple wave shapes for modulating dualities
 */

import type { LFOShape, LFOConfig } from '../core/types.js';

export interface LFOState {
  phase: number;
  value: number;
  lastTick: number;
}

export class LFO {
  private _shape: LFOShape;
  private _frequency: number; // Hz
  private _amplitude: number; // 0.0 to 1.0
  private _phase: number; // 0.0 to 1.0 (phase offset)
  private _running: boolean = false;
  private _startTime: number = 0;
  private _currentPhase: number = 0;
  private _currentValue: number = 0;

  // For random/step shapes
  private _lastStepPhase: number = -1;
  private _stepValue: number = 0;

  constructor(config: Partial<LFOConfig> = {}) {
    this._shape = config.shape ?? 'sine';
    this._frequency = config.frequency ?? 1.0;
    this._amplitude = config.amplitude ?? 1.0;
    this._phase = config.phase ?? 0;
  }

  /**
   * Get current shape
   */
  get shape(): LFOShape {
    return this._shape;
  }

  /**
   * Set shape
   */
  setShape(shape: LFOShape): this {
    this._shape = shape;
    return this;
  }

  /**
   * Get frequency in Hz
   */
  get frequency(): number {
    return this._frequency;
  }

  /**
   * Set frequency in Hz
   */
  setFrequency(hz: number): this {
    this._frequency = Math.max(0.001, hz);
    return this;
  }

  /**
   * Get amplitude (0.0 to 1.0)
   */
  get amplitude(): number {
    return this._amplitude;
  }

  /**
   * Set amplitude (clamped to 0.0-1.0)
   */
  setAmplitude(amp: number): this {
    this._amplitude = Math.max(0, Math.min(1, amp));
    return this;
  }

  /**
   * Get phase offset (0.0 to 1.0)
   */
  get phase(): number {
    return this._phase;
  }

  /**
   * Set phase offset
   */
  setPhase(phase: number): this {
    this._phase = phase % 1;
    return this;
  }

  /**
   * Check if running
   */
  get running(): boolean {
    return this._running;
  }

  /**
   * Get current phase position (0.0 to 1.0)
   */
  get currentPhase(): number {
    return this._currentPhase;
  }

  /**
   * Get current output value (-amplitude to +amplitude)
   */
  get value(): number {
    return this._currentValue;
  }

  /**
   * Start the LFO
   */
  start(): this {
    this._running = true;
    this._startTime = Date.now();
    return this;
  }

  /**
   * Stop the LFO
   */
  stop(): this {
    this._running = false;
    return this;
  }

  /**
   * Reset the LFO phase
   */
  reset(): this {
    this._currentPhase = this._phase;
    this._startTime = Date.now();
    this._lastStepPhase = -1;
    return this;
  }

  /**
   * Update the LFO value (call on each tick)
   */
  tick(timestamp?: number): number {
    const now = timestamp ?? Date.now();

    if (!this._running) {
      return this._currentValue;
    }

    // Calculate phase based on elapsed time
    const elapsed = (now - this._startTime) / 1000; // seconds
    this._currentPhase = ((elapsed * this._frequency) + this._phase) % 1;

    // Calculate wave value
    this._currentValue = this.calculateWave(this._currentPhase) * this._amplitude;

    return this._currentValue;
  }

  /**
   * Get value at a specific phase (0.0 to 1.0)
   */
  valueAtPhase(phase: number): number {
    return this.calculateWave(phase % 1) * this._amplitude;
  }

  /**
   * Calculate wave value for a given phase
   */
  private calculateWave(phase: number): number {
    switch (this._shape) {
      case 'sine':
        return Math.sin(phase * Math.PI * 2);

      case 'saw':
        // Ramp from -1 to +1
        return phase * 2 - 1;

      case 'square':
        return phase < 0.5 ? 1 : -1;

      case 'step':
        // 4-step quantized wave
        const stepIndex = Math.floor(phase * 4);
        if (stepIndex !== this._lastStepPhase) {
          this._lastStepPhase = stepIndex;
          // Values: -1, -0.33, +0.33, +1
          this._stepValue = (stepIndex / 1.5) - 1;
        }
        return this._stepValue;

      case 'random':
        // Sample and hold random
        const randomPhaseIndex = Math.floor(phase * 8);
        if (randomPhaseIndex !== this._lastStepPhase) {
          this._lastStepPhase = randomPhaseIndex;
          this._stepValue = Math.random() * 2 - 1;
        }
        return this._stepValue;

      case 'moon_phase':
        // Very slow sine simulating lunar cycle
        // One complete cycle = 29.5 days
        const moonPeriod = 29.5 * 24 * 60 * 60 * 1000; // ms
        const moonPhase = ((Date.now() / moonPeriod) + phase) % 1;
        return Math.sin(moonPhase * Math.PI * 2);

      default:
        return 0;
    }
  }

  /**
   * Export configuration
   */
  toConfig(): LFOConfig {
    return {
      shape: this._shape,
      frequency: this._frequency,
      amplitude: this._amplitude,
      phase: this._phase,
    };
  }

  /**
   * Create from configuration
   */
  static fromConfig(config: LFOConfig): LFO {
    return new LFO(config);
  }

  /**
   * Get state for serialization
   */
  getState(): LFOState {
    return {
      phase: this._currentPhase,
      value: this._currentValue,
      lastTick: Date.now(),
    };
  }
}

/**
 * LFO presets for common use cases
 */
export const LFO_PRESETS = {
  // Slow breathing modulation
  breath: (): LFO => new LFO({ shape: 'sine', frequency: 0.1, amplitude: 0.5 }),

  // Fast vibrato
  vibrato: (): LFO => new LFO({ shape: 'sine', frequency: 6, amplitude: 0.2 }),

  // Slow drift
  drift: (): LFO => new LFO({ shape: 'random', frequency: 0.05, amplitude: 0.3 }),

  // Rhythmic pulse
  pulse: (): LFO => new LFO({ shape: 'square', frequency: 2, amplitude: 0.8 }),

  // Smooth sweep
  sweep: (): LFO => new LFO({ shape: 'saw', frequency: 0.2, amplitude: 0.6 }),

  // Stepped modulation
  stepped: (): LFO => new LFO({ shape: 'step', frequency: 0.5, amplitude: 0.7 }),

  // Lunar cycle
  lunar: (): LFO => new LFO({ shape: 'moon_phase', frequency: 1, amplitude: 1.0 }),
} as const;
