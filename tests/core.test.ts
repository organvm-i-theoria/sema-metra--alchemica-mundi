/**
 * Core module tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Duality, DualityRegistry } from '../src/core/duality.js';
import { BinaryGate, BinaryRegistry } from '../src/core/binary.js';
import { HybridToggle, HybridRegistry } from '../src/core/hybrid.js';
import { BridgeGate, BridgeRegistry } from '../src/core/bridge.js';
import { SemaMetra } from '../src/core/system.js';
import type {
  DualityDefinition,
  BinaryDefinition,
  HybridDefinition,
  BridgeMapping,
} from '../src/core/types.js';

// Sample data for testing
const sampleDuality: DualityDefinition = {
  id: 13,
  leftPole: 'divine',
  rightPole: 'profane',
  domain: 'myth',
  rng: 'd20',
  tags: ['sacred', 'viral'],
  fusionHook: 'shimmer engine trigger',
};

const sampleBinary: BinaryDefinition = {
  id: 'B05',
  stateA: 'create',
  stateB: 'destroy',
  domain: 'ritual',
  signalType: 'initiation/descent',
};

const sampleHybrid: HybridDefinition = {
  id: 'H01',
  conditionA: 'veil lifted',
  conditionB: 'veil lowered',
  mode: 'concealment',
  description: 'mystery and knowledge thresholds',
};

const sampleBridge: BridgeMapping = {
  pairId: 'P01',
  dualityA: 1,
  dualityB: 2,
  binaryId: 'B01',
  lockType: 'logic gate',
};

describe('Duality', () => {
  let duality: Duality;

  beforeEach(() => {
    duality = new Duality(sampleDuality);
  });

  it('should initialize with correct properties', () => {
    expect(duality.id).toBe(13);
    expect(duality.leftPole).toBe('divine');
    expect(duality.rightPole).toBe('profane');
    expect(duality.domain).toBe('myth');
    expect(duality.value).toBe(0);
  });

  it('should clamp values to [-1.0, +1.0]', () => {
    duality.set(2.5);
    expect(duality.value).toBe(1);

    duality.set(-3.0);
    expect(duality.value).toBe(-1);

    duality.set(0.5);
    expect(duality.value).toBe(0.5);
  });

  it('should modulate values correctly', () => {
    duality.set(0.5);
    duality.modulate(0.3);
    expect(duality.value).toBe(0.8);

    duality.modulate(0.5); // Should clamp to 1.0
    expect(duality.value).toBe(1);
  });

  it('should report current pole correctly', () => {
    duality.set(-0.8);
    expect(duality.currentPole).toBe('divine');

    duality.set(0.8);
    expect(duality.currentPole).toBe('profane');

    duality.set(0);
    expect(duality.currentPole).toBe('neutral');
  });

  it('should respect lock state', () => {
    duality.set(0.5);
    duality.lock();
    duality.set(0.9);
    expect(duality.value).toBe(0.5);
    expect(duality.locked).toBe(true);

    duality.unlock();
    duality.set(0.9);
    expect(duality.value).toBe(0.9);
  });

  it('should calculate normalized value correctly', () => {
    duality.set(-1);
    expect(duality.normalized).toBe(0);

    duality.set(1);
    expect(duality.normalized).toBe(1);

    duality.set(0);
    expect(duality.normalized).toBe(0.5);
  });

  it('should serialize and deserialize correctly', () => {
    duality.set(0.7);
    duality.lock();

    const json = duality.toJSON();
    expect(json).toEqual({ id: 13, value: 0.7, locked: true });

    const newDuality = new Duality(sampleDuality);
    newDuality.fromJSON(json);
    expect(newDuality.value).toBe(0.7);
    expect(newDuality.locked).toBe(true);
  });
});

describe('DualityRegistry', () => {
  let registry: DualityRegistry;

  beforeEach(() => {
    registry = new DualityRegistry([
      sampleDuality,
      { ...sampleDuality, id: 7, leftPole: 'synthetic', rightPole: 'natural', domain: 'av' },
    ]);
  });

  it('should get dualities by ID', () => {
    const d = registry.get(13);
    expect(d).toBeDefined();
    expect(d?.leftPole).toBe('divine');
  });

  it('should throw for missing duality with getOrThrow', () => {
    expect(() => registry.getOrThrow(999)).toThrow();
  });

  it('should filter by domain', () => {
    const myth = registry.byDomain('myth');
    expect(myth.length).toBe(1);
    expect(myth[0]?.id).toBe(13);
  });

  it('should reset all dualities', () => {
    registry.get(13)?.set(0.9);
    registry.get(7)?.set(-0.5);

    registry.resetAll();

    expect(registry.get(13)?.value).toBe(0);
    expect(registry.get(7)?.value).toBe(0);
  });
});

describe('BinaryGate', () => {
  let gate: BinaryGate;

  beforeEach(() => {
    gate = new BinaryGate(sampleBinary);
  });

  it('should initialize with state A', () => {
    expect(gate.state).toBe('A');
    expect(gate.stateLabel).toBe('create');
    expect(gate.isA).toBe(true);
    expect(gate.isB).toBe(false);
  });

  it('should toggle states correctly', () => {
    gate.toggle();
    expect(gate.state).toBe('B');
    expect(gate.stateLabel).toBe('destroy');

    gate.toggle();
    expect(gate.state).toBe('A');
  });

  it('should set states directly', () => {
    gate.setB();
    expect(gate.isB).toBe(true);

    gate.setA();
    expect(gate.isA).toBe(true);
  });

  it('should set by label', () => {
    gate.setByLabel('destroy');
    expect(gate.state).toBe('B');

    gate.setByLabel('create');
    expect(gate.state).toBe('A');
  });

  it('should respect lock state', () => {
    gate.lock();
    gate.toggle();
    expect(gate.state).toBe('A');

    gate.unlock();
    gate.toggle();
    expect(gate.state).toBe('B');
  });

  it('should match required states', () => {
    expect(gate.matches('A')).toBe(true);
    expect(gate.matches('B')).toBe(false);
  });
});

describe('HybridToggle', () => {
  let toggle: HybridToggle;

  beforeEach(() => {
    toggle = new HybridToggle(sampleHybrid);
  });

  it('should initialize in condition A', () => {
    expect(toggle.condition).toBe('A');
    expect(toggle.conditionLabel).toBe('veil lifted');
  });

  it('should transition between conditions', () => {
    toggle.setB();
    expect(toggle.condition).toBe('B');
    expect(toggle.conditionLabel).toBe('veil lowered');

    toggle.setA();
    expect(toggle.condition).toBe('A');
  });

  it('should handle gradual transitions', () => {
    toggle.updateTransition(0.5);
    expect(toggle.isTransitioning).toBe(true);
    expect(toggle.transitionProgress).toBe(0.5);

    toggle.updateTransition(1.0);
    expect(toggle.isB).toBe(true);
  });

  it('should evaluate to correct values', () => {
    toggle.setA();
    expect(toggle.evaluate()).toBe(-1.0);

    toggle.setB();
    expect(toggle.evaluate()).toBe(1.0);

    toggle.updateTransition(0.5);
    expect(toggle.evaluate()).toBe(0);
  });
});

describe('BridgeGate', () => {
  let matrix: SemaMetra;

  beforeEach(() => {
    matrix = new SemaMetra({
      dualities: [
        { id: 1, leftPole: 'abstract', rightPole: 'concrete', domain: 'metaphysical', rng: 'd20', tags: [], fusionHook: '' },
        { id: 2, leftPole: 'complex', rightPole: 'simple', domain: 'structural', rng: 'd6', tags: [], fusionHook: '' },
      ],
      binaries: [{ id: 'B01', stateA: 'on', stateB: 'off', domain: 'power', signalType: 'logic gate' }],
      hybrids: [],
      bridges: [sampleBridge],
    });
  });

  it('should evaluate bridge conditions', () => {
    const bridge = matrix.bridge('P01');
    bridge.setThresholds(0.5, 0.5);
    bridge.setRequiredBinaryState('A');

    // Both dualities at 0, should fail threshold
    let result = bridge.evaluate(matrix.dualities, matrix.binaries);
    expect(result.overallPassed).toBe(false);

    // Set dualities above threshold
    matrix.setDuality(1, 0.8);
    matrix.setDuality(2, 0.7);

    result = bridge.evaluate(matrix.dualities, matrix.binaries);
    expect(result.overallPassed).toBe(true);
  });

  it('should calculate fusion score', () => {
    const bridge = matrix.bridge('P01');
    matrix.setDuality(1, 0.9);
    matrix.setDuality(2, 0.8);

    const result = bridge.evaluate(matrix.dualities, matrix.binaries);
    expect(result.fusionScore).toBeGreaterThan(0);
    expect(result.fusionScore).toBeLessThanOrEqual(1);
  });
});

describe('SemaMetra', () => {
  let matrix: SemaMetra;

  beforeEach(() => {
    matrix = new SemaMetra({
      dualities: [sampleDuality],
      binaries: [sampleBinary],
      hybrids: [sampleHybrid],
      bridges: [],
    });
  });

  it('should provide access to all registries', () => {
    expect(matrix.dualities.size).toBe(1);
    expect(matrix.binaries.size).toBe(1);
    expect(matrix.hybrids.size).toBe(1);
  });

  it('should emit events on changes', () => {
    let eventFired = false;
    matrix.on('duality:changed', () => {
      eventFired = true;
    });

    matrix.setDuality(13, 0.5);
    expect(eventFired).toBe(true);
  });

  it('should serialize and deserialize state', () => {
    matrix.setDuality(13, 0.8);
    matrix.setBinary('B05', 'B');

    const json = matrix.toJSON();
    expect(json.dualities[13]?.value).toBe(0.8);
    expect(json.binaries['B05']?.state).toBe('B');

    matrix.reset();
    expect(matrix.duality(13).value).toBe(0);

    matrix.fromJSON(json);
    expect(matrix.duality(13).value).toBe(0.8);
    expect(matrix.binary('B05').state).toBe('B');
  });

  it('should reset all state', () => {
    matrix.setDuality(13, 0.9);
    matrix.setBinary('B05', 'B');

    matrix.reset();

    expect(matrix.duality(13).value).toBe(0);
    expect(matrix.binary('B05').state).toBe('A');
  });
});
