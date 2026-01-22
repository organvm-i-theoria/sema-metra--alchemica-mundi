/**
 * FX module tests
 *
 * Tests for FXUnit, FXGodRegistry, and FXChain functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  FXUnit,
  FXGodRegistry,
  FXChain,
  FX_GODS,
  type FXGodId,
} from '../src/fx/index.js';
import type { FXGodDefinition } from '../src/core/types.js';

// ============================================================================
// TEST DATA
// ============================================================================

const sampleDefinitions: FXGodDefinition[] = [
  {
    id: 'filter',
    godName: 'The Divider',
    effectType: 'Frequency split',
    role: 'Cuts truth from noise',
    toneModule: 'Filter',
  },
  {
    id: 'reverb',
    godName: 'The Veil',
    effectType: 'Space and myth trail',
    role: 'Echo of otherworlds',
    toneModule: 'Reverb',
  },
  {
    id: 'delay',
    godName: 'The Mirror Chain',
    effectType: 'Time reflection',
    role: 'Past looped',
    toneModule: 'FeedbackDelay',
  },
  {
    id: 'compressor',
    godName: 'The Enforcer',
    effectType: 'Dynamic flattening',
    role: 'Tames chaos, lifts silence',
    toneModule: 'Compressor',
  },
  {
    id: 'drive',
    godName: 'The Hammer',
    effectType: 'Signal push',
    role: 'Aggression spike',
    toneModule: 'Distortion',
  },
  {
    id: 'shimmer',
    godName: "The Angel's Path",
    effectType: 'High pitch glow',
    role: 'Divinity enhancer',
    toneModule: 'PitchShift',
  },
  {
    id: 'glitch',
    godName: 'The Screamer',
    effectType: 'System corruption',
    role: 'Pattern interruptor',
    toneModule: 'BitCrusher',
  },
  {
    id: 'mix',
    godName: 'The Balancer',
    effectType: 'Final combine',
    role: 'Ritual resolution',
    toneModule: 'Channel',
  },
  {
    id: 'freeze',
    godName: 'The Stasis Node',
    effectType: 'Holds time',
    role: 'Immortality trap',
    toneModule: 'Freeverb',
  },
  {
    id: 'granulator',
    godName: 'The Particle Oracle',
    effectType: 'Fragments signal',
    role: 'Memory distortion',
    toneModule: 'GrainPlayer',
  },
];

// ============================================================================
// FX UNIT TESTS
// ============================================================================

describe('FXUnit', () => {
  it('should create unit from definition', () => {
    const unit = new FXUnit(sampleDefinitions[0]!);

    expect(unit.id).toBe('filter');
    expect(unit.godName).toBe('The Divider');
    expect(unit.effectType).toBe('Frequency split');
    expect(unit.role).toBe('Cuts truth from noise');
    expect(unit.toneModule).toBe('Filter');
  });

  it('should start enabled in symbolic mode', () => {
    const unit = new FXUnit(sampleDefinitions[0]!);

    expect(unit.enabled).toBe(true);
    expect(unit.mode).toBe('symbolic');
  });

  it('should initialize type-specific parameters for Filter', () => {
    const unit = new FXUnit(sampleDefinitions[0]!);
    const params = unit.getParameters();

    expect(params.frequency).toBeDefined();
    expect(params.frequency?.value).toBe(1000);
    expect(params.resonance).toBeDefined();
    expect(params.type).toBeDefined();
  });

  it('should initialize type-specific parameters for Reverb', () => {
    const unit = new FXUnit(sampleDefinitions[1]!);
    const params = unit.getParameters();

    expect(params.decay).toBeDefined();
    expect(params.preDelay).toBeDefined();
    expect(params.roomSize).toBeDefined();
  });

  it('should initialize type-specific parameters for FeedbackDelay', () => {
    const unit = new FXUnit(sampleDefinitions[2]!);
    const params = unit.getParameters();

    expect(params.delayTime).toBeDefined();
    expect(params.feedback).toBeDefined();
  });

  it('should initialize type-specific parameters for Compressor', () => {
    const unit = new FXUnit(sampleDefinitions[3]!);
    const params = unit.getParameters();

    expect(params.threshold).toBeDefined();
    expect(params.ratio).toBeDefined();
    expect(params.attack).toBeDefined();
    expect(params.release).toBeDefined();
    expect(params.knee).toBeDefined();
  });

  it('should initialize type-specific parameters for Distortion', () => {
    const unit = new FXUnit(sampleDefinitions[4]!);
    const params = unit.getParameters();

    expect(params.distortion).toBeDefined();
    expect(params.oversample).toBeDefined();
  });

  it('should have common parameters (wet, bypass)', () => {
    const unit = new FXUnit(sampleDefinitions[0]!);
    const params = unit.getParameters();

    expect(params.wet).toBeDefined();
    expect(params.wet?.value).toBe(1.0);
    expect(params.bypass).toBeDefined();
    expect(params.bypass?.value).toBe(0);
  });

  it('should clamp parameter values to valid range', () => {
    const unit = new FXUnit(sampleDefinitions[0]!);

    unit.setParameter('frequency', 50000);
    expect(unit.getParameter('frequency')).toBe(20000); // max

    unit.setParameter('frequency', 5);
    expect(unit.getParameter('frequency')).toBe(20); // min
  });

  it('should enable and disable', () => {
    const unit = new FXUnit(sampleDefinitions[0]!);

    unit.disable();
    expect(unit.enabled).toBe(false);
    expect(unit.getParameter('bypass')).toBe(1);

    unit.enable();
    expect(unit.enabled).toBe(true);
    expect(unit.getParameter('bypass')).toBe(0);
  });

  it('should get and set state', () => {
    const unit = new FXUnit(sampleDefinitions[0]!);

    unit.setParameter('frequency', 2000);
    unit.setParameter('wet', 0.5);

    const state = unit.getState();
    expect(state.id).toBe('filter');
    expect(state.godName).toBe('The Divider');
    expect(state.parameters.frequency).toBe(2000);
    expect(state.parameters.wet).toBe(0.5);

    // Restore state to new unit
    const unit2 = new FXUnit(sampleDefinitions[0]!);
    unit2.setState({ parameters: { frequency: 3000, wet: 0.7 } });
    expect(unit2.getParameter('frequency')).toBe(3000);
    expect(unit2.getParameter('wet')).toBe(0.7);
  });

  it('should reset parameters to defaults', () => {
    const unit = new FXUnit(sampleDefinitions[0]!);

    unit.setParameter('frequency', 5000);
    unit.setParameter('wet', 0.3);

    unit.reset();

    expect(unit.getParameter('frequency')).toBe(1000);
    expect(unit.getParameter('wet')).toBe(1.0);
  });

  it('should have formatted string representation', () => {
    const unit = new FXUnit(sampleDefinitions[0]!);
    const str = unit.toString();

    expect(str).toContain('The Divider');
    expect(str).toContain('filter');
  });
});

// ============================================================================
// FX GOD REGISTRY TESTS
// ============================================================================

describe('FXGodRegistry', () => {
  let registry: FXGodRegistry;

  beforeEach(() => {
    registry = new FXGodRegistry(sampleDefinitions);
  });

  it('should load definitions', () => {
    expect(registry.getAllDefinitions().length).toBe(10);
  });

  it('should get definition by ID', () => {
    const def = registry.getDefinition('filter');
    expect(def).toBeDefined();
    expect(def?.godName).toBe('The Divider');
  });

  it('should return undefined for unknown ID', () => {
    const def = registry.getDefinition('unknown');
    expect(def).toBeUndefined();
  });

  it('should create unit from definition', () => {
    const unit = registry.createUnit('reverb');
    expect(unit).toBeDefined();
    expect(unit?.id).toBe('reverb');
    expect(unit?.godName).toBe('The Veil');
  });

  it('should get or create unit', () => {
    const unit1 = registry.getOrCreateUnit('delay');
    const unit2 = registry.getOrCreateUnit('delay');

    expect(unit1).toBe(unit2); // Same instance
  });

  it('should track active units', () => {
    registry.createUnit('filter');
    registry.createUnit('reverb');

    expect(registry.getActiveUnits().length).toBe(2);
  });

  it('should find by god name', () => {
    const def = registry.findByGodName('Divider');
    expect(def?.id).toBe('filter');
  });

  it('should find by effect type', () => {
    const defs = registry.findByEffectType('reflection');
    expect(defs.length).toBe(1);
    expect(defs[0]?.id).toBe('delay');
  });

  it('should find by Tone.js module', () => {
    const defs = registry.findByToneModule('compressor');
    expect(defs.length).toBeGreaterThanOrEqual(1);
  });

  it('should get by role keyword', () => {
    const defs = registry.getByRole('chaos');
    expect(defs.some((d) => d.id === 'compressor')).toBe(true);
  });

  it('should invoke god description', () => {
    const invocation = registry.invoke('filter');
    expect(invocation).toContain('THE DIVIDER');
    expect(invocation).toContain('Frequency split');
    expect(invocation).toContain('Filter');
  });

  it('should handle unknown god invocation', () => {
    const invocation = registry.invoke('unknown');
    expect(invocation).toContain('Unknown god');
  });

  it('should clear all units', () => {
    registry.createUnit('filter');
    registry.createUnit('reverb');

    expect(registry.getActiveUnits().length).toBe(2);

    registry.clearUnits();

    expect(registry.getActiveUnits().length).toBe(0);
  });
});

// ============================================================================
// FX CHAIN TESTS
// ============================================================================

describe('FXChain', () => {
  let registry: FXGodRegistry;
  let chain: FXChain;

  beforeEach(() => {
    registry = new FXGodRegistry(sampleDefinitions);
    chain = new FXChain(registry);
  });

  it('should start empty', () => {
    expect(chain.length).toBe(0);
    expect(chain.getOrder()).toEqual([]);
  });

  it('should add units to chain', () => {
    chain.add('filter').add('reverb').add('delay');

    expect(chain.length).toBe(3);
    expect(chain.getOrder()).toEqual(['filter', 'reverb', 'delay']);
  });

  it('should get and set wet mix', () => {
    expect(chain.wet).toBe(1.0);

    chain.setWet(0.5);
    expect(chain.wet).toBe(0.5);

    chain.setWet(1.5); // Clamp to max
    expect(chain.wet).toBe(1.0);

    chain.setWet(-0.5); // Clamp to min
    expect(chain.wet).toBe(0);
  });

  it('should enable and disable chain', () => {
    expect(chain.enabled).toBe(true);

    chain.disable();
    expect(chain.enabled).toBe(false);

    chain.enable();
    expect(chain.enabled).toBe(true);
  });

  it('should insert units at position', () => {
    chain.add('filter').add('delay');
    chain.insert('reverb', 1);

    expect(chain.getOrder()).toEqual(['filter', 'reverb', 'delay']);
  });

  it('should remove units', () => {
    chain.add('filter').add('reverb').add('delay');
    chain.remove('reverb');

    expect(chain.length).toBe(2);
    expect(chain.getOrder()).toEqual(['filter', 'delay']);
  });

  it('should move units', () => {
    chain.add('filter').add('reverb').add('delay');
    chain.move('delay', 0);

    expect(chain.getOrder()).toEqual(['delay', 'filter', 'reverb']);
  });

  it('should swap units', () => {
    chain.add('filter').add('reverb').add('delay');
    chain.swap('filter', 'delay');

    expect(chain.getOrder()).toEqual(['delay', 'reverb', 'filter']);
  });

  it('should get unit by ID', () => {
    chain.add('filter').add('reverb');

    const unit = chain.getUnit('filter');
    expect(unit).toBeDefined();
    expect(unit?.id).toBe('filter');
  });

  it('should get all units in order', () => {
    chain.add('filter').add('reverb');

    const units = chain.getUnits();
    expect(units.length).toBe(2);
    expect(units[0]?.id).toBe('filter');
    expect(units[1]?.id).toBe('reverb');
  });

  it('should clear chain', () => {
    chain.add('filter').add('reverb').add('delay');
    chain.clear();

    expect(chain.length).toBe(0);
  });

  it('should set unit parameters', () => {
    chain.add('filter');
    chain.setUnitParameter('filter', 'frequency', 2000);

    const unit = chain.getUnit('filter');
    expect(unit?.getParameter('frequency')).toBe(2000);
  });

  it('should enable/disable individual units', () => {
    chain.add('filter');
    chain.setUnitEnabled('filter', false);

    const unit = chain.getUnit('filter');
    expect(unit?.enabled).toBe(false);
  });

  it('should get and load configuration', () => {
    chain.add('filter').add('reverb').add('mix');
    chain.setWet(0.7);

    const config = chain.getConfig();
    expect(config.units).toEqual(['filter', 'reverb', 'mix']);
    expect(config.wet).toBe(0.7);
    expect(config.connections.length).toBe(2);
    expect(config.connections[0]).toEqual({ from: 'filter', to: 'reverb' });

    // Load into new chain
    const chain2 = new FXChain(registry);
    chain2.loadConfig(config);

    expect(chain2.getOrder()).toEqual(['filter', 'reverb', 'mix']);
    expect(chain2.wet).toBe(0.7);
  });

  it('should have formatted string representation', () => {
    chain.add('filter').add('reverb');
    chain.setWet(0.7);

    const str = chain.toString();
    expect(str).toContain('The Divider');
    expect(str).toContain('The Veil');
    expect(str).toContain('70%');
  });

  it('should show empty chain string', () => {
    const str = chain.toString();
    expect(str).toContain('Empty');
  });
});

// ============================================================================
// FX CHAIN PRESETS
// ============================================================================

describe('FXChain Presets', () => {
  let registry: FXGodRegistry;

  beforeEach(() => {
    registry = new FXGodRegistry(sampleDefinitions);
  });

  it('should create reverb_shimmer preset', () => {
    const chain = FXChain.createPreset(registry, 'reverb_shimmer');

    expect(chain.getOrder()).toContain('filter');
    expect(chain.getOrder()).toContain('reverb');
    expect(chain.getOrder()).toContain('shimmer');
    expect(chain.getOrder()).toContain('mix');
    expect(chain.wet).toBe(0.7);
  });

  it('should create glitch_chain preset', () => {
    const chain = FXChain.createPreset(registry, 'glitch_chain');

    expect(chain.getOrder()).toContain('glitch');
    expect(chain.getOrder()).toContain('freeze');
    expect(chain.getOrder()).toContain('granulator');
    expect(chain.wet).toBe(0.5);
  });

  it('should create clean_delay preset', () => {
    const chain = FXChain.createPreset(registry, 'clean_delay');

    expect(chain.getOrder()).toContain('compressor');
    expect(chain.getOrder()).toContain('delay');
    expect(chain.getOrder()).toContain('reverb');
    expect(chain.wet).toBe(0.6);
  });

  it('should create full_synth preset', () => {
    const chain = FXChain.createPreset(registry, 'full_synth');

    expect(chain.length).toBe(7);
    expect(chain.wet).toBe(0.8);
  });
});

// ============================================================================
// FX GODS CONSTANTS
// ============================================================================

describe('FX_GODS Constants', () => {
  it('should have all expected god IDs', () => {
    expect(FX_GODS.FILTER).toBe('filter');
    expect(FX_GODS.COMPRESSOR).toBe('compressor');
    expect(FX_GODS.REVERB).toBe('reverb');
    expect(FX_GODS.DELAY).toBe('delay');
    expect(FX_GODS.SHIMMER).toBe('shimmer');
    expect(FX_GODS.GLITCH).toBe('glitch');
    expect(FX_GODS.MIX).toBe('mix');
  });

  it('should be string type', () => {
    const id: FXGodId = FX_GODS.FILTER;
    expect(typeof id).toBe('string');
  });
});
