/**
 * FX unit type definitions
 * Supports both symbolic state and audio processing modes
 */

import type { FXGodDefinition } from '../core/types.js';

export type FXMode = 'symbolic' | 'audio';

export interface FXParameter {
  name: string;
  value: number;
  min: number;
  max: number;
  defaultValue: number;
  unit?: string;
}

export interface FXUnitState {
  id: string;
  godName: string;
  enabled: boolean;
  parameters: Record<string, number>;
  mode: FXMode;
}

export interface FXUnitConfig {
  definition: FXGodDefinition;
  parameters?: Record<string, number>;
  enabled?: boolean;
}

export interface FXChainConfig {
  units: string[];
  connections: Array<{ from: string; to: string }>;
  wet: number;
}

/**
 * Base FX unit interface
 */
export interface IFXUnit {
  readonly id: string;
  readonly godName: string;
  readonly effectType: string;
  readonly role: string;
  readonly toneModule: string;

  enabled: boolean;
  mode: FXMode;

  getParameter(name: string): number | undefined;
  setParameter(name: string, value: number): void;
  getParameters(): Record<string, FXParameter>;

  enable(): void;
  disable(): void;
  bypass(): void;

  getState(): FXUnitState;
  setState(state: Partial<FXUnitState>): void;

  connect(target: IFXUnit): void;
  disconnect(): void;
}
