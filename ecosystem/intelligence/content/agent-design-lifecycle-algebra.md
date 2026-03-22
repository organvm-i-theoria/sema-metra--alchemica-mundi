# Agent Design Lifecycle Algebra

## The Isomorphism

Two systems independently converged on the same structural solution to the same problem: **how do you govern the evolution of complex artifacts through states of increasing trust?**

### ORGANVM Promotion State Machine

```
LOCAL → CANDIDATE → PUBLIC_PROCESS → GRADUATED → ARCHIVED
```

Governs: repository readiness across a 118-repo ecosystem.

- **LOCAL**: Exists, untested. No CI, no review.
- **CANDIDATE**: CI passing, seed.yaml wired, structural gates met.
- **PUBLIC_PROCESS**: Externally visible, documentation complete, stranger-tested.
- **GRADUATED**: Production-grade. All quality gates satisfied.
- **ARCHIVED**: Superseded. Preserved but no longer active.

Transitions are forward-only (Article VI). No state skipping. Back-transitions are forbidden — if a GRADUATED repo regresses, a new version enters at LOCAL and climbs again.

### Hive Agent Evolution Loop

```
Execute → Evaluate → Diagnose → Regenerate → (repeat)
```

Governs: agent design improvement across generations.

Each cycle overwrites `agent.json` with no version history. The previous design vanishes. If a regeneration degrades performance, there is no rollback, no diff, no audit trail.

### The Fusion: DesignLifecycleState

```
DRAFT → CANDIDATE → VALIDATED → PROMOTED → ARCHIVED
```

Governs: agent design versions across evolution cycles.

- **DRAFT**: Queen is building. Graph may be incomplete or invalid.
- **CANDIDATE**: Graph validates (no structural errors). Ready for execution.
- **VALIDATED**: At least one session completed with `success=True`. Automated gate.
- **PROMOTED**: User explicitly approves. Manual gate. This is "the good version."
- **ARCHIVED**: Superseded by a newer PROMOTED version. Preserved for rollback.

Forward-only transitions. If a PROMOTED version needs replacement, the new version enters at DRAFT and climbs.

## The Algebraic Structure

Both systems implement a **bounded join-semilattice** over trust states:

```
ARCHIVED
    |
PROMOTED / GRADUATED
    |
VALIDATED / PUBLIC_PROCESS
    |
CANDIDATE / CANDIDATE
    |
DRAFT / LOCAL
```

The ordering relation `≤` is: "has passed all gates up to and including this state." The join operation `∨` is: "the highest state both artifacts have reached." The bottom element is DRAFT/LOCAL (no gates passed). The top element is PROMOTED/GRADUATED (all gates passed).

Forward-only transitions enforce the monotonicity property: once an artifact reaches state `s`, it cannot return to any state `s' < s`. This is not a constraint imposed for bureaucratic reasons — it is a correctness property. The gates that were passed at state `s` were evaluated against the artifact's content at that time. If the content changes, those evaluations are invalidated and must be re-run from the bottom.

## Quality Gates as Morphisms

Each transition `s → s'` is guarded by a quality gate — a predicate that must be satisfied before the transition is allowed. These gates form a sequence of morphisms in the category of trust states:

| Transition | ORGANVM Gate | Hive Gate |
|------------|-------------|-----------|
| DRAFT → CANDIDATE | CI passing, seed.yaml valid | `GraphSpec.validate()` returns no errors |
| CANDIDATE → VALIDATED | Soak test green, documentation present | ≥1 session with `success=True` |
| VALIDATED → PROMOTED | Stranger test passed, community review | User explicit action (star/approve) |
| PROMOTED → ARCHIVED | Superseded by newer PROMOTED | Newer version reaches PROMOTED |

The gates are composable: VALIDATED implies CANDIDATE implies DRAFT. A PROMOTED artifact has passed all gates. This is the inductive property of the semilattice.

## Integrity as Invariant

Both systems require integrity verification at state boundaries:

- **ORGANVM**: `StateSnapshot.verify()` computes SHA-256 checksum of agent state (task, context, memory, turn_number, status). Checksum is verified on restore.
- **Hive DesignVersion**: `DesignVersion.verify()` computes SHA-256 checksum of `json.dumps(graph_spec, sort_keys=True) + json.dumps(goal, sort_keys=True)`. Canonical sorted serialization ensures deterministic hashes.

Integrity verification prevents two failure modes:
1. **Silent corruption**: A version file is modified outside the lifecycle (disk error, manual edit). Checksum catches it.
2. **Lineage fraud**: A version claims to be PROMOTED but its content doesn't match what was promoted. Checksum provides evidence.

## Assembly Dynamics in Agent Evolution

Agentic-titan's Deleuze-inspired dynamics provide operational semantics for what happens *between* lifecycle states:

- **Territorialization** (CANDIDATE → VALIDATED → PROMOTED): The agent design stabilizes. Nodes, edges, prompts settle into a working configuration. The system "captures" this configuration as a governed version.

- **Deterritorialization** (evolution regeneration): A coding agent rewrites the graph. Nodes added, prompts changed, edges restructured. The previous territorial arrangement is dissolved. A new DRAFT enters the lifecycle.

- **Crystallization** (over-fitting): An agent that has been evolved many times against the same failure patterns becomes rigid — it handles known edge cases but can't adapt to novel situations. In assembly dynamics, this is the CRYSTALLIZED state. The remedy is a "line of flight" — a deliberate break from the existing design to explore a fundamentally different approach.

- **Fission-Fusion**: During active evolution, the agent's design exists in a fission state — multiple candidate versions being tested in parallel. When one version proves superior, the system fuses around it (PROMOTED). This mirrors the fission-fusion dynamics of crow roosts and primate social groups in agentic-titan's coordination model.

These are not metaphors. They are operational states that a versioning system can detect and act on:
- A version with many CANDIDATE siblings is in fission state
- A version with no CANDIDATE successors for a long time may be crystallized
- A large diff between consecutive versions indicates deterritorialization
- A small diff indicates incremental territorialization

## Practical Implications

1. **Rollback is not back-transition.** Restoring a previous version creates a *new* DRAFT with the old content. It enters the lifecycle from the bottom. The original version retains its state.

2. **Starring is a commitment.** PROMOTED is not "I like this version" — it is "I have verified this version meets my criteria and I am willing to run it in production." The manual gate exists because automated metrics can't capture user intent.

3. **The archive is the memory.** ARCHIVED versions are not deleted — they are the evolutionary history. Patterns that recur across archived versions indicate deep structural properties of the problem domain.

4. **The lifecycle is the governance.** Without it, agent evolution is a random walk. With it, evolution is a directed search through design space, with quality gates ensuring each step is an improvement or at least a measured experiment.
