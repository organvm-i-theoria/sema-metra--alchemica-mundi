/**
 * Modulation module exports
 */

export { LFO, LFO_PRESETS, type LFOState } from './lfo.js';
export { RNG, globalRNG, type RollResult, type RollHistoryEntry } from './rng.js';
export {
  Affector,
  CharacterAffector,
  WorldAffector,
  ThreadAffector,
  UserAffector,
  type AffectorParams,
} from './affector.js';
export { ModulationEngine, type ModulationRoute, type ModulationTickResult } from './engine.js';
