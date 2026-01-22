/**
 * SEMA_LOG, METRA_PROJECTIONS, ALCHEMICA_TRANSFORMS, MUNDI_FEEDBACK
 *
 * Event spine types that make the axioms architecturally true.
 * Derived from: AXIOMS.md, CONSTRAINTS.md
 *
 * Kernel Law: Signals generate the matrix; the matrix transmutes signals;
 * and every transmutation rewrites the conditions of the world that will
 * interpret the next signal.
 */

// ============================================================================
// CONTEXT BUNDLE (Axiom VII: Irreducibility of Context)
// ============================================================================

/**
 * Every signal must carry a context bundle that is required for interpretation.
 * The system must enforce that no module can consume a signal without receiving
 * its context reference.
 *
 * Constraint C7: Context is First-Class
 * Invariant I5: interpret(signal, context_ref); no overload interpret(signal) allowed.
 */
export interface ContextBundle {
  /** Unique context identifier (versioned) */
  contextId: string;
  /** Context version for replay consistency */
  version: number;
  /** WHO: The agent/source that generated this signal */
  who: ContextAgent;
  /** WHAT: The nature/type of the signal */
  what: ContextNature;
  /** WHEN: Temporal coordinates */
  when: ContextTemporal;
  /** WHERE: Spatial/domain coordinates */
  where: ContextSpatial;
  /** WHY: Causal chain / intent */
  why: ContextCausal;
  /** Parent context references (for inheritance) */
  parentRefs?: string[];
  /** Tags for routing and filtering */
  tags: string[];
}

export interface ContextAgent {
  type: 'system' | 'user' | 'character' | 'world' | 'thread' | 'ritual' | 'rng';
  id: string;
  name?: string;
  /** Mythic tags for character agents */
  mythicTags?: string[];
}

export interface ContextNature {
  signalType: SignalType;
  domain: string;
  intensity: number; // 0.0 to 1.0
  polarity: 'positive' | 'negative' | 'neutral';
}

export type SignalType =
  | 'observation'    // External input
  | 'modulation'     // Internal state change
  | 'ritual'         // Ritual execution
  | 'fusion'         // Signal fusion
  | 'transform'      // Alchemical transform
  | 'output'         // External output
  | 'query'          // Information request
  | 'command'        // Action directive
  | 'feedback';      // World-binding return

export interface ContextTemporal {
  timestamp: number;
  /** Tick number in the modulation cycle */
  tick?: number;
  /** Moon phase (0-1) if relevant */
  moonPhase?: number;
  /** Thread recursion depth */
  recursionDepth?: number;
}

export interface ContextSpatial {
  /** Primary domain of the signal */
  domain: string;
  /** Sub-domains affected */
  subDomains?: string[];
  /** UI/spatial location if applicable */
  location?: string;
}

export interface ContextCausal {
  /** The event that caused this signal */
  causeEventId?: string;
  /** The intent behind this signal */
  intent?: string;
  /** Ritual name if ritual-triggered */
  ritualName?: string;
  /** Fork point if branched */
  forkPointId?: string;
}

// ============================================================================
// COST VECTOR (Axiom IX: Ontological Cost)
// ============================================================================

/**
 * Every transformation exacts a cost: entropy, ambiguity, or excess.
 * Systems that claim zero-cost meaning transfer are incoherent.
 *
 * Constraint C9: Explicit Cost Accounting
 * Invariant I9: each transform emits cost = {loss_estimate, ambiguity_delta,
 *               compute_cost, confidence_delta}
 */
export interface CostVector {
  /** Estimated information loss (0.0 = none, 1.0 = total) */
  lossEstimate: number;
  /** Change in ambiguity (-1.0 = clarified, +1.0 = more ambiguous) */
  ambiguityDelta: number;
  /** Computational cost (normalized units) */
  computeCost: number;
  /** Change in confidence (-1.0 = less confident, +1.0 = more confident) */
  confidenceDelta: number;
  /** Optional breakdown of cost components */
  breakdown?: CostBreakdown;
}

export interface CostBreakdown {
  /** Entropy introduced */
  entropy?: number;
  /** Semantic drift from original */
  semanticDrift?: number;
  /** Temporal cost (delay) */
  temporalCost?: number;
  /** Resource consumption */
  resourceCost?: number;
}

/**
 * Create a neutral cost vector (no transformation cost)
 */
export function createNeutralCost(): CostVector {
  return {
    lossEstimate: 0,
    ambiguityDelta: 0,
    computeCost: 0,
    confidenceDelta: 0,
  };
}

/**
 * Create a cost vector for a transform
 */
export function createCost(params: Partial<CostVector>): CostVector {
  return {
    lossEstimate: params.lossEstimate ?? 0,
    ambiguityDelta: params.ambiguityDelta ?? 0,
    computeCost: params.computeCost ?? 0.01, // Minimum compute cost
    confidenceDelta: params.confidenceDelta ?? 0,
    breakdown: params.breakdown,
  };
}

// ============================================================================
// SPINE EVENT TYPES (Axiom II: Emergence of the Matrix)
// ============================================================================

/**
 * All state must be derivable from an append-only event stream.
 * "Current state" is a projection, not the ground truth.
 * Mutations occur by appending, never by overwriting.
 *
 * Constraint C2: Event-First Architecture
 * Invariant I2: events are immutable once committed; updates are modeled as
 *               new events referencing prior events (supersedes, amends, forks).
 */
export type SpineEventType =
  // SEMA_LOG: Signal observation events
  | 'signal:observed'           // External signal enters the system
  | 'signal:interpreted'        // Signal has been interpreted with context

  // METRA_PROJECTIONS: Structure inference events
  | 'structure:inferred'        // Matrix structure has emerged/changed
  | 'structure:stabilized'      // Structure has reached stable state

  // ALCHEMICA_TRANSFORMS: Transformation events
  | 'transform:applied'         // Alchemical transformation occurred
  | 'transform:rejected'        // Transform rejected (failed cost/identity check)

  // MUNDI_FEEDBACK: World-binding events
  | 'output:committed'          // External output committed
  | 'condition:updated'         // World conditions updated from output

  // Control flow events (Axiom VIII: Anti-Teleology)
  | 'action:proposed'           // Next action proposed (no terminal states)
  | 'fork:created'              // Execution forked
  | 'reinterpretation:requested'// Signal needs reinterpretation
  | 'question:registered'       // Open question registered

  // System events
  | 'genesis:signal'            // The first signal (required for boot)
  | 'projection:computed'       // State projection computed from events
  | 'degradation:emitted';      // Semantic degradation warning

/**
 * Base spine event interface
 */
export interface SpineEvent<T extends SpineEventType = SpineEventType> {
  /** Unique event identifier */
  eventId: string;
  /** Event type */
  type: T;
  /** Timestamp (monotonic) */
  timestamp: number;
  /** Sequence number in the log */
  sequence: number;
  /** Required context reference */
  contextRef: string;
  /** Event-specific payload */
  payload: SpineEventPayload<T>;
  /** Cost of this event (for transforms) */
  cost?: CostVector;
  /** Reference to superseded event (for amendments) */
  supersedesRef?: string;
  /** Reference to parent event (for causality) */
  causeRef?: string;
  /** Hash of the event for integrity */
  hash?: string;
}

// Type-safe payload mapping
export type SpineEventPayload<T extends SpineEventType> =
  T extends 'signal:observed' ? SignalObservedPayload :
  T extends 'signal:interpreted' ? SignalInterpretedPayload :
  T extends 'structure:inferred' ? StructureInferredPayload :
  T extends 'structure:stabilized' ? StructureStabilizedPayload :
  T extends 'transform:applied' ? TransformAppliedPayload :
  T extends 'transform:rejected' ? TransformRejectedPayload :
  T extends 'output:committed' ? OutputCommittedPayload :
  T extends 'condition:updated' ? ConditionUpdatedPayload :
  T extends 'action:proposed' ? ActionProposedPayload :
  T extends 'fork:created' ? ForkCreatedPayload :
  T extends 'reinterpretation:requested' ? ReinterpretationRequestedPayload :
  T extends 'question:registered' ? QuestionRegisteredPayload :
  T extends 'genesis:signal' ? GenesisSignalPayload :
  T extends 'projection:computed' ? ProjectionComputedPayload :
  T extends 'degradation:emitted' ? DegradationEmittedPayload :
  never;

// ============================================================================
// PAYLOAD DEFINITIONS
// ============================================================================

export interface SignalObservedPayload {
  signalType: SignalType;
  source: string;
  rawValue: unknown;
  domain: string;
}

export interface SignalInterpretedPayload {
  signalRef: string; // Reference to observed signal
  interpretation: unknown;
  semanticScore: number; // 0-1 confidence
}

export interface StructureInferredPayload {
  structureType: 'duality' | 'binary' | 'hybrid' | 'bridge' | 'pattern';
  structureId: string;
  inferredFrom: string[]; // Event references
  confidence: number;
  version: number;
}

export interface StructureStabilizedPayload {
  structureRefs: string[];
  stabilityScore: number;
  recurrenceCount: number;
}

export interface TransformAppliedPayload {
  transformType: string;
  inputRefs: string[]; // References to input signals/events
  outputRef: string;   // Reference to output event
  fingerprint: {
    before: string;
    after: string;
  };
  contextChanged: boolean;
  priorsChanged: boolean;
}

export interface TransformRejectedPayload {
  transformType: string;
  reason: 'identity' | 'cost_exceeded' | 'constraint_violated' | 'context_missing';
  details: string;
}

export interface OutputCommittedPayload {
  outputType: string;
  outputValue: unknown;
  destination: string;
  externalRef?: string; // External system reference
}

export interface ConditionUpdatedPayload {
  conditionType: string;
  delta: unknown;
  affectedDomains: string[];
  /** Reference to the output that caused this update */
  outputRef: string;
}

export interface ActionProposedPayload {
  actionType: string;
  parameters: unknown;
  priority: number;
  deadline?: number;
}

export interface ForkCreatedPayload {
  forkPoint: string;
  branchId: string;
  branchReason: string;
}

export interface ReinterpretationRequestedPayload {
  signalRef: string;
  reason: string;
  newContextRef?: string;
}

export interface QuestionRegisteredPayload {
  questionType: string;
  question: string;
  relatedEventRefs: string[];
  priority: number;
}

export interface GenesisSignalPayload {
  genesisType: 'seed_corpus' | 'user_utterance' | 'sensory_datum' | 'signed_intent';
  genesisValue: unknown;
  interpretationFunction: string;
}

export interface ProjectionComputedPayload {
  projectionType: string;
  projectionVersion: string;
  stateHash: string;
  eventRange: { from: number; to: number };
}

export interface DegradationEmittedPayload {
  degradationType: 'semantic' | 'temporal' | 'structural';
  severity: number; // 0-1
  lossBounds: { min: number; max: number };
  justification: string;
}

// ============================================================================
// WORLD BINDING (Axiom V: Recursive World-Binding)
// ============================================================================

/**
 * The scope of transformation is mundus. The system does not model the world
 * from outside it; it participates in world-formation. Outputs alter the
 * conditions of subsequent inputs.
 *
 * Constraint C6: World-Binding Feedback Loop is Mandatory
 * Invariant I7: every externally visible output O produces at least one feedback event
 */
export interface WorldBinding {
  /** The output event that triggered this binding */
  outputEventRef: string;
  /** The condition update event */
  conditionEventRef: string;
  /** What world conditions changed */
  conditionChanges: WorldConditionChange[];
  /** Timestamp of binding */
  timestamp: number;
}

export interface WorldConditionChange {
  conditionType: 'prior' | 'policy' | 'memory' | 'task_queue' | 'weight' | 'routing';
  conditionId: string;
  previousValue: unknown;
  newValue: unknown;
  changeReason: string;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate that a transform is non-identity (Axiom III)
 *
 * Invariant I4: fingerprint(out) != fingerprint(in)
 *              OR context(out) != context(in)
 *              OR priors_after != priors_before
 */
export function validateTransformNonIdentity(
  inputFingerprint: string,
  outputFingerprint: string,
  contextChanged: boolean,
  priorsChanged: boolean
): { valid: boolean; reason?: string } {
  const fingerprintChanged = inputFingerprint !== outputFingerprint;

  if (!fingerprintChanged && !contextChanged && !priorsChanged) {
    return {
      valid: false,
      reason: 'Transform is identity: fingerprint, context, and priors unchanged',
    };
  }

  return { valid: true };
}

/**
 * Validate that semantic score meets threshold (Axiom IV)
 *
 * Invariant I6: semantic_score(out, in) >= threshold
 *              OR emit a degradation_event
 */
export function validateSemanticConservation(
  semanticScore: number,
  threshold: number = 0.82
): { valid: boolean; requiresDegradationEvent: boolean } {
  if (semanticScore >= threshold) {
    return { valid: true, requiresDegradationEvent: false };
  }
  return { valid: true, requiresDegradationEvent: true };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isSpineEvent(obj: unknown): obj is SpineEvent {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'eventId' in obj &&
    'type' in obj &&
    'timestamp' in obj &&
    'sequence' in obj &&
    'contextRef' in obj &&
    'payload' in obj
  );
}

export function hasValidContext(event: SpineEvent): boolean {
  return typeof event.contextRef === 'string' && event.contextRef.length > 0;
}
