/**
 * HARD RULES - Ironclad Constraint Layer
 *
 * These rules make the system true by architecture, not just by vibe.
 *
 * Rule A: No empty boot. If $EVENT_LOG has zero events, the system cannot render tables.
 * Rule B: Append-only. Any "change" is a new event that references prior events.
 * Rule C: Context required. Every event must include context_ref, and interpretation must require it.
 * Rule D: Transform must mutate. Each transform event must prove non-identity or be rejected.
 * Rule E: Every transform emits cost. Cost vectors must exist for every transform.
 * Rule F: Every output writes back. Every outward output appends a ConditionUpdated event.
 */

import type { EventLog } from './event-log.js';
import type { ContextStore } from './context-store.js';
import type { WorldBindingManager } from './world-binding.js';

// ============================================================================
// RULE VIOLATION ERROR
// ============================================================================

export class RuleViolationError extends Error {
  constructor(
    public readonly rule: HardRule,
    public readonly message: string,
    public readonly details?: unknown
  ) {
    super(`[RULE ${rule}] ${message}`);
    this.name = 'RuleViolationError';
  }
}

export type HardRule = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

// ============================================================================
// RULE DESCRIPTIONS
// ============================================================================

export const RULE_DESCRIPTIONS: Record<HardRule, string> = {
  A: 'No empty boot. If event_log has zero events, the system cannot render tables.',
  B: 'Append-only. Any "change" is a new event that references prior events.',
  C: 'Context required. Every event must include context_ref, and interpretation must require it.',
  D: 'Transform must mutate. Each transform event must prove non-identity or be rejected.',
  E: 'Every transform emits cost. Cost vectors must exist for every transform.',
  F: 'Every output writes back. Every outward output appends a ConditionUpdated event.',
};

// ============================================================================
// RULE VALIDATOR
// ============================================================================

/**
 * Validates that all hard rules are satisfied.
 *
 * These rules are the missing spine that makes the existing system
 * architecturally faithful to the axioms.
 */
export class RuleValidator {
  constructor(
    private readonly eventLog: EventLog,
    private readonly contextStore: ContextStore,
    private readonly worldBinding?: WorldBindingManager
  ) {}

  /**
   * Validate Rule A: No empty boot
   *
   * The system cannot render tables if event_log has zero events.
   * Genesis signal is required before any state projection.
   */
  validateRuleA(): RuleValidationResult {
    const hasGenesis = this.eventLog.hasGenesis;
    const eventCount = this.eventLog.length;

    if (eventCount === 0 || !hasGenesis) {
      return {
        rule: 'A',
        valid: false,
        reason: 'Event log is empty or missing genesis signal',
        details: { eventCount, hasGenesis },
      };
    }

    return { rule: 'A', valid: true };
  }

  /**
   * Validate Rule B: Append-only
   *
   * Events are immutable once committed. Updates are modeled as
   * new events referencing prior events.
   */
  validateRuleB(): RuleValidationResult {
    // Check that events are in monotonic sequence
    const events = this.eventLog.all();
    let lastSequence = 0;

    for (const event of events) {
      if (event.sequence <= lastSequence) {
        return {
          rule: 'B',
          valid: false,
          reason: 'Event sequence is not monotonic',
          details: { eventId: event.eventId, sequence: event.sequence, lastSequence },
        };
      }
      lastSequence = event.sequence;
    }

    // Check that supersedes references are valid
    for (const event of events) {
      if (event.supersedesRef) {
        const superseded = this.eventLog.get(event.supersedesRef);
        if (!superseded) {
          return {
            rule: 'B',
            valid: false,
            reason: 'Supersedes reference points to non-existent event',
            details: { eventId: event.eventId, supersedesRef: event.supersedesRef },
          };
        }
        if (superseded.sequence >= event.sequence) {
          return {
            rule: 'B',
            valid: false,
            reason: 'Supersedes reference points to future or same event',
            details: { eventId: event.eventId, supersedesRef: event.supersedesRef },
          };
        }
      }
    }

    return { rule: 'B', valid: true };
  }

  /**
   * Validate Rule C: Context required
   *
   * Every event must include context_ref, and interpretation must require it.
   */
  validateRuleC(): RuleValidationResult {
    const events = this.eventLog.all();

    for (const event of events) {
      // Check context ref exists
      if (!event.contextRef) {
        return {
          rule: 'C',
          valid: false,
          reason: 'Event missing context reference',
          details: { eventId: event.eventId },
        };
      }

      // Check context can be resolved
      if (!this.contextStore.has(event.contextRef)) {
        return {
          rule: 'C',
          valid: false,
          reason: 'Context reference cannot be resolved',
          details: { eventId: event.eventId, contextRef: event.contextRef },
        };
      }
    }

    return { rule: 'C', valid: true };
  }

  /**
   * Validate Rule D: Transform must mutate
   *
   * Each transform event must prove non-identity or be rejected.
   */
  validateRuleD(): RuleValidationResult {
    const transforms = this.eventLog.getByType('transform:applied');

    for (const transform of transforms) {
      const payload = transform.payload;

      // Check fingerprint change
      const fingerprintChanged = payload.fingerprint.before !== payload.fingerprint.after;

      // At least one of: fingerprint, context, or priors must change
      if (!fingerprintChanged && !payload.contextChanged && !payload.priorsChanged) {
        return {
          rule: 'D',
          valid: false,
          reason: 'Transform is identity: fingerprint, context, and priors unchanged',
          details: { eventId: transform.eventId, payload },
        };
      }
    }

    return { rule: 'D', valid: true };
  }

  /**
   * Validate Rule E: Every transform emits cost
   *
   * Cost vectors must exist for every transform.
   */
  validateRuleE(): RuleValidationResult {
    const transforms = this.eventLog.getByType('transform:applied');

    for (const transform of transforms) {
      if (!transform.cost) {
        return {
          rule: 'E',
          valid: false,
          reason: 'Transform missing cost vector',
          details: { eventId: transform.eventId },
        };
      }

      // Validate cost vector structure
      const cost = transform.cost;
      if (
        typeof cost.lossEstimate !== 'number' ||
        typeof cost.ambiguityDelta !== 'number' ||
        typeof cost.computeCost !== 'number' ||
        typeof cost.confidenceDelta !== 'number'
      ) {
        return {
          rule: 'E',
          valid: false,
          reason: 'Cost vector has invalid structure',
          details: { eventId: transform.eventId, cost },
        };
      }
    }

    return { rule: 'E', valid: true };
  }

  /**
   * Validate Rule F: Every output writes back
   *
   * Every outward output appends a ConditionUpdated event.
   */
  validateRuleF(): RuleValidationResult {
    const outputs = this.eventLog.getByType('output:committed');
    const conditions = this.eventLog.getByType('condition:updated');

    // Build set of output refs that have condition updates
    const outputsWithConditions = new Set<string>();
    for (const condition of conditions) {
      const payload = condition.payload;
      if (payload.outputRef) {
        outputsWithConditions.add(payload.outputRef);
      }
    }

    // Check each output has a corresponding condition update
    for (const output of outputs) {
      if (!outputsWithConditions.has(output.eventId)) {
        return {
          rule: 'F',
          valid: false,
          reason: 'Output committed without corresponding ConditionUpdated event',
          details: { outputEventId: output.eventId },
        };
      }
    }

    // Check for orphaned outputs (if world binding manager is available)
    if (this.worldBinding) {
      const orphanedCount = this.worldBinding.getPendingCount();
      if (orphanedCount > 0) {
        return {
          rule: 'F',
          valid: false,
          reason: `${orphanedCount} pending output(s) not yet committed`,
          details: { pendingCount: orphanedCount },
        };
      }
    }

    return { rule: 'F', valid: true };
  }

  /**
   * Validate all rules
   */
  validateAll(): RuleValidationReport {
    const results = [
      this.validateRuleA(),
      this.validateRuleB(),
      this.validateRuleC(),
      this.validateRuleD(),
      this.validateRuleE(),
      this.validateRuleF(),
    ];

    const violations = results.filter((r) => !r.valid);

    return {
      valid: violations.length === 0,
      results,
      violations,
      timestamp: Date.now(),
    };
  }

  /**
   * Assert all rules (throws on violation)
   */
  assertAll(): void {
    const report = this.validateAll();

    if (!report.valid && report.violations.length > 0) {
      const firstViolation = report.violations[0]!;
      throw new RuleViolationError(
        firstViolation.rule,
        firstViolation.reason ?? 'Rule violation',
        firstViolation.details
      );
    }
  }

  /**
   * Validate a specific rule
   */
  validate(rule: HardRule): RuleValidationResult {
    switch (rule) {
      case 'A': return this.validateRuleA();
      case 'B': return this.validateRuleB();
      case 'C': return this.validateRuleC();
      case 'D': return this.validateRuleD();
      case 'E': return this.validateRuleE();
      case 'F': return this.validateRuleF();
      default:
        throw new Error(`Unknown rule: ${rule}`);
    }
  }
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export interface RuleValidationResult {
  rule: HardRule;
  valid: boolean;
  reason?: string;
  details?: unknown;
}

export interface RuleValidationReport {
  valid: boolean;
  results: RuleValidationResult[];
  violations: RuleValidationResult[];
  timestamp: number;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a rule validator
 */
export function createRuleValidator(
  eventLog: EventLog,
  contextStore: ContextStore,
  worldBinding?: WorldBindingManager
): RuleValidator {
  return new RuleValidator(eventLog, contextStore, worldBinding);
}

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

/**
 * Environment variable configuration for the spine
 *
 * These environment variables provide the interface boundary
 * so the system is portable and consistently addressable.
 */
export interface SpineEnvironment {
  /** System identifier */
  SYSTEM_ID: string;
  /** Kernel identifier */
  KERNEL_ID: string;
  /** Path to event log file */
  EVENT_LOG_PATH: string;
  /** Path to context store */
  CONTEXT_STORE_PATH: string;
  /** Path to projection store */
  PROJECTION_STORE_PATH: string;
  /** Path to transform store */
  TRANSFORM_STORE_PATH: string;
  /** Path to world state */
  WORLD_STATE_PATH: string;
  /** Projection version */
  PROJECTION_VERSION: string;
  /** Semantic threshold */
  SEMANTIC_THRESHOLD: number;
}

/**
 * Default environment configuration
 */
export const DEFAULT_SPINE_ENV: SpineEnvironment = {
  SYSTEM_ID: 'sema-metra--alchemica-mundi',
  KERNEL_ID: 'sema-metra--alchemica-mundi',
  EVENT_LOG_PATH: './data/spine/sema_log.ndjson',
  CONTEXT_STORE_PATH: './data/spine/context_store',
  PROJECTION_STORE_PATH: './data/spine/metra_projections',
  TRANSFORM_STORE_PATH: './data/spine/alchemica_transforms',
  WORLD_STATE_PATH: './data/spine/mundi_conditions',
  PROJECTION_VERSION: 'v1.0',
  SEMANTIC_THRESHOLD: 0.82,
};

/**
 * Load spine environment from process env
 */
export function loadSpineEnvironment(): SpineEnvironment {
  return {
    SYSTEM_ID: process.env.SYSTEM_ID ?? DEFAULT_SPINE_ENV.SYSTEM_ID,
    KERNEL_ID: process.env.KERNEL_ID ?? DEFAULT_SPINE_ENV.KERNEL_ID,
    EVENT_LOG_PATH: process.env.EVENT_LOG_PATH ?? DEFAULT_SPINE_ENV.EVENT_LOG_PATH,
    CONTEXT_STORE_PATH: process.env.CONTEXT_STORE_PATH ?? DEFAULT_SPINE_ENV.CONTEXT_STORE_PATH,
    PROJECTION_STORE_PATH: process.env.PROJECTION_STORE_PATH ?? DEFAULT_SPINE_ENV.PROJECTION_STORE_PATH,
    TRANSFORM_STORE_PATH: process.env.TRANSFORM_STORE_PATH ?? DEFAULT_SPINE_ENV.TRANSFORM_STORE_PATH,
    WORLD_STATE_PATH: process.env.WORLD_STATE_PATH ?? DEFAULT_SPINE_ENV.WORLD_STATE_PATH,
    PROJECTION_VERSION: process.env.PROJECTION_VERSION ?? DEFAULT_SPINE_ENV.PROJECTION_VERSION,
    SEMANTIC_THRESHOLD: parseFloat(process.env.SEMANTIC_THRESHOLD ?? '') || DEFAULT_SPINE_ENV.SEMANTIC_THRESHOLD,
  };
}
