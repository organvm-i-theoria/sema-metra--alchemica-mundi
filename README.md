[![ORGAN-I: Theory](https://img.shields.io/badge/ORGAN--I-Theory-1a237e?style=flat-square)](https://github.com/organvm-i-theoria)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square)]()
[![Tests](https://img.shields.io/badge/tests-297%20passing-brightgreen?style=flat-square)]()
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

# sema-metra--alchemica-mundi

**Signal-Matrix for World-Alchemy**

> *Signals generate the matrix; the matrix transmutes signals; and every transmutation rewrites the conditions of the world that will interpret the next signal.*

---

## What This Is

**Sema-Metra: Alchemica Mundi** is a TypeScript framework implementing an axiom-driven signal-matrix system. It functions as a programmable creative engine — a modular synthesis patchbay that routes and transforms signals across modalities using formal ontological architecture. Where conventional signal-processing frameworks treat transformation as stateless pipes (signals enter, get processed, exit unchanged), this system enforces a closed ontological loop: every output rewrites the world that interprets subsequent inputs.

The name encodes the architecture. *Sema* (Greek: sign, signal) and *metra* (Greek: matrix, measure) describe the input/output surface. *Alchemica mundi* (Latin: world-alchemy) describes what happens between: transmutation that alters not just the signal but the conditions under which future signals will be read.

The framework blends four domains that rarely share infrastructure:

- **Modular synthesis** — LFO waveforms, signal routing, FX chains, patch save/load
- **Tabletop RPG mechanics** — Dice systems (d4 through d1000), ritual conditions, pass/fail gates
- **Ritual and mythological systems** — Pre-built rituals with binary gate checks, hybrid toggle states, character waveform models as AI entities
- **Formal ontology** — 10 axioms enforced at runtime through an event-sourcing spine with hard rules, cost vectors, and mandatory world-binding feedback

The result is a system where creative emergence and formal rigor coexist by design, not by accident. The axioms prevent the system from degenerating into noise; the signal architecture prevents the axioms from calcifying into dogma.

71 files. 162KB. Node >= 20. MIT license. v1.0.0.

## Why This Exists

Creative systems face a fundamental tension: they must be **structured enough to be programmable** yet **fluid enough to enable genuine emergence**. Traditional approaches either impose rigid schemas that constrain creativity, or offer formless flexibility that resists systematic operation.

Most signal-processing frameworks lack four properties this system treats as non-negotiable:

- **Ontological integrity** — No guarantee that operations preserve meaning while allowing form to evolve
- **Contextual awareness** — Signals processed without knowledge of their origin or purpose
- **World-binding** — Outputs that never influence future inputs; the system never learns from its operations
- **Cost accounting** — Transformations that happen without acknowledging the semantic entropy they create

Sema-Metra addresses all four by making them axiomatic constraints rather than optional features. The 10 formal axioms are not documentation — they are runtime-enforced invariants. An identity transform (passing a signal through unchanged) is rejected by Hard Rule D. A transform without a cost vector is rejected by Hard Rule E. An output that fails to write back to the world context is rejected by Hard Rule F.

This makes the framework useful for building systems where creative operations must leave auditable traces, where context is constitutive rather than decorative, and where "total clarity is total stagnation" (Axiom 10: Legibility as Power).

## The 10 Axioms

The formal axiom set governs all system behavior. These are not guidelines — they are enforced through six hard rules and validated by 43 dedicated axiom tests.

| # | Axiom | Principle |
|---|-------|-----------|
| 1 | **Primacy of the Sign** | Signals precede structure; the system cannot exist empty |
| 2 | **Emergence of the Matrix** | Structure crystallizes from recurring signals, not from schema |
| 3 | **Alchemical Transformation** | All operations transmute; nothing passes through unchanged |
| 4 | **Conservation of Meaning** | Semantic charge persists even as forms decay |
| 5 | **Recursive World-Binding** | Outputs alter the conditions of subsequent inputs |
| 6 | **Signal-Structure Feedback** | Structure constrains future signification |
| 7 | **Irreducibility of Context** | Context is constitutive, not decorative |
| 8 | **Anti-Teleology** | No final state; progress emerges locally |
| 9 | **Ontological Cost** | Every transformation exacts entropy |
| 10 | **Legibility as Power** | Total clarity is total stagnation |

The axiom-compliant spine enforces these through four mechanisms:

```
SEMA_LOG              →  Append-only event stream (Axioms 1, 2)
METRA_PROJECTIONS     →  Versioned context bundles (Axioms 6, 7)
ALCHEMICA_TRANSFORMS  →  Non-identity transform validation (Axioms 3, 4, 9)
MUNDI_FEEDBACK        →  Mandatory world-binding loop (Axioms 5, 8, 10)
```

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

| Rule | Name | Enforcement |
|------|------|-------------|
| A | No Empty Boot | Genesis signal required before state projection |
| B | Append-Only | Events immutable after commit |
| C | Context Required | Every event carries context reference |
| D | Transform Must Mutate | Identity transforms rejected |
| E | Every Transform Emits Cost | Cost vectors mandatory |
| F | Every Output Writes Back | World-binding feedback required |

### Signal Surface

The signal surface comprises five interconnected layers:

- **DUALCORE Spectral Matrix** — 64 oscillating dualities sliding -1.0 to +1.0 across 8+ domains (metaphysical, structural, narrative, myth, psychological, temporal, audio/visual, technical). These are the primary signal carriers.
- **Binary Mirror Table** — 32 strict on/off logic gates for ritual entry/denial, narrative forks, and security toggles. No intermediate states.
- **Hybrid Toggles** — 15 context-sensitive ritual states (veil lifted/lowered, mirror intact/shattered, gateway sealed/ajar). State depends on surrounding duality values.
- **Dual-Binary Bridge** — 32 mappings connecting duality oscillations to binary gate states (2:1 duality-to-binary pairs). This is the layer where continuous signals become discrete decisions.
- **LFO System** — 6 waveform shapes (sine, saw, square, step, random, moon_phase) providing continuous modulation of duality values over time.

### RNG Dice System

Probability is managed through a tabletop-style dice system where each die type maps to a different scale of consequence:

| Die | Range | Use Case |
|-----|-------|----------|
| d4 | 1–4 | Micro modulation (UI effects) |
| d6 | 1–6 | AI responses, emotion flicker |
| d8 | 1–8 | Mood state changes |
| d10 | 1–10 | Action success/failure intensities |
| d12 | 1–12 | System bugs, recursion locks |
| d20 | 1–20 | Ritual pass/fail, karma inversion |
| d100 | 1–100 | Major plot forks, fusion glitch |
| d1000 | 1–1000 | Divine intervention, cosmic shift |

### Ritual System

Pre-built rituals operate as conditional signal-fusion procedures. Each ritual declares binary gate conditions, duality thresholds, and fusion logic. When conditions are met, the ritual produces a fusion signal that propagates through the FX chain and writes back to the world context.

Built-in rituals include **D3VOT10N_G4T3** (devotion gate), **GLITCH_SUMMON** (glitch invocation), **DREAM_GATE** (oneiric passage), and **MEMORY_SEAL** (archive lockdown).

### FX Chain

25 effect units named after mythological archetypes — "The Divider", "The Enforcer", "The Veil", "The Screamer", among others — mapping to Tone.js audio processing modules. The FX chain is composable: units can be stacked, reordered, and parameterized at runtime.

### Character Waveform Models

AI characters are modeled as waveform objects with signature oscillation patterns:

| Character | Waveform | Personality |
|-----------|----------|-------------|
| Jessica | sine | Smooth, empathic, cyclical |
| Gabriel | soulwave | Deep resonance, spiritual amplitude |
| MM15 | fractal | Self-similar, recursive, unpredictable |
| Glitch | noise | Chaotic, boundary-dissolving |

Characters influence the signal matrix when active, creating persistent modulation patterns that shift the DUALCORE spectral values in their signature directions.

## Three-Tier API

The framework exposes three factory functions at increasing levels of axiom enforcement:

### Tier 1: `createMatrix` (Basic)

Creates the signal matrix (dualities, binaries, hybrids, bridges) without modulation, rituals, or spine enforcement. Useful for prototyping signal layouts.

```typescript
import { createMatrix } from 'sema-metra--alchemica-mundi';

const matrix = createMatrix(data);
const duality = matrix.dualities.get(13);
duality.modulate(0.5);
```

### Tier 2: `createAlchemica` (Full System)

Creates the complete system — matrix, modulation engine, ritual engine, FX chain, characters, patch manager — without the axiom-enforcement spine. Lighter weight for applications that want the creative tooling without formal compliance.

```typescript
import { createAlchemica } from 'sema-metra--alchemica-mundi';

const alchemica = await createAlchemica();
const roll = alchemica.modulation.rng.roll('d20');
const result = await alchemica.ritual.engine.execute('invoke_shimmer');
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

// Validate full axiom compliance
const { valid, report } = validateAxiomCompliance(mundi);
console.log(`Axiom compliant: ${valid}`);
```

## CLI

The `sema` binary provides terminal access to all system operations:

```bash
# Initialize system
sema init

# Roll dice
sema roll d20

# Modulate a duality (index 0-63, value -1.0 to 1.0)
sema modulate 13 0.8

# Execute a ritual
sema ritual invoke_shimmer

# Show status
sema status
```

## Installation and Development

```bash
# Install
npm install sema-metra--alchemica-mundi

# Requires Node.js >= 20.0.0

# Development
npm install          # Install dependencies
npm test             # Run all 297 tests
npm run test:watch   # Watch mode
npm run build        # Build
npm run typecheck    # Type check
```

### Dependencies

| Package | Version | Role |
|---------|---------|------|
| commander | latest | CLI framework |
| tone | ^15.0.4 | Audio processing (FX chain) |
| zod | ^3.22.4 | Schema validation |
| typescript | ^5.3.3 | Language (dev) |
| tsup | latest | Build (dev) |
| tsx | latest | Runtime (dev) |
| vitest | latest | Testing (dev) |

### Test Coverage

297 tests across 8 test files:

| Suite | Tests | Coverage |
|-------|-------|----------|
| Core | 27 | Duality, binary, hybrid, bridge operations |
| Modulation | 26 | LFO, RNG, affector, engine |
| Ritual | 22 | Conditions, fusion, execution |
| FX | 48 | Unit, registry, chain, presets |
| Character | 36 | Waveforms, templates, registry |
| Patch | 35 | Snapshots, save/load, validation |
| Spine | 60 | Rules A-F, event log, context store |
| Axiom | 43 | All 10 axioms + compliance validation |

## Documentation

| Document | Purpose |
|----------|---------|
| [AXIOMS.md](./AXIOMS.md) | Formal axiom set (10 laws + closing condition) |
| [CONSTRAINTS.md](./CONSTRAINTS.md) | Implementation constraints and hard rules |
| [CLAUDE.md](./CLAUDE.md) | System guide for AI assistants |

## Organ Context

This repository belongs to **ORGAN-I (Theoria)** within the [organvm](https://github.com/organvm-i-theoria) system — the theoretical layer concerned with epistemology, recursion, and ontology. Sema-Metra represents ORGAN-I's approach to signal ontology: the formal study of how signs generate structure and structure constrains signification, implemented as executable TypeScript rather than academic prose.

Within the eight-organ architecture, ORGAN-I artifacts flow downstream to ORGAN-II (Poiesis/Art) and ORGAN-III (Ergon/Commerce) but never accept back-edges. The axiom system defined here provides the ontological substrate that creative and commercial applications build upon.

## Author

Built by [@4444J99](https://github.com/4444J99).

## License

MIT

---

*A system may call itself sema-metra--alchemica-mundi only if it cannot be emptied without collapse, cannot repeat itself without mutation, and cannot describe the world without altering it.*
