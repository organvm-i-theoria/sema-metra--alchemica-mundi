/**
 * MUNDI_FEEDBACK - World-Binding Commit System
 *
 * The scope of transformation is mundus. The system does not model the world
 * from outside it; it participates in world-formation. Outputs alter the
 * conditions of subsequent inputs.
 *
 * Rule F: Every output writes back. Every outward output appends a ConditionUpdated event.
 *
 * Constraint C6: World-Binding Feedback Loop is Mandatory
 * Invariant I7: every externally visible output O produces at least one feedback event:
 *              OutputCommitted(O) and one conditioning event: ConditionUpdated(delta).
 *              No "fire-and-forget" outputs.
 */

import type {
  SpineEvent,
  OutputCommittedPayload,
  ConditionUpdatedPayload,
  ContextBundle,
  WorldBinding,
  WorldConditionChange,
  CostVector,
} from './types.js';
import type { EventLog } from './event-log.js';
import type { ContextStore } from './context-store.js';
import { createCost } from './types.js';

// ============================================================================
// WORLD BINDING ERRORS
// ============================================================================

export class WorldBindingError extends Error {
  constructor(
    message: string,
    public readonly code: WorldBindingErrorCode
  ) {
    super(message);
    this.name = 'WorldBindingError';
  }
}

export type WorldBindingErrorCode =
  | 'NO_CONDITION_UPDATE'    // I7 violated
  | 'INVALID_OUTPUT_REF'
  | 'BINDING_INCOMPLETE';

// ============================================================================
// WORLD BINDING MANAGER
// ============================================================================

/**
 * Manages the world-binding feedback loop.
 *
 * Ensures that every externally visible output produces both an
 * OutputCommitted event and a ConditionUpdated event.
 */
export class WorldBindingManager {
  private readonly _pendingOutputs: Map<string, PendingOutput> = new Map();
  private readonly _completedBindings: WorldBinding[] = [];

  constructor(
    private readonly eventLog: EventLog,
    private readonly contextStore: ContextStore
  ) {}

  /**
   * Commit an output and create the feedback loop
   *
   * This is the primary entry point for world-binding.
   * It creates both OutputCommitted and ConditionUpdated events atomically.
   *
   * Invariant I7: No fire-and-forget outputs.
   */
  commitOutput(params: OutputCommitParams): WorldBindingResult {
    // Create output context
    const outputContext = this.contextStore.derive(params.context.contextId, {
      what: {
        signalType: 'output',
        domain: params.domain,
        intensity: 1.0,
        polarity: 'neutral',
      },
      why: { intent: `output: ${params.outputType}` },
      additionalTags: ['output', params.outputType],
    });

    // 1. Emit OutputCommitted event
    const outputEvent = this.eventLog.append(
      'output:committed',
      {
        outputType: params.outputType,
        outputValue: params.outputValue,
        destination: params.destination,
        externalRef: params.externalRef,
      } as OutputCommittedPayload,
      outputContext,
      {
        cost: params.cost ?? createCost({ computeCost: 0.01 }),
        causeRef: params.causeEventRef,
      }
    ) as SpineEvent<'output:committed'>;

    // 2. Compute condition changes
    const conditionChanges = this.computeConditionChanges(params);

    // Create condition context
    const conditionContext = this.contextStore.derive(outputContext.contextId, {
      what: {
        signalType: 'feedback',
        domain: params.domain,
        intensity: 0.8,
        polarity: 'neutral',
      },
      why: { intent: 'world-binding feedback' },
      additionalTags: ['feedback', 'condition-update'],
    });

    // 3. Emit ConditionUpdated event
    const conditionEvent = this.eventLog.append(
      'condition:updated',
      {
        conditionType: params.conditionType ?? 'general',
        delta: params.conditionDelta ?? conditionChanges,
        affectedDomains: params.affectedDomains ?? [params.domain],
        outputRef: outputEvent.eventId,
      } as ConditionUpdatedPayload,
      conditionContext,
      {
        cost: createCost({ confidenceDelta: 0.05 }),
        causeRef: outputEvent.eventId,
      }
    ) as SpineEvent<'condition:updated'>;

    // 4. Record the binding
    const binding: WorldBinding = {
      outputEventRef: outputEvent.eventId,
      conditionEventRef: conditionEvent.eventId,
      conditionChanges,
      timestamp: Date.now(),
    };

    this._completedBindings.push(binding);

    // 5. Emit next action proposal (Axiom VIII: Anti-Teleology)
    this.proposeNextAction(params, outputEvent.eventId, conditionContext);

    return {
      outputEvent,
      conditionEvent,
      binding,
    };
  }

  /**
   * Begin a pending output (for async operations)
   *
   * Use this when the output will be committed later.
   * Must call completeOutput() to satisfy I7.
   */
  beginOutput(params: BeginOutputParams): string {
    const outputId = this.generateOutputId();

    this._pendingOutputs.set(outputId, {
      outputId,
      params,
      startedAt: Date.now(),
      context: params.context,
    });

    return outputId;
  }

  /**
   * Complete a pending output
   *
   * This satisfies the world-binding requirement for async outputs.
   */
  completeOutput(outputId: string, result: CompleteOutputParams): WorldBindingResult {
    const pending = this._pendingOutputs.get(outputId);
    if (!pending) {
      throw new WorldBindingError(
        `No pending output found: ${outputId}`,
        'INVALID_OUTPUT_REF'
      );
    }

    this._pendingOutputs.delete(outputId);

    return this.commitOutput({
      ...pending.params,
      outputValue: result.outputValue,
      externalRef: result.externalRef,
      conditionDelta: result.conditionDelta,
    });
  }

  /**
   * Cancel a pending output (explicit abandonment)
   *
   * This is the only valid way to not complete an output.
   * Emits an action:proposed event with cancellation reason.
   */
  cancelOutput(outputId: string, reason: string): void {
    const pending = this._pendingOutputs.get(outputId);
    if (!pending) return;

    this._pendingOutputs.delete(outputId);

    // Emit cancellation as proposed action
    this.eventLog.append(
      'action:proposed',
      {
        actionType: 'output_cancelled',
        parameters: { outputId, reason },
        priority: 0,
      },
      pending.context
    );
  }

  /**
   * Check for orphaned outputs (pending too long)
   *
   * Call this periodically to enforce I7.
   */
  checkOrphanedOutputs(maxAgeMs: number = 60000): string[] {
    const now = Date.now();
    const orphaned: string[] = [];

    for (const [outputId, pending] of this._pendingOutputs) {
      if (now - pending.startedAt > maxAgeMs) {
        orphaned.push(outputId);
      }
    }

    return orphaned;
  }

  /**
   * Get all completed bindings
   */
  getBindings(): readonly WorldBinding[] {
    return this._completedBindings;
  }

  /**
   * Get pending outputs count
   */
  getPendingCount(): number {
    return this._pendingOutputs.size;
  }

  /**
   * Propose next action (Axiom VIII: No terminal states)
   *
   * Every workflow ends by appending an event that can be re-entered.
   */
  private proposeNextAction(
    params: OutputCommitParams,
    outputEventRef: string,
    context: ContextBundle
  ): void {
    // Determine appropriate next action based on output type
    const nextAction = this.determineNextAction(params);

    this.eventLog.append(
      'action:proposed',
      {
        actionType: nextAction.type,
        parameters: nextAction.parameters,
        priority: nextAction.priority,
      },
      context,
      { causeRef: outputEventRef }
    );
  }

  /**
   * Compute condition changes from output
   */
  private computeConditionChanges(params: OutputCommitParams): WorldConditionChange[] {
    const changes: WorldConditionChange[] = [];

    // Memory condition: output affects future recall
    if (params.affectsMemory !== false) {
      changes.push({
        conditionType: 'memory',
        conditionId: `memory:${params.domain}`,
        previousValue: null,
        newValue: { outputRef: params.outputType, timestamp: Date.now() },
        changeReason: `Output ${params.outputType} committed to ${params.destination}`,
      });
    }

    // Routing condition: output may affect future routing
    if (params.affectsRouting) {
      changes.push({
        conditionType: 'routing',
        conditionId: `routing:${params.domain}`,
        previousValue: null,
        newValue: { preference: params.destination },
        changeReason: `Routing preference updated after output to ${params.destination}`,
      });
    }

    // Task queue condition: output may spawn follow-up tasks
    if (params.spawnsTask) {
      changes.push({
        conditionType: 'task_queue',
        conditionId: `task:${params.spawnsTask}`,
        previousValue: null,
        newValue: { taskType: params.spawnsTask, priority: 1 },
        changeReason: `Task spawned by output ${params.outputType}`,
      });
    }

    // Prior condition: output updates priors for domain
    changes.push({
      conditionType: 'prior',
      conditionId: `prior:${params.domain}`,
      previousValue: null,
      newValue: { lastOutput: params.outputType, timestamp: Date.now() },
      changeReason: `Domain ${params.domain} prior updated`,
    });

    return changes;
  }

  /**
   * Determine next action based on output
   */
  private determineNextAction(params: OutputCommitParams): NextAction {
    // If explicit next action provided
    if (params.nextAction) {
      return params.nextAction;
    }

    // Default: propose reinterpretation or open question
    if (params.outputType.includes('query') || params.outputType.includes('question')) {
      return {
        type: 'await_response',
        parameters: { domain: params.domain },
        priority: 1,
      };
    }

    if (params.outputType.includes('ritual') || params.outputType.includes('fusion')) {
      return {
        type: 'stabilize_state',
        parameters: { domain: params.domain },
        priority: 2,
      };
    }

    // Default: monitor for next signal
    return {
      type: 'monitor',
      parameters: { domain: params.domain, waitForSignal: true },
      priority: 0,
    };
  }

  /**
   * Generate unique output ID
   */
  private generateOutputId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `OUT-${timestamp}-${random}`;
  }
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export interface OutputCommitParams {
  /** Context for the output */
  context: ContextBundle;
  /** Type of output (e.g., 'ritual_result', 'fusion_signal', 'ui_update') */
  outputType: string;
  /** The actual output value */
  outputValue: unknown;
  /** Destination (e.g., 'ui', 'audio', 'external_api') */
  destination: string;
  /** Domain of the output */
  domain: string;
  /** External reference (e.g., API response ID) */
  externalRef?: string;
  /** Condition type for the update */
  conditionType?: string;
  /** Explicit condition delta (computed if not provided) */
  conditionDelta?: unknown;
  /** Domains affected by this output */
  affectedDomains?: string[];
  /** Cost of the output */
  cost?: CostVector;
  /** Cause event reference */
  causeEventRef?: string;
  /** Whether output affects memory (default: true) */
  affectsMemory?: boolean;
  /** Whether output affects routing */
  affectsRouting?: boolean;
  /** Task to spawn after output */
  spawnsTask?: string;
  /** Explicit next action */
  nextAction?: NextAction;
}

export interface BeginOutputParams extends Omit<OutputCommitParams, 'outputValue' | 'externalRef' | 'conditionDelta'> {}

export interface CompleteOutputParams {
  outputValue: unknown;
  externalRef?: string;
  conditionDelta?: unknown;
}

export interface PendingOutput {
  outputId: string;
  params: BeginOutputParams;
  startedAt: number;
  context: ContextBundle;
}

export interface WorldBindingResult {
  outputEvent: SpineEvent<'output:committed'>;
  conditionEvent: SpineEvent<'condition:updated'>;
  binding: WorldBinding;
}

export interface NextAction {
  type: string;
  parameters: unknown;
  priority: number;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a world binding manager
 */
export function createWorldBindingManager(
  eventLog: EventLog,
  contextStore: ContextStore
): WorldBindingManager {
  return new WorldBindingManager(eventLog, contextStore);
}
