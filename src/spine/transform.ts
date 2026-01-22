/**
 * ALCHEMICA_TRANSFORMS - Transform Validation & Cost Emission
 *
 * All operations within the matrix are transmutative rather than preservative.
 * No signal exits the system in the same ontological state in which it entered.
 *
 * Rule D: Transform must mutate. Each transform event must prove non-identity or be rejected.
 * Rule E: Every transform emits cost. Cost vectors must exist for every transform.
 *
 * Constraint C4: Every Transform is Transmutative
 * Constraint C9: Explicit Cost Accounting
 *
 * Invariant I4: fingerprint(out) != fingerprint(in) OR context(out) != context(in)
 *              OR priors_after != priors_before. If none change, the transform is invalid.
 * Invariant I9: each transform emits cost = {loss_estimate, ambiguity_delta,
 *              compute_cost, confidence_delta}
 */

import { createHash } from 'crypto';
import type {
  CostVector,
  SpineEvent,
  TransformAppliedPayload,
  TransformRejectedPayload,
  ContextBundle,
} from './types.js';
import { createCost, validateTransformNonIdentity, validateSemanticConservation } from './types.js';
import type { EventLog } from './event-log.js';
import type { ContextStore } from './context-store.js';

// ============================================================================
// TRANSFORM ERRORS
// ============================================================================

export class TransformError extends Error {
  constructor(
    message: string,
    public readonly code: TransformErrorCode,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'TransformError';
  }
}

export type TransformErrorCode =
  | 'IDENTITY_TRANSFORM'     // I4 violated
  | 'NO_COST_VECTOR'         // I9 violated
  | 'CONTEXT_REQUIRED'       // C7 violated
  | 'SEMANTIC_LOSS'          // I6 warning
  | 'COST_EXCEEDED';

// ============================================================================
// TRANSFORM VALIDATOR
// ============================================================================

/**
 * Transform validator enforces that all transforms are transmutative
 * and emit cost vectors.
 */
export class TransformValidator {
  constructor(
    private readonly eventLog: EventLog,
    private readonly _contextStore: ContextStore,
    private readonly config: TransformValidatorConfig = {}
  ) {}

  /**
   * Get the context store (for advanced operations)
   */
  get contextStore(): ContextStore {
    return this._contextStore;
  }

  /**
   * Validate and execute a transform
   *
   * Returns the applied transform event, or throws if invalid.
   */
  validateAndApply<I, O>(
    transformType: string,
    input: I,
    output: O,
    inputContext: ContextBundle,
    outputContext: ContextBundle,
    options: TransformOptions = {}
  ): SpineEvent<'transform:applied'> {
    const startTime = Date.now();

    // Compute fingerprints
    const inputFingerprint = this.computeFingerprint(input);
    const outputFingerprint = this.computeFingerprint(output);

    // Check context change
    const contextChanged = inputContext.contextId !== outputContext.contextId ||
                          inputContext.version !== outputContext.version;

    // Check priors change (if provided)
    const priorsChanged = options.priorsBefore !== undefined &&
                         options.priorsAfter !== undefined &&
                         JSON.stringify(options.priorsBefore) !== JSON.stringify(options.priorsAfter);

    // Validate non-identity (Invariant I4)
    const identityCheck = validateTransformNonIdentity(
      inputFingerprint,
      outputFingerprint,
      contextChanged,
      priorsChanged
    );

    if (!identityCheck.valid) {
      // Emit rejection event
      this.eventLog.append('transform:rejected', {
        transformType,
        reason: 'identity',
        details: identityCheck.reason!,
      } as TransformRejectedPayload, inputContext, {
        causeRef: options.causeEventRef,
      });

      throw new TransformError(
        identityCheck.reason!,
        'IDENTITY_TRANSFORM',
        { inputFingerprint, outputFingerprint, contextChanged, priorsChanged }
      );
    }

    // Compute cost vector (Invariant I9)
    const cost = this.computeCost(input, output, startTime, options);

    // Validate semantic conservation (Invariant I6)
    const semanticScore = options.semanticScore ?? this.estimateSemanticScore(input, output);
    const semanticCheck = validateSemanticConservation(
      semanticScore,
      this.config.semanticThreshold ?? 0.82
    );

    // Emit degradation event if needed
    if (semanticCheck.requiresDegradationEvent) {
      this.eventLog.append('degradation:emitted', {
        degradationType: 'semantic',
        severity: 1 - semanticScore,
        lossBounds: { min: semanticScore, max: 1 },
        justification: `Semantic score ${semanticScore.toFixed(3)} below threshold`,
      }, outputContext, {
        causeRef: options.causeEventRef,
      });
    }

    // Emit the applied transform event
    const payload: TransformAppliedPayload = {
      transformType,
      inputRefs: options.inputEventRefs ?? [],
      outputRef: '', // Will be set by caller if needed
      fingerprint: {
        before: inputFingerprint,
        after: outputFingerprint,
      },
      contextChanged,
      priorsChanged,
    };

    return this.eventLog.append('transform:applied', payload, outputContext, {
      cost,
      causeRef: options.causeEventRef,
    }) as SpineEvent<'transform:applied'>;
  }

  /**
   * Compute a fingerprint for any value
   */
  computeFingerprint(value: unknown): string {
    const data = JSON.stringify(value);
    return createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Compute cost vector for a transform
   */
  private computeCost<I, O>(
    input: I,
    output: O,
    startTime: number,
    options: TransformOptions
  ): CostVector {
    // If explicit cost provided, use it
    if (options.explicitCost) {
      return options.explicitCost;
    }

    // Compute cost heuristics
    const endTime = Date.now();
    const computeCost = (endTime - startTime) / 1000; // Seconds

    // Estimate information loss based on size change
    const inputSize = JSON.stringify(input).length;
    const outputSize = JSON.stringify(output).length;
    const sizeRatio = outputSize / inputSize;
    const lossEstimate = sizeRatio < 1 ? (1 - sizeRatio) * 0.5 : 0;

    // Ambiguity delta based on type change
    const inputType = typeof input;
    const outputType = typeof output;
    const ambiguityDelta = inputType !== outputType ? 0.1 : 0;

    // Confidence based on semantic score
    const semanticScore = options.semanticScore ?? 0.9;
    const confidenceDelta = semanticScore - 0.9; // Relative to baseline

    return createCost({
      lossEstimate,
      ambiguityDelta,
      computeCost,
      confidenceDelta,
      breakdown: {
        entropy: lossEstimate * 0.5,
        semanticDrift: (1 - semanticScore) * 0.5,
        temporalCost: computeCost,
        resourceCost: inputSize / 1000, // KB
      },
    });
  }

  /**
   * Estimate semantic score between input and output
   *
   * This is a heuristic; actual semantic scoring should use
   * entailment coverage, key-claim retention, or retrieval agreement.
   */
  private estimateSemanticScore<I, O>(input: I, output: O): number {
    // Simple heuristic: compare JSON representations
    const inputStr = JSON.stringify(input);
    const outputStr = JSON.stringify(output);

    // If same, perfect semantic preservation
    if (inputStr === outputStr) return 1.0;

    // Check for subset relationship
    if (outputStr.includes(inputStr.slice(0, 100))) return 0.95;
    if (inputStr.includes(outputStr.slice(0, 100))) return 0.9;

    // Default to reasonable estimate
    return 0.85;
  }
}

// ============================================================================
// TRANSFORM TYPES
// ============================================================================

export interface TransformValidatorConfig {
  /** Semantic threshold for conservation check (default: 0.82) */
  semanticThreshold?: number;
  /** Maximum allowed cost per transform */
  maxCost?: CostVector;
}

export interface TransformOptions {
  /** Explicit cost vector (skips computation) */
  explicitCost?: CostVector;
  /** Semantic score (skips estimation) */
  semanticScore?: number;
  /** Prior state before transform */
  priorsBefore?: unknown;
  /** Prior state after transform */
  priorsAfter?: unknown;
  /** References to input events */
  inputEventRefs?: string[];
  /** Reference to cause event */
  causeEventRef?: string;
}

// ============================================================================
// PRE-BUILT TRANSFORM COSTS
// ============================================================================

/**
 * Cost profiles for common transform types
 */
export const TRANSFORM_COSTS = {
  /** Duality modulation - low cost, minimal loss */
  DUALITY_MODULATION: createCost({
    lossEstimate: 0.01,
    ambiguityDelta: 0.05,
    computeCost: 0.001,
    confidenceDelta: 0,
  }),

  /** Binary toggle - no loss, discrete state change */
  BINARY_TOGGLE: createCost({
    lossEstimate: 0,
    ambiguityDelta: -0.1, // Clarifies state
    computeCost: 0.0005,
    confidenceDelta: 0.1,
  }),

  /** Hybrid transition - moderate ambiguity during transition */
  HYBRID_TRANSITION: createCost({
    lossEstimate: 0.05,
    ambiguityDelta: 0.2, // Uncertain during transition
    computeCost: 0.005,
    confidenceDelta: -0.1,
  }),

  /** Ritual execution - higher cost, significant state change */
  RITUAL_EXECUTION: createCost({
    lossEstimate: 0.1,
    ambiguityDelta: 0.15,
    computeCost: 0.05,
    confidenceDelta: 0.2,
  }),

  /** Fusion operation - semantic synthesis cost */
  FUSION: createCost({
    lossEstimate: 0.15,
    ambiguityDelta: 0.1,
    computeCost: 0.02,
    confidenceDelta: 0.15,
  }),

  /** RNG roll - entropy injection */
  RNG_ROLL: createCost({
    lossEstimate: 0,
    ambiguityDelta: 0.3, // Increases uncertainty
    computeCost: 0.001,
    confidenceDelta: -0.2,
  }),

  /** Patch load - state replacement cost */
  PATCH_LOAD: createCost({
    lossEstimate: 0.2,
    ambiguityDelta: -0.3, // Clarifies to known state
    computeCost: 0.01,
    confidenceDelta: 0.3,
  }),
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a cost vector exceeds limits
 */
export function exceedsCostLimit(cost: CostVector, limit: CostVector): boolean {
  return (
    cost.lossEstimate > limit.lossEstimate ||
    cost.ambiguityDelta > limit.ambiguityDelta ||
    cost.computeCost > limit.computeCost ||
    -cost.confidenceDelta > -limit.confidenceDelta
  );
}

/**
 * Aggregate multiple cost vectors
 */
export function aggregateCosts(costs: CostVector[]): CostVector {
  if (costs.length === 0) return createCost({});

  return createCost({
    lossEstimate: costs.reduce((sum, c) => sum + c.lossEstimate, 0) / costs.length,
    ambiguityDelta: costs.reduce((sum, c) => sum + c.ambiguityDelta, 0),
    computeCost: costs.reduce((sum, c) => sum + c.computeCost, 0),
    confidenceDelta: costs.reduce((sum, c) => sum + c.confidenceDelta, 0) / costs.length,
  });
}
