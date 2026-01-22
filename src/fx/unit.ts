/**
 * FX Unit implementation
 * Base class for all FX units with symbolic + audio mode support
 */

import type { FXGodDefinition } from '../core/types.js';
import type { FXMode, FXParameter, FXUnitState, IFXUnit } from './types.js';

export class FXUnit implements IFXUnit {
  readonly id: string;
  readonly godName: string;
  readonly effectType: string;
  readonly role: string;
  readonly toneModule: string;

  private _enabled: boolean = true;
  private _mode: FXMode = 'symbolic';
  private _parameters: Map<string, FXParameter> = new Map();
  private _connections: Set<IFXUnit> = new Set();

  // Audio node reference (set when in audio mode)
  protected _audioNode: unknown = null;

  constructor(definition: FXGodDefinition) {
    this.id = definition.id;
    this.godName = definition.godName;
    this.effectType = definition.effectType;
    this.role = definition.role;
    this.toneModule = definition.toneModule;

    this.initializeDefaultParameters();
  }

  /**
   * Initialize default parameters based on FX type
   */
  protected initializeDefaultParameters(): void {
    // Common parameters for all FX units
    this.addParameter('wet', 1.0, 0, 1, 'mix');
    this.addParameter('bypass', 0, 0, 1, 'bool');

    // Type-specific parameters
    switch (this.toneModule.toLowerCase()) {
      case 'filter':
        this.addParameter('frequency', 1000, 20, 20000, 'Hz');
        this.addParameter('resonance', 0.5, 0, 20, 'Q');
        this.addParameter('type', 0, 0, 3, 'enum'); // 0=lp, 1=hp, 2=bp, 3=notch
        break;

      case 'reverb':
      case 'freeverb':
        this.addParameter('decay', 2.0, 0.1, 20, 's');
        this.addParameter('preDelay', 0.01, 0, 0.5, 's');
        this.addParameter('roomSize', 0.7, 0, 1, 'ratio');
        break;

      case 'feedbackdelay':
        this.addParameter('delayTime', 0.25, 0, 2, 's');
        this.addParameter('feedback', 0.5, 0, 1, 'ratio');
        break;

      case 'distortion':
        this.addParameter('distortion', 0.4, 0, 1, 'ratio');
        this.addParameter('oversample', 0, 0, 2, 'enum');
        break;

      case 'compressor':
        this.addParameter('threshold', -24, -60, 0, 'dB');
        this.addParameter('ratio', 4, 1, 20, 'ratio');
        this.addParameter('attack', 0.003, 0, 1, 's');
        this.addParameter('release', 0.25, 0, 1, 's');
        this.addParameter('knee', 30, 0, 40, 'dB');
        break;

      case 'gate':
        this.addParameter('threshold', -40, -100, 0, 'dB');
        this.addParameter('attack', 0.01, 0, 1, 's');
        this.addParameter('release', 0.1, 0, 1, 's');
        break;

      case 'pitchshift':
        this.addParameter('pitch', 0, -24, 24, 'semitones');
        this.addParameter('windowSize', 0.1, 0.01, 1, 's');
        break;

      case 'bitcrusher':
        this.addParameter('bits', 8, 1, 16, 'bits');
        this.addParameter('sampleRate', 22050, 100, 44100, 'Hz');
        break;

      case 'waveshaper':
        this.addParameter('amount', 0.5, 0, 1, 'ratio');
        this.addParameter('oversample', 2, 0, 4, 'enum');
        break;

      default:
        // Generic effect parameter
        this.addParameter('amount', 0.5, 0, 1, 'ratio');
    }
  }

  /**
   * Add a parameter to this unit
   */
  protected addParameter(
    name: string,
    defaultValue: number,
    min: number,
    max: number,
    unit?: string
  ): void {
    this._parameters.set(name, {
      name,
      value: defaultValue,
      min,
      max,
      defaultValue,
      unit,
    });
  }

  // IFXUnit implementation

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
  }

  get mode(): FXMode {
    return this._mode;
  }

  set mode(value: FXMode) {
    this._mode = value;
  }

  getParameter(name: string): number | undefined {
    return this._parameters.get(name)?.value;
  }

  setParameter(name: string, value: number): void {
    const param = this._parameters.get(name);
    if (param) {
      param.value = Math.max(param.min, Math.min(param.max, value));

      // If in audio mode and audio node exists, sync the parameter
      if (this._mode === 'audio' && this._audioNode) {
        this.syncAudioParameter(name, param.value);
      }
    }
  }

  getParameters(): Record<string, FXParameter> {
    const result: Record<string, FXParameter> = {};
    for (const [key, param] of this._parameters) {
      result[key] = { ...param };
    }
    return result;
  }

  enable(): void {
    this._enabled = true;
    this.setParameter('bypass', 0);
  }

  disable(): void {
    this._enabled = false;
    this.setParameter('bypass', 1);
  }

  bypass(): void {
    this.disable();
  }

  getState(): FXUnitState {
    const parameters: Record<string, number> = {};
    for (const [key, param] of this._parameters) {
      parameters[key] = param.value;
    }

    return {
      id: this.id,
      godName: this.godName,
      enabled: this._enabled,
      parameters,
      mode: this._mode,
    };
  }

  setState(state: Partial<FXUnitState>): void {
    if (state.enabled !== undefined) {
      this._enabled = state.enabled;
    }
    if (state.mode !== undefined) {
      this._mode = state.mode;
    }
    if (state.parameters) {
      for (const [key, value] of Object.entries(state.parameters)) {
        this.setParameter(key, value);
      }
    }
  }

  connect(target: IFXUnit): void {
    this._connections.add(target);
    // Audio connection would happen here in audio mode
  }

  disconnect(): void {
    this._connections.clear();
    // Audio disconnection would happen here in audio mode
  }

  /**
   * Sync parameter to audio node (override in subclasses for audio mode)
   */
  protected syncAudioParameter(_name: string, _value: number): void {
    // Override in audio-enabled subclasses
  }

  /**
   * Get a formatted description for display
   */
  toString(): string {
    return `${this.godName} [${this.id}] - ${this.role}`;
  }

  /**
   * Reset all parameters to defaults
   */
  reset(): void {
    for (const param of this._parameters.values()) {
      param.value = param.defaultValue;
    }
  }
}
