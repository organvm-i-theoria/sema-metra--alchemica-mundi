/**
 * RitualEngine - FUSE_LOCK ritual execution system
 * Combines duality conditions, binary locks, and fusion signals
 */

import type {
  RitualDefinition,
  RitualResult,
  RitualEffect,
  RitualCondition,
  BinaryState,
} from '../core/types.js';
import type { SemaMetra } from '../core/system.js';
import {
  evaluateCondition,
  dualityThreshold,
  binaryState,
  type ConditionResult,
} from './condition.js';
import { FusionEngine, type FusionResult } from './fusion.js';

export interface RitualExecutionContext {
  timestamp: number;
  dualityResults: ConditionResult[];
  binaryResult: ConditionResult | null;
  fusionResult: FusionResult | null;
  effects: RitualEffect[];
}

export class RitualEngine {
  private _matrix: SemaMetra;
  private _fusionEngine: FusionEngine;
  private _rituals: Map<string, RitualDefinition> = new Map();
  private _effectHandlers: Map<string, (effect: RitualEffect, matrix: SemaMetra) => void> = new Map();

  constructor(matrix: SemaMetra) {
    this._matrix = matrix;
    this._fusionEngine = new FusionEngine();
    this.initializeDefaultEffectHandlers();
  }

  /**
   * Initialize default effect handlers
   */
  private initializeDefaultEffectHandlers(): void {
    // UI effects
    this._effectHandlers.set('ui', (effect) => {
      console.log(`[RITUAL UI] ${effect.target}: ${effect.value}`);
    });

    // Language mode effects
    this._effectHandlers.set('language', (effect) => {
      console.log(`[RITUAL LANG] ${effect.target}: ${effect.value}`);
    });

    // Synth patch effects
    this._effectHandlers.set('synth', (effect) => {
      console.log(`[RITUAL SYNTH] ${effect.target}: ${effect.value}`);
    });

    // Character effects
    this._effectHandlers.set('character', (effect) => {
      console.log(`[RITUAL CHAR] ${effect.target}: ${effect.value}`);
    });

    // Mode effects
    this._effectHandlers.set('mode', (effect) => {
      console.log(`[RITUAL MODE] ${effect.target}: ${effect.value}`);
    });
  }

  /**
   * Get the fusion engine
   */
  get fusionEngine(): FusionEngine {
    return this._fusionEngine;
  }

  /**
   * Register a ritual definition
   */
  registerRitual(ritual: RitualDefinition): this {
    this._rituals.set(ritual.name, ritual);
    return this;
  }

  /**
   * Get a registered ritual
   */
  getRitual(name: string): RitualDefinition | undefined {
    return this._rituals.get(name);
  }

  /**
   * Get all registered rituals
   */
  getAllRituals(): RitualDefinition[] {
    return Array.from(this._rituals.values());
  }

  /**
   * Register a custom effect handler
   */
  registerEffectHandler(
    type: string,
    handler: (effect: RitualEffect, matrix: SemaMetra) => void
  ): this {
    this._effectHandlers.set(type, handler);
    return this;
  }

  /**
   * Execute a ritual by name
   */
  execute(ritualName: string): RitualResult {
    const ritual = this._rituals.get(ritualName);
    if (!ritual) {
      return {
        success: false,
        fusionSignal: null,
        conditionResults: [],
        effects: [],
        timestamp: Date.now(),
      };
    }

    return this.executeRitual(ritual);
  }

  /**
   * Execute a ritual definition
   */
  executeRitual(ritual: RitualDefinition): RitualResult {
    const timestamp = Date.now();
    const conditionResults: Array<{ condition: RitualCondition; passed: boolean }> = [];
    let allConditionsPassed = true;

    // Evaluate duality conditions
    const dualityConditions: RitualCondition[] = ritual.dualityConditions.map((dc) =>
      dualityThreshold(dc.id, dc.threshold)
    );

    for (const condition of dualityConditions) {
      const result = evaluateCondition(condition, this._matrix);
      conditionResults.push({ condition, passed: result.passed });
      if (!result.passed) allConditionsPassed = false;
    }

    // Evaluate binary lock
    const binaryCondition = binaryState(ritual.binaryLock.id, ritual.binaryLock.requiredState);
    const binaryResult = evaluateCondition(binaryCondition, this._matrix);
    conditionResults.push({ condition: binaryCondition, passed: binaryResult.passed });

    if (!binaryResult.passed) allConditionsPassed = false;

    // Determine success and effects
    const success = allConditionsPassed;
    const appliedEffects: RitualEffect[] = [];

    if (success) {
      // Apply ritual effects
      for (const effect of ritual.effects) {
        this.applyEffect(effect);
        appliedEffects.push(effect);
      }
    }

    const result: RitualResult = {
      success,
      fusionSignal: success ? ritual.fusionSignal : null,
      conditionResults,
      effects: appliedEffects,
      timestamp,
    };

    // Store result and emit event
    this._matrix.setLastRitualResult(result);
    this._matrix.emitEvent('ritual:executed', {
      ritualName: ritual.name,
      result,
    });

    return result;
  }

  /**
   * Quick ritual execution with inline definition
   */
  executeQuick(params: {
    dualityConditions: Array<{ id: number; threshold: number }>;
    binaryLock: { id: string; requiredState: BinaryState };
    fusionSignal: string;
    effects?: RitualEffect[];
  }): RitualResult {
    const ritual: RitualDefinition = {
      name: `quick_${Date.now()}`,
      dualityConditions: params.dualityConditions,
      fusionSignal: params.fusionSignal,
      binaryLock: params.binaryLock,
      effects: params.effects ?? [],
    };

    return this.executeRitual(ritual);
  }

  /**
   * Apply a ritual effect
   */
  private applyEffect(effect: RitualEffect): void {
    const handler = this._effectHandlers.get(effect.type);
    if (handler) {
      try {
        handler(effect, this._matrix);
      } catch (error) {
        console.error(`Error applying ritual effect ${effect.type}:`, error);
      }
    }
  }

  /**
   * Check if a ritual would pass without executing it
   */
  check(ritualName: string): {
    wouldPass: boolean;
    conditions: Array<{ description: string; passed: boolean }>;
  } {
    const ritual = this._rituals.get(ritualName);
    if (!ritual) {
      return { wouldPass: false, conditions: [] };
    }

    const conditions: Array<{ description: string; passed: boolean }> = [];

    // Check duality conditions
    for (const dc of ritual.dualityConditions) {
      const duality = this._matrix.dualities.get(dc.id);
      const passed = duality ? duality.value >= dc.threshold : false;
      conditions.push({
        description: `D${dc.id} >= ${dc.threshold}`,
        passed,
      });
    }

    // Check binary lock
    const binary = this._matrix.binaries.get(ritual.binaryLock.id);
    const binaryPassed = binary ? binary.matches(ritual.binaryLock.requiredState) : false;
    conditions.push({
      description: `${ritual.binaryLock.id} = ${ritual.binaryLock.requiredState}`,
      passed: binaryPassed,
    });

    const wouldPass = conditions.every((c) => c.passed);

    return { wouldPass, conditions };
  }

  /**
   * Generate a fusion for the ritual's dualities
   */
  generateFusion(ritualName: string): FusionResult | null {
    const ritual = this._rituals.get(ritualName);
    if (!ritual) return null;

    const inputs = ritual.dualityConditions.map((dc) => ({
      dualityId: dc.id,
      weight: 1,
    }));

    return this._fusionEngine.fuse(inputs, this._matrix);
  }
}

/**
 * Pre-built ritual definitions from the specification
 */
export const RITUAL_DEFINITIONS = {
  D3VOT10N_G4T3: {
    name: 'D3VOT10N_G4T3',
    dualityConditions: [
      { id: 13, threshold: 0.9 }, // divine >= 0.9
      { id: 7, threshold: -0.4 }, // glitch (note: threshold is for comparison, actual check is value >= threshold)
    ],
    fusionSignal: 'SH1MM3R_FR4CTURE',
    binaryLock: { id: 'B05', requiredState: 'A' as BinaryState }, // create
    effects: [
      { type: 'character', target: 'jessica', value: 'fractured_voice_mode' },
      { type: 'synth', target: 'delay', value: 'activated' },
      { type: 'mode', target: 'system', value: 'recursive_prayer' },
    ],
  } satisfies RitualDefinition,

  GLITCH_SUMMON: {
    name: 'GLITCH_SUMMON',
    dualityConditions: [
      { id: 7, threshold: -0.7 }, // synthetic strongly left (glitch)
      { id: 18, threshold: -0.5 }, // volatile
    ],
    fusionSignal: 'GL1TCH_SP1KE',
    binaryLock: { id: 'B18', requiredState: 'B' as BinaryState }, // corrupt
    effects: [
      { type: 'ui', target: 'display', value: 'glitch_overlay' },
      { type: 'synth', target: 'bitcrusher', value: 0.8 },
      { type: 'mode', target: 'text', value: 'fragmented' },
    ],
  } satisfies RitualDefinition,

  DREAM_GATE: {
    name: 'DREAM_GATE',
    dualityConditions: [
      { id: 21, threshold: -0.6 }, // dream side
      { id: 46, threshold: -0.5 }, // dreaming body
    ],
    fusionSignal: 'SL33P_W4V3',
    binaryLock: { id: 'B17', requiredState: 'B' as BinaryState }, // asleep
    effects: [
      { type: 'ui', target: 'blur', value: 0.7 },
      { type: 'synth', target: 'reverb', value: 'cathedral' },
      { type: 'language', target: 'mode', value: 'metaphoric' },
    ],
  } satisfies RitualDefinition,

  MEMORY_SEAL: {
    name: 'MEMORY_SEAL',
    dualityConditions: [
      { id: 40, threshold: -0.8 }, // erasure side
      { id: 24, threshold: -0.5 }, // synthetic memory
    ],
    fusionSignal: 'V01D_L0CK',
    binaryLock: { id: 'B32', requiredState: 'B' as BinaryState }, // erased
    effects: [
      { type: 'mode', target: 'memory', value: 'sealed' },
      { type: 'synth', target: 'freeze', value: 'active' },
      { type: 'ui', target: 'opacity', value: 0.3 },
    ],
  } satisfies RitualDefinition,
} as const;
