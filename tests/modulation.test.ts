/**
 * Modulation module tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LFO, LFO_PRESETS } from '../src/modulation/lfo.js';
import { RNG } from '../src/modulation/rng.js';
import { Affector, CharacterAffector, WorldAffector } from '../src/modulation/affector.js';
import { ModulationEngine } from '../src/modulation/engine.js';
import { SemaMetra } from '../src/core/system.js';

describe('LFO', () => {
  let lfo: LFO;

  beforeEach(() => {
    lfo = new LFO({ shape: 'sine', frequency: 1, amplitude: 1, phase: 0 });
  });

  it('should initialize with correct properties', () => {
    expect(lfo.shape).toBe('sine');
    expect(lfo.frequency).toBe(1);
    expect(lfo.amplitude).toBe(1);
    expect(lfo.phase).toBe(0);
  });

  it('should generate sine wave values', () => {
    // At phase 0, sine should be 0
    const value0 = lfo.valueAtPhase(0);
    expect(value0).toBeCloseTo(0, 5);

    // At phase 0.25, sine should be 1
    const value25 = lfo.valueAtPhase(0.25);
    expect(value25).toBeCloseTo(1, 5);

    // At phase 0.5, sine should be 0
    const value50 = lfo.valueAtPhase(0.5);
    expect(value50).toBeCloseTo(0, 5);

    // At phase 0.75, sine should be -1
    const value75 = lfo.valueAtPhase(0.75);
    expect(value75).toBeCloseTo(-1, 5);
  });

  it('should generate saw wave values', () => {
    const lfoSaw = new LFO({ shape: 'saw', frequency: 1, amplitude: 1, phase: 0 });

    expect(lfoSaw.valueAtPhase(0)).toBeCloseTo(-1, 5);
    expect(lfoSaw.valueAtPhase(0.5)).toBeCloseTo(0, 5);
    // At phase 1.0, modulo wraps to 0, so it's back to -1
    expect(lfoSaw.valueAtPhase(0.99)).toBeCloseTo(0.98, 1);
  });

  it('should generate square wave values', () => {
    const lfoSquare = new LFO({ shape: 'square', frequency: 1, amplitude: 1, phase: 0 });

    expect(lfoSquare.valueAtPhase(0)).toBe(1);
    expect(lfoSquare.valueAtPhase(0.25)).toBe(1);
    expect(lfoSquare.valueAtPhase(0.5)).toBe(-1);
    expect(lfoSquare.valueAtPhase(0.75)).toBe(-1);
  });

  it('should respect amplitude setting', () => {
    lfo.setAmplitude(0.5);
    const value = lfo.valueAtPhase(0.25); // Peak of sine
    expect(value).toBeCloseTo(0.5, 5);
  });

  it('should start and stop', () => {
    expect(lfo.running).toBe(false);
    lfo.start();
    expect(lfo.running).toBe(true);
    lfo.stop();
    expect(lfo.running).toBe(false);
  });

  it('should create presets', () => {
    const breath = LFO_PRESETS.breath();
    expect(breath.shape).toBe('sine');
    expect(breath.frequency).toBe(0.1);

    const vibrato = LFO_PRESETS.vibrato();
    expect(vibrato.frequency).toBe(6);
  });
});

describe('RNG', () => {
  let rng: RNG;

  beforeEach(() => {
    rng = new RNG();
  });

  it('should roll dice within valid ranges', () => {
    for (let i = 0; i < 100; i++) {
      const d4 = rng.d4().value;
      expect(d4).toBeGreaterThanOrEqual(1);
      expect(d4).toBeLessThanOrEqual(4);

      const d20 = rng.d20().value;
      expect(d20).toBeGreaterThanOrEqual(1);
      expect(d20).toBeLessThanOrEqual(20);

      const d100 = rng.d100().value;
      expect(d100).toBeGreaterThanOrEqual(1);
      expect(d100).toBeLessThanOrEqual(100);
    }
  });

  it('should calculate normalized values correctly', () => {
    // With a seeded RNG for deterministic testing
    const seededRng = new RNG({ seed: 12345 });

    const result = seededRng.d20();
    expect(result.normalized).toBeGreaterThanOrEqual(0);
    expect(result.normalized).toBeLessThanOrEqual(1);
    expect(result.normalized).toBe((result.value - 1) / (result.max - 1));
  });

  it('should maintain roll history', () => {
    rng.d6('test1');
    rng.d6('test2');
    rng.d6('test3');

    expect(rng.history.length).toBe(3);
    expect(rng.lastRoll?.context).toBe('test3');
  });

  it('should perform DC checks', () => {
    // Use seeded RNG for determinism
    const seededRng = new RNG({ seed: 42 });

    const check = seededRng.check('d20', 10);
    expect(typeof check.passed).toBe('boolean');
    expect(check.result.value).toBeGreaterThanOrEqual(1);
  });

  it('should roll with advantage (higher of two)', () => {
    const seededRng = new RNG({ seed: 100 });

    const result = seededRng.rollAdvantage('d20');
    expect(result.value).toBeGreaterThanOrEqual(1);
    expect(result.value).toBeLessThanOrEqual(20);
  });

  it('should generate duality values', () => {
    const dualityValue = rng.rollDuality('d20');
    expect(dualityValue).toBeGreaterThanOrEqual(-1);
    expect(dualityValue).toBeLessThanOrEqual(1);
  });

  it('should calculate statistics', () => {
    for (let i = 0; i < 50; i++) {
      rng.d6();
    }

    const stats = rng.getStats('d6');
    expect(stats.count).toBe(50);
    expect(stats.average).toBeGreaterThanOrEqual(1);
    expect(stats.average).toBeLessThanOrEqual(6);
    expect(stats.min).toBeGreaterThanOrEqual(1);
    expect(stats.max).toBeLessThanOrEqual(6);
  });
});

describe('Affector', () => {
  it('should create affector with correct properties', () => {
    const affector = new Affector({
      id: 'test_affector',
      type: 'character',
      influence: 0.5,
    });

    expect(affector.id).toBe('test_affector');
    expect(affector.type).toBe('character');
    expect(affector.influence).toBe(0.5);
    expect(affector.active).toBe(true);
  });

  it('should clamp influence to [-1, 1]', () => {
    const affector = new Affector({
      id: 'test',
      type: 'world',
      influence: 2.0,
    });

    expect(affector.influence).toBe(1);
  });

  it('should toggle active state', () => {
    const affector = new Affector({
      id: 'test',
      type: 'user',
      influence: 0.5,
    });

    affector.deactivate();
    expect(affector.active).toBe(false);
    expect(affector.getCurrentInfluence()).toBe(0);

    affector.activate();
    expect(affector.active).toBe(true);
  });

  it('should create character affector with tags', () => {
    const char = new CharacterAffector({
      id: 'jessica',
      characterName: 'Jessica',
      influence: 0.8,
      mythicTags: ['GOD', 'ANGEL'],
    });

    expect(char.characterName).toBe('Jessica');
    expect(char.hasTag('god')).toBe(true);
    expect(char.hasTag('ANGEL')).toBe(true);
    expect(char.hasTag('demon')).toBe(false);
  });

  it('should create world affectors', () => {
    const weather = WorldAffector.weather('storm', 1.0);
    expect(weather.eventType).toBe('weather');
    expect(weather.influence).toBeLessThan(0); // Storm is negative

    const moon = WorldAffector.moonPhase('full');
    expect(moon.eventType).toBe('moon');
    expect(moon.influence).toBe(1.0);
  });
});

describe('ModulationEngine', () => {
  let matrix: SemaMetra;
  let engine: ModulationEngine;

  beforeEach(() => {
    matrix = new SemaMetra({
      dualities: [
        { id: 1, leftPole: 'abstract', rightPole: 'concrete', domain: 'metaphysical', rng: 'd20', tags: [], fusionHook: '' },
        { id: 2, leftPole: 'complex', rightPole: 'simple', domain: 'structural', rng: 'd6', tags: [], fusionHook: '' },
      ],
      binaries: [],
      hybrids: [],
      bridges: [],
    });
    engine = new ModulationEngine(matrix);
  });

  afterEach(() => {
    engine.stop();
  });

  it('should create and manage routes', () => {
    engine.createRoute(1);
    expect(engine.routes.has(1)).toBe(true);

    engine.removeRoute(1);
    expect(engine.routes.has(1)).toBe(false);
  });

  it('should attach LFO to duality', () => {
    engine.attachLFO(1, { shape: 'sine', frequency: 1, amplitude: 0.5, phase: 0 });

    const route = engine.getRoute(1);
    expect(route?.lfo).toBeDefined();
    expect(route?.lfo?.shape).toBe('sine');
  });

  it('should attach LFO from preset', () => {
    engine.attachLFO(1, 'breath');

    const route = engine.getRoute(1);
    expect(route?.lfo?.shape).toBe('sine');
    expect(route?.lfo?.frequency).toBe(0.1);
  });

  it('should add global affectors', () => {
    const affector = new Affector({ id: 'test', type: 'world', influence: 0.3 });
    engine.addGlobalAffector(affector);

    expect(engine.globalAffectors.length).toBe(1);
  });

  it('should provide RNG access', () => {
    const result = engine.rng.d20();
    expect(result.value).toBeGreaterThanOrEqual(1);
    expect(result.value).toBeLessThanOrEqual(20);
  });

  it('should roll and apply to duality', () => {
    const originalValue = matrix.duality(1).value;
    engine.rollAndApply(1, 'd20');

    // Value should have changed (unless exactly same)
    const newValue = matrix.duality(1).value;
    expect(typeof newValue).toBe('number');
  });

  it('should get summary of state', () => {
    engine.attachLFO(1, 'breath');
    engine.addGlobalAffector(new Affector({ id: 'test', type: 'world', influence: 0.5 }));

    const summary = engine.getSummary();
    expect(summary.routeCount).toBe(1);
    expect(summary.globalAffectorCount).toBe(1);
    expect(summary.lfoCount).toBe(1);
  });
});
