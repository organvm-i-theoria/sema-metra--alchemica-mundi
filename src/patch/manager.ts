/**
 * PatchManager - Load, save, and manage patches
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { SemaMetra } from '../core/system.js';
import type { RitualDefinition } from '../core/types.js';
import { RitualEngine } from '../ritual/engine.js';
import { validatePatch, type ValidatedPatch } from './schema.js';

export interface PatchSnapshot {
  name: string;
  timestamp: number;
  data: ValidatedPatch;
}

export class PatchManager {
  private _matrix: SemaMetra;
  private _ritualEngine: RitualEngine;
  private _currentPatch: ValidatedPatch | null = null;
  private _snapshots: PatchSnapshot[] = [];
  private _maxSnapshots: number = 10;
  private _patchDirectory: string;

  constructor(matrix: SemaMetra, patchDirectory: string = './patches') {
    this._matrix = matrix;
    this._ritualEngine = new RitualEngine(matrix);
    this._patchDirectory = patchDirectory;
  }

  /**
   * Get the ritual engine
   */
  get ritualEngine(): RitualEngine {
    return this._ritualEngine;
  }

  /**
   * Get the current patch
   */
  get currentPatch(): ValidatedPatch | null {
    return this._currentPatch;
  }

  /**
   * Create an empty patch
   */
  createPatch(name: string): ValidatedPatch {
    return {
      name,
      version: '1.0.0',
      dualities: {},
      binaries: {},
      hybrids: {},
      lfoConfigs: {},
      affectors: [],
      fxChain: [],
      rituals: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Create a patch from current system state
   */
  captureState(name: string): ValidatedPatch {
    const systemState = this._matrix.toJSON();

    const dualities: ValidatedPatch['dualities'] = {};
    for (const [id, state] of Object.entries(systemState.dualities)) {
      dualities[Number(id)] = { value: state.value, locked: state.locked };
    }

    const binaries: ValidatedPatch['binaries'] = {};
    for (const [id, state] of Object.entries(systemState.binaries)) {
      binaries[id] = { state: state.state, locked: state.locked };
    }

    const hybrids: ValidatedPatch['hybrids'] = {};
    for (const [id, state] of Object.entries(systemState.hybrids)) {
      hybrids[id] = {
        condition: state.condition,
        transitionProgress: state.transitionProgress
      };
    }

    const lfoConfigs: ValidatedPatch['lfoConfigs'] = {};
    for (const [id, config] of systemState.lfos) {
      lfoConfigs[id] = config;
    }

    return {
      name,
      version: '1.0.0',
      dualities,
      binaries,
      hybrids,
      lfoConfigs,
      affectors: systemState.affectors,
      fxChain: [],
      rituals: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Apply a patch to the system
   */
  applyPatch(patch: ValidatedPatch): void {
    // Apply dualities
    if (patch.dualities) {
      for (const [idStr, state] of Object.entries(patch.dualities)) {
        const id = Number(idStr);
        const duality = this._matrix.dualities.get(id);
        if (duality) {
          duality.fromJSON(state);
        }
      }
    }

    // Apply binaries
    if (patch.binaries) {
      for (const [id, state] of Object.entries(patch.binaries)) {
        const binary = this._matrix.binaries.get(id);
        if (binary) {
          binary.fromJSON(state);
        }
      }
    }

    // Apply hybrids
    if (patch.hybrids) {
      for (const [id, state] of Object.entries(patch.hybrids)) {
        const hybrid = this._matrix.hybrids.get(id);
        if (hybrid) {
          hybrid.fromJSON(state);
        }
      }
    }

    // Apply LFO configs
    if (patch.lfoConfigs) {
      for (const [idStr, config] of Object.entries(patch.lfoConfigs)) {
        const id = Number(idStr);
        this._matrix.attachLFO(id, config);
      }
    }

    // Register rituals
    if (patch.rituals) {
      for (const ritual of patch.rituals) {
        this._ritualEngine.registerRitual(ritual as RitualDefinition);
      }
    }

    this._currentPatch = patch;
  }

  /**
   * Load a patch from a file
   */
  async loadFromFile(filename: string): Promise<ValidatedPatch> {
    const filepath = this.resolvePath(filename);
    const content = await readFile(filepath, 'utf-8');
    const data = JSON.parse(content);

    const result = validatePatch(data);
    if (!result.success) {
      throw new Error(`Invalid patch file: ${result.errors.message}`);
    }

    this.applyPatch(result.data);
    return result.data;
  }

  /**
   * Save current patch to a file
   */
  async saveToFile(filename: string, patch?: ValidatedPatch): Promise<void> {
    const patchToSave = patch ?? this._currentPatch ?? this.captureState('untitled');

    // Update metadata
    if (patchToSave.metadata) {
      patchToSave.metadata.updatedAt = new Date().toISOString();
    }

    const filepath = this.resolvePath(filename);
    const dir = dirname(filepath);

    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    await writeFile(filepath, JSON.stringify(patchToSave, null, 2), 'utf-8');
  }

  /**
   * Create a snapshot of the current state
   */
  createSnapshot(name?: string): PatchSnapshot {
    const snapshot: PatchSnapshot = {
      name: name ?? `snapshot_${Date.now()}`,
      timestamp: Date.now(),
      data: this.captureState(name ?? 'snapshot'),
    };

    this._snapshots.push(snapshot);

    // Trim old snapshots
    if (this._snapshots.length > this._maxSnapshots) {
      this._snapshots = this._snapshots.slice(-this._maxSnapshots);
    }

    return snapshot;
  }

  /**
   * Restore a snapshot
   */
  restoreSnapshot(index: number): boolean {
    const snapshot = this._snapshots[index];
    if (!snapshot) return false;

    this.applyPatch(snapshot.data);
    return true;
  }

  /**
   * Get all snapshots
   */
  getSnapshots(): PatchSnapshot[] {
    return [...this._snapshots];
  }

  /**
   * Clear all snapshots
   */
  clearSnapshots(): void {
    this._snapshots = [];
  }

  /**
   * Resolve file path
   */
  private resolvePath(filename: string): string {
    if (filename.startsWith('/') || filename.startsWith('./')) {
      return filename;
    }
    return join(this._patchDirectory, filename.endsWith('.json') ? filename : `${filename}.json`);
  }

  /**
   * Set max snapshots
   */
  setMaxSnapshots(max: number): void {
    this._maxSnapshots = Math.max(1, max);
  }
}

/**
 * Built-in patch presets
 */
export const PATCH_PRESETS = {
  D3ATH_L0V3R_FUS10N: {
    name: 'D3ATH.L0V3R_FUS10N',
    version: '1.0.0',
    dualities: {
      13: { value: 0.9, locked: false }, // divine
      7: { value: -0.6, locked: false }, // glitch
      21: { value: -0.5, locked: false }, // dream
    },
    binaries: {
      B05: { state: 'A' as const, locked: false }, // create
    },
    hybrids: {},
    lfoConfigs: {
      13: { shape: 'moon_phase' as const, frequency: 1, amplitude: 0.3, phase: 0 },
    },
    affectors: [],
    fxChain: ['filter', 'reverb', 'shimmer', 'delay'],
    rituals: [],
    metadata: {
      description: 'Recursive poetry mode with dream haze',
      tags: ['ritual', 'poetry', 'dream'],
    },
  } satisfies ValidatedPatch,

  GLITCH_SUMM0N: {
    name: 'GLITCH_SUMM0N',
    version: '1.0.0',
    dualities: {
      7: { value: -0.8, locked: false }, // synthetic (glitch)
      18: { value: -0.7, locked: false }, // volatile
      4: { value: -0.6, locked: false }, // chaos
    },
    binaries: {
      B18: { state: 'B' as const, locked: false }, // corrupt
    },
    hybrids: {},
    lfoConfigs: {
      7: { shape: 'random' as const, frequency: 4, amplitude: 0.5, phase: 0 },
    },
    affectors: [],
    fxChain: ['glitch', 'freeze', 'granulator', 'delay'],
    rituals: [],
    metadata: {
      description: 'Pattern interruption and system corruption',
      tags: ['glitch', 'chaos', 'experimental'],
    },
  } satisfies ValidatedPatch,

  EQUILIBRIUM: {
    name: 'EQUILIBRIUM',
    version: '1.0.0',
    dualities: {},
    binaries: {},
    hybrids: {},
    lfoConfigs: {},
    affectors: [],
    fxChain: ['compressor', 'mix'],
    rituals: [],
    metadata: {
      description: 'Neutral balanced state',
      tags: ['neutral', 'reset'],
    },
  } satisfies ValidatedPatch,
} as const;
