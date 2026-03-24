# CLAUDE.md - sēma-mētra--alchemica-mundi

*Signal-Matrix for World-Alchemy*

---

## Kernel Law

> *Signals generate the matrix; the matrix transmutes signals; and every transmutation rewrites the conditions of the world that will interpret the next signal.*

---

## Structural Analysis

**sema-metra--alchemica-mundi** is a hybridized ontological compound that deliberately mixes Greek and Latin to signal depth over philological purity. The single hyphens indicate tight semantic binding, while the double hyphen establishes a higher-order conceptual break. This places the construction closer to a system kernel name or root namespace than to a grammatical sentence.

Formally, it resolves into two planes:

```
sema-metra      ⟶  micro-level generative unit
alchemica-mundi ⟶  macro-level transformative scope
```

The double hyphen correctly separates **engine** from **cosmos**.

---

## Lexical Semantics

### sēma (Greek σῆμα)
Carries *signal, sign, mark, trace, omen*. Importantly, it is not merely communicative; it implies meaning-bearing presence. In classical usage, a σῆμα can be a tomb-marker, a portent, or a cipher—already halfway between data and myth.

### mētra (from Greek μήτρα, via Latinized truncation)
Implies *womb, matrix, generative container*. As truncated, it reads as architectural rather than anatomical, aligning with systems theory and computation. The ordering **sema-metra** reverses the intuitive causality (matrix → signal) and instead implies **signals generating their own matrix**, which is conceptually sophisticated and nontrivial.

### alchemica (Latinized adjective)
Positions the system as **transformative** rather than descriptive. Alchemy implies irreversible change, recombination, and symbolic transmutation—not simple processing.

### mundi (Latin genitive: "of the world")
Scopes the operation globally, cosmologically, or total-systemically. This is not a media engine inside the world; it claims relevance to **world-construction itself**.

---

## Ontological Reading

Taken as a whole, the name reads as:

> *"A signal-born matrix that alchemically transforms the world."*

More precisely, it encodes a **recursive ontology**:

1. Signals do not merely pass through a matrix.
2. Signals constitute the matrix.
3. The matrix performs alchemical transformation.
4. The domain of transformation is the world itself.

This aligns with media-theoretic, mytho-technical, and OS-level metaphysics.

---

## System Essence

**WHAT IT IS**: A modular synthesis patchbay—routing signals across modalities (language, writing, sound, image, video)

**WHAT IT DOES**: Alchemical transmutation of signals through a matrix of gated patch points

---

## Ruling Documents

| Document | Purpose |
|----------|---------|
| `AXIOMS.md` | Formal axiom set (10 laws + closing condition) |
| `CONSTRAINTS.md` | Implementation constraints, code-level invariants, and hard rules |
| `# sema-metra--alchemica-mundi.md` | Complete specification document |

---

## Hard Rules (Ironclad Constraints)

The system enforces six hard rules that make the axioms architecturally true:

| Rule | Name | Enforcement |
|------|------|-------------|
| A | No Empty Boot | Genesis signal required before any state projection |
| B | Append-Only | Events are immutable; changes are new events referencing priors |
| C | Context Required | Every event must include context_ref |
| D | Transform Must Mutate | Identity transforms are rejected |
| E | Every Transform Emits Cost | Cost vectors required for all transforms |
| F | Every Output Writes Back | OutputCommitted + ConditionUpdated required |

---

## Event Spine Architecture

The spine module provides four hard mechanisms:

```
SEMA_LOG          ⟶  Append-only event log (src/spine/event-log.ts)
METRA_PROJECTIONS ⟶  Context store (src/spine/context-store.ts)
ALCHEMICA_TRANSFORMS ⟶  Transform validator (src/spine/transform.ts)
MUNDI_FEEDBACK    ⟶  World-binding commits (src/spine/world-binding.ts)
```

---

## Project Nature

This is a **symbolic and ritual-based modulation framework** implemented in TypeScript. The system provides programmatic control over oscillating dualities, binary gates, hybrid toggles, and bridge mappings.

A system may call itself **sema-metra–alchemica-mundi** only if:
1. It cannot be emptied without collapse.
2. It cannot repeat itself without mutation.
3. It cannot describe the world without altering it.

---

## Core Architecture

### 1. DUALCORE Spectral Matrix (64 entries)
Oscillating dualities that slide from -1.0 (left pole) to +1.0 (right pole). Organized across 8 domains:
- Metaphysical, Structural, Narrative, Myth
- Psychological, Temporal, Audio/Visual, Technical

Modulated by: LFO, RNG dice rolls, AI characters, environmental factors (weather, moon phase)

### 2. Binary Mirror Table (32 entries)
Strict on/off logic pairs (true/false, open/closed). Cannot be modulated or fused. Used for:
- Ritual entry/denial gates
- Narrative forks and execution switches
- Security toggles and recursion locks

### 3. Hybrid Toggles (15 entries)
Context-sensitive ritual states responding to narrative logic, emotional tone, or ritual conditions. Examples: veil lifted/lowered, mirror intact/shattered, gateway sealed/ajar

### 4. Dual-Binary Bridge (32 mappings)
2:1 mapping where 64 dualities map to 32 binary locks. Dualities must pass binary check to execute system actions.

---

## Ritual Logic

Rituals combine:
1. Two DUALCORE conditions (e.g., sacred = +0.9, glitch = -0.6)
2. A fusion signal output
3. A corresponding binary lock check
4. Resulting effects (UI style, language mode, synth patch, character behavior)

---

## RNG Mapping

| Die    | Range    | Use Case                              |
|--------|----------|---------------------------------------|
| d4     | 1-4      | Micro modulation (UI blur)            |
| d6     | 1-6      | AI responses, emotion flicker         |
| d8     | 1-8      | Mood state changes                    |
| d10    | 1-10     | Action success/failure intensities    |
| d12    | 1-12     | System bugs, recursion locks          |
| d20    | 1-20     | Ritual pass/fail, karma inversion     |
| d100   | 1-100    | Major plot forks, fusion glitch       |
| d1000  | 1-1000   | Divine intervention, cosmic shift     |

---

## Document Navigation Tags

Use these tags to find specific sections in the main specification:
- `#dualcore_master` - All 64 DUALCORE entries by domain
- `#binary_mirror` - Full 32-entry strict BINARY table
- `#hybrid_toggle` - 15 hybrid toggles
- `#dual_binary_bridge` - Full 2:1 mapping from DUALCORE to BINARY
- `#synthesis_ring` - Visual map of double-ring logic
- `#ritual_engine` - Ritual logic check syntax and examples
- `#synth_chain_core` - Modular synth module chain
- `#fx_unit_gods` - Mythological FX module representations
- `#modulatable_features` - All controllable system parameters

---

## CLI Usage

```bash
sema init              # Initialize system
sema roll d20          # Roll dice
sema modulate 13 0.8   # Set duality value
sema ritual invoke_shimmer  # Execute ritual
```

---

## API Entry Points

```typescript
import {
  createMatrix,
  createAlchemica,
  createAlchemicaMundi,
  validateAxiomCompliance,
  SemaMetra
} from 'sema-metra--alchemica-mundi';

// Create matrix from data (basic usage)
const matrix = createMatrix(data);

// Create full alchemical system with all engines
const alchemica = await createAlchemica();
// Returns: { matrix, modulation, ritual, fx, patch, characters }

// Create axiom-compliant system with spine
const mundi = await createAlchemicaMundi();
// Returns: { matrix, modulation, ritual, fx, patch, characters, spine }

// Validate axiom compliance
const { valid, report } = validateAxiomCompliance(mundi);
```

<!-- ORGANVM:AUTO:START -->
## System Context (auto-generated — do not edit)

**Organ:** ORGAN-I (Theory) | **Tier:** standard | **Status:** GRADUATED
**Org:** `organvm-i-theoria` | **Repo:** `sema-metra--alchemica-mundi`

### Edges
- **Produces** → `unspecified`: theory

### Siblings in Theory
`recursive-engine--generative-entity`, `organon-noumenon--ontogenetic-morphe`, `auto-revision-epistemic-engine`, `narratological-algorithmic-lenses`, `call-function--ontological`, `cognitive-archaelogy-tribunal`, `a-recursive-root`, `radix-recursiva-solve-coagula-redi`, `.github`, `nexus--babel-alexandria`, `4-ivi374-F0Rivi4`, `cog-init-1-0-`, `linguistic-atomization-framework`, `my-knowledge-base`, `scalable-lore-expert` ... and 5 more

### Governance
- Foundational theory layer. No upstream dependencies.

*Last synced: 2026-03-21T13:20:55Z*

## Session Review Protocol

At the end of each session that produces or modifies files:
1. Run `organvm session review --latest` to get a session summary
2. Check for unimplemented plans: `organvm session plans --project .`
3. Export significant sessions: `organvm session export <id> --slug <slug>`
4. Run `organvm prompts distill --dry-run` to detect uncovered operational patterns

Transcripts are on-demand (never committed):
- `organvm session transcript <id>` — conversation summary
- `organvm session transcript <id> --unabridged` — full audit trail
- `organvm session prompts <id>` — human prompts only


## Active Directives

| Scope | Phase | Name | Description |
|-------|-------|------|-------------|
| system | any | prompting-standards | Prompting Standards |
| system | any | research-standards-bibliography | APPENDIX: Research Standards Bibliography |
| system | any | phase-closing-and-forward-plan | METADOC: Phase-Closing Commemoration & Forward Attack Plan |
| system | any | research-standards | METADOC: Architectural Typology & Research Standards |
| system | any | sop-ecosystem | METADOC: SOP Ecosystem — Taxonomy, Inventory & Coverage |
| system | any | autonomous-content-syndication | SOP: Autonomous Content Syndication (The Broadcast Protocol) |
| system | any | autopoietic-systems-diagnostics | SOP: Autopoietic Systems Diagnostics (The Mirror of Eternity) |
| system | any | background-task-resilience | background-task-resilience |
| system | any | cicd-resilience-and-recovery | SOP: CI/CD Pipeline Resilience & Recovery |
| system | any | community-event-facilitation | SOP: Community Event Facilitation (The Dialectic Crucible) |
| system | any | context-window-conservation | context-window-conservation |
| system | any | conversation-to-content-pipeline | SOP — Conversation-to-Content Pipeline |
| system | any | cross-agent-handoff | SOP: Cross-Agent Session Handoff |
| system | any | cross-channel-publishing-metrics | SOP: Cross-Channel Publishing Metrics (The Echo Protocol) |
| system | any | data-migration-and-backup | SOP: Data Migration and Backup Protocol (The Memory Vault) |
| system | any | document-audit-feature-extraction | SOP: Document Audit & Feature Extraction |
| system | any | dynamic-lens-assembly | SOP: Dynamic Lens Assembly |
| system | any | essay-publishing-and-distribution | SOP: Essay Publishing & Distribution |
| system | any | formal-methods-applied-protocols | SOP: Formal Methods Applied Protocols |
| system | any | formal-methods-master-taxonomy | SOP: Formal Methods Master Taxonomy (The Blueprint of Proof) |
| system | any | formal-methods-tla-pluscal | SOP: Formal Methods — TLA+ and PlusCal Verification (The Blueprint Verifier) |
| system | any | generative-art-deployment | SOP: Generative Art Deployment (The Gallery Protocol) |
| system | any | market-gap-analysis | SOP: Full-Breath Market-Gap Analysis & Defensive Parrying |
| system | any | mcp-server-fleet-management | SOP: MCP Server Fleet Management (The Server Protocol) |
| system | any | multi-agent-swarm-orchestration | SOP: Multi-Agent Swarm Orchestration (The Polymorphic Swarm) |
| system | any | network-testament-protocol | SOP: Network Testament Protocol (The Mirror Protocol) |
| system | any | open-source-licensing-and-ip | SOP: Open Source Licensing and IP (The Commons Protocol) |
| system | any | performance-interface-design | SOP: Performance Interface Design (The Stage Protocol) |
| system | any | pitch-deck-rollout | SOP: Pitch Deck Generation & Rollout |
| system | any | polymorphic-agent-testing | SOP: Polymorphic Agent Testing (The Adversarial Protocol) |
| system | any | promotion-and-state-transitions | SOP: Promotion & State Transitions |
| system | any | recursive-study-feedback | SOP: Recursive Study & Feedback Loop (The Ouroboros) |
| system | any | repo-onboarding-and-habitat-creation | SOP: Repo Onboarding & Habitat Creation |
| system | any | research-to-implementation-pipeline | SOP: Research-to-Implementation Pipeline (The Gold Path) |
| system | any | security-and-accessibility-audit | SOP: Security & Accessibility Audit |
| system | any | session-self-critique | session-self-critique |
| system | any | smart-contract-audit-and-legal-wrap | SOP: Smart Contract Audit and Legal Wrap (The Ledger Protocol) |
| system | any | source-evaluation-and-bibliography | SOP: Source Evaluation & Annotated Bibliography (The Refinery) |
| system | any | stranger-test-protocol | SOP: Stranger Test Protocol |
| system | any | strategic-foresight-and-futures | SOP: Strategic Foresight & Futures (The Telescope) |
| system | any | styx-pipeline-traversal | SOP: Styx Pipeline Traversal (The 7-Organ Transmutation) |
| system | any | system-dashboard-telemetry | SOP: System Dashboard Telemetry (The Panopticon Protocol) |
| system | any | the-descent-protocol | the-descent-protocol |
| system | any | the-membrane-protocol | the-membrane-protocol |
| system | any | theoretical-concept-versioning | SOP: Theoretical Concept Versioning (The Epistemic Protocol) |
| system | any | theory-to-concrete-gate | theory-to-concrete-gate |
| system | any | typological-hermeneutic-analysis | SOP: Typological & Hermeneutic Analysis (The Archaeology) |
| unknown | any | gpt-to-os | SOP_GPT_TO_OS.md |
| unknown | any | index | SOP_INDEX.md |
| unknown | any | obsidian-sync | SOP_OBSIDIAN_SYNC.md |

Linked skills: cicd-resilience-and-recovery, continuous-learning-agent, evaluation-to-growth, genesis-dna, multi-agent-workforce-planner, promotion-and-state-transitions, quality-gate-baseline-calibration, repo-onboarding-and-habitat-creation, structural-integrity-audit


**Prompting (Anthropic)**: context 200K tokens, format: XML tags, thinking: extended thinking (budget_tokens)


## Ecosystem Status

- **delivery**: 0/2 live, 1 planned
- **content**: 0/2 live, 1 planned

Run: `organvm ecosystem show sema-metra--alchemica-mundi` | `organvm ecosystem validate --organ I`


## External Mirrors (Network Testament)

- **technical** (2): microsoft/TypeScript, vitest-dev/vitest

Convergences: 20 | Run: `organvm network map --repo sema-metra--alchemica-mundi` | `organvm network suggest`


## Entity Identity (Ontologia)

**UID:** `ent_repo_01KKKX3RVHJZ8KRRC147PBXGBW` | **Matched by:** primary_name

Resolve: `organvm ontologia resolve sema-metra--alchemica-mundi` | History: `organvm ontologia history ent_repo_01KKKX3RVHJZ8KRRC147PBXGBW`


## Live System Variables (Ontologia)

| Variable | Value | Scope | Updated |
|----------|-------|-------|---------|
| `active_repos` | 62 | global | 2026-03-21 |
| `archived_repos` | 53 | global | 2026-03-21 |
| `ci_workflows` | 104 | global | 2026-03-21 |
| `code_files` | 23121 | global | 2026-03-21 |
| `dependency_edges` | 55 | global | 2026-03-21 |
| `operational_organs` | 8 | global | 2026-03-21 |
| `published_essays` | 0 | global | 2026-03-21 |
| `repos_with_tests` | 47 | global | 2026-03-21 |
| `sprints_completed` | 0 | global | 2026-03-21 |
| `test_files` | 4337 | global | 2026-03-21 |
| `total_organs` | 8 | global | 2026-03-21 |
| `total_repos` | 116 | global | 2026-03-21 |
| `total_words_formatted` | 740,907 | global | 2026-03-21 |
| `total_words_numeric` | 740907 | global | 2026-03-21 |
| `total_words_short` | 741K+ | global | 2026-03-21 |

Metrics: 9 registered | Observations: 8632 recorded
Resolve: `organvm ontologia status` | Refresh: `organvm refresh`


## System Density (auto-generated)

AMMOI: 54% | Edges: 28 | Tensions: 33 | Clusters: 5 | Adv: 3 | Events(24h): 14977
Structure: 8 organs / 117 repos / 1654 components (depth 17) | Inference: 98% | Organs: META-ORGANVM:66%, ORGAN-I:55%, ORGAN-II:47%, ORGAN-III:56% +4 more
Last pulse: 2026-03-21T13:20:54 | Δ24h: n/a | Δ7d: n/a


## Dialect Identity (Trivium)

**Dialect:** FORMAL_LOGIC | **Classical Parallel:** Logic | **Translation Role:** The Grammar — defines well-formedness in any dialect

Strongest translations: III (formal), IV (formal), META (formal)

Scan: `organvm trivium scan I <OTHER>` | Matrix: `organvm trivium matrix` | Synthesize: `organvm trivium synthesize`

<!-- ORGANVM:AUTO:END -->


## ⚡ Conductor OS Integration
This repository is a managed component of the ORGANVM meta-workspace.
- **Orchestration:** Use `conductor patch` for system status and work queue.
- **Lifecycle:** Follow the `FRAME -> SHAPE -> BUILD -> PROVE` workflow.
- **Governance:** Promotions are managed via `conductor wip promote`.
- **Intelligence:** Conductor MCP tools are available for routing and mission synthesis.
