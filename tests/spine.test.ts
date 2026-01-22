/**
 * Spine module tests - Hard Rules A-F validation
 *
 * These tests verify that the axiom-derived hard rules are
 * architecturally enforced by the spine module.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Spine factory
  createSpine,
  createEmptySpine,
  createSystemGenesisPayload,
  createUserUtteranceGenesis,
  type Spine,

  // Event Log
  EventLog,
  EventLogError,
  createEventLog,
  createEmptyEventLog,

  // Context Store
  ContextStore,
  ContextError,
  createSystemContext,
  createGenesisContext,

  // Transform
  TransformValidator,
  TransformError,
  TRANSFORM_COSTS,

  // World Binding
  WorldBindingManager,
  WorldBindingError,

  // Rules
  RuleValidator,
  RuleViolationError,
  RULE_DESCRIPTIONS,

  // Types
  type ContextBundle,
  type GenesisSignalPayload,
  type CostVector,
  createCost,
} from '../src/spine/index.js';

// ============================================================================
// TEST HELPERS
// ============================================================================

function createTestGenesis(): GenesisSignalPayload {
  return {
    genesisType: 'signed_intent',
    genesisValue: { action: 'test_init', timestamp: Date.now() },
    interpretationFunction: 'test_interpreter',
  };
}

function createTestContext(store: ContextStore, domain = 'test'): ContextBundle {
  return createSystemContext(store, { domain, intent: 'testing' });
}

// ============================================================================
// RULE A: NO EMPTY BOOT
// ============================================================================

describe('Rule A: No Empty Boot', () => {
  it('should reject state projection without genesis', () => {
    const spine = createEmptySpine();

    // Validate Rule A should fail
    const result = spine.rules.validateRuleA();
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('empty');
  });

  it('should reject replay on empty event log', () => {
    const log = createEmptyEventLog();

    expect(() => {
      log.replay((state) => state, {});
    }).toThrow(EventLogError);
  });

  it('should require genesis before any other events', () => {
    const contextStore = new ContextStore();
    const log = createEmptyEventLog();
    const context = createTestContext(contextStore);

    expect(() => {
      log.append('signal:observed', {
        signalType: 'observation',
        source: 'test',
        rawValue: 'test',
        domain: 'test',
      }, context);
    }).toThrow(EventLogError);
  });

  it('should allow exactly one genesis', () => {
    const contextStore = new ContextStore();
    const log = createEmptyEventLog();
    const context = createGenesisContext(contextStore);
    const genesis = createTestGenesis();

    // First genesis should succeed
    log.appendGenesis(genesis, context);
    expect(log.hasGenesis).toBe(true);

    // Second genesis should fail
    expect(() => {
      log.appendGenesis(genesis, context);
    }).toThrow(EventLogError);
  });

  it('should pass Rule A validation with genesis', () => {
    const spine = createSpine(createTestGenesis());

    const result = spine.rules.validateRuleA();
    expect(result.valid).toBe(true);
  });

  it('should allow events after genesis', () => {
    const spine = createSpine(createTestGenesis());
    const context = createTestContext(spine.contextStore);

    // Should not throw
    spine.eventLog.append('signal:observed', {
      signalType: 'observation',
      source: 'test',
      rawValue: 'test value',
      domain: 'test',
    }, context);

    expect(spine.eventLog.length).toBe(2); // genesis + observed
  });
});

// ============================================================================
// RULE B: APPEND-ONLY
// ============================================================================

describe('Rule B: Append-Only', () => {
  let spine: Spine;

  beforeEach(() => {
    spine = createSpine(createTestGenesis());
  });

  it('should freeze events after commit', () => {
    const events = spine.eventLog.all();
    const genesisEvent = events[0];

    // Object.freeze should have been called
    expect(Object.isFrozen(genesisEvent)).toBe(true);
  });

  it('should maintain monotonic sequences', () => {
    const context = createTestContext(spine.contextStore);

    // Add multiple events
    spine.eventLog.append('signal:observed', {
      signalType: 'observation',
      source: 'test1',
      rawValue: 'value1',
      domain: 'test',
    }, context);

    spine.eventLog.append('signal:observed', {
      signalType: 'observation',
      source: 'test2',
      rawValue: 'value2',
      domain: 'test',
    }, context);

    const events = spine.eventLog.all();
    let lastSeq = 0;
    for (const event of events) {
      expect(event.sequence).toBeGreaterThan(lastSeq);
      lastSeq = event.sequence;
    }
  });

  it('should validate supersedes references point to past events', () => {
    const context = createTestContext(spine.contextStore);

    // Add an event
    const event1 = spine.eventLog.append('signal:observed', {
      signalType: 'observation',
      source: 'original',
      rawValue: 'original value',
      domain: 'test',
    }, context);

    // Add superseding event (should work)
    spine.eventLog.append('signal:observed', {
      signalType: 'observation',
      source: 'updated',
      rawValue: 'updated value',
      domain: 'test',
    }, context, { supersedesRef: event1.eventId });

    const result = spine.rules.validateRuleB();
    expect(result.valid).toBe(true);
  });

  it('should reject invalid supersedes references', () => {
    const context = createTestContext(spine.contextStore);

    expect(() => {
      spine.eventLog.append('signal:observed', {
        signalType: 'observation',
        source: 'test',
        rawValue: 'test',
        domain: 'test',
      }, context, { supersedesRef: 'INVALID-REF' });
    }).toThrow(EventLogError);
  });

  it('should reject invalid cause references', () => {
    const context = createTestContext(spine.contextStore);

    expect(() => {
      spine.eventLog.append('signal:observed', {
        signalType: 'observation',
        source: 'test',
        rawValue: 'test',
        domain: 'test',
      }, context, { causeRef: 'INVALID-CAUSE' });
    }).toThrow(EventLogError);
  });

  it('should prevent appending to frozen log', () => {
    const context = createTestContext(spine.contextStore);

    spine.eventLog.freeze();
    expect(spine.eventLog.isFrozen).toBe(true);

    expect(() => {
      spine.eventLog.append('signal:observed', {
        signalType: 'observation',
        source: 'test',
        rawValue: 'test',
        domain: 'test',
      }, context);
    }).toThrow(EventLogError);
  });

  it('should compute hash for event integrity', () => {
    const events = spine.eventLog.all();
    expect(events[0]?.hash).toBeDefined();
    expect(events[0]?.hash?.length).toBe(16);
  });

  it('should pass Rule B validation', () => {
    const result = spine.rules.validateRuleB();
    expect(result.valid).toBe(true);
  });
});

// ============================================================================
// RULE C: CONTEXT REQUIRED
// ============================================================================

describe('Rule C: Context Required', () => {
  let spine: Spine;

  beforeEach(() => {
    spine = createSpine(createTestGenesis());
  });

  it('should require context on all events', () => {
    const events = spine.eventLog.all();
    for (const event of events) {
      expect(event.contextRef).toBeDefined();
      expect(event.contextRef.length).toBeGreaterThan(0);
    }
  });

  it('should reject events without context reference', () => {
    // Create context with empty ID (should fail validation)
    const badContext: ContextBundle = {
      contextId: '',
      version: 1,
      who: { type: 'system', id: 'test' },
      what: { signalType: 'observation', domain: 'test', intensity: 1, polarity: 'neutral' },
      when: { timestamp: Date.now() },
      where: { domain: 'test' },
      why: {},
      tags: [],
    };

    expect(() => {
      spine.eventLog.append('signal:observed', {
        signalType: 'observation',
        source: 'test',
        rawValue: 'test',
        domain: 'test',
      }, badContext);
    }).toThrow(EventLogError);
  });

  it('should resolve context references via store', () => {
    const context = createTestContext(spine.contextStore);
    const resolved = spine.contextStore.resolve(context.contextId);

    expect(resolved.contextId).toBe(context.contextId);
    expect(resolved.version).toBe(1);
  });

  it('should throw on unresolvable context', () => {
    expect(() => {
      spine.contextStore.resolve('NONEXISTENT-CTX');
    }).toThrow(ContextError);
  });

  it('should track context versions', () => {
    const context = createTestContext(spine.contextStore);

    // Update context
    const updated = spine.contextStore.update(context.contextId, {
      why: { intent: 'updated intent' },
    });

    expect(updated.version).toBe(2);
    expect(spine.contextStore.getHistory(context.contextId).length).toBe(2);
  });

  it('should derive contexts with parent reference', () => {
    const parent = createTestContext(spine.contextStore);
    const child = spine.contextStore.derive(parent.contextId, {
      why: { intent: 'derived operation' },
      additionalTags: ['derived'],
    });

    expect(child.parentRefs).toContain(parent.contextId);
    expect(child.tags).toContain('derived');
  });

  it('should pass Rule C validation', () => {
    const result = spine.rules.validateRuleC();
    expect(result.valid).toBe(true);
  });

  it('should fail Rule C if context not in store', () => {
    // This is a tricky test - we need to manipulate internal state
    // to create an event with an unresolvable context
    const contextStore = new ContextStore();
    const eventLog = new EventLog();
    const genesisContext = createGenesisContext(contextStore);
    eventLog.appendGenesis(createTestGenesis(), genesisContext);

    // Now delete the context from store (simulating corruption)
    (contextStore as any)._contexts.delete(genesisContext.contextId);

    const rules = new RuleValidator(eventLog, contextStore);
    const result = rules.validateRuleC();
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('cannot be resolved');
  });
});

// ============================================================================
// RULE D: TRANSFORM MUST MUTATE
// ============================================================================

describe('Rule D: Transform Must Mutate', () => {
  let spine: Spine;

  beforeEach(() => {
    spine = createSpine(createTestGenesis());
  });

  it('should accept transforms with fingerprint change', () => {
    const inputContext = createTestContext(spine.contextStore, 'input');
    const outputContext = spine.contextStore.derive(inputContext.contextId, {
      why: { intent: 'transform output' },
    });

    const input = { value: 'original' };
    const output = { value: 'transformed' };

    const event = spine.transform.validateAndApply(
      'test_transform',
      input,
      output,
      inputContext,
      outputContext
    );

    expect(event.type).toBe('transform:applied');
    expect(event.payload.fingerprint.before).not.toBe(event.payload.fingerprint.after);
  });

  it('should accept transforms with context change only', () => {
    const inputContext = createTestContext(spine.contextStore, 'input');
    const outputContext = createTestContext(spine.contextStore, 'output'); // Different context

    const data = { value: 'same' };

    const event = spine.transform.validateAndApply(
      'context_only_transform',
      data,
      data, // Same data
      inputContext,
      outputContext
    );

    expect(event.type).toBe('transform:applied');
    expect(event.payload.contextChanged).toBe(true);
  });

  it('should accept transforms with priors change', () => {
    const context = createTestContext(spine.contextStore);
    const data = { value: 'same' };

    const event = spine.transform.validateAndApply(
      'priors_only_transform',
      data,
      data,
      context,
      context, // Same context
      {
        priorsBefore: { state: 'before' },
        priorsAfter: { state: 'after' },
      }
    );

    expect(event.type).toBe('transform:applied');
    expect(event.payload.priorsChanged).toBe(true);
  });

  it('should reject identity transforms', () => {
    const context = createTestContext(spine.contextStore);
    const data = { value: 'unchanged' };

    expect(() => {
      spine.transform.validateAndApply(
        'identity_transform',
        data,
        data, // Same data
        context,
        context // Same context
        // No priors change
      );
    }).toThrow(TransformError);
  });

  it('should emit transform:rejected event for identity', () => {
    const context = createTestContext(spine.contextStore);
    const data = { value: 'unchanged' };

    try {
      spine.transform.validateAndApply('identity', data, data, context, context);
    } catch {
      // Expected
    }

    const rejected = spine.eventLog.getByType('transform:rejected');
    expect(rejected.length).toBe(1);
    expect(rejected[0]?.payload.reason).toBe('identity');
  });

  it('should compute fingerprints correctly', () => {
    const fp1 = spine.transform.computeFingerprint({ a: 1 });
    const fp2 = spine.transform.computeFingerprint({ a: 1 });
    const fp3 = spine.transform.computeFingerprint({ a: 2 });

    expect(fp1).toBe(fp2); // Same input = same fingerprint
    expect(fp1).not.toBe(fp3); // Different input = different fingerprint
    expect(fp1.length).toBe(16);
  });

  it('should pass Rule D validation with valid transforms', () => {
    const inputContext = createTestContext(spine.contextStore);
    const outputContext = spine.contextStore.derive(inputContext.contextId, {});

    spine.transform.validateAndApply(
      'valid_transform',
      { input: 'data' },
      { output: 'data' },
      inputContext,
      outputContext
    );

    const result = spine.rules.validateRuleD();
    expect(result.valid).toBe(true);
  });
});

// ============================================================================
// RULE E: EVERY TRANSFORM EMITS COST
// ============================================================================

describe('Rule E: Every Transform Emits Cost', () => {
  let spine: Spine;

  beforeEach(() => {
    spine = createSpine(createTestGenesis());
  });

  it('should auto-compute cost vector', () => {
    const inputContext = createTestContext(spine.contextStore);
    const outputContext = spine.contextStore.derive(inputContext.contextId, {});

    const event = spine.transform.validateAndApply(
      'auto_cost_transform',
      { input: 'original data here' },
      { output: 'transformed' },
      inputContext,
      outputContext
    );

    expect(event.cost).toBeDefined();
    expect(event.cost?.lossEstimate).toBeGreaterThanOrEqual(0);
    expect(event.cost?.ambiguityDelta).toBeDefined();
    expect(event.cost?.computeCost).toBeGreaterThanOrEqual(0);
    expect(event.cost?.confidenceDelta).toBeDefined();
  });

  it('should accept explicit cost vector', () => {
    const inputContext = createTestContext(spine.contextStore);
    const outputContext = spine.contextStore.derive(inputContext.contextId, {});

    const explicitCost: CostVector = {
      lossEstimate: 0.5,
      ambiguityDelta: 0.2,
      computeCost: 0.1,
      confidenceDelta: -0.1,
    };

    const event = spine.transform.validateAndApply(
      'explicit_cost_transform',
      { input: 'data' },
      { output: 'transformed' },
      inputContext,
      outputContext,
      { explicitCost }
    );

    expect(event.cost?.lossEstimate).toBe(0.5);
    expect(event.cost?.ambiguityDelta).toBe(0.2);
  });

  it('should validate cost vector structure', () => {
    const inputContext = createTestContext(spine.contextStore);
    const outputContext = spine.contextStore.derive(inputContext.contextId, {});

    spine.transform.validateAndApply(
      'test_transform',
      { a: 1 },
      { b: 2 },
      inputContext,
      outputContext
    );

    const result = spine.rules.validateRuleE();
    expect(result.valid).toBe(true);
  });

  it('should use pre-built cost profiles', () => {
    expect(TRANSFORM_COSTS.DUALITY_MODULATION.lossEstimate).toBe(0.01);
    expect(TRANSFORM_COSTS.BINARY_TOGGLE.lossEstimate).toBe(0);
    expect(TRANSFORM_COSTS.RITUAL_EXECUTION.computeCost).toBe(0.05);
  });

  it('should include cost breakdown when available', () => {
    const inputContext = createTestContext(spine.contextStore);
    const outputContext = spine.contextStore.derive(inputContext.contextId, {});

    const event = spine.transform.validateAndApply(
      'breakdown_transform',
      { large: 'input data here for size calculation' },
      { small: 'output' },
      inputContext,
      outputContext
    );

    expect(event.cost?.breakdown).toBeDefined();
    expect(event.cost?.breakdown?.entropy).toBeDefined();
    expect(event.cost?.breakdown?.semanticDrift).toBeDefined();
  });

  it('should pass Rule E validation', () => {
    const inputContext = createTestContext(spine.contextStore);
    const outputContext = spine.contextStore.derive(inputContext.contextId, {});

    spine.transform.validateAndApply(
      'transform1',
      { a: 1 },
      { b: 2 },
      inputContext,
      outputContext
    );

    spine.transform.validateAndApply(
      'transform2',
      { c: 3 },
      { d: 4 },
      inputContext,
      outputContext
    );

    const result = spine.rules.validateRuleE();
    expect(result.valid).toBe(true);
  });
});

// ============================================================================
// RULE F: EVERY OUTPUT WRITES BACK
// ============================================================================

describe('Rule F: Every Output Writes Back', () => {
  let spine: Spine;

  beforeEach(() => {
    spine = createSpine(createTestGenesis());
  });

  it('should create output and condition events atomically', () => {
    const context = createTestContext(spine.contextStore);

    const result = spine.worldBinding.commitOutput({
      context,
      outputType: 'test_output',
      outputValue: { data: 'test value' },
      destination: 'ui',
      domain: 'test',
    });

    expect(result.outputEvent).toBeDefined();
    expect(result.conditionEvent).toBeDefined();
    expect(result.binding).toBeDefined();

    // Verify events are linked
    expect(result.conditionEvent.payload.outputRef).toBe(result.outputEvent.eventId);
  });

  it('should record world binding', () => {
    const context = createTestContext(spine.contextStore);

    spine.worldBinding.commitOutput({
      context,
      outputType: 'bound_output',
      outputValue: { test: true },
      destination: 'external',
      domain: 'test',
    });

    const bindings = spine.worldBinding.getBindings();
    expect(bindings.length).toBe(1);
    expect(bindings[0]?.outputEventRef).toBeDefined();
    expect(bindings[0]?.conditionEventRef).toBeDefined();
  });

  it('should compute condition changes', () => {
    const context = createTestContext(spine.contextStore);

    const result = spine.worldBinding.commitOutput({
      context,
      outputType: 'condition_output',
      outputValue: 'test',
      destination: 'memory',
      domain: 'test',
      affectsRouting: true,
      spawnsTask: 'follow_up',
    });

    // Check that condition changes include memory, routing, task, and prior
    const changes = result.binding.conditionChanges;
    expect(changes.length).toBeGreaterThan(0);

    const conditionTypes = changes.map((c) => c.conditionType);
    expect(conditionTypes).toContain('memory');
    expect(conditionTypes).toContain('routing');
    expect(conditionTypes).toContain('task_queue');
    expect(conditionTypes).toContain('prior');
  });

  it('should propose next action (anti-teleology)', () => {
    const context = createTestContext(spine.contextStore);

    spine.worldBinding.commitOutput({
      context,
      outputType: 'test_output',
      outputValue: 'test',
      destination: 'ui',
      domain: 'test',
    });

    const proposals = spine.eventLog.getByType('action:proposed');
    expect(proposals.length).toBeGreaterThan(0);
  });

  it('should handle async outputs with begin/complete', () => {
    const context = createTestContext(spine.contextStore);

    // Begin output
    const outputId = spine.worldBinding.beginOutput({
      context,
      outputType: 'async_output',
      destination: 'api',
      domain: 'test',
    });

    expect(outputId).toBeDefined();
    expect(spine.worldBinding.getPendingCount()).toBe(1);

    // Complete output
    const result = spine.worldBinding.completeOutput(outputId, {
      outputValue: { response: 'data' },
      externalRef: 'api-response-123',
    });

    expect(result.outputEvent).toBeDefined();
    expect(spine.worldBinding.getPendingCount()).toBe(0);
  });

  it('should detect orphaned outputs', async () => {
    const context = createTestContext(spine.contextStore);

    // Begin output but don't complete
    spine.worldBinding.beginOutput({
      context,
      outputType: 'orphan_output',
      destination: 'nowhere',
      domain: 'test',
    });

    // Wait a tiny bit so the output ages past 0ms
    await new Promise((resolve) => setTimeout(resolve, 5));

    // Check for orphans with very short timeout
    const orphans = spine.worldBinding.checkOrphanedOutputs(1);
    expect(orphans.length).toBe(1);
  });

  it('should allow cancellation of pending outputs', () => {
    const context = createTestContext(spine.contextStore);

    const outputId = spine.worldBinding.beginOutput({
      context,
      outputType: 'cancelable_output',
      destination: 'test',
      domain: 'test',
    });

    spine.worldBinding.cancelOutput(outputId, 'User cancelled');
    expect(spine.worldBinding.getPendingCount()).toBe(0);

    // Should have emitted cancellation proposal
    const proposals = spine.eventLog.getByType('action:proposed');
    const cancellation = proposals.find(
      (p) => p.payload.actionType === 'output_cancelled'
    );
    expect(cancellation).toBeDefined();
  });

  it('should pass Rule F validation', () => {
    const context = createTestContext(spine.contextStore);

    spine.worldBinding.commitOutput({
      context,
      outputType: 'valid_output',
      outputValue: 'test',
      destination: 'ui',
      domain: 'test',
    });

    const result = spine.rules.validateRuleF();
    expect(result.valid).toBe(true);
  });

  it('should fail Rule F with pending outputs', () => {
    const context = createTestContext(spine.contextStore);

    spine.worldBinding.beginOutput({
      context,
      outputType: 'pending_output',
      destination: 'test',
      domain: 'test',
    });

    const result = spine.rules.validateRuleF();
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('pending');
  });
});

// ============================================================================
// RULE VALIDATOR - AGGREGATE TESTS
// ============================================================================

describe('RuleValidator', () => {
  it('should validate all rules at once', () => {
    const spine = createSpine(createTestGenesis());
    const context = createTestContext(spine.contextStore);

    // Add a valid output
    spine.worldBinding.commitOutput({
      context,
      outputType: 'test',
      outputValue: 'test',
      destination: 'test',
      domain: 'test',
    });

    const report = spine.rules.validateAll();
    expect(report.valid).toBe(true);
    expect(report.violations.length).toBe(0);
    expect(report.results.length).toBe(6);
  });

  it('should collect all violations', () => {
    const spine = createEmptySpine();

    const report = spine.rules.validateAll();
    expect(report.valid).toBe(false);
    expect(report.violations.length).toBeGreaterThan(0);
  });

  it('should throw on assertAll with violations', () => {
    const spine = createEmptySpine();

    expect(() => {
      spine.rules.assertAll();
    }).toThrow(RuleViolationError);
  });

  it('should validate individual rules', () => {
    const spine = createSpine(createTestGenesis());

    expect(spine.rules.validate('A').valid).toBe(true);
    expect(spine.rules.validate('B').valid).toBe(true);
    expect(spine.rules.validate('C').valid).toBe(true);
    expect(spine.rules.validate('D').valid).toBe(true);
    expect(spine.rules.validate('E').valid).toBe(true);
    expect(spine.rules.validate('F').valid).toBe(true);
  });

  it('should have descriptions for all rules', () => {
    expect(RULE_DESCRIPTIONS.A).toBeDefined();
    expect(RULE_DESCRIPTIONS.B).toBeDefined();
    expect(RULE_DESCRIPTIONS.C).toBeDefined();
    expect(RULE_DESCRIPTIONS.D).toBeDefined();
    expect(RULE_DESCRIPTIONS.E).toBeDefined();
    expect(RULE_DESCRIPTIONS.F).toBeDefined();
  });
});

// ============================================================================
// EVENT LOG - ADDITIONAL TESTS
// ============================================================================

describe('EventLog', () => {
  it('should support event retrieval by ID', () => {
    const spine = createSpine(createTestGenesis());
    const events = spine.eventLog.all();
    const genesis = events[0]!;

    const retrieved = spine.eventLog.get(genesis.eventId);
    expect(retrieved).toBe(genesis);
  });

  it('should support event retrieval by sequence', () => {
    const spine = createSpine(createTestGenesis());

    const retrieved = spine.eventLog.getBySequence(1);
    expect(retrieved).toBeDefined();
    expect(retrieved?.type).toBe('genesis:signal');
  });

  it('should support event retrieval by type', () => {
    const spine = createSpine(createTestGenesis());
    const context = createTestContext(spine.contextStore);

    spine.eventLog.append('signal:observed', {
      signalType: 'observation',
      source: 'test',
      rawValue: 'test',
      domain: 'test',
    }, context);

    const observed = spine.eventLog.getByType('signal:observed');
    expect(observed.length).toBe(1);
  });

  it('should support event range queries', () => {
    const spine = createSpine(createTestGenesis());
    const context = createTestContext(spine.contextStore);

    // Add multiple events
    for (let i = 0; i < 5; i++) {
      spine.eventLog.append('signal:observed', {
        signalType: 'observation',
        source: `test${i}`,
        rawValue: i,
        domain: 'test',
      }, context);
    }

    const range = spine.eventLog.getRange(2, 4);
    expect(range.length).toBe(3);
  });

  it('should support event chain traversal', () => {
    const spine = createSpine(createTestGenesis());
    const context = createTestContext(spine.contextStore);
    const genesis = spine.eventLog.all()[0]!;

    // Create chain
    const event1 = spine.eventLog.append('signal:observed', {
      signalType: 'observation',
      source: 'chain1',
      rawValue: 'v1',
      domain: 'test',
    }, context, { causeRef: genesis.eventId });

    const event2 = spine.eventLog.append('signal:interpreted', {
      signalRef: event1.eventId,
      interpretation: 'interpreted',
      semanticScore: 0.9,
    }, context, { causeRef: event1.eventId });

    // Walk chain backward
    const backwardChain = spine.eventLog.getChain(event2.eventId, 'backward');
    expect(backwardChain.length).toBe(3);
    expect(backwardChain[0]?.eventId).toBe(genesis.eventId);
    expect(backwardChain[2]?.eventId).toBe(event2.eventId);

    // Walk chain forward
    const forwardChain = spine.eventLog.getChain(genesis.eventId, 'forward');
    expect(forwardChain.length).toBeGreaterThanOrEqual(1);
  });

  it('should support replay with projection', () => {
    const spine = createSpine(createTestGenesis());
    const context = createTestContext(spine.contextStore);

    // Add events
    for (let i = 0; i < 3; i++) {
      spine.eventLog.append('signal:observed', {
        signalType: 'observation',
        source: 'counter',
        rawValue: i,
        domain: 'test',
      }, context);
    }

    // Replay to count events
    type CounterState = { count: number };
    const result = spine.eventLog.replay<CounterState>(
      (state, event) => {
        if (event.type === 'signal:observed') {
          return { count: state.count + 1 };
        }
        return state;
      },
      { count: 0 }
    );

    expect(result.state.count).toBe(3);
    expect(result.stateHash).toBeDefined();
  });

  it('should export and import from JSON', () => {
    const spine = createSpine(createTestGenesis());
    const context = createTestContext(spine.contextStore);

    spine.eventLog.append('signal:observed', {
      signalType: 'observation',
      source: 'test',
      rawValue: 'data',
      domain: 'test',
    }, context);

    // Export
    const snapshot = spine.eventLog.toJSON();
    expect(snapshot.version).toBe('1.0');
    expect(snapshot.events.length).toBe(2);

    // Import
    const restored = EventLog.fromJSON(snapshot);
    expect(restored.length).toBe(2);
    expect(restored.hasGenesis).toBe(true);
  });
});

// ============================================================================
// CONTEXT STORE - ADDITIONAL TESTS
// ============================================================================

describe('ContextStore', () => {
  it('should query contexts by tag', () => {
    const store = new ContextStore();
    createSystemContext(store, { tags: ['mytag'] });
    createSystemContext(store, { tags: ['other'] });

    const tagged = store.byTag('mytag');
    expect(tagged.length).toBe(1);
  });

  it('should query contexts by agent type', () => {
    const store = new ContextStore();
    createSystemContext(store);

    const systems = store.byAgentType('system');
    expect(systems.length).toBeGreaterThan(0);
  });

  it('should query contexts by domain', () => {
    const store = new ContextStore();
    createSystemContext(store, { domain: 'audio' });
    createSystemContext(store, { domain: 'visual' });

    const audio = store.byDomain('audio');
    expect(audio.length).toBe(1);
  });

  it('should export and import from JSON', () => {
    const store = new ContextStore();
    createSystemContext(store, { domain: 'test' });
    createSystemContext(store, { domain: 'test2' });

    const snapshot = store.toJSON();
    expect(snapshot.contexts.length).toBe(2);

    const restored = ContextStore.fromJSON(snapshot);
    expect(restored.size).toBe(2);
  });
});
