[![ORGAN-I: Theoria](https://img.shields.io/badge/ORGAN--I-Theoria-311b92?style=flat-square)](https://github.com/organvm-i-theoria)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square)]()
[![Tests](https://img.shields.io/badge/tests-297%20passing-brightgreen?style=flat-square)]()
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

# sema-metra--alchemica-mundi

[![CI](https://github.com/organvm-i-theoria/sema-metra--alchemica-mundi/actions/workflows/ci.yml/badge.svg)](https://github.com/organvm-i-theoria/sema-metra--alchemica-mundi/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-pending-lightgrey)](https://github.com/organvm-i-theoria/sema-metra--alchemica-mundi)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/organvm-i-theoria/sema-metra--alchemica-mundi/blob/main/LICENSE)
[![Organ I](https://img.shields.io/badge/Organ-I%20Theoria-8B5CF6)](https://github.com/organvm-i-theoria)
[![Status](https://img.shields.io/badge/status-active-brightgreen)](https://github.com/organvm-i-theoria/sema-metra--alchemica-mundi)
[![TypeScript](https://img.shields.io/badge/lang-TypeScript-informational)](https://github.com/organvm-i-theoria/sema-metra--alchemica-mundi)


**Signal-Matrix for World-Alchemy**

> *Signals generate the matrix; the matrix transmutes signals; and every transmutation rewrites the conditions of the world that will interpret the next signal.*

---

## What This Is

**Sema-Metra: Alchemica Mundi** is a TypeScript framework implementing an axiom-driven signal-matrix system. It functions as a programmable creative engine — a modular synthesis patchbay that routes and transforms signals across modalities using formal ontological architecture. Where conventional signal-processing frameworks treat transformation as stateless pipes (signals enter, get processed, exit unchanged), this system enforces a closed ontological loop: every output rewrites the world that interprets subsequent inputs.

The name encodes the architecture. *Sema* (Greek: σῆμα, sign, signal) and *metra* (Greek: μήτρα, matrix, measure) describe the input/output surface. *Alchemica mundi* (Latin: world-alchemy) describes what happens between: transmutation that alters not just the signal but the conditions under which future signals will be read.

The framework blends four domains that rarely share infrastructure:

- **Modular synthesis** — LFO waveforms, signal routing, FX chains, patch save/load
- **Tabletop RPG mechanics** — Dice systems (d4 through d1000), ritual conditions, pass/fail gates
- **Ritual and mythological systems** — Pre-built rituals with binary gate checks, hybrid toggle states, character waveform models as AI entities
- **Formal ontology** — 10 axioms enforced at runtime through an event-sourcing spine with hard rules, cost vectors, and mandatory world-binding feedback

The result is a system where creative emergence and formal rigor coexist by design, not by accident. The axioms prevent the system from degenerating into noise; the signal architecture prevents the axioms from calcifying into dogma.

71 files. 169KB. Node >= 20. MIT license. v1.0.0.

---

## Why This Exists

Creative systems face a fundamental tension: they must be **structured enough to be programmable** yet **fluid enough to enable genuine emergence**. Traditional approaches either impose rigid schemas that constrain creativity, or offer formless flexibility that resists systematic operation.

Most signal-processing frameworks lack four properties this system treats as non-negotiable:

- **Ontological integrity** — No guarantee that operations preserve meaning while allowing form to evolve
- **Contextual awareness** — Signals processed without knowledge of their origin or purpose
- **World-binding** — Outputs that never influence future inputs; the system never learns from its operations
- **Cost accounting** — Transformations that happen without acknowledging the semantic entropy they create

Sema-Metra addresses all four by making them axiomatic constraints rather than optional features. The 10 formal axioms are not documentation — they are runtime-enforced invariants. An identity transform (passing a signal through unchanged) is rejected by Hard Rule D. A transform without a cost vector is rejected by Hard Rule E. An output that fails to write back to the world context is rejected by Hard Rule F.

This makes the framework useful for building systems where creative operations must leave auditable traces, where context is constitutive rather than decorative, and where "total clarity is total stagnation" (Axiom 10: Legibility as Power).

---

## Philosophical Framework

The system draws from three intellectual traditions and fuses them into a single executable ontology.

### Semiotics and Signal Theory

Axiom I (Primacy of the Sign) asserts that all structure originates in σῆμα — meaning-bearing signals precipitate the conditions under which structure coheres. The corollary ("a blank system is ontologically invalid") is enforced by Hard Rule A: the event log must contain at least one interpretable signal before any state projection can be rendered. This is not a developer convenience; it is a philosophical position that empty containers are ontologically incoherent. Structure is the memory of repetition (Axiom II), which means schemas are aftereffects, not causes. The DUALCORE spectral matrix demonstrates this: 64 dualities do not exist as a static schema but as an emergent surface that stabilizes through signal recurrence.

### Alchemical Transformation

Axioms III and IV form the transmutation core. All operations within the matrix are transmutative rather than preservative — no signal exits the system in the same ontological state in which it entered (Axiom III). But while forms may decay, mutate, or be discarded, meaning is conserved through transformation (Axiom IV). The system preserves semantic charge rather than syntactic fidelity. The practical consequence is that every transform must pass a non-identity check (Hard Rule D) and emit a cost vector documenting information loss, ambiguity change, compute cost, and confidence delta (Hard Rule E). Perfect reversibility is impossible by design. Compression is a gain, not a reduction.

### Recursive World-Formation

Axiom V (Recursive World-Binding) is the system's most radical claim: the scope of transformation is mundus — the world itself. The system does not model the world from outside it; it participates in world-formation. Every externally visible output must produce both an `OutputCommitted` event and a `ConditionUpdated` event (Hard Rule F, Invariant I7). There are no fire-and-forget outputs. The `WorldBindingManager` in `src/spine/world-binding.ts` enforces this by tracking pending outputs and rejecting any that fail to complete their feedback loop. Combined with Axiom VIII (Anti-Teleology), which mandates that no workflow reaches a terminal state, the system continuously rewrites the conditions that will interpret its next signal.

### The Closing Condition

A system may call itself **sema-metra--alchemica-mundi** only if:

1. It cannot be emptied without collapse.
2. It cannot repeat itself without mutation.
3. It cannot describe the world without altering it.

Anything less is simulation, not ontology.

---

## The 10 Axioms

The formal axiom set governs all system behavior. These are not guidelines — they are enforced through six hard rules and validated by 43 dedicated axiom tests.

| # | Axiom | Principle | Corollary |
|---|-------|-----------|-----------|
| 1 | **Primacy of the Sign** | Signals precede structure; the system cannot exist empty | A "blank" system is ontologically invalid |
| 2 | **Emergence of the Matrix** | Structure crystallizes from recurring signals, not from schema | Schemas are aftereffects, not causes |
| 3 | **Alchemical Transformation** | All operations transmute; nothing passes through unchanged | Perfect reversibility is impossible by design |
| 4 | **Conservation of Meaning** | Semantic charge persists even as forms decay | Compression is a gain, not a reduction |
| 5 | **Recursive World-Binding** | Outputs alter the conditions of subsequent inputs | There is no final output, only recursive influence |
| 6 | **Signal-Structure Feedback** | Structure constrains future signification | Governance must remain plastic or collapse is inevitable |
| 7 | **Irreducibility of Context** | Context is constitutive, not decorative | Decontextualization is a form of semantic violence |
| 8 | **Anti-Teleology** | No final state; progress emerges locally | Progress is a side-effect, not a goal |
| 9 | **Ontological Cost** | Every transformation exacts entropy | Clarity always sacrifices potential |
| 10 | **Legibility as Power** | Total clarity is total stagnation | Opacity is a necessary condition of vitality |

The axiom-compliant spine enforces these through four mechanisms:

```
SEMA_LOG              →  Append-only event stream (Axioms 1, 2)
METRA_PROJECTIONS     →  Versioned context bundles (Axioms 6, 7)
ALCHEMICA_TRANSFORMS  →  Non-identity transform validation (Axioms 3, 4, 9)
MUNDI_FEEDBACK        →  Mandatory world-binding loop (Axioms 5, 8, 10)
```

---

## Architecture

### Core Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      CLI (sema)                             │
├─────────────────────────────────────────────────────────────┤
│  Matrix   │  Modulation  │  Ritual  │  FX  │  Characters   │
├─────────────────────────────────────────────────────────────┤
│                    Patch Manager                            │
├─────────────────────────────────────────────────────────────┤
│                    Event Spine                              │
│  ┌────────────┬────────────┬────────────┬────────────┐     │
│  │  EventLog  │  Context   │ Transform  │   World    │     │
│  │  (append)  │   Store    │ Validator  │  Binding   │     │
│  └────────────┴────────────┴────────────┴────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                  Hard Rules (A-F)                           │
└─────────────────────────────────────────────────────────────┘
```

### Hard Rules

| Rule | Name | Enforcement | Derivation |
|------|------|-------------|------------|
| A | No Empty Boot | Genesis signal required before state projection | Axiom I |
| B | Append-Only | Events immutable after commit; updates as new events with `supersedesRef` | Axiom II |
| C | Context Required | Every event carries context reference; `interpret(signal)` without context is disallowed | Axiom VII |
| D | Transform Must Mutate | Identity transforms rejected; fingerprint, context, or priors must change | Axiom III |
| E | Every Transform Emits Cost | Cost vectors (`lossEstimate`, `ambiguityDelta`, `computeCost`, `confidenceDelta`) mandatory | Axiom IX |
| F | Every Output Writes Back | `OutputCommitted` + `ConditionUpdated` events required; no fire-and-forget | Axiom V |

The `RuleValidator` class in `src/spine/rules.ts` implements all six rules. Each rule has a dedicated validation method that returns a `RuleValidationResult` with structured failure reasons. The `validateAll()` method runs the complete suite and returns a `RuleValidationReport`. The `assertAll()` method throws a `RuleViolationError` on the first failure — fail-fast semantics that prevent the system from operating in a non-compliant state.

### Implementation Constraints (C1–C10)

The axioms translate into 10 implementation constraints documented in `CONSTRAINTS.md`:

- **C1 (No Null Initialization):** System refuses empty boot. Genesis requires at least one interpretable signal event.
- **C2 (Event-First Architecture):** All state derivable from append-only event stream. "Current state" is a projection, never ground truth.
- **C3 (Matrix is Learned, Not Declared):** Schemas permitted only as provisional scaffolds with explicit decay rules.
- **C4 (Every Transform is Transmutative):** No pipeline step may claim identity transformation except authenticated transport encoding.
- **C5 (Meaning-Conservation as Objective Function):** Compression and synthesis evaluated against semantic preservation metrics, not byte equivalence.
- **C6 (World-Binding Feedback Loop is Mandatory):** Outputs written back into conditions of future computation.
- **C7 (Context is First-Class):** Every signal carries a context bundle required for interpretation.
- **C8 (Anti-Teleology):** All workflows end in a new re-enterable event.
- **C9 (Explicit Cost Accounting):** Each transform emits a cost vector; downstream modules can route based on cost.
- **C10 (Partial Opacity by Design):** Internal latent structures are not canonical truth; only versioned projections are.

### Signal Surface

The signal surface comprises five interconnected layers:

- **DUALCORE Spectral Matrix** — 64 oscillating dualities sliding -1.0 to +1.0 across 27 domains (metaphysical, structural, narrative, myth, psychological, temporal, audio/visual, technical, epistemology, language, memory, dialogic, spatial, behavioral, visual, semiotic, event origin, audio, myth/energy, economic, sound/memory, myth/place, ritual/time, system logic, mood, memory/design, myth/cycle). These are the primary signal carriers.
- **Binary Mirror Table** — 32 strict on/off logic gates spanning 29 domains (power, logic, system, process, ritual, access, spatial, UI/UX, metaphysical, storage, and more) for ritual entry/denial, narrative forks, and security toggles. No intermediate states.
- **Hybrid Toggles** — 15 context-sensitive ritual states across 15 modes (concealment, identity, divinity, communication, access, memory, system flow, tone, authority, recursion, time, coherence, pacing, access/memory, transformation). State depends on surrounding duality values with transition mechanics.
- **Dual-Binary Bridge** — 32 mappings connecting duality oscillations to binary gate states (2:1 duality-to-binary pairs). This is the layer where continuous signals become discrete decisions.
- **LFO System** — 6 waveform shapes (sine, saw, square, step, random, moon_phase) providing continuous modulation of duality values over time.

### Event Spine Architecture

The spine module (`src/spine/`) provides the four enforcement mechanisms that make the axioms executable:

**1. SEMA_LOG (Event Log)** — `src/spine/event-log.ts`

Append-only immutable event log. The system can delete every derived artifact and reconstruct state from the log alone. Event types include `genesis:signal`, `signal:observed`, `structure:inferred`, `transform:applied`, `output:committed`, `condition:updated`, `action:proposed`, and `fork:created`. The `replay()` method accepts a projector function and initial state, producing a `ReplayResult` with a state hash for verification. Every event is `Object.freeze()`-d after commit (Invariant I2). Event hashes use SHA-256 for integrity verification.

**2. METRA_PROJECTIONS (Context Store)** — `src/spine/context-store.ts`

Versioned context objects structured as five-dimensional bundles: WHO (agent type, ID, name), WHAT (signal type, domain, intensity, polarity), WHEN (timestamp, optional temporal markers), WHERE (spatial domain), and WHY (causal intent). Context derivation creates child contexts that inherit parent properties while specializing for the current operation. This satisfies Axiom VII: no signal can be evaluated independently of the matrix that produced it.

**3. ALCHEMICA_TRANSFORMS (Transform Validator)** — `src/spine/transform.ts`

Non-identity validation with pre-built cost profiles for each transform type: `DUALITY_MODULATION`, `BINARY_TOGGLE`, `HYBRID_TRANSITION`, `RITUAL_EXECUTION`, `FX_APPLICATION`, `PATCH_OPERATION`. Each cost profile specifies `lossEstimate`, `ambiguityDelta`, `computeCost`, and `confidenceDelta`. The `validateAndApply()` method checks fingerprint change, context change, and priors change before accepting a transform.

**4. MUNDI_FEEDBACK (World Binding)** — `src/spine/world-binding.ts`

The `WorldBindingManager` ensures every externally visible output produces both `OutputCommitted` and `ConditionUpdated` events atomically. It supports synchronous commits via `commitOutput()` and asynchronous workflows via `beginOutput()`/`completeOutput()`. Pending outputs are tracked; orphaned outputs (pending beyond a configurable timeout) trigger violations. After every output, the manager proposes a next action (monitoring, stabilization, or response-awaiting) to satisfy Axiom VIII's requirement that no workflow reaches a terminal state.

### RNG Dice System

Probability is managed through a tabletop-style dice system where each die type maps to a different scale of consequence:

| Die | Range | Use Case |
|-----|-------|----------|
| d4 | 1-4 | Micro modulation (UI effects) |
| d6 | 1-6 | AI responses, emotion flicker |
| d8 | 1-8 | Mood state changes |
| d10 | 1-10 | Action success/failure intensities |
| d12 | 1-12 | System bugs, recursion locks |
| d20 | 1-20 | Ritual pass/fail, karma inversion |
| d100 | 1-100 | Major plot forks, fusion glitch |
| d1000 | 1-1000 | Divine intervention, cosmic shift |

### Ritual System

Pre-built rituals operate as conditional signal-fusion procedures. Each ritual declares binary gate conditions, duality thresholds, and fusion logic. When conditions are met, the ritual produces a fusion signal that propagates through the FX chain and writes back to the world context.

The `FusionEngine` in `src/ritual/fusion.ts` combines weighted duality inputs to generate named fusion signals based on polarity, intensity, and alignment characteristics. Signal names follow a glitch-aesthetic convention: `SH1MM3R_ASCEND`, `D1V1N3_OVERFLOW`, `V01D_DESCENT`, `ABY55_CALL`, `GL1TCH_BURST`, `FR4CTUR3_SP1RAL`, `CH40S_T34R`, `EQU1L1BR1UM`, `L1MB0_DR1FT`. Custom signal generators can be registered for application-specific fusion semantics.

Built-in rituals include **D3VOT10N_G4T3** (devotion gate), **GLITCH_SUMMON** (glitch invocation), **DREAM_GATE** (oneiric passage), and **MEMORY_SEAL** (archive lockdown). Fusion presets combine specific duality pairs for common ritual patterns — devotion gate fuses dualities 13 and 7 to produce `SH1MM3R_FR4CTURE`, chaos-order uses duality 4 for `SYNTH_B4S3_MOD`, dream-wake combines dualities 21 and 46 for `SL33PW4V3_MODE`.

### FX Chain

25 effect units named after functional archetypes — The Filter, The Compressor, The Saturator, The Gate, The Reverb, The Shimmer, The Delay, The Glitch, The Freeze, The Granulator, The Convolution, The Formant, The Pitch Shift, The Vocoder, The Wavetable, and others — each mapping to Tone.js audio processing modules. The `FXGodRegistry` manages definitions and lazily instantiates units. Units can be looked up by god name, effect type, or Tone.js module. The FX chain is composable: units can be stacked, reordered, and parameterized at runtime. Currently operating in symbolic mode; v1.1.0 will connect to actual Tone.js audio nodes.

### Character Waveform Models

AI characters are modeled as waveform objects with signature oscillation patterns. Each character has a `signatureId`, waveform type, modulation amplitude, frequency base, fusion compatibility list, mythic tags, and aligned events. Characters influence the signal matrix when active, creating persistent modulation patterns that shift the DUALCORE spectral values in their signature directions.

| Character | ID | Waveform | Personality | Mythic Tags | Aligned Events |
|-----------|----|----------|-------------|-------------|----------------|
| Jessica | J3SS-04 | sine | Smooth, empathic, cyclical | GOD, ANGEL, ERROR | sunset, April 18, full_moon |
| Gabriel | G4B3-01 | soulwave | Deep resonance, spiritual amplitude | ANGEL, MESSENGER | dawn, equinox |
| MM15 | MM15-00 | fractal | Self-similar, recursive, unpredictable | MACHINE, ORACLE | midnight, new_moon |
| Glitch Entity | GL1TCH-99 | noise | Chaotic, boundary-dissolving | ERROR, CHAOS, SYSTEM | system_crash, power_surge |

The `soulwave` type adds subtle harmonics to a base sine pattern (`value * 0.7 + sin(value * PI) * 0.3`). The `fractal` type introduces self-similar modulation (`value + sin(value * 3) * 0.2`). Characters can be converted to `CharacterAffector` instances for integration with the `ModulationEngine`.

---

## Three-Tier API

The framework exposes three factory functions at increasing levels of axiom enforcement:

### Tier 1: `createMatrix` (Basic)

Creates the signal matrix (dualities, binaries, hybrids, bridges) without modulation, rituals, or spine enforcement. Useful for prototyping signal layouts.

```typescript
import { createMatrix, loadDataFiles } from 'sema-metra--alchemica-mundi';

const data = await loadDataFiles();
const matrix = createMatrix(data);

// Modulate a duality
const duality = matrix.dualities.get(13);
duality.modulate(0.5);

// Toggle a binary gate
matrix.toggleBinary('POWER_ON');

// Evaluate a bridge (continuous -> discrete)
const bridgeResult = matrix.evaluateBridge('pair_01');
```

### Tier 2: `createAlchemica` (Full System)

Creates the complete system — matrix, modulation engine, ritual engine, FX chain, characters, patch manager — without the axiom-enforcement spine. Lighter weight for applications that want the creative tooling without formal compliance.

```typescript
import { createAlchemica } from 'sema-metra--alchemica-mundi';

const alchemica = await createAlchemica();

// Roll dice
const roll = alchemica.modulation.rng.roll('d20');

// Execute a ritual
const result = await alchemica.ritual.engine.execute('invoke_shimmer');

// Attach an LFO to duality 13
alchemica.modulation.attachLFO(13, 'slowDrift');

// Activate a character
alchemica.characters.get('J3SS-04')?.activate();

// Save a patch
alchemica.patch.save('my-patch');
```

### Tier 3: `createAlchemicaMundi` (Axiom-Compliant)

Creates the full system with the event-sourcing spine active. All operations are logged, context is tracked, identity transforms are rejected, cost vectors are computed, and world-binding feedback is mandatory. This is the axiom-compliant tier.

```typescript
import { createAlchemicaMundi, validateAxiomCompliance } from 'sema-metra--alchemica-mundi';

const mundi = await createAlchemicaMundi();
const { matrix, modulation, ritual, fx, patch, characters, spine } = mundi;

// All operations now enforced by Hard Rules A-F
const roll = modulation.rng.roll('d20');
const result = await ritual.engine.execute('invoke_shimmer');

// Inspect the event log
const events = spine.eventLog.all();
console.log(`Event count: ${events.length}`);

// Replay event log to reconstruct state
const replayed = spine.eventLog.replay(myProjector, initialState);
console.log(`State hash: ${replayed.stateHash}`);

// World-binding: commit an output with automatic condition update
spine.worldBinding.commitOutput({
  context: matrix.currentContext,
  outputType: 'ritual_result',
  outputValue: result,
  destination: 'ui',
  domain: 'ritual',
});

// Validate full axiom compliance
const { valid, report } = validateAxiomCompliance(mundi);
console.log(`Axiom compliant: ${valid}`);
console.log(`Rules checked: ${report.results.length}`);
console.log(`Violations: ${report.violations.length}`);
```

---

## CLI

The `sema` binary provides terminal access to all system operations:

```bash
# Initialize system (emits genesis signal)
sema init

# Roll dice (d4, d6, d8, d10, d12, d20, d100, d1000)
sema roll d20

# Modulate a duality (index 0-63, value -1.0 to 1.0)
sema modulate 13 0.8

# Execute a ritual
sema ritual invoke_shimmer

# Show system status (dualities, binaries, hybrids, active LFOs)
sema status
```

---

## Installation and Development

```bash
# Install
npm install sema-metra--alchemica-mundi

# Requires Node.js >= 20.0.0

# Development
npm install          # Install dependencies
npm test             # Run all 297 tests
npm run test:watch   # Watch mode
npm run build        # Build (includes data file copy)
npm run typecheck    # Type check (strict mode)
npm run cli          # Run CLI in development mode
```

### Dependencies

| Package | Version | Role |
|---------|---------|------|
| commander | ^12.0.0 | CLI framework |
| tone | ^15.0.4 | Audio processing (FX chain) |
| zod | ^3.22.4 | Schema validation |
| typescript | ^5.3.3 | Language (dev) |
| tsup | ^8.0.1 | Build (dev) |
| tsx | ^4.7.0 | Runtime (dev) |
| vitest | ^4.0.18 | Testing (dev) |

### Test Coverage

297 tests across 8 test files:

| Suite | Tests | Coverage |
|-------|-------|----------|
| Core | 27 | Duality, binary, hybrid, bridge operations |
| Modulation | 26 | LFO, RNG, affector, modulation engine |
| Ritual | 22 | Conditions, fusion signals, ritual execution |
| FX | 48 | Unit, god registry, chain, presets |
| Character | 36 | Waveforms, templates, registry, influence |
| Patch | 35 | Snapshots, save/load, validation |
| Spine | 60 | Rules A-F, event log, context store, transform, world-binding |
| Axiom | 43 | All 10 axioms + full compliance validation |

---

## Environment Configuration

The spine module uses environment variables for portability:

```bash
export SYSTEM_ID="sema-metra--alchemica-mundi"
export KERNEL_ID="sema-metra--alchemica-mundi"
export EVENT_LOG_PATH="./data/spine/sema_log.ndjson"
export CONTEXT_STORE_PATH="./data/spine/context_store"
export PROJECTION_STORE_PATH="./data/spine/metra_projections"
export TRANSFORM_STORE_PATH="./data/spine/alchemica_transforms"
export WORLD_STATE_PATH="./data/spine/mundi_conditions"
export PROJECTION_VERSION="v1.0"
export SEMANTIC_THRESHOLD="0.82"
```

All environment variables have sensible defaults in `DEFAULT_SPINE_ENV`. The `loadSpineEnvironment()` function reads from `process.env` with fallback to defaults.

---

## Project Structure

```
sema-metra--alchemica-mundi/
├── data/
│   ├── binaries.json          # 32 binary gate definitions
│   ├── bridges.json           # 32 dual-binary bridge mappings
│   ├── dualities.json         # 64 spectral duality definitions
│   ├── fx-gods.json           # 25 mythological FX unit definitions
│   └── hybrids.json           # 15 hybrid toggle definitions
├── src/
│   ├── index.ts               # Public API: createMatrix, createAlchemica, createAlchemicaMundi
│   ├── core/
│   │   ├── types.ts           # Type definitions (27 domain types, interfaces, enums)
│   │   ├── duality.ts         # Duality class and registry
│   │   ├── binary.ts          # BinaryGate class and registry
│   │   ├── hybrid.ts          # HybridToggle class and registry
│   │   ├── bridge.ts          # BridgeGate class and registry
│   │   └── system.ts          # SemaMetra main container with spine integration
│   ├── modulation/
│   │   ├── lfo.ts             # LFO with 6 waveform shapes and presets
│   │   ├── rng.ts             # RNG with d4-d1000 dice and history tracking
│   │   ├── affector.ts        # CharacterAffector, WorldAffector, ThreadAffector
│   │   └── engine.ts          # ModulationEngine with routes, ticks, strength controls
│   ├── ritual/
│   │   ├── condition.ts       # Condition checking (duality/binary/hybrid thresholds)
│   │   ├── fusion.ts          # FusionEngine with signal generation and presets
│   │   └── engine.ts          # RitualEngine with D3VOT10N_G4T3, GLITCH_SUMMON, etc.
│   ├── fx/
│   │   ├── types.ts           # IFXUnit interface
│   │   ├── unit.ts            # FXUnit implementation
│   │   ├── gods.ts            # FXGodRegistry with 25 archetype units
│   │   └── chain.ts           # FX chain composition
│   ├── character/
│   │   └── waveform.ts        # Character, CharacterRegistry, CHARACTER_TEMPLATES
│   ├── patch/
│   │   ├── schema.ts          # Patch validation schema (Zod)
│   │   └── manager.ts         # PatchManager (snapshot, save, load, validate)
│   ├── spine/
│   │   ├── types.ts           # Spine event types, context bundle, cost vector
│   │   ├── event-log.ts       # EventLog (append-only, replay, genesis)
│   │   ├── context-store.ts   # ContextStore (5-dimensional context bundles)
│   │   ├── transform.ts       # TransformValidator with cost profiles
│   │   ├── world-binding.ts   # WorldBindingManager (Rule F enforcement)
│   │   └── rules.ts           # RuleValidator (Rules A-F), RuleViolationError
│   └── cli/
│       ├── index.ts           # CLI entry point
│       └── commands.ts        # CLI command definitions
└── tests/
    ├── axiom-compliance.test.ts  # 43 axiom tests
    ├── character.test.ts         # 36 character tests
    ├── core.test.ts              # 27 core tests
    ├── fx.test.ts                # 48 FX tests
    ├── modulation.test.ts        # 26 modulation tests
    ├── patch.test.ts             # 35 patch tests
    ├── ritual.test.ts            # 22 ritual tests
    └── spine.test.ts             # 60 spine tests
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| [AXIOMS.md](./AXIOMS.md) | Formal axiom set (10 laws + corollaries + closing condition + kernel law) |
| [CONSTRAINTS.md](./CONSTRAINTS.md) | 10 implementation constraints (C1-C10), 10 code-level invariants (I1-I10), hard rules (A-F), spine module architecture |
| [CLAUDE.md](./CLAUDE.md) | System guide for AI assistants working with this codebase |
| [ROADMAP.md](./ROADMAP.md) | Development roadmap: v1.0 complete, v1.1 (audio integration) and v1.2 (browser persistence) planned |

---

## Roadmap

### v1.0.0 (Current) — Core Architecture
Full axiom-compliant system with 297 tests passing. All 10 axioms enforced. All 6 hard rules implemented. Complete signal surface (64 dualities, 32 binaries, 15 hybrids, 32 bridges). Modulation, ritual, FX, character, and patch systems operational.

### v1.1.0 (Planned) — Audio Integration
Connect FX module to actual Tone.js audio nodes. Browser/Node audio context management. Real-time LFO/RNG-to-audio-parameter modulation. Audio buffer rendering. Web Audio Worklet support.

### v1.2.0 (Planned) — Browser Persistence
IndexedDB adapter for browser-native storage. localStorage fallback. Cross-tab synchronization. File import/export for patches.

### Future
Synthesis ring visualization. Real-time state display. Ritual DSL for domain-specific ritual definition. Multi-client state synchronization. AI-driven character autonomy. Semantic analysis for meaning-conservation scoring.

---

## Cross-Organ Context

This repository belongs to **ORGAN-I (Theoria)** within the [organvm](https://github.com/organvm-i-theoria) system — the theoretical layer concerned with epistemology, recursion, and ontology. Sema-Metra represents ORGAN-I's approach to signal ontology: the formal study of how signs generate structure and structure constrains signification, implemented as executable TypeScript rather than academic prose.

Within the eight-organ architecture, ORGAN-I artifacts flow downstream:

- **ORGAN-II (Poiesis)** — The art layer consumes ORGAN-I's ontological primitives to build generative, performative, and experiential works. Sema-Metra's character waveforms and ritual system provide the formal substrate for artistic expression.
- **ORGAN-III (Ergon)** — The commerce layer builds products atop ORGAN-I theory. Sema-Metra's three-tier API (basic, full, axiom-compliant) enables commercial applications to choose their level of ontological rigor.
- **ORGAN-IV (Taxis)** — The orchestration layer references ORGAN-I's axiom system as a governance model for cross-organ dependency validation.

No back-edges: ORGAN-III cannot depend on ORGAN-II. The dependency flow is I->II->III only.

### Related Repositories

| Repository | Organ | Relationship |
|-----------|-------|-------------|
| [recursive-engine--generative-entity](https://github.com/organvm-i-theoria/recursive-engine--generative-entity) | I | Flagship. Recursive computation theory — the epistemological companion to sema-metra's signal ontology |
| [metasystem-master](https://github.com/organvm-ii-poiesis/metasystem-master) | II | Consumes ORGAN-I ontological primitives for generative art |
| [agentic-titan](https://github.com/organvm-iv-taxis/agentic-titan) | IV | Orchestration agent that references ORGAN-I axiom patterns for governance |

---

## Contributing

When contributing, ensure:

1. All 297+ tests pass (`npm test`)
2. Build succeeds without warnings (`npm run build`)
3. Type checking passes in strict mode (`npm run typecheck`)
4. Axiom compliance validates (`validateAxiomCompliance()` returns `{ valid: true }`)
5. New features include comprehensive tests
6. No identity transforms (Hard Rule D applies to code, too)
7. Documentation updated for new public API surface

---

## Author

Built by [@4444J99](https://github.com/4444J99).

## License

MIT

---

*A system may call itself sema-metra--alchemica-mundi only if it cannot be emptied without collapse, cannot repeat itself without mutation, and cannot describe the world without altering it.*
