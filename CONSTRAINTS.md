# Implementation Constraints & Code-Level Invariants

## SEMA-METRA — ALCHEMICA MUNDI

*Derived from the Axiom Set. These constraints translate ontological law into implementation requirement.*

---

## Implementation Constraints

### C1. No Null Initialization

The system must refuse "empty boot" semantics. A valid boot requires at least one interpretable signal event in the genesis log. This can be a seed corpus, a user utterance, a sensory datum, or a signed intent—anything that has an interpretation function.

**Derivation:** Axiom I (Primacy of the Sign)

---

### C2. Event-First Architecture

All state must be derivable from an append-only event stream. "Current state" is a projection, not the ground truth. Mutations occur by appending, never by overwriting.

**Derivation:** Axiom II (Emergence of the Matrix)

---

### C3. Matrix is Learned, Not Declared

Schemas, ontologies, indices, embeddings, topic models, routing rules, and UI taxonomies must be allowed to emerge from signal recurrence. Hand-authored structure is permitted only as a provisional scaffold with explicit decay rules (sunset dates or deprecation triggers).

**Derivation:** Axiom II (Emergence of the Matrix)

---

### C4. Every Transform is Transmutative

No pipeline step may claim identity transformation except for authenticated transport encoding (e.g., encryption/decryption). Otherwise, every operation must:
- (a) alter representation,
- (b) alter contextualization, or
- (c) alter downstream probability.

If a step "does nothing," it must be removed.

**Derivation:** Axiom III (Alchemical Transformation)

---

### C5. Meaning-Conservation as Objective Function

Compression, summarization, translation, reformatting, and synthesis must be evaluated against semantic preservation metrics, not byte equivalence. Introduce explicit semantic-check gates (entailment checks, retrieval consistency checks, unit tests for claims).

**Derivation:** Axiom IV (Conservation of Meaning, Not Form)

---

### C6. World-Binding Feedback Loop is Mandatory

Outputs must be written back into the system's conditions of future computation (policy, priors, memory graph, task queue, weights, or routing). A read-only generator is out of scope.

**Derivation:** Axiom V (Recursive World-Binding)

---

### C7. Context is First-Class

Every signal must carry a context bundle that is required for interpretation. The system must enforce that no module can consume a signal without receiving its context reference.

**Derivation:** Axiom VII (Irreducibility of Context)

---

### C8. Anti-Teleology: No "Final" States

The architecture must avoid terminal workflows. All workflows end in a new event that can be re-entered, branched, forked, or reinterpreted.

**Derivation:** Axiom VIII (Anti-Teleology)

---

### C9. Explicit Cost Accounting

Each transform must emit a cost vector (at minimum: information loss estimate, ambiguity increase/decrease, compute cost, and confidence delta). Downstream modules must be able to route based on cost.

**Derivation:** Axiom IX (Ontological Cost)

---

### C10. Partial Opacity by Design

The system must not fully expose its internal state in a way that collapses emergence. Practically: keep a distinction between public projections (views) and private latent structure (working state), with governed interfaces between them.

**Derivation:** Axiom X (Legibility as Power)

---

## Code-Level Invariants

*"MUST" means the system should fail fast if violated.*

### I1. Genesis Requires Signal

```
event_log.length > 0 before any state projection is accepted.
MUST: replay(event_log) is the only way to produce state.
```

---

### I2. Append-Only History

```
MUST: events are immutable once committed.
MUST: updates are modeled as new events referencing prior events
      (supersedes, amends, forks).
```

---

### I3. State is a View

```
MUST: state_hash == hash(replay(event_log, projection_version)).
MUST: any persisted "state snapshot" is treated as a cache and can be discarded.
```

---

### I4. Transform Non-Identity

For any transform T (except authenticated transport):
```
MUST: fingerprint(out) != fingerprint(in)
   OR context(out) != context(in)
   OR priors_after != priors_before.

If none change, the transform is invalid.
```

---

### I5. Context Required for Interpretation

```
MUST: interpret(signal, context_ref); no overload interpret(signal) allowed.
MUST: context_ref resolves to a versioned context object.
```

---

### I6. Meaning-Conservation Gate

For summarization/synthesis S:
```
MUST: semantic_score(out, in) >= threshold
   OR emit a degradation_event with justification and loss bounds.

Where semantic_score can be operationalized as entailment coverage,
key-claim retention tests, or retrieval agreement.
```

---

### I7. World-Binding Commit

```
MUST: every externally visible output O produces at least one feedback event:
      OutputCommitted(O)
      and one conditioning event:
      ConditionUpdated(delta).

No "fire-and-forget" outputs.
```

---

### I8. No Terminal Workflow

```
MUST: every workflow ends by appending an event that can be re-entered:
      - NextActionProposed
      - ForkCreated
      - ReinterpretationRequested
      - OpenQuestionRegistered
```

---

### I9. Cost Vector Emitted

```
MUST: each transform emits cost = {
  loss_estimate,
  ambiguity_delta,
  compute_cost,
  confidence_delta
}.

MUST: routing/planning can read and act on cost.
```

---

### I10. Opacity Boundary

```
MUST: internal latent structures (e.g., embeddings, learned clusters,
      model-internal weights, heuristic scores) are not treated as
      canonical truth; only projections are.

MUST: any export of latent structure is labeled as a projection
      with version + method.
```

---

## Reference Architecture Implications

The event store becomes the spine:

1. **Signal ingestion** writes `SignalObserved` events with context references.
2. **Matrix formation** is a background projection over the event log that emits `StructureInferred` events (versioned, replaceable).
3. **Transformation pipelines** append `TransmutationApplied` events with cost vectors and semantic checks.
4. **Outputs** append `OutputCommitted` plus `ConditionUpdated`, forcing the world-binding loop.

This architecture makes the name true: **signals birth a matrix; the matrix transmutes signals; and every transmutation rewrites the conditions of the world that will interpret the next signal.**

---

## Axiom-to-Constraint Mapping

| Axiom | Constraint(s) | Invariant(s) |
|-------|---------------|--------------|
| I. Primacy of the Sign | C1 | I1 |
| II. Emergence of the Matrix | C2, C3 | I2, I3 |
| III. Alchemical Transformation | C4 | I4 |
| IV. Conservation of Meaning | C5 | I6 |
| V. Recursive World-Binding | C6 | I7 |
| VI. Signal–Structure Feedback | C2 | I2, I3 |
| VII. Irreducibility of Context | C7 | I5 |
| VIII. Anti-Teleology | C8 | I8 |
| IX. Ontological Cost | C9 | I9 |
| X. Legibility as Power | C10 | I10 |

---

## Hard Rules (Implementation Layer)

*These rules are the ironclad constraint layer that makes the system true by architecture, not just by vibe.*

### Rule A: No Empty Boot

```
IF event_log.length === 0 THEN system.cannotRenderTables()
```

The system cannot render tables if the event log has zero events. Genesis signal is required before any state projection.

**Implemented in:** `src/spine/event-log.ts` - `EventLog.appendGenesis()`

---

### Rule B: Append-Only

```
FOR ALL events: event.immutable === true AFTER commit
ANY change = new Event { supersedesRef: priorEventId }
```

Events are immutable once committed. Any "change" is a new event that references prior events.

**Implemented in:** `src/spine/event-log.ts` - `EventLog.append()`, `Object.freeze(event)`

---

### Rule C: Context Required

```
FOR ALL events: event.contextRef !== null
FOR ALL interpret(signal): REQUIRES context_ref parameter
```

Every event must include context_ref, and interpretation must require it.

**Implemented in:** `src/spine/context-store.ts` - `ContextStore.resolve()`, `ContextBundle`

---

### Rule D: Transform Must Mutate

```
FOR ALL transform T:
  REQUIRE: fingerprint(out) !== fingerprint(in)
        OR context(out) !== context(in)
        OR priors_after !== priors_before
  ELSE: reject(T) with 'identity_transform' error
```

Each transform event must prove non-identity or be rejected.

**Implemented in:** `src/spine/transform.ts` - `TransformValidator.validateAndApply()`

---

### Rule E: Every Transform Emits Cost

```
FOR ALL transform T:
  EMIT: cost = {
    lossEstimate: number,
    ambiguityDelta: number,
    computeCost: number,
    confidenceDelta: number
  }
```

Cost vectors must exist for every transform.

**Implemented in:** `src/spine/transform.ts` - `CostVector`, `TRANSFORM_COSTS`

---

### Rule F: Every Output Writes Back

```
FOR ALL output O:
  EMIT: OutputCommitted(O)
  EMIT: ConditionUpdated(delta)
NO fire-and-forget outputs
```

Every outward output appends both OutputCommitted and ConditionUpdated events.

**Implemented in:** `src/spine/world-binding.ts` - `WorldBindingManager.commitOutput()`

---

## Environment Configuration

*These environment variables provide the interface boundary so the system is portable and consistently addressable.*

```bash
export SYSTEM_ID="sema-metra--alchemica-mundi"
export KERNEL_ID="sema-metra--alchemica-mundi"
export EVENT_LOG_PATH="$PROJECT_ROOT/data/spine/sema_log.ndjson"
export CONTEXT_STORE_PATH="$PROJECT_ROOT/data/spine/context_store"
export PROJECTION_STORE_PATH="$PROJECT_ROOT/data/spine/metra_projections"
export TRANSFORM_STORE_PATH="$PROJECT_ROOT/data/spine/alchemica_transforms"
export WORLD_STATE_PATH="$PROJECT_ROOT/data/spine/mundi_conditions"
export PROJECTION_VERSION="v1.0"
export SEMANTIC_THRESHOLD="0.82"
```

**Implemented in:** `src/spine/rules.ts` - `SpineEnvironment`, `DEFAULT_SPINE_ENV`

---

## Spine Module Architecture

The spine module (`src/spine/`) provides the four hard mechanisms:

### 1. SEMA_LOG (Event Log)

- `src/spine/event-log.ts` - Append-only immutable event log
- Event types: `SignalObserved`, `StructureInferred`, `TransformApplied`, `OutputCommitted`, `ConditionUpdated`, `ActionProposed`, `ForkCreated`
- Replay mechanism: `eventLog.replay(projector, initialState)`

### 2. METRA_PROJECTIONS (Context Store)

- `src/spine/context-store.ts` - Versioned context objects
- Context bundles: WHO (agent), WHAT (nature), WHEN (temporal), WHERE (spatial), WHY (causal)
- Context derivation for signal transformation

### 3. ALCHEMICA_TRANSFORMS (Transform Validator)

- `src/spine/transform.ts` - Non-identity validation and cost emission
- Pre-built cost profiles: `TRANSFORM_COSTS.DUALITY_MODULATION`, `TRANSFORM_COSTS.BINARY_TOGGLE`, etc.
- Semantic conservation gates with degradation events

### 4. MUNDI_FEEDBACK (World Binding)

- `src/spine/world-binding.ts` - Mandatory feedback loop
- Output commit with automatic condition update
- Next action proposal (anti-teleology)

### 5. RULES (Validation)

- `src/spine/rules.ts` - Rule validator for all six hard rules
- `RuleValidator.validateAll()` - Check system compliance
- `RuleViolationError` - Fail-fast on violations

---

## Usage: Axiom-Compliant System

```typescript
import { createAlchemicaMundi, validateAxiomCompliance } from 'sema-metra--alchemica-mundi';

// Create axiom-compliant system (with spine)
const alchemica = await createAlchemicaMundi();

// System is initialized with genesis signal (Rule A satisfied)
// All operations emit spine events (Rules B-F satisfied)

// Validate compliance
const { valid, report } = validateAxiomCompliance(alchemica);
console.log(`Axiom compliant: ${valid}`);
```

---

## Kernel Law

> *Signals generate the matrix; the matrix transmutes signals; and every transmutation rewrites the conditions of the world that will interpret the next signal.*
