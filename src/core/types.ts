/**
 * Core type definitions for the Synth-Wave-Modules system
 */

// Domain types for dualities
export type DualityDomain =
  | 'metaphysical'
  | 'structural'
  | 'narrative'
  | 'myth'
  | 'psychological'
  | 'temporal'
  | 'av'
  | 'technical'
  | 'epistemology'
  | 'language'
  | 'memory'
  | 'dialogic'
  | 'spatial'
  | 'behavioral'
  | 'visual'
  | 'semiotic'
  | 'event origin'
  | 'audio'
  | 'myth/energy'
  | 'economic'
  | 'sound/memory'
  | 'myth/place'
  | 'ritual/time'
  | 'system logic'
  | 'mood'
  | 'memory/design'
  | 'myth/cycle';

// Binary domain types
export type BinaryDomain =
  | 'power'
  | 'logic'
  | 'system'
  | 'process'
  | 'ritual'
  | 'access'
  | 'spatial'
  | 'UI/UX'
  | 'metaphysical'
  | 'storage'
  | 'visual'
  | 'moral'
  | 'outcome'
  | 'gatekeeper'
  | 'biological'
  | 'technical'
  | 'state'
  | 'code'
  | 'security'
  | 'signal'
  | 'decision'
  | 'timing'
  | 'identity'
  | 'permission'
  | 'integrity'
  | 'time'
  | 'motion'
  | 'control'
  | 'memory';

// Hybrid mode types
export type HybridMode =
  | 'concealment'
  | 'identity'
  | 'divinity'
  | 'communication'
  | 'access'
  | 'memory'
  | 'system flow'
  | 'tone'
  | 'authority'
  | 'recursion'
  | 'time'
  | 'coherence'
  | 'pacing'
  | 'access/memory'
  | 'transformation';

// Dice types for RNG
export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100' | 'd1000';

// Die ranges mapping
export const DIE_RANGES: Record<DieType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
  d100: 100,
  d1000: 1000,
};

// LFO wave shapes
export type LFOShape = 'sine' | 'saw' | 'square' | 'step' | 'random' | 'moon_phase';

// Duality definition from data file
export interface DualityDefinition {
  id: number;
  leftPole: string;
  rightPole: string;
  domain: DualityDomain;
  rng: DieType;
  tags: string[];
  fusionHook: string;
}

// Binary definition from data file
export interface BinaryDefinition {
  id: string;
  stateA: string;
  stateB: string;
  domain: BinaryDomain;
  signalType: string;
}

// Hybrid definition from data file
export interface HybridDefinition {
  id: string;
  conditionA: string;
  conditionB: string;
  mode: HybridMode;
  description: string;
}

// Bridge mapping from data file
export interface BridgeMapping {
  pairId: string;
  dualityA: number;
  dualityB: number;
  binaryId: string;
  lockType: string;
}

// FX god definition
export interface FXGodDefinition {
  id: string;
  godName: string;
  effectType: string;
  role: string;
  toneModule: string;
}

// Binary state enum
export type BinaryState = 'A' | 'B';

// Hybrid condition state
export type HybridCondition = 'A' | 'B' | 'transitioning';

// Affector types for modulation
export type AffectorType = 'character' | 'world' | 'thread' | 'user';

// Affector configuration
export interface AffectorConfig {
  type: AffectorType;
  id: string;
  influence: number; // -1.0 to +1.0
  active: boolean;
}

// LFO configuration
export interface LFOConfig {
  shape: LFOShape;
  frequency: number; // Hz
  amplitude: number; // 0.0 to 1.0
  phase: number; // 0.0 to 1.0
}

// Modulation target
export interface ModulationTarget {
  dualityId: number;
  lfo?: LFOConfig;
  affectors: AffectorConfig[];
}

// Ritual condition
export interface RitualCondition {
  type: 'duality' | 'binary' | 'hybrid';
  id: number | string;
  operator: '=' | '>' | '<' | '>=' | '<=' | '!=';
  value: number | string | boolean;
}

// Ritual definition
export interface RitualDefinition {
  name: string;
  dualityConditions: Array<{ id: number; threshold: number }>;
  fusionSignal: string;
  binaryLock: { id: string; requiredState: BinaryState };
  effects: RitualEffect[];
}

// Ritual effect
export interface RitualEffect {
  type: 'ui' | 'language' | 'synth' | 'character' | 'mode';
  target: string;
  value: string | number | boolean;
}

// Ritual execution result
export interface RitualResult {
  success: boolean;
  fusionSignal: string | null;
  conditionResults: Array<{ condition: RitualCondition; passed: boolean }>;
  effects: RitualEffect[];
  timestamp: number;
}

// Patch structure
export interface Patch {
  name: string;
  version: string;
  dualities: Record<number, number>;
  binaries: Record<string, BinaryState>;
  hybrids: Record<string, HybridCondition>;
  lfoConfigs: Record<number, LFOConfig>;
  affectors: AffectorConfig[];
  fxChain: string[];
  metadata?: Record<string, unknown>;
}

// Character waveform model
export interface CharacterWaveform {
  signatureId: string;
  waveform: 'sine' | 'square' | 'noise' | 'pulse' | 'fractal' | 'soulwave';
  modAmplitude: number;
  frequencyBase: number;
  fusionCompatible: readonly string[];
  mythicTags: readonly string[];
  alignedEvents: readonly string[];
}

// System state snapshot
export interface SystemState {
  timestamp: number;
  dualities: Map<number, number>;
  binaries: Map<string, BinaryState>;
  hybrids: Map<string, HybridCondition>;
  activeAffectors: AffectorConfig[];
  activeLFOs: Map<number, LFOConfig>;
  lastRitualResult: RitualResult | null;
}

// Event types for system notifications
export type SystemEventType =
  | 'duality:changed'
  | 'binary:toggled'
  | 'hybrid:transitioned'
  | 'ritual:executed'
  | 'modulation:tick'
  | 'rng:rolled'
  | 'patch:loaded'
  | 'patch:saved';

// System event
export interface SystemEvent {
  type: SystemEventType;
  timestamp: number;
  data: unknown;
}

// Event listener type
export type SystemEventListener = (event: SystemEvent) => void;
