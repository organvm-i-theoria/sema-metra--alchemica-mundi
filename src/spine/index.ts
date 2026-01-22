/**
 * SEMA_LOG, METRA_PROJECTIONS, ALCHEMICA_TRANSFORMS, MUNDI_FEEDBACK
 *
 * The event spine module - the missing architecture that makes the axioms true.
 *
 * Kernel Law: Signals generate the matrix; the matrix transmutes signals;
 * and every transmutation rewrites the conditions of the world that will
 * interpret the next signal.
 *
 * @module spine
 */

// Types
export {
  // Context types
  type ContextBundle,
  type ContextAgent,
  type ContextNature,
  type ContextTemporal,
  type ContextSpatial,
  type ContextCausal,
  type SignalType,

  // Cost types
  type CostVector,
  type CostBreakdown,
  createNeutralCost,
  createCost,

  // Event types
  type SpineEventType,
  type SpineEvent,
  type SpineEventPayload,

  // Payload types
  type SignalObservedPayload,
  type SignalInterpretedPayload,
  type StructureInferredPayload,
  type StructureStabilizedPayload,
  type TransformAppliedPayload,
  type TransformRejectedPayload,
  type OutputCommittedPayload,
  type ConditionUpdatedPayload,
  type ActionProposedPayload,
  type ForkCreatedPayload,
  type ReinterpretationRequestedPayload,
  type QuestionRegisteredPayload,
  type GenesisSignalPayload,
  type ProjectionComputedPayload,
  type DegradationEmittedPayload,

  // World binding types
  type WorldBinding,
  type WorldConditionChange,

  // Validation helpers
  validateTransformNonIdentity,
  validateSemanticConservation,
  isSpineEvent,
  hasValidContext,
} from './types.js';

// Event Log
export {
  EventLog,
  EventLogError,
  type EventLogErrorCode,
  type AppendOptions,
  type EventProjector,
  type ReplayOptions,
  type ReplayResult,
  type EventLogSnapshot,
  createEventLog,
  createEmptyEventLog,
} from './event-log.js';

// Context Store
export {
  ContextStore,
  ContextError,
  type ContextErrorCode,
  type ContextCreateParams,
  type ContextUpdateParams,
  type ContextDeriveParams,
  type ContextStoreSnapshot,
  createSystemContext,
  createUserContext,
  createRitualContext,
  createCharacterContext,
  createGenesisContext,
} from './context-store.js';

// Transform Validator
export {
  TransformValidator,
  TransformError,
  type TransformErrorCode,
  type TransformValidatorConfig,
  type TransformOptions,
  TRANSFORM_COSTS,
  exceedsCostLimit,
  aggregateCosts,
} from './transform.js';

// World Binding
export {
  WorldBindingManager,
  WorldBindingError,
  type WorldBindingErrorCode,
  type OutputCommitParams,
  type BeginOutputParams,
  type CompleteOutputParams,
  type PendingOutput,
  type WorldBindingResult,
  type NextAction,
  createWorldBindingManager,
} from './world-binding.js';

// Rules
export {
  RuleValidator,
  RuleViolationError,
  type HardRule,
  type RuleValidationResult,
  type RuleValidationReport,
  RULE_DESCRIPTIONS,
  createRuleValidator,
  type SpineEnvironment,
  DEFAULT_SPINE_ENV,
  loadSpineEnvironment,
} from './rules.js';

// ============================================================================
// CONVENIENCE: CREATE FULL SPINE
// ============================================================================

import { EventLog, createEventLog, createEmptyEventLog } from './event-log.js';
import { ContextStore, createGenesisContext } from './context-store.js';
import { TransformValidator, type TransformValidatorConfig } from './transform.js';
import { WorldBindingManager } from './world-binding.js';
import { RuleValidator, type SpineEnvironment, DEFAULT_SPINE_ENV } from './rules.js';
import type { GenesisSignalPayload } from './types.js';

/**
 * Complete spine instance with all components
 */
export interface Spine {
  /** The event log (SEMA_LOG) */
  eventLog: EventLog;
  /** The context store */
  contextStore: ContextStore;
  /** The transform validator (ALCHEMICA_TRANSFORMS) */
  transform: TransformValidator;
  /** The world binding manager (MUNDI_FEEDBACK) */
  worldBinding: WorldBindingManager;
  /** The rule validator */
  rules: RuleValidator;
  /** Environment configuration */
  env: SpineEnvironment;
}

/**
 * Create a complete spine with genesis signal
 *
 * This is the preferred way to initialize the system.
 * The genesis signal satisfies Rule A (no empty boot).
 */
export function createSpine(
  genesisPayload: GenesisSignalPayload,
  config: SpineConfig = {}
): Spine {
  const env = config.env ?? DEFAULT_SPINE_ENV;
  const contextStore = new ContextStore();

  // Create genesis context
  const genesisContext = createGenesisContext(contextStore);

  // Create event log with genesis
  const eventLog = createEventLog(genesisPayload, genesisContext);

  // Create transform validator
  const transform = new TransformValidator(
    eventLog,
    contextStore,
    config.transformConfig
  );

  // Create world binding manager
  const worldBinding = new WorldBindingManager(eventLog, contextStore);

  // Create rule validator
  const rules = new RuleValidator(eventLog, contextStore, worldBinding);

  return {
    eventLog,
    contextStore,
    transform,
    worldBinding,
    rules,
    env,
  };
}

/**
 * Create an empty spine (for testing or deferred genesis)
 *
 * WARNING: This creates a spine that violates Rule A.
 * You must call appendGenesis() before using the system.
 */
export function createEmptySpine(config: SpineConfig = {}): Spine {
  const env = config.env ?? DEFAULT_SPINE_ENV;
  const contextStore = new ContextStore();
  const eventLog = createEmptyEventLog();

  const transform = new TransformValidator(
    eventLog,
    contextStore,
    config.transformConfig
  );

  const worldBinding = new WorldBindingManager(eventLog, contextStore);
  const rules = new RuleValidator(eventLog, contextStore, worldBinding);

  return {
    eventLog,
    contextStore,
    transform,
    worldBinding,
    rules,
    env,
  };
}

export interface SpineConfig {
  env?: SpineEnvironment;
  transformConfig?: TransformValidatorConfig;
}

// ============================================================================
// DEFAULT GENESIS PAYLOADS
// ============================================================================

/**
 * Create a seed corpus genesis payload
 */
export function createSeedCorpusGenesis(corpus: unknown): GenesisSignalPayload {
  return {
    genesisType: 'seed_corpus',
    genesisValue: corpus,
    interpretationFunction: 'corpus_parser',
  };
}

/**
 * Create a user utterance genesis payload
 */
export function createUserUtteranceGenesis(utterance: string): GenesisSignalPayload {
  return {
    genesisType: 'user_utterance',
    genesisValue: utterance,
    interpretationFunction: 'utterance_interpreter',
  };
}

/**
 * Create a signed intent genesis payload
 */
export function createSignedIntentGenesis(intent: {
  action: string;
  parameters?: unknown;
  signature?: string;
}): GenesisSignalPayload {
  return {
    genesisType: 'signed_intent',
    genesisValue: intent,
    interpretationFunction: 'intent_executor',
  };
}

/**
 * Create a system initialization genesis payload
 */
export function createSystemGenesisPayload(): GenesisSignalPayload {
  return {
    genesisType: 'signed_intent',
    genesisValue: {
      action: 'system_init',
      parameters: { timestamp: Date.now() },
    },
    interpretationFunction: 'system_initializer',
  };
}
