/**
 * Ritual module tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  evaluateCondition,
  evaluateConditionsAnd,
  dualityThreshold,
  binaryState,
} from '../src/ritual/condition.js';
import { FusionEngine, FUSION_PRESETS } from '../src/ritual/fusion.js';
import { RitualEngine, RITUAL_DEFINITIONS } from '../src/ritual/engine.js';
import { SemaMetra } from '../src/core/system.js';
import type { RitualCondition, RitualDefinition } from '../src/core/types.js';

// Test system setup
function createTestSystem(): SemaMetra {
  return new SemaMetra({
    dualities: [
      { id: 7, leftPole: 'synthetic', rightPole: 'natural', domain: 'av', rng: 'd10', tags: ['texture'], fusionHook: 'glitch FX' },
      { id: 13, leftPole: 'divine', rightPole: 'profane', domain: 'myth', rng: 'd20', tags: ['sacred'], fusionHook: 'shimmer' },
      { id: 21, leftPole: 'dream', rightPole: 'awake', domain: 'psychological', rng: 'd100', tags: ['lucid'], fusionHook: 'sleepwave' },
    ],
    binaries: [
      { id: 'B05', stateA: 'create', stateB: 'destroy', domain: 'ritual', signalType: 'initiation' },
      { id: 'B17', stateA: 'awake', stateB: 'asleep', domain: 'state', signalType: 'user state flag' },
    ],
    hybrids: [
      { id: 'H01', conditionA: 'veil lifted', conditionB: 'veil lowered', mode: 'concealment', description: 'mystery threshold' },
    ],
    bridges: [],
  });
}

describe('Condition Evaluation', () => {
  let system: SynthWaveSystem;

  beforeEach(() => {
    system = createTestSystem();
  });

  describe('Duality Conditions', () => {
    it('should evaluate >= threshold', () => {
      system.setDuality(13, 0.9);

      const condition = dualityThreshold(13, 0.8, '>=');
      const result = evaluateCondition(condition, system);

      expect(result.passed).toBe(true);
      expect(result.actualValue).toBe(0.9);
    });

    it('should fail when below threshold', () => {
      system.setDuality(13, 0.5);

      const condition = dualityThreshold(13, 0.8, '>=');
      const result = evaluateCondition(condition, system);

      expect(result.passed).toBe(false);
    });

    it('should evaluate < threshold', () => {
      system.setDuality(7, -0.6);

      const condition = dualityThreshold(7, -0.4, '<');
      const result = evaluateCondition(condition, system);

      expect(result.passed).toBe(true);
    });

    it('should evaluate with tolerance for equality', () => {
      system.setDuality(13, 0.85);

      const condition: RitualCondition = { type: 'duality', id: 13, operator: '=', value: 0.85 };
      const result = evaluateCondition(condition, system);

      expect(result.passed).toBe(true);
    });
  });

  describe('Binary Conditions', () => {
    it('should evaluate binary state A', () => {
      const condition = binaryState('B05', 'A');
      const result = evaluateCondition(condition, system);

      expect(result.passed).toBe(true);
    });

    it('should fail when binary is in wrong state', () => {
      system.setBinary('B05', 'B');

      const condition = binaryState('B05', 'A');
      const result = evaluateCondition(condition, system);

      expect(result.passed).toBe(false);
    });

    it('should evaluate by state label', () => {
      const condition = binaryState('B05', 'create');
      const result = evaluateCondition(condition, system);

      expect(result.passed).toBe(true);
    });
  });

  describe('Multiple Conditions', () => {
    it('should evaluate AND conditions', () => {
      system.setDuality(13, 0.9);
      system.setDuality(7, -0.6);

      const conditions = [
        dualityThreshold(13, 0.8),
        dualityThreshold(7, -0.4, '<'),
      ];

      const result = evaluateConditionsAnd(conditions, system);
      expect(result.allPassed).toBe(true);
    });

    it('should fail AND if any condition fails', () => {
      system.setDuality(13, 0.9);
      system.setDuality(7, 0.0); // Won't pass < -0.4

      const conditions = [
        dualityThreshold(13, 0.8),
        dualityThreshold(7, -0.4, '<'),
      ];

      const result = evaluateConditionsAnd(conditions, system);
      expect(result.allPassed).toBe(false);
    });
  });
});

describe('FusionEngine', () => {
  let system: SynthWaveSystem;
  let fusionEngine: FusionEngine;

  beforeEach(() => {
    system = createTestSystem();
    fusionEngine = new FusionEngine();
  });

  it('should generate fusion from inputs', () => {
    system.setDuality(13, 0.9);
    system.setDuality(7, -0.6);

    const result = fusionEngine.fuse(
      [{ dualityId: 13 }, { dualityId: 7 }],
      system
    );

    expect(result.signal).toBeDefined();
    expect(typeof result.score).toBe('number');
    expect(result.inputs.length).toBe(2);
  });

  it('should fuse pairs', () => {
    system.setDuality(13, 0.8);
    system.setDuality(7, 0.5);

    const result = fusionEngine.fusePair(13, 7, system);

    expect(result.characteristics.polarity).toBeDefined();
    expect(result.characteristics.intensity).toBeDefined();
  });

  it('should determine correct characteristics', () => {
    system.setDuality(13, 1.0);
    system.setDuality(7, 0.9);

    const result = fusionEngine.fuse(
      [{ dualityId: 13 }, { dualityId: 7 }],
      system
    );

    expect(result.characteristics.polarity).toBe('positive');
    expect(['high', 'extreme']).toContain(result.characteristics.intensity);
    expect(result.characteristics.alignment).toBe('harmonic');
  });

  it('should detect dissonant alignment', () => {
    system.setDuality(13, 0.9);
    system.setDuality(7, -0.8);

    const result = fusionEngine.fuse(
      [{ dualityId: 13 }, { dualityId: 7 }],
      system
    );

    expect(['dissonant', 'mixed']).toContain(result.characteristics.alignment);
  });

  it('should use preset fusions', () => {
    system.setDuality(13, 0.9);
    system.setDuality(7, 0.5);

    const result = FUSION_PRESETS.devotionGate(system);
    // Signal depends on fusion characteristics which are calculated from values
    expect(result.signal).toBeDefined();
    expect(typeof result.signal).toBe('string');
  });
});

describe('RitualEngine', () => {
  let system: SynthWaveSystem;
  let ritualEngine: RitualEngine;

  beforeEach(() => {
    system = createTestSystem();
    ritualEngine = new RitualEngine(system);
  });

  it('should register and retrieve rituals', () => {
    const ritual: RitualDefinition = {
      name: 'TEST_RITUAL',
      dualityConditions: [{ id: 13, threshold: 0.5 }],
      fusionSignal: 'TEST_SIGNAL',
      binaryLock: { id: 'B05', requiredState: 'A' },
      effects: [],
    };

    ritualEngine.registerRitual(ritual);

    expect(ritualEngine.getRitual('TEST_RITUAL')).toBeDefined();
    expect(ritualEngine.getAllRituals().length).toBe(1);
  });

  it('should execute successful ritual', () => {
    system.setDuality(13, 0.9);

    const ritual: RitualDefinition = {
      name: 'SUCCESS_RITUAL',
      dualityConditions: [{ id: 13, threshold: 0.5 }],
      fusionSignal: 'SUCCESS_SIGNAL',
      binaryLock: { id: 'B05', requiredState: 'A' },
      effects: [{ type: 'mode', target: 'test', value: 'activated' }],
    };

    ritualEngine.registerRitual(ritual);
    const result = ritualEngine.execute('SUCCESS_RITUAL');

    expect(result.success).toBe(true);
    expect(result.fusionSignal).toBe('SUCCESS_SIGNAL');
    expect(result.effects.length).toBe(1);
  });

  it('should fail ritual when conditions not met', () => {
    system.setDuality(13, 0.3); // Below threshold

    const ritual: RitualDefinition = {
      name: 'FAIL_RITUAL',
      dualityConditions: [{ id: 13, threshold: 0.5 }],
      fusionSignal: 'FAIL_SIGNAL',
      binaryLock: { id: 'B05', requiredState: 'A' },
      effects: [],
    };

    ritualEngine.registerRitual(ritual);
    const result = ritualEngine.execute('FAIL_RITUAL');

    expect(result.success).toBe(false);
    expect(result.fusionSignal).toBeNull();
  });

  it('should check ritual without executing', () => {
    system.setDuality(13, 0.8);

    const ritual: RitualDefinition = {
      name: 'CHECK_RITUAL',
      dualityConditions: [{ id: 13, threshold: 0.5 }],
      fusionSignal: 'CHECK_SIGNAL',
      binaryLock: { id: 'B05', requiredState: 'A' },
      effects: [],
    };

    ritualEngine.registerRitual(ritual);
    const check = ritualEngine.check('CHECK_RITUAL');

    expect(check.wouldPass).toBe(true);
    expect(check.conditions.length).toBe(2); // 1 duality + 1 binary
  });

  it('should execute D3VOT10N_G4T3 ritual from definitions', () => {
    // Set up conditions for the ritual
    // divine >= 0.9, glitch (id 7) >= -0.4 (note: threshold check is >=)
    system.setDuality(13, 1.0); // divine at max: passes 0.9 threshold
    system.setDuality(7, -0.3); // synthetic duality: passes -0.4 threshold (-0.3 >= -0.4)

    ritualEngine.registerRitual(RITUAL_DEFINITIONS.D3VOT10N_G4T3);

    const result = ritualEngine.execute('D3VOT10N_G4T3');

    expect(result.success).toBe(true);
    expect(result.fusionSignal).toBe('SH1MM3R_FR4CTURE');
  });

  it('should execute quick ritual with inline definition', () => {
    system.setDuality(13, 0.9);

    const result = ritualEngine.executeQuick({
      dualityConditions: [{ id: 13, threshold: 0.5 }],
      binaryLock: { id: 'B05', requiredState: 'A' },
      fusionSignal: 'QUICK_SIGNAL',
    });

    expect(result.success).toBe(true);
    expect(result.fusionSignal).toBe('QUICK_SIGNAL');
  });

  it('should update last ritual result on system', () => {
    system.setDuality(13, 0.8);

    const ritual: RitualDefinition = {
      name: 'TRACK_RITUAL',
      dualityConditions: [{ id: 13, threshold: 0.5 }],
      fusionSignal: 'TRACK_SIGNAL',
      binaryLock: { id: 'B05', requiredState: 'A' },
      effects: [],
    };

    ritualEngine.registerRitual(ritual);
    ritualEngine.execute('TRACK_RITUAL');

    expect(system.lastRitualResult).toBeDefined();
    expect(system.lastRitualResult?.fusionSignal).toBe('TRACK_SIGNAL');
  });
});

describe('Integration: D3VOT10N_G4T3 Ritual', () => {
  it('should pass complete D3VOT10N_G4T3 scenario from spec', () => {
    const system = createTestSystem();
    const ritualEngine = new RitualEngine(system);

    // Setup: divine = +1.0, synthetic duality passes threshold, B05 = create
    // The ritual checks value >= threshold, so -0.4 at threshold -0.4 passes
    system.setDuality(13, 1.0);    // divine = +1.0: passes >= 0.9
    system.setDuality(7, -0.4);    // synthetic: passes >= -0.4 (exactly at threshold)
    system.binary('B05').setA();   // create

    ritualEngine.registerRitual(RITUAL_DEFINITIONS.D3VOT10N_G4T3);

    const result = ritualEngine.execute('D3VOT10N_G4T3');

    expect(result.success).toBe(true);
    expect(result.fusionSignal).toBe('SH1MM3R_FR4CTURE');
  });
});
