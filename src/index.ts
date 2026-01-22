/**
 * sēma-mētra--alchemica-mundi
 * Signal-Matrix for World-Alchemy
 *
 * Kernel Law: Signals generate the matrix; the matrix transmutes signals;
 * and every transmutation rewrites the conditions of the world that will
 * interpret the next signal.
 *
 * A modular synthesis patchbay—routing signals across modalities
 * Alchemical transmutation of signals through a matrix of gated patch points
 *
 * The Dualcore Spectral Matrix system provides:
 * - 64 oscillating dualities (-1.0 to +1.0)
 * - 32 binary logic gates (on/off)
 * - 15 hybrid conditional toggles
 * - 32 bridge mappings (2 dualities -> 1 binary)
 * - LFO, RNG, and affector-based modulation
 * - Ritual execution with fusion signals
 * - FX chain with symbolic god-names
 * - Character waveform models
 * - Patch save/load system
 *
 * Axiom-Compliant Architecture (via spine module):
 * - Rule A: No empty boot (genesis signal required)
 * - Rule B: Append-only event log
 * - Rule C: Context required for all operations
 * - Rule D: Transforms must mutate (non-identity)
 * - Rule E: All transforms emit cost vectors
 * - Rule F: All outputs write back (world-binding)
 */

// Core exports
export * from './core/index.js';

// Modulation exports
export * from './modulation/index.js';

// Ritual exports
export * from './ritual/index.js';

// FX exports
export * from './fx/index.js';

// Character exports
export * from './character/index.js';

// Patch exports
export * from './patch/index.js';

// Spine exports (axiom-compliant architecture)
export * from './spine/index.js';

// ========================================
// Factory functions
// ========================================

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  DualityDefinition,
  BinaryDefinition,
  HybridDefinition,
  BridgeMapping,
  FXGodDefinition,
} from './core/types.js';
import { SemaMetra, type SemaMetraConfig } from './core/system.js';
import { ModulationEngine } from './modulation/engine.js';
import { RitualEngine, RITUAL_DEFINITIONS } from './ritual/engine.js';
import { FXGodRegistry } from './fx/gods.js';
import { PatchManager } from './patch/manager.js';
import { CharacterRegistry, CHARACTER_TEMPLATES } from './character/waveform.js';
import {
  createSpine,
  createSystemGenesisPayload,
  type Spine,
  type SpineConfig,
} from './spine/index.js';

export interface DataFiles {
  dualities: DualityDefinition[];
  binaries: BinaryDefinition[];
  hybrids: HybridDefinition[];
  bridges: BridgeMapping[];
  fxGods: FXGodDefinition[];
}

/**
 * Load data files from the data directory
 */
export async function loadDataFiles(dataDir?: string): Promise<DataFiles> {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const baseDir = dataDir ?? join(__dirname, '..', 'data');

  const loadJson = async <T>(filename: string): Promise<T> => {
    const content = await readFile(join(baseDir, filename), 'utf-8');
    return JSON.parse(content) as T;
  };

  const [dualitiesData, binariesData, hybridsData, bridgesData, fxGodsData] = await Promise.all([
    loadJson<{ entries: DualityDefinition[] }>('dualities.json'),
    loadJson<{ entries: BinaryDefinition[] }>('binaries.json'),
    loadJson<{ entries: HybridDefinition[] }>('hybrids.json'),
    loadJson<{ mappings: BridgeMapping[] }>('bridges.json'),
    loadJson<{ units: FXGodDefinition[] }>('fx-gods.json'),
  ]);

  return {
    dualities: dualitiesData.entries,
    binaries: binariesData.entries,
    hybrids: hybridsData.entries,
    bridges: bridgesData.mappings,
    fxGods: fxGodsData.units,
  };
}

/**
 * Create a SemaMetra matrix from loaded data
 */
export function createMatrix(data: DataFiles): SemaMetra {
  const config: SemaMetraConfig = {
    dualities: data.dualities,
    binaries: data.binaries,
    hybrids: data.hybrids,
    bridges: data.bridges,
  };

  return new SemaMetra(config);
}

/**
 * Create a fully initialized alchemical system with all engines
 */
export interface Alchemica {
  matrix: SemaMetra;
  modulation: ModulationEngine;
  ritual: RitualEngine;
  fx: FXGodRegistry;
  patch: PatchManager;
  characters: CharacterRegistry;
}

export async function createAlchemica(dataDir?: string): Promise<Alchemica> {
  const data = await loadDataFiles(dataDir);
  const matrix = createMatrix(data);

  const modulation = new ModulationEngine(matrix);
  const ritual = new RitualEngine(matrix);
  const fx = new FXGodRegistry(data.fxGods);
  const patch = new PatchManager(matrix);
  const characters = new CharacterRegistry();

  // Register built-in rituals
  for (const ritualDef of Object.values(RITUAL_DEFINITIONS)) {
    ritual.registerRitual(ritualDef);
  }

  // Register built-in characters
  for (const charConfig of Object.values(CHARACTER_TEMPLATES)) {
    characters.register(charConfig);
  }

  return { matrix, modulation, ritual, fx, patch, characters };
}

/**
 * Quick-start function for simple usage
 */
export async function quickStart(): Promise<Alchemica> {
  return createAlchemica();
}

// ========================================
// Axiom-Compliant Factory Functions
// ========================================

/**
 * Full alchemical system with spine (axiom-compliant)
 */
export interface AlchemicaMundi extends Alchemica {
  /** The spine (event log, context store, transform validator, world binding) */
  spine: Spine;
}

/**
 * Create a fully axiom-compliant alchemical system.
 *
 * This version satisfies all hard rules:
 * - Rule A: Genesis signal required (system cannot boot empty)
 * - Rule B: Append-only event log
 * - Rule C: Context required for all operations
 * - Rule D: Transforms must mutate
 * - Rule E: All transforms emit cost vectors
 * - Rule F: All outputs write back
 *
 * @param dataDir Optional path to data directory
 * @param spineConfig Optional spine configuration
 * @returns Complete axiom-compliant system
 */
export async function createAlchemicaMundi(
  dataDir?: string,
  spineConfig?: SpineConfig
): Promise<AlchemicaMundi> {
  const data = await loadDataFiles(dataDir);

  // Create spine with genesis signal (Rule A)
  const genesisPayload = createSystemGenesisPayload();
  const spine = createSpine(genesisPayload, spineConfig);

  // Create matrix with spine attached
  const config: SemaMetraConfig = {
    dualities: data.dualities,
    binaries: data.binaries,
    hybrids: data.hybrids,
    bridges: data.bridges,
    spine,
  };
  const matrix = new SemaMetra(config);

  // Create system context for initial operations
  const systemContext = spine.contextStore.create({
    who: { type: 'system', id: 'ALCHEMICA', name: 'alchemica-mundi' },
    what: {
      signalType: 'command',
      domain: 'system',
      intensity: 1.0,
      polarity: 'neutral',
    },
    when: { timestamp: Date.now() },
    where: { domain: 'system' },
    why: { intent: 'system initialization' },
    tags: ['system', 'init'],
  });
  matrix.setContext(systemContext);

  // Create engines
  const modulation = new ModulationEngine(matrix);
  const ritual = new RitualEngine(matrix);
  const fx = new FXGodRegistry(data.fxGods);
  const patch = new PatchManager(matrix);
  const characters = new CharacterRegistry();

  // Register built-in rituals
  for (const ritualDef of Object.values(RITUAL_DEFINITIONS)) {
    ritual.registerRitual(ritualDef);
  }

  // Register built-in characters
  for (const charConfig of Object.values(CHARACTER_TEMPLATES)) {
    characters.register(charConfig);
  }

  // Emit system initialization signal
  spine.eventLog.append(
    'signal:observed',
    {
      signalType: 'command',
      source: 'system',
      rawValue: { action: 'init_complete', timestamp: Date.now() },
      domain: 'system',
    },
    systemContext
  );

  return { matrix, modulation, ritual, fx, patch, characters, spine };
}

/**
 * Validate that a system is axiom-compliant.
 *
 * Use this to check if an AlchemicaMundi instance satisfies all hard rules.
 */
export function validateAxiomCompliance(system: AlchemicaMundi): {
  valid: boolean;
  report: import('./spine/index.js').RuleValidationReport;
} {
  const report = system.spine.rules.validateAll();
  return { valid: report.valid, report };
}
