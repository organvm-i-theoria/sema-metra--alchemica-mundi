/**
 * CLI command handlers
 */

import { createMatrix, loadDataFiles } from '../index.js';
import type { SemaMetra } from '../core/system.js';
import { ModulationEngine } from '../modulation/engine.js';
import { RitualEngine, RITUAL_DEFINITIONS } from '../ritual/engine.js';
import { FXGodRegistry } from '../fx/gods.js';
import { FXChain } from '../fx/chain.js';
import { PatchManager, PATCH_PRESETS } from '../patch/manager.js';

let matrix: SemaMetra | null = null;
let modulationEngine: ModulationEngine | null = null;
let ritualEngine: RitualEngine | null = null;
let fxRegistry: FXGodRegistry | null = null;
let patchManager: PatchManager | null = null;

/**
 * Initialize the system
 */
export async function initCommand(): Promise<void> {
  console.log('::INITIALIZING SEMA-METRA ALCHEMICA MUNDI::');
  console.log('');

  try {
    const data = await loadDataFiles();
    matrix = createMatrix(data);
    modulationEngine = new ModulationEngine(matrix);
    ritualEngine = new RitualEngine(matrix);
    fxRegistry = new FXGodRegistry(data.fxGods);
    patchManager = new PatchManager(matrix);

    // Register built-in rituals
    for (const ritual of Object.values(RITUAL_DEFINITIONS)) {
      ritualEngine.registerRitual(ritual);
    }

    console.log(`✓ Loaded ${data.dualities.length} dualities`);
    console.log(`✓ Loaded ${data.binaries.length} binaries`);
    console.log(`✓ Loaded ${data.hybrids.length} hybrids`);
    console.log(`✓ Loaded ${data.bridges.length} bridges`);
    console.log(`✓ Loaded ${data.fxGods.length} FX gods`);
    console.log(`✓ Registered ${Object.keys(RITUAL_DEFINITIONS).length} rituals`);
    console.log('');
    console.log('::SYSTEM_READY::');
  } catch (error) {
    console.error('Failed to initialize system:', error);
    process.exit(1);
  }
}

/**
 * Ensure system is initialized (auto-initializes if needed)
 */
async function ensureInit(): Promise<{ matrix: SemaMetra; modulation: ModulationEngine; ritual: RitualEngine; fx: FXGodRegistry; patch: PatchManager }> {
  if (!matrix || !modulationEngine || !ritualEngine || !fxRegistry || !patchManager) {
    const data = await loadDataFiles();
    matrix = createMatrix(data);
    modulationEngine = new ModulationEngine(matrix);
    ritualEngine = new RitualEngine(matrix);
    fxRegistry = new FXGodRegistry(data.fxGods);
    patchManager = new PatchManager(matrix);

    // Register built-in rituals
    for (const ritual of Object.values(RITUAL_DEFINITIONS)) {
      ritualEngine.registerRitual(ritual);
    }
  }
  return { matrix, modulation: modulationEngine, ritual: ritualEngine, fx: fxRegistry, patch: patchManager };
}

/**
 * Roll a die
 */
export async function rollCommand(die: string): Promise<void> {
  const { modulation } = await ensureInit();

  const validDice = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100', 'd1000'];
  if (!validDice.includes(die)) {
    console.error(`Invalid die. Choose from: ${validDice.join(', ')}`);
    return;
  }

  const result = modulation.rng.roll(die as 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100' | 'd1000');

  console.log(`::RNG::${die.toUpperCase()}::`);
  console.log(`Result: ${result.value} / ${result.max}`);
  console.log(`Normalized: ${(result.normalized * 100).toFixed(1)}%`);
  console.log(`Duality value: ${(result.normalized * 2 - 1).toFixed(3)}`);
}

/**
 * Modulate a duality
 */
export async function modulateCommand(dualityId: string, value: string): Promise<void> {
  const { matrix } = await ensureInit();

  const id = parseInt(dualityId, 10);
  const val = parseFloat(value);

  if (isNaN(id) || id < 1 || id > 64) {
    console.error('Duality ID must be between 1 and 64');
    return;
  }

  if (isNaN(val) || val < -1 || val > 1) {
    console.error('Value must be between -1.0 and +1.0');
    return;
  }

  const duality = matrix.duality(id);
  const oldValue = duality.value;
  matrix.setDuality(id, val);

  console.log(`::MODULATE::D${id.toString().padStart(2, '0')}::`);
  console.log(`${duality.leftPole} <---> ${duality.rightPole}`);
  console.log(`Old: ${oldValue.toFixed(3)} -> New: ${duality.value.toFixed(3)}`);
  console.log(`Pole: ${duality.currentPole}`);
}

/**
 * Toggle a binary gate
 */
export async function toggleCommand(binaryId: string, state?: string): Promise<void> {
  const { matrix } = await ensureInit();

  if (!binaryId.match(/^B\d{2}$/)) {
    console.error('Binary ID format: B01-B32');
    return;
  }

  const binary = matrix.binary(binaryId);

  if (state) {
    if (state.toUpperCase() === 'A' || state.toLowerCase() === binary.stateA.toLowerCase()) {
      binary.setA();
    } else if (state.toUpperCase() === 'B' || state.toLowerCase() === binary.stateB.toLowerCase()) {
      binary.setB();
    } else {
      binary.toggle();
    }
  } else {
    binary.toggle();
  }

  console.log(`::TOGGLE::${binaryId}::`);
  console.log(`${binary.stateA} / ${binary.stateB}`);
  console.log(`State: ${binary.stateLabel} (${binary.state})`);
}

/**
 * Inspect system state
 */
export async function inspectCommand(options: { duality?: string; binary?: string; hybrid?: string; all?: boolean }): Promise<void> {
  const { matrix } = await ensureInit();

  if (options.duality) {
    const id = parseInt(options.duality, 10);
    const duality = matrix.duality(id);
    console.log(`::INSPECT::D${id.toString().padStart(2, '0')}::`);
    console.log(`Poles: ${duality.leftPole} <-> ${duality.rightPole}`);
    console.log(`Value: ${duality.value.toFixed(3)}`);
    console.log(`Current: ${duality.currentPole}`);
    console.log(`Intensity: ${(duality.intensity * 100).toFixed(1)}%`);
    console.log(`Domain: ${duality.domain}`);
    console.log(`Tags: ${duality.tags.join(', ')}`);
    console.log(`RNG: ${duality.rng}`);
    console.log(`Fusion Hook: ${duality.fusionHook}`);
    return;
  }

  if (options.binary) {
    const binary = matrix.binary(options.binary);
    console.log(`::INSPECT::${binary.id}::`);
    console.log(`States: ${binary.stateA} / ${binary.stateB}`);
    console.log(`Current: ${binary.stateLabel} (${binary.state})`);
    console.log(`Domain: ${binary.domain}`);
    console.log(`Signal Type: ${binary.signalType}`);
    return;
  }

  if (options.hybrid) {
    const hybrid = matrix.hybrid(options.hybrid);
    console.log(`::INSPECT::${hybrid.id}::`);
    console.log(`Conditions: ${hybrid.conditionA} / ${hybrid.conditionB}`);
    console.log(`Current: ${hybrid.conditionLabel}`);
    console.log(`Mode: ${hybrid.mode}`);
    return;
  }

  if (options.all) {
    console.log('::SYSTEM STATE::');
    console.log('');
    console.log('DUALITIES (non-zero):');
    for (const d of matrix.dualities.all()) {
      if (Math.abs(d.value) > 0.01) {
        console.log(`  D${d.id.toString().padStart(2, '0')}: ${d.value.toFixed(3)} (${d.currentPole})`);
      }
    }
    console.log('');
    console.log('BINARIES (state B):');
    for (const b of matrix.binaries.all()) {
      if (b.isB) {
        console.log(`  ${b.id}: ${b.stateLabel}`);
      }
    }
    console.log('');
    console.log('HYBRIDS (non-A):');
    for (const h of matrix.hybrids.all()) {
      if (!h.isA) {
        console.log(`  ${h.id}: ${h.conditionLabel}`);
      }
    }
    return;
  }

  console.log('Use --duality <id>, --binary <id>, --hybrid <id>, or --all');
}

/**
 * Execute a ritual
 */
export async function ritualCommand(ritualName: string, options: { check?: boolean }): Promise<void> {
  const { ritual } = await ensureInit();

  if (options.check) {
    const check = ritual.check(ritualName);
    console.log(`::RITUAL CHECK::${ritualName}::`);
    console.log(`Would pass: ${check.wouldPass ? 'YES' : 'NO'}`);
    console.log('');
    console.log('Conditions:');
    for (const c of check.conditions) {
      console.log(`  ${c.passed ? '✓' : '✗'} ${c.description}`);
    }
    return;
  }

  const result = ritual.execute(ritualName);

  console.log(`::RITUAL EXECUTE::${ritualName}::`);
  console.log(`Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);

  if (result.fusionSignal) {
    console.log(`Fusion Signal: ${result.fusionSignal}`);
  }

  console.log('');
  console.log('Conditions:');
  for (const c of result.conditionResults) {
    const desc = c.condition.type === 'duality'
      ? `D${c.condition.id} ${c.condition.operator} ${c.condition.value}`
      : `${c.condition.id} ${c.condition.operator} ${c.condition.value}`;
    console.log(`  ${c.passed ? '✓' : '✗'} ${desc}`);
  }

  if (result.effects.length > 0) {
    console.log('');
    console.log('Effects Applied:');
    for (const e of result.effects) {
      console.log(`  [${e.type}] ${e.target}: ${e.value}`);
    }
  }
}

/**
 * List available rituals
 */
export async function ritualsListCommand(): Promise<void> {
  const { ritual } = await ensureInit();

  console.log('::AVAILABLE RITUALS::');
  console.log('');

  for (const r of ritual.getAllRituals()) {
    console.log(`${r.name}`);
    console.log(`  Signal: ${r.fusionSignal}`);
    console.log(`  Binary Lock: ${r.binaryLock.id} = ${r.binaryLock.requiredState}`);
    console.log('');
  }
}

/**
 * Show FX gods
 */
export async function fxCommand(options: { list?: boolean; invoke?: string }): Promise<void> {
  const { fx } = await ensureInit();

  if (options.list) {
    console.log('::FX GODS::');
    console.log('');
    for (const def of fx.getAllDefinitions()) {
      console.log(`${def.godName} [${def.id}]`);
      console.log(`  Effect: ${def.effectType}`);
      console.log(`  Role: ${def.role}`);
      console.log('');
    }
    return;
  }

  if (options.invoke) {
    console.log(fx.invoke(options.invoke));
    return;
  }

  console.log('Use --list or --invoke <id>');
}

/**
 * Load/save patches
 */
export async function patchCommand(
  action: string,
  name?: string,
  options: { preset?: string } = {}
): Promise<void> {
  const { patch } = await ensureInit();

  if (action === 'save' && name) {
    await patch.saveToFile(name);
    console.log(`Patch saved: ${name}`);
    return;
  }

  if (action === 'load' && name) {
    await patch.loadFromFile(name);
    console.log(`Patch loaded: ${name}`);
    return;
  }

  if (action === 'preset' && options.preset) {
    const presetKey = options.preset.toUpperCase().replace(/-/g, '_') as keyof typeof PATCH_PRESETS;
    const preset = PATCH_PRESETS[presetKey];
    if (preset) {
      patch.applyPatch(preset);
      console.log(`Preset applied: ${preset.name}`);
    } else {
      console.log('Available presets:');
      for (const key of Object.keys(PATCH_PRESETS)) {
        console.log(`  ${key}`);
      }
    }
    return;
  }

  if (action === 'snapshot') {
    const snapshot = patch.createSnapshot(name);
    console.log(`Snapshot created: ${snapshot.name}`);
    return;
  }

  if (action === 'capture') {
    const captured = patch.captureState(name ?? 'captured');
    console.log(`Current state captured as: ${captured.name}`);
    console.log(JSON.stringify(captured, null, 2));
    return;
  }

  console.log('Usage: patch <save|load|preset|snapshot|capture> [name] [--preset <name>]');
}

/**
 * Reset the system
 */
export async function resetCommand(): Promise<void> {
  const { matrix } = await ensureInit();

  matrix.reset();
  console.log('::SYSTEM RESET::');
  console.log('All dualities, binaries, and hybrids reset to initial state.');
}
