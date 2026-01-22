/**
 * Patch module tests
 *
 * Tests for PatchManager, patch validation, and presets.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PatchManager,
  PATCH_PRESETS,
  type PatchSnapshot,
} from '../src/patch/manager.js';
import { validatePatch, type ValidatedPatch } from '../src/patch/schema.js';
import { SemaMetra, type SemaMetraConfig } from '../src/core/system.js';
import type {
  DualityDefinition,
  BinaryDefinition,
  HybridDefinition,
  BridgeMapping,
} from '../src/core/types.js';

// ============================================================================
// TEST DATA
// ============================================================================

const minimalDualities: DualityDefinition[] = [
  { id: 1, leftPole: 'order', rightPole: 'chaos', domain: 'meta', rng: 'd20', tags: [], fusionHook: '' },
  { id: 7, leftPole: 'organic', rightPole: 'synthetic', domain: 'tech', rng: 'd12', tags: [], fusionHook: '' },
  { id: 13, leftPole: 'divine', rightPole: 'profane', domain: 'myth', rng: 'd20', tags: [], fusionHook: '' },
  { id: 18, leftPole: 'stable', rightPole: 'volatile', domain: 'state', rng: 'd8', tags: [], fusionHook: '' },
  { id: 21, leftPole: 'waking', rightPole: 'dream', domain: 'psych', rng: 'd10', tags: [], fusionHook: '' },
];

const minimalBinaries: BinaryDefinition[] = [
  { id: 'B05', stateA: 'create', stateB: 'destroy', domain: 'ritual', signalType: 'initiation' },
  { id: 'B18', stateA: 'clean', stateB: 'corrupt', domain: 'data', signalType: 'infection' },
];

const minimalHybrids: HybridDefinition[] = [
  { id: 'H01', conditionA: 'veil lifted', conditionB: 'veil lowered', mode: 'concealment' },
];

const minimalBridges: BridgeMapping[] = [
  { pairId: 'P01', dualityA: 1, dualityB: 7, binaryId: 'B05', lockType: 'logic gate' },
];

function createTestMatrix(): SemaMetra {
  const config: SemaMetraConfig = {
    dualities: minimalDualities,
    binaries: minimalBinaries,
    hybrids: minimalHybrids,
    bridges: minimalBridges,
  };
  return new SemaMetra(config);
}

// ============================================================================
// PATCH SCHEMA VALIDATION
// ============================================================================

describe('Patch Schema Validation', () => {
  it('should validate minimal valid patch', () => {
    const patch = {
      name: 'test',
      version: '1.0.0',
      dualities: {},
      binaries: {},
      hybrids: {},
      lfoConfigs: {},
      affectors: [],
      fxChain: [],
      rituals: [],
    };

    const result = validatePatch(patch);
    expect(result.success).toBe(true);
  });

  it('should validate patch with duality states', () => {
    const patch = {
      name: 'duality_test',
      version: '1.0.0',
      dualities: {
        1: { value: 0.5, locked: false },
        7: { value: -0.3, locked: true },
      },
      binaries: {},
      hybrids: {},
      lfoConfigs: {},
      affectors: [],
      fxChain: [],
      rituals: [],
    };

    const result = validatePatch(patch);
    expect(result.success).toBe(true);
  });

  it('should validate patch with binary states', () => {
    const patch = {
      name: 'binary_test',
      version: '1.0.0',
      dualities: {},
      binaries: {
        B05: { state: 'A', locked: false },
        B18: { state: 'B', locked: true },
      },
      hybrids: {},
      lfoConfigs: {},
      affectors: [],
      fxChain: [],
      rituals: [],
    };

    const result = validatePatch(patch);
    expect(result.success).toBe(true);
  });

  it('should validate patch with LFO configs', () => {
    const patch = {
      name: 'lfo_test',
      version: '1.0.0',
      dualities: {},
      binaries: {},
      hybrids: {},
      lfoConfigs: {
        1: { shape: 'sine', frequency: 1, amplitude: 0.5, phase: 0 },
        7: { shape: 'random', frequency: 2, amplitude: 0.3, phase: 0.25 },
      },
      affectors: [],
      fxChain: [],
      rituals: [],
    };

    const result = validatePatch(patch);
    expect(result.success).toBe(true);
  });

  it('should validate patch with FX chain', () => {
    const patch = {
      name: 'fx_test',
      version: '1.0.0',
      dualities: {},
      binaries: {},
      hybrids: {},
      lfoConfigs: {},
      affectors: [],
      fxChain: ['filter', 'reverb', 'delay', 'mix'],
      rituals: [],
    };

    const result = validatePatch(patch);
    expect(result.success).toBe(true);
  });

  it('should validate patch with metadata', () => {
    const patch = {
      name: 'meta_test',
      version: '1.0.0',
      dualities: {},
      binaries: {},
      hybrids: {},
      lfoConfigs: {},
      affectors: [],
      fxChain: [],
      rituals: [],
      metadata: {
        description: 'A test patch',
        tags: ['test', 'demo'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    const result = validatePatch(patch);
    expect(result.success).toBe(true);
  });

  it('should reject patch without name', () => {
    const patch = {
      version: '1.0.0',
      dualities: {},
    };

    const result = validatePatch(patch);
    expect(result.success).toBe(false);
  });

  it('should reject patch without version', () => {
    const patch = {
      name: 'test',
      dualities: {},
    };

    const result = validatePatch(patch);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// PATCH MANAGER
// ============================================================================

describe('PatchManager', () => {
  let matrix: SemaMetra;
  let manager: PatchManager;

  beforeEach(() => {
    matrix = createTestMatrix();
    manager = new PatchManager(matrix);
  });

  it('should create empty patch', () => {
    const patch = manager.createPatch('test_patch');

    expect(patch.name).toBe('test_patch');
    expect(patch.version).toBe('1.0.0');
    expect(patch.dualities).toEqual({});
    expect(patch.binaries).toEqual({});
    expect(patch.metadata?.createdAt).toBeDefined();
  });

  it('should capture current state', () => {
    // Modify matrix state
    matrix.dualities.get(1)?.set(0.7);
    matrix.binaries.get('B05')?.toggle();

    const patch = manager.captureState('captured_state');

    expect(patch.name).toBe('captured_state');
    expect(patch.dualities[1]?.value).toBe(0.7);
  });

  it('should apply patch to matrix', () => {
    const patch: ValidatedPatch = {
      name: 'apply_test',
      version: '1.0.0',
      dualities: {
        1: { value: 0.8, locked: false },
        7: { value: -0.4, locked: true },
      },
      binaries: {
        B05: { state: 'B', locked: false },
      },
      hybrids: {},
      lfoConfigs: {},
      affectors: [],
      fxChain: [],
      rituals: [],
    };

    manager.applyPatch(patch);

    expect(matrix.dualities.get(1)?.value).toBe(0.8);
    expect(matrix.dualities.get(7)?.value).toBe(-0.4);
    expect(matrix.dualities.get(7)?.locked).toBe(true);
    expect(matrix.binaries.get('B05')?.state).toBe('B');
    expect(manager.currentPatch).toBe(patch);
  });

  it('should apply LFO configs from patch', () => {
    const patch: ValidatedPatch = {
      name: 'lfo_test',
      version: '1.0.0',
      dualities: {},
      binaries: {},
      hybrids: {},
      lfoConfigs: {
        1: { shape: 'sine', frequency: 2, amplitude: 0.5, phase: 0 },
      },
      affectors: [],
      fxChain: [],
      rituals: [],
    };

    manager.applyPatch(patch);

    const state = matrix.toJSON();
    const lfo = state.lfos.find(([id]) => id === 1);
    expect(lfo).toBeDefined();
    expect(lfo?.[1].shape).toBe('sine');
  });

  it('should have null current patch initially', () => {
    expect(manager.currentPatch).toBeNull();
  });

  it('should provide ritual engine', () => {
    expect(manager.ritualEngine).toBeDefined();
  });
});

// ============================================================================
// SNAPSHOTS
// ============================================================================

describe('PatchManager Snapshots', () => {
  let matrix: SemaMetra;
  let manager: PatchManager;

  beforeEach(() => {
    matrix = createTestMatrix();
    manager = new PatchManager(matrix);
  });

  it('should create snapshot', () => {
    matrix.dualities.get(1)?.set(0.5);

    const snapshot = manager.createSnapshot('snap1');

    expect(snapshot.name).toBe('snap1');
    expect(snapshot.timestamp).toBeDefined();
    expect(snapshot.data.dualities[1]?.value).toBe(0.5);
  });

  it('should auto-name snapshots', () => {
    const snapshot = manager.createSnapshot();

    expect(snapshot.name).toContain('snapshot_');
  });

  it('should get all snapshots', () => {
    manager.createSnapshot('snap1');
    manager.createSnapshot('snap2');

    const snapshots = manager.getSnapshots();
    expect(snapshots.length).toBe(2);
  });

  it('should restore snapshot', () => {
    matrix.dualities.get(1)?.set(0.3);
    manager.createSnapshot('before');

    matrix.dualities.get(1)?.set(0.9);

    const restored = manager.restoreSnapshot(0);
    expect(restored).toBe(true);
    expect(matrix.dualities.get(1)?.value).toBe(0.3);
  });

  it('should return false for invalid snapshot index', () => {
    const restored = manager.restoreSnapshot(999);
    expect(restored).toBe(false);
  });

  it('should clear snapshots', () => {
    manager.createSnapshot('snap1');
    manager.createSnapshot('snap2');

    manager.clearSnapshots();

    expect(manager.getSnapshots().length).toBe(0);
  });

  it('should limit max snapshots', () => {
    manager.setMaxSnapshots(3);

    for (let i = 0; i < 5; i++) {
      manager.createSnapshot(`snap${i}`);
    }

    expect(manager.getSnapshots().length).toBe(3);
  });

  it('should keep most recent snapshots when trimming', () => {
    manager.setMaxSnapshots(2);

    manager.createSnapshot('first');
    manager.createSnapshot('second');
    manager.createSnapshot('third');

    const snapshots = manager.getSnapshots();
    expect(snapshots[0]?.name).toBe('second');
    expect(snapshots[1]?.name).toBe('third');
  });
});

// ============================================================================
// PATCH PRESETS
// ============================================================================

describe('PATCH_PRESETS', () => {
  it('should have D3ATH_L0V3R_FUS10N preset', () => {
    const preset = PATCH_PRESETS.D3ATH_L0V3R_FUS10N;

    expect(preset.name).toBe('D3ATH.L0V3R_FUS10N');
    expect(preset.dualities[13]?.value).toBe(0.9); // divine
    expect(preset.dualities[7]?.value).toBe(-0.6); // glitch
    expect(preset.fxChain).toContain('shimmer');
    expect(preset.metadata?.tags).toContain('ritual');
  });

  it('should have GLITCH_SUMM0N preset', () => {
    const preset = PATCH_PRESETS.GLITCH_SUMM0N;

    expect(preset.name).toBe('GLITCH_SUMM0N');
    expect(preset.dualities[7]?.value).toBe(-0.8); // synthetic/glitch
    expect(preset.binaries['B18']?.state).toBe('B'); // corrupt
    expect(preset.fxChain).toContain('glitch');
    expect(preset.metadata?.tags).toContain('chaos');
  });

  it('should have EQUILIBRIUM preset', () => {
    const preset = PATCH_PRESETS.EQUILIBRIUM;

    expect(preset.name).toBe('EQUILIBRIUM');
    expect(Object.keys(preset.dualities).length).toBe(0);
    expect(preset.metadata?.tags).toContain('neutral');
  });

  it('should validate all presets', () => {
    for (const [name, preset] of Object.entries(PATCH_PRESETS)) {
      const result = validatePatch(preset);
      expect(result.success).toBe(true);
    }
  });

  it('should apply D3ATH_L0V3R_FUS10N preset', () => {
    const matrix = createTestMatrix();
    const manager = new PatchManager(matrix);

    manager.applyPatch(PATCH_PRESETS.D3ATH_L0V3R_FUS10N as ValidatedPatch);

    expect(matrix.dualities.get(13)?.value).toBe(0.9);
    expect(matrix.dualities.get(7)?.value).toBe(-0.6);
  });

  it('should apply GLITCH_SUMM0N preset', () => {
    const matrix = createTestMatrix();
    const manager = new PatchManager(matrix);

    manager.applyPatch(PATCH_PRESETS.GLITCH_SUMM0N as ValidatedPatch);

    expect(matrix.dualities.get(7)?.value).toBe(-0.8);
    expect(matrix.binaries.get('B18')?.state).toBe('B');
  });
});

// ============================================================================
// PATCH CAPTURE AND RESTORE CYCLE
// ============================================================================

describe('Patch Capture/Restore Cycle', () => {
  it('should fully capture and restore state', () => {
    const matrix = createTestMatrix();
    const manager = new PatchManager(matrix);

    // Set up initial state
    matrix.dualities.get(1)?.set(0.7);
    matrix.dualities.get(1)?.lock();
    matrix.dualities.get(7)?.set(-0.5);
    matrix.binaries.get('B05')?.toggle();

    // Capture state
    const captured = manager.captureState('full_test');

    // Create new matrix and manager
    const matrix2 = createTestMatrix();
    const manager2 = new PatchManager(matrix2);

    // Restore state
    manager2.applyPatch(captured);

    // Verify state matches
    expect(matrix2.dualities.get(1)?.value).toBe(0.7);
    expect(matrix2.dualities.get(1)?.locked).toBe(true);
    expect(matrix2.dualities.get(7)?.value).toBe(-0.5);
  });

  it('should handle partial patches gracefully', () => {
    const matrix = createTestMatrix();
    const manager = new PatchManager(matrix);

    // Apply patch with only some dualities
    const partial: ValidatedPatch = {
      name: 'partial',
      version: '1.0.0',
      dualities: {
        1: { value: 0.9, locked: false },
        // 7 and 13 not specified
      },
      binaries: {},
      hybrids: {},
      lfoConfigs: {},
      affectors: [],
      fxChain: [],
      rituals: [],
    };

    const originalValue7 = matrix.dualities.get(7)?.value;

    manager.applyPatch(partial);

    // Specified duality should change
    expect(matrix.dualities.get(1)?.value).toBe(0.9);
    // Unspecified duality should remain unchanged
    expect(matrix.dualities.get(7)?.value).toBe(originalValue7);
  });

  it('should handle nonexistent keys gracefully', () => {
    const matrix = createTestMatrix();
    const manager = new PatchManager(matrix);

    // Apply patch with nonexistent duality ID
    const patch: ValidatedPatch = {
      name: 'nonexistent',
      version: '1.0.0',
      dualities: {
        999: { value: 0.5, locked: false }, // Doesn't exist in matrix
      },
      binaries: {
        'B99': { state: 'A', locked: false }, // Doesn't exist
      },
      hybrids: {},
      lfoConfigs: {},
      affectors: [],
      fxChain: [],
      rituals: [],
    };

    // Should not throw
    expect(() => manager.applyPatch(patch)).not.toThrow();
  });
});

// ============================================================================
// PATCH VERSION HANDLING
// ============================================================================

describe('Patch Versioning', () => {
  it('should include version in created patches', () => {
    const matrix = createTestMatrix();
    const manager = new PatchManager(matrix);

    const patch = manager.createPatch('versioned');
    expect(patch.version).toBe('1.0.0');
  });

  it('should preserve version through capture', () => {
    const matrix = createTestMatrix();
    const manager = new PatchManager(matrix);

    const captured = manager.captureState('version_test');
    expect(captured.version).toBe('1.0.0');
  });
});

// ============================================================================
// METADATA HANDLING
// ============================================================================

describe('Patch Metadata', () => {
  it('should create timestamps on new patches', () => {
    const matrix = createTestMatrix();
    const manager = new PatchManager(matrix);

    const patch = manager.createPatch('meta_test');

    expect(patch.metadata?.createdAt).toBeDefined();
    expect(patch.metadata?.updatedAt).toBeDefined();
  });

  it('should capture timestamps', () => {
    const matrix = createTestMatrix();
    const manager = new PatchManager(matrix);

    const captured = manager.captureState('timestamp_test');

    expect(captured.metadata?.createdAt).toBeDefined();
    expect(new Date(captured.metadata!.createdAt!).getTime()).toBeLessThanOrEqual(Date.now());
  });
});
