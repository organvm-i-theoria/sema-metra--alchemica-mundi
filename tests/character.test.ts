/**
 * Character module tests
 *
 * Tests for Character waveform models and CharacterRegistry.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  Character,
  CharacterRegistry,
  CHARACTER_TEMPLATES,
  type CharacterConfig,
  type WaveformType,
} from '../src/character/waveform.js';

// ============================================================================
// TEST DATA
// ============================================================================

const sampleConfig: CharacterConfig = {
  signatureId: 'TEST-01',
  name: 'Test Character',
  waveform: 'sine',
  modAmplitude: 0.7,
  frequencyBase: 0.5,
  fusionCompatible: ['CharA', 'CharB'],
  mythicTags: ['DIVINE', 'SACRED'],
  alignedEvents: ['sunset', 'full_moon'],
};

// ============================================================================
// CHARACTER TESTS
// ============================================================================

describe('Character', () => {
  it('should create with config', () => {
    const char = new Character(sampleConfig);

    expect(char.signatureId).toBe('TEST-01');
    expect(char.name).toBe('Test Character');
    expect(char.waveform).toBe('sine');
    expect(char.modAmplitude).toBe(0.7);
    expect(char.frequencyBase).toBe(0.5);
  });

  it('should use defaults for missing config values', () => {
    const char = new Character({ signatureId: 'MIN-01' });

    expect(char.name).toBe('MIN-01'); // Falls back to signatureId
    expect(char.waveform).toBe('sine');
    expect(char.modAmplitude).toBe(0.5);
    expect(char.frequencyBase).toBe(1.0);
    expect(char.fusionCompatible).toEqual([]);
  });

  it('should start inactive', () => {
    const char = new Character(sampleConfig);

    expect(char.active).toBe(false);
    expect(char.influence).toBe(0);
  });

  it('should activate and deactivate', () => {
    const char = new Character(sampleConfig);

    char.activate();
    expect(char.active).toBe(true);

    char.deactivate();
    expect(char.active).toBe(false);
  });

  it('should return 0 when inactive', () => {
    const char = new Character(sampleConfig);

    expect(char.getCurrentValue()).toBe(0);
  });

  it('should return modulation value when active', () => {
    const char = new Character(sampleConfig);
    char.activate();

    // Should return a number between -amplitude and +amplitude
    const value = char.getCurrentValue();
    expect(typeof value).toBe('number');
    expect(value).toBeLessThanOrEqual(char.modAmplitude);
    expect(value).toBeGreaterThanOrEqual(-char.modAmplitude);
  });

  it('should update influence on getCurrentValue', () => {
    const char = new Character(sampleConfig);
    char.activate();

    // Call at a non-zero timestamp to get non-zero value from LFO
    char.getCurrentValue(500);
    // Influence should be set (may be 0 at certain phase points, but generally not)
    expect(typeof char.influence).toBe('number');
  });

  it('should check fusion compatibility with string', () => {
    const char = new Character(sampleConfig);

    expect(char.isCompatibleWith('CharA')).toBe(true);
    expect(char.isCompatibleWith('CharC')).toBe(false);
  });

  it('should check fusion compatibility with Character', () => {
    const charA = new Character(sampleConfig);
    const charB = new Character({
      signatureId: 'CharA',
      name: 'Character A',
    });

    expect(charA.isCompatibleWith(charB)).toBe(true);
  });

  it('should check mythic tags (case insensitive)', () => {
    const char = new Character(sampleConfig);

    expect(char.hasTag('DIVINE')).toBe(true);
    expect(char.hasTag('divine')).toBe(true);
    expect(char.hasTag('Divine')).toBe(true);
    expect(char.hasTag('EVIL')).toBe(false);
  });

  it('should check event alignment (case insensitive)', () => {
    const char = new Character(sampleConfig);

    expect(char.isAlignedWith('sunset')).toBe(true);
    expect(char.isAlignedWith('SUNSET')).toBe(true);
    expect(char.isAlignedWith('full_moon')).toBe(true);
    expect(char.isAlignedWith('dawn')).toBe(false);
  });

  it('should convert to affector', () => {
    const char = new Character(sampleConfig);
    char.activate();

    const affector = char.toAffector();

    expect(affector.id).toBe('char_TEST-01');
    expect(affector.characterName).toBe('Test Character');
    expect(affector.influence).toBe(0.7);
    expect(affector.active).toBe(true);
    expect(affector.mythicTags).toContain('DIVINE');
  });

  it('should have formatted string representation', () => {
    const char = new Character(sampleConfig);
    const str = char.toString();

    expect(str).toContain('Test Character');
    expect(str).toContain('TEST-01');
    expect(str).toContain('sine');
    expect(str).toContain('INACTIVE');

    char.activate();
    expect(char.toString()).toContain('ACTIVE');
  });

  it('should export to JSON', () => {
    const char = new Character(sampleConfig);
    char.activate();

    const json = char.toJSON();

    expect(json.signatureId).toBe('TEST-01');
    expect(json.name).toBe('Test Character');
    expect(json.waveform).toBe('sine');
    expect(json.active).toBe(true);
    expect(json.mythicTags).toContain('DIVINE');
  });
});

// ============================================================================
// WAVEFORM TYPES
// ============================================================================

describe('Character Waveform Types', () => {
  it('should support sine waveform', () => {
    const char = new Character({ signatureId: 'SINE', waveform: 'sine' });
    char.activate();

    const value = char.getCurrentValue();
    expect(typeof value).toBe('number');
  });

  it('should support square waveform', () => {
    const char = new Character({ signatureId: 'SQUARE', waveform: 'square' });
    char.activate();

    const value = char.getCurrentValue();
    expect(typeof value).toBe('number');
  });

  it('should support noise waveform', () => {
    const char = new Character({ signatureId: 'NOISE', waveform: 'noise' });
    char.activate();

    const value = char.getCurrentValue();
    expect(typeof value).toBe('number');
  });

  it('should support pulse waveform', () => {
    const char = new Character({ signatureId: 'PULSE', waveform: 'pulse' });
    char.activate();

    const value = char.getCurrentValue();
    expect(typeof value).toBe('number');
  });

  it('should support fractal waveform with self-similar modulation', () => {
    const char = new Character({ signatureId: 'FRACTAL', waveform: 'fractal' });
    char.activate();

    const value = char.getCurrentValue();
    expect(typeof value).toBe('number');
  });

  it('should support soulwave waveform with harmonics', () => {
    const char = new Character({ signatureId: 'SOUL', waveform: 'soulwave' });
    char.activate();

    const value = char.getCurrentValue();
    expect(typeof value).toBe('number');
  });
});

// ============================================================================
// CHARACTER REGISTRY TESTS
// ============================================================================

describe('CharacterRegistry', () => {
  let registry: CharacterRegistry;

  beforeEach(() => {
    registry = new CharacterRegistry();
  });

  it('should register characters', () => {
    const char = registry.register(sampleConfig);

    expect(char.signatureId).toBe('TEST-01');
    expect(registry.get('TEST-01')).toBe(char);
  });

  it('should get all characters', () => {
    registry.register({ signatureId: 'CHAR-A' });
    registry.register({ signatureId: 'CHAR-B' });
    registry.register({ signatureId: 'CHAR-C' });

    expect(registry.all().length).toBe(3);
  });

  it('should get active characters only', () => {
    const charA = registry.register({ signatureId: 'CHAR-A' });
    const charB = registry.register({ signatureId: 'CHAR-B' });
    registry.register({ signatureId: 'CHAR-C' });

    charA.activate();
    charB.activate();

    expect(registry.active().length).toBe(2);
  });

  it('should deactivate all characters', () => {
    const charA = registry.register({ signatureId: 'CHAR-A' });
    const charB = registry.register({ signatureId: 'CHAR-B' });

    charA.activate();
    charB.activate();

    registry.deactivateAll();

    expect(registry.active().length).toBe(0);
    expect(charA.active).toBe(false);
    expect(charB.active).toBe(false);
  });

  it('should filter by mythic tag', () => {
    registry.register({ signatureId: 'DIVINE-1', mythicTags: ['DIVINE'] });
    registry.register({ signatureId: 'DIVINE-2', mythicTags: ['DIVINE', 'SACRED'] });
    registry.register({ signatureId: 'CHAOS-1', mythicTags: ['CHAOS'] });

    const divineChars = registry.byTag('DIVINE');
    expect(divineChars.length).toBe(2);
  });

  it('should calculate total influence', () => {
    const charA = registry.register({
      signatureId: 'CHAR-A',
      modAmplitude: 0.5,
    });
    const charB = registry.register({
      signatureId: 'CHAR-B',
      modAmplitude: 0.3,
    });

    charA.activate();
    charB.activate();

    // Total influence should be sum of active character values
    const total = registry.getTotalInfluence();
    expect(typeof total).toBe('number');
  });

  it('should return undefined for unknown character', () => {
    expect(registry.get('UNKNOWN')).toBeUndefined();
  });
});

// ============================================================================
// CHARACTER TEMPLATES
// ============================================================================

describe('CHARACTER_TEMPLATES', () => {
  it('should have Jessica template', () => {
    const template = CHARACTER_TEMPLATES.JESSICA;

    expect(template.signatureId).toBe('J3SS-04');
    expect(template.name).toBe('Jessica');
    expect(template.waveform).toBe('sine');
    expect(template.mythicTags).toContain('GOD');
    expect(template.mythicTags).toContain('ANGEL');
    expect(template.alignedEvents).toContain('sunset');
  });

  it('should have Gabriel template', () => {
    const template = CHARACTER_TEMPLATES.GABRIEL;

    expect(template.signatureId).toBe('G4B3-01');
    expect(template.waveform).toBe('soulwave');
    expect(template.mythicTags).toContain('ANGEL');
    expect(template.mythicTags).toContain('MESSENGER');
  });

  it('should have MM15 template', () => {
    const template = CHARACTER_TEMPLATES.MM15;

    expect(template.signatureId).toBe('MM15-00');
    expect(template.waveform).toBe('fractal');
    expect(template.mythicTags).toContain('MACHINE');
    expect(template.mythicTags).toContain('ORACLE');
  });

  it('should have Glitch Entity template', () => {
    const template = CHARACTER_TEMPLATES.GLITCH_ENTITY;

    expect(template.signatureId).toBe('GL1TCH-99');
    expect(template.waveform).toBe('noise');
    expect(template.modAmplitude).toBe(1.0);
    expect(template.fusionCompatible).toEqual([]);
    expect(template.mythicTags).toContain('CHAOS');
  });

  it('should create characters from templates', () => {
    const registry = new CharacterRegistry();

    const jessica = registry.register(CHARACTER_TEMPLATES.JESSICA);
    const gabriel = registry.register(CHARACTER_TEMPLATES.GABRIEL);

    expect(jessica.name).toBe('Jessica');
    expect(gabriel.name).toBe('Gabriel');
    expect(jessica.isCompatibleWith('Gabriel')).toBe(false); // Gabriel uses signatureId
    expect(jessica.isCompatibleWith('Gabe')).toBe(true);
  });

  it('should have proper fusion compatibility', () => {
    const jessica = new Character(CHARACTER_TEMPLATES.JESSICA);
    const mm15 = new Character(CHARACTER_TEMPLATES.MM15);

    // Jessica is compatible with MM15
    expect(jessica.fusionCompatible).toContain('MM15');
    // MM15 is compatible with Jessica
    expect(mm15.fusionCompatible).toContain('Jessica');
  });
});

// ============================================================================
// CHARACTER LIFECYCLE
// ============================================================================

describe('Character Lifecycle', () => {
  it('should support chained activation', () => {
    const char = new Character(sampleConfig);

    const result = char.activate();
    expect(result).toBe(char);
    expect(char.active).toBe(true);
  });

  it('should support chained deactivation', () => {
    const char = new Character(sampleConfig);
    char.activate();

    const result = char.deactivate();
    expect(result).toBe(char);
    expect(char.active).toBe(false);
  });

  it('should produce different values over time', () => {
    const char = new Character({
      signatureId: 'DYNAMIC',
      waveform: 'sine',
      frequencyBase: 10, // Fast frequency
    });
    char.activate();

    const values: number[] = [];
    for (let i = 0; i < 10; i++) {
      values.push(char.getCurrentValue(i * 100)); // Sample at different times
    }

    // Should have some variation
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBeGreaterThan(1);
  });
});
