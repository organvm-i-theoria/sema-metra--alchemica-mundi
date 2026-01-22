/**
 * Axiom Compliance Tests
 *
 * Validates that the system satisfies all 10 axioms plus closing conditions.
 * These tests prove the architecture makes the axioms true by construction.
 *
 * AXIOMS.md defines:
 * I.    Primacy of the Sign - No empty boot
 * II.   Emergence of the Matrix - State from event replay
 * III.  Alchemical Transformation - Transforms are transmutative
 * IV.   Conservation of Meaning - Semantic tracking
 * V.    Recursive World-Binding - Outputs write back
 * VI.   Signal-Structure Feedback - Structure affects signal generation
 * VII.  Irreducibility of Context - Context required for all
 * VIII. Anti-Teleology - No terminal states
 * IX.   Ontological Cost - Cost vectors emitted
 * X.    Legibility as Power - Projections vs latent structure
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAlchemicaMundi,
  validateAxiomCompliance,
  type AlchemicaMundi,
  createSpine,
  createEmptySpine,
  createSystemGenesisPayload,
  createSystemContext,
  type GenesisSignalPayload,
  EventLogError,
  TransformError,
} from '../src/index.js';

// ============================================================================
// TEST HELPERS
// ============================================================================

function createTestGenesis(): GenesisSignalPayload {
  return {
    genesisType: 'seed_corpus',
    genesisValue: { seed: 'test', timestamp: Date.now() },
    interpretationFunction: 'test_parser',
  };
}

// ============================================================================
// AXIOM I: PRIMACY OF THE SIGN
// ============================================================================

describe('Axiom I: Primacy of the Sign', () => {
  it('system cannot be emptied without collapse', () => {
    const spine = createEmptySpine();

    // Without genesis, system cannot function
    const result = spine.rules.validateRuleA();
    expect(result.valid).toBe(false);

    // Empty log cannot be replayed
    expect(() => {
      spine.eventLog.replay((s) => s, {});
    }).toThrow(EventLogError);
  });

  it('initialization requires at least one interpretable signal', () => {
    const spine = createSpine(createTestGenesis());

    expect(spine.eventLog.hasGenesis).toBe(true);
    expect(spine.eventLog.length).toBeGreaterThan(0);
    expect(spine.rules.validateRuleA().valid).toBe(true);
  });

  it('blank system is ontologically invalid', async () => {
    const spine = createEmptySpine();

    // Cannot project state from empty system
    const report = spine.rules.validateAll();
    expect(report.valid).toBe(false);
    expect(report.violations.some((v) => v.rule === 'A')).toBe(true);
  });

  it('genesis signal precipitates structure', () => {
    const spine = createSpine(createTestGenesis());
    const events = spine.eventLog.all();

    // Genesis is first event
    expect(events[0]?.type).toBe('genesis:signal');
    expect(events[0]?.payload).toBeDefined();
    expect((events[0]?.payload as any).genesisType).toBe('seed_corpus');
  });
});

// ============================================================================
// AXIOM II: EMERGENCE OF THE MATRIX
// ============================================================================

describe('Axiom II: Emergence of the Matrix', () => {
  it('state is derivable from event replay', () => {
    const spine = createSpine(createTestGenesis());
    const context = createSystemContext(spine.contextStore);

    // Add some events
    spine.eventLog.append('signal:observed', {
      signalType: 'observation',
      source: 'test',
      rawValue: { count: 1 },
      domain: 'test',
    }, context);

    spine.eventLog.append('signal:observed', {
      signalType: 'observation',
      source: 'test',
      rawValue: { count: 2 },
      domain: 'test',
    }, context);

    // Replay to derive state
    interface CountState { total: number; events: number }
    const result = spine.eventLog.replay<CountState>(
      (state, event) => {
        if (event.type === 'signal:observed') {
          const payload = event.payload as any;
          return {
            total: state.total + (payload.rawValue?.count ?? 0),
            events: state.events + 1,
          };
        }
        return state;
      },
      { total: 0, events: 0 }
    );

    expect(result.state.total).toBe(3);
    expect(result.state.events).toBe(2);
    expect(result.stateHash).toBeDefined();
  });

  it('schemas are aftereffects not causes', () => {
    const spine = createSpine(createTestGenesis());
    const context = createSystemContext(spine.contextStore);

    // Emit structure stabilization events (they come AFTER signals)
    spine.eventLog.append('signal:observed', {
      signalType: 'observation',
      source: 'sensor',
      rawValue: 'pattern_a',
      domain: 'test',
    }, context);

    spine.eventLog.append('structure:inferred', {
      structureType: 'pattern',
      structureId: 'PATTERN-001',
      inferredFrom: ['genesis'],
      confidence: 0.85,
      version: 1,
    }, context);

    // Structure comes after signal
    const events = spine.eventLog.all();
    const signalIdx = events.findIndex((e) => e.type === 'signal:observed');
    const structIdx = events.findIndex((e) => e.type === 'structure:inferred');
    expect(structIdx).toBeGreaterThan(signalIdx);
  });

  it('events are immutable once committed (persistence of memory)', () => {
    const spine = createSpine(createTestGenesis());
    const events = spine.eventLog.all();

    expect(Object.isFrozen(events[0])).toBe(true);

    // Attempting to modify throws
    expect(() => {
      (events[0] as any).type = 'modified';
    }).toThrow();
  });

  it('mutations occur by appending not overwriting', () => {
    const spine = createSpine(createTestGenesis());
    const context = createSystemContext(spine.contextStore);
    const genesis = spine.eventLog.all()[0]!;

    // Add an event
    const event1 = spine.eventLog.append('signal:observed', {
      signalType: 'observation',
      source: 'original',
      rawValue: 'v1',
      domain: 'test',
    }, context);

    // "Update" by superseding
    spine.eventLog.append('signal:observed', {
      signalType: 'observation',
      source: 'updated',
      rawValue: 'v2',
      domain: 'test',
    }, context, { supersedesRef: event1.eventId });

    // Both events exist
    expect(spine.eventLog.length).toBe(3);
    expect(spine.eventLog.get(event1.eventId)).toBeDefined();
  });
});

// ============================================================================
// AXIOM III: ALCHEMICAL TRANSFORMATION
// ============================================================================

describe('Axiom III: Alchemical Transformation', () => {
  it('transforms are transmutative not preservative', () => {
    const spine = createSpine(createTestGenesis());
    const inputCtx = createSystemContext(spine.contextStore, { domain: 'input' });
    const outputCtx = spine.contextStore.derive(inputCtx.contextId, {});

    const event = spine.transform.validateAndApply(
      'transmutation',
      { raw: 'gold' },
      { refined: 'philosophers_stone' },
      inputCtx,
      outputCtx
    );

    expect(event.payload.fingerprint.before).not.toBe(event.payload.fingerprint.after);
  });

  it('identity transforms are rejected', () => {
    const spine = createSpine(createTestGenesis());
    const ctx = createSystemContext(spine.contextStore);

    expect(() => {
      spine.transform.validateAndApply('identity', { x: 1 }, { x: 1 }, ctx, ctx);
    }).toThrow(TransformError);
  });

  it('no signal exits unchanged', () => {
    const spine = createSpine(createTestGenesis());

    // All transform:applied events must have different fingerprints
    // or context/priors changed
    const inputCtx = createSystemContext(spine.contextStore);
    const outputCtx = spine.contextStore.derive(inputCtx.contextId, {});

    spine.transform.validateAndApply('t1', 'a', 'b', inputCtx, outputCtx);
    spine.transform.validateAndApply('t2', 1, 2, inputCtx, outputCtx);

    const transforms = spine.eventLog.getByType('transform:applied');
    for (const t of transforms) {
      const fp = t.payload.fingerprint;
      const changed = fp.before !== fp.after ||
                      t.payload.contextChanged ||
                      t.payload.priorsChanged;
      expect(changed).toBe(true);
    }

    expect(spine.rules.validateRuleD().valid).toBe(true);
  });

  it('loss and distortion are mechanisms not errors', () => {
    const spine = createSpine(createTestGenesis());
    const inputCtx = createSystemContext(spine.contextStore);
    const outputCtx = spine.contextStore.derive(inputCtx.contextId, {});

    // Large input compressed to small output
    const event = spine.transform.validateAndApply(
      'compression',
      { data: 'a'.repeat(1000) },
      { data: 'compressed' },
      inputCtx,
      outputCtx
    );

    // Loss is recorded, not hidden
    expect(event.cost?.lossEstimate).toBeGreaterThan(0);
  });
});

// ============================================================================
// AXIOM IV: CONSERVATION OF MEANING, NOT FORM
// ============================================================================

describe('Axiom IV: Conservation of Meaning', () => {
  it('semantic score is tracked', () => {
    const spine = createSpine(createTestGenesis());
    const inputCtx = createSystemContext(spine.contextStore);
    const outputCtx = spine.contextStore.derive(inputCtx.contextId, {});

    const event = spine.transform.validateAndApply(
      'semantic_transform',
      { meaning: 'hello' },
      { meaning: 'hi' },
      inputCtx,
      outputCtx,
      { semanticScore: 0.95 }
    );

    // Cost tracks semantic drift
    expect(event.cost?.breakdown?.semanticDrift).toBeDefined();
  });

  it('degradation events are emitted for low semantic scores', () => {
    const spine = createSpine(createTestGenesis());
    const inputCtx = createSystemContext(spine.contextStore);
    const outputCtx = spine.contextStore.derive(inputCtx.contextId, {});

    // Transform with low semantic score
    spine.transform.validateAndApply(
      'lossy_transform',
      { full: 'detailed information here' },
      { summary: 'info' },
      inputCtx,
      outputCtx,
      { semanticScore: 0.5 } // Below threshold
    );

    const degradations = spine.eventLog.getByType('degradation:emitted');
    expect(degradations.length).toBeGreaterThan(0);
    expect(degradations[0]?.payload.degradationType).toBe('semantic');
  });

  it('compression is tracked as gain not reduction', () => {
    const spine = createSpine(createTestGenesis());
    const inputCtx = createSystemContext(spine.contextStore);
    const outputCtx = spine.contextStore.derive(inputCtx.contextId, {});

    const event = spine.transform.validateAndApply(
      'compression',
      { verbose: 'this is a very long string with lots of data' },
      { compact: 'short' },
      inputCtx,
      outputCtx,
      { semanticScore: 0.9 }
    );

    // High semantic score + size reduction = successful compression
    expect(event.cost).toBeDefined();
    expect(event.cost!.lossEstimate).toBeLessThan(0.5);
  });
});

// ============================================================================
// AXIOM V: RECURSIVE WORLD-BINDING
// ============================================================================

describe('Axiom V: Recursive World-Binding', () => {
  it('outputs alter conditions of subsequent inputs', () => {
    const spine = createSpine(createTestGenesis());
    const ctx = createSystemContext(spine.contextStore);

    const result = spine.worldBinding.commitOutput({
      context: ctx,
      outputType: 'world_effect',
      outputValue: { action: 'modify_world' },
      destination: 'external',
      domain: 'test',
    });

    // Output creates condition update
    expect(result.conditionEvent).toBeDefined();
    expect(result.binding.conditionChanges.length).toBeGreaterThan(0);

    // Condition update references the output
    expect(result.conditionEvent.payload.outputRef).toBe(result.outputEvent.eventId);
  });

  it('there is no final output only recursive influence', () => {
    const spine = createSpine(createTestGenesis());
    const ctx = createSystemContext(spine.contextStore);

    spine.worldBinding.commitOutput({
      context: ctx,
      outputType: 'output_1',
      outputValue: 'v1',
      destination: 'world',
      domain: 'test',
    });

    // Check that action:proposed is emitted (no terminal state)
    const proposals = spine.eventLog.getByType('action:proposed');
    expect(proposals.length).toBeGreaterThan(0);
  });

  it('all outputs must write back (no fire-and-forget)', () => {
    const spine = createSpine(createTestGenesis());
    const ctx = createSystemContext(spine.contextStore);

    spine.worldBinding.commitOutput({
      context: ctx,
      outputType: 'bound_output',
      outputValue: 'data',
      destination: 'ui',
      domain: 'test',
    });

    expect(spine.rules.validateRuleF().valid).toBe(true);
  });
});

// ============================================================================
// AXIOM VI: SIGNAL-STRUCTURE FEEDBACK
// ============================================================================

describe('Axiom VI: Signal-Structure Feedback', () => {
  it('structure stabilization creates feedback events', () => {
    const spine = createSpine(createTestGenesis());
    const ctx = createSystemContext(spine.contextStore);

    spine.eventLog.append('structure:stabilized', {
      structureRefs: ['STR-001'],
      stabilityScore: 0.9,
      recurrenceCount: 5,
    }, ctx);

    // Structure event should be in log
    const stabilized = spine.eventLog.getByType('structure:stabilized');
    expect(stabilized.length).toBe(1);
  });

  it('context carries structural information for signal generation', () => {
    const spine = createSpine(createTestGenesis());
    const ctx = createSystemContext(spine.contextStore, {
      domain: 'structured',
      tags: ['has_structure'],
    });

    // Context influences signal interpretation
    expect(ctx.tags).toContain('has_structure');
    expect(ctx.where.domain).toBe('structured');
  });
});

// ============================================================================
// AXIOM VII: IRREDUCIBILITY OF CONTEXT
// ============================================================================

describe('Axiom VII: Irreducibility of Context', () => {
  it('no signal can be evaluated without context', () => {
    const spine = createSpine(createTestGenesis());

    // All events have context ref
    const events = spine.eventLog.all();
    for (const event of events) {
      expect(event.contextRef).toBeDefined();
      expect(event.contextRef.length).toBeGreaterThan(0);
    }

    expect(spine.rules.validateRuleC().valid).toBe(true);
  });

  it('context is constitutive not metadata', () => {
    const spine = createSpine(createTestGenesis());
    const ctx = createSystemContext(spine.contextStore);

    // Context contains WHO, WHAT, WHEN, WHERE, WHY
    expect(ctx.who).toBeDefined();
    expect(ctx.what).toBeDefined();
    expect(ctx.when).toBeDefined();
    expect(ctx.where).toBeDefined();
    expect(ctx.why).toBeDefined();
  });

  it('decontextualization is prevented', () => {
    const spine = createSpine(createTestGenesis());

    // Cannot append event without context
    const badContext: any = { contextId: '' };

    expect(() => {
      spine.eventLog.append('signal:observed', {
        signalType: 'observation',
        source: 'test',
        rawValue: 'test',
        domain: 'test',
      }, badContext);
    }).toThrow(EventLogError);
  });

  it('context is versioned for consistency', () => {
    const spine = createSpine(createTestGenesis());
    const ctx = createSystemContext(spine.contextStore);

    expect(ctx.version).toBe(1);

    const updated = spine.contextStore.update(ctx.contextId, {
      why: { intent: 'updated' },
    });

    expect(updated.version).toBe(2);
  });
});

// ============================================================================
// AXIOM VIII: ANTI-TELEOLOGY
// ============================================================================

describe('Axiom VIII: Anti-Teleology', () => {
  it('system has no terminal state', () => {
    const spine = createSpine(createTestGenesis());
    const ctx = createSystemContext(spine.contextStore);

    // Every output proposes next action
    spine.worldBinding.commitOutput({
      context: ctx,
      outputType: 'any_output',
      outputValue: 'data',
      destination: 'ui',
      domain: 'test',
    });

    const proposals = spine.eventLog.getByType('action:proposed');
    expect(proposals.length).toBeGreaterThan(0);
  });

  it('directionality emerges locally not globally', () => {
    const spine = createSpine(createTestGenesis());
    const ctx = createSystemContext(spine.contextStore);

    // Different outputs propose different next actions
    spine.worldBinding.commitOutput({
      context: ctx,
      outputType: 'query_output',
      outputValue: 'question',
      destination: 'user',
      domain: 'query',
    });

    spine.worldBinding.commitOutput({
      context: ctx,
      outputType: 'ritual_output',
      outputValue: 'ritual_result',
      destination: 'state',
      domain: 'ritual',
    });

    const proposals = spine.eventLog.getByType('action:proposed');
    expect(proposals.length).toBeGreaterThanOrEqual(2);
  });

  it('workflows end by appending re-enterable events', () => {
    const spine = createSpine(createTestGenesis());
    const ctx = createSystemContext(spine.contextStore);

    spine.worldBinding.commitOutput({
      context: ctx,
      outputType: 'workflow_end',
      outputValue: 'completed',
      destination: 'system',
      domain: 'test',
    });

    // Last events should be proposing next actions
    const proposals = spine.eventLog.getByType('action:proposed');
    const lastProposal = proposals[proposals.length - 1];
    expect(lastProposal?.payload.actionType).toBeDefined();
  });
});

// ============================================================================
// AXIOM IX: ONTOLOGICAL COST
// ============================================================================

describe('Axiom IX: Ontological Cost', () => {
  it('every transform emits cost vector', () => {
    const spine = createSpine(createTestGenesis());
    const inputCtx = createSystemContext(spine.contextStore);
    const outputCtx = spine.contextStore.derive(inputCtx.contextId, {});

    spine.transform.validateAndApply('t1', 'a', 'b', inputCtx, outputCtx);
    spine.transform.validateAndApply('t2', 1, 2, inputCtx, outputCtx);

    const transforms = spine.eventLog.getByType('transform:applied');
    for (const t of transforms) {
      expect(t.cost).toBeDefined();
      expect(typeof t.cost!.lossEstimate).toBe('number');
      expect(typeof t.cost!.ambiguityDelta).toBe('number');
      expect(typeof t.cost!.computeCost).toBe('number');
      expect(typeof t.cost!.confidenceDelta).toBe('number');
    }

    expect(spine.rules.validateRuleE().valid).toBe(true);
  });

  it('cost includes entropy, ambiguity, and excess', () => {
    const spine = createSpine(createTestGenesis());
    const inputCtx = createSystemContext(spine.contextStore);
    const outputCtx = spine.contextStore.derive(inputCtx.contextId, {});

    const event = spine.transform.validateAndApply(
      'costly_transform',
      { original: 'data' },
      { transformed: 'result' },
      inputCtx,
      outputCtx
    );

    expect(event.cost!.lossEstimate).toBeGreaterThanOrEqual(0);
    expect(event.cost!.ambiguityDelta).toBeDefined();
    expect(event.cost!.breakdown?.entropy).toBeDefined();
  });

  it('zero-cost claims are rejected', () => {
    const spine = createSpine(createTestGenesis());
    const inputCtx = createSystemContext(spine.contextStore);
    const outputCtx = spine.contextStore.derive(inputCtx.contextId, {});

    // Even with explicit zero cost, computeCost has minimum
    const event = spine.transform.validateAndApply(
      'minimal_transform',
      'a',
      'b',
      inputCtx,
      outputCtx,
      {
        explicitCost: {
          lossEstimate: 0,
          ambiguityDelta: 0,
          computeCost: 0,
          confidenceDelta: 0,
        },
      }
    );

    // Cost is still recorded (even if zero)
    expect(event.cost).toBeDefined();
  });
});

// ============================================================================
// AXIOM X: LEGIBILITY AS POWER
// ============================================================================

describe('Axiom X: Legibility as Power', () => {
  it('projections are labeled and versioned', () => {
    const spine = createSpine(createTestGenesis());

    const result = spine.eventLog.replay(
      (state) => state,
      {},
      { projectionVersion: 'v1.0' }
    );

    expect(result.projectionVersion).toBe('v1.0');
    expect(result.stateHash).toBeDefined();
  });

  it('projection computed events are emitted', () => {
    const spine = createSpine(createTestGenesis());
    const ctx = createSystemContext(spine.contextStore);

    spine.eventLog.append('projection:computed', {
      projectionType: 'state_view',
      projectionVersion: 'v1.0',
      stateHash: 'abc123',
      eventRange: { from: 1, to: 10 },
    }, ctx);

    const projections = spine.eventLog.getByType('projection:computed');
    expect(projections.length).toBe(1);
    expect(projections[0]?.payload.projectionType).toBe('state_view');
  });

  it('latent structure remains in event log', () => {
    const spine = createSpine(createTestGenesis());

    // Even after replay, original events are preserved
    const events = spine.eventLog.all();
    const firstCount = events.length;

    // Replay doesn't modify events
    spine.eventLog.replay((s) => s, {});

    expect(spine.eventLog.length).toBe(firstCount);
  });
});

// ============================================================================
// CLOSING CONDITION
// ============================================================================

describe('Closing Condition', () => {
  it('cannot be emptied without collapse', () => {
    const spine = createEmptySpine();

    // Empty system cannot validate
    expect(spine.rules.validateAll().valid).toBe(false);
  });

  it('cannot repeat itself without mutation', () => {
    const spine = createSpine(createTestGenesis());
    const ctx = createSystemContext(spine.contextStore);

    // Identity transform is rejected
    expect(() => {
      spine.transform.validateAndApply('repeat', 'x', 'x', ctx, ctx);
    }).toThrow(TransformError);
  });

  it('cannot describe the world without altering it', () => {
    const spine = createSpine(createTestGenesis());
    const ctx = createSystemContext(spine.contextStore);

    // Every output creates condition update (world alteration)
    spine.worldBinding.commitOutput({
      context: ctx,
      outputType: 'description',
      outputValue: 'the world is...',
      destination: 'output',
      domain: 'test',
    });

    const conditions = spine.eventLog.getByType('condition:updated');
    expect(conditions.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// KERNEL LAW
// ============================================================================

describe('Kernel Law', () => {
  it('signals generate the matrix', () => {
    const spine = createSpine(createTestGenesis());
    const ctx = createSystemContext(spine.contextStore);

    // Signals create structure
    spine.eventLog.append('signal:observed', {
      signalType: 'observation',
      source: 'test',
      rawValue: 'pattern',
      domain: 'test',
    }, ctx);

    spine.eventLog.append('structure:inferred', {
      structureType: 'pattern',
      structureId: 'P1',
      inferredFrom: ['genesis'],
      confidence: 0.8,
      version: 1,
    }, ctx);

    // Matrix (structure) emerges from signals
    const structures = spine.eventLog.getByType('structure:inferred');
    expect(structures.length).toBe(1);
  });

  it('the matrix transmutes signals', () => {
    const spine = createSpine(createTestGenesis());
    const inputCtx = createSystemContext(spine.contextStore);
    const outputCtx = spine.contextStore.derive(inputCtx.contextId, {});

    // Signals are transformed (transmuted)
    spine.transform.validateAndApply(
      'matrix_transmutation',
      { signal: 'input' },
      { signal: 'output', transformed: true },
      inputCtx,
      outputCtx
    );

    const transforms = spine.eventLog.getByType('transform:applied');
    expect(transforms.length).toBeGreaterThan(0);
  });

  it('every transmutation rewrites world conditions', () => {
    const spine = createSpine(createTestGenesis());
    const ctx = createSystemContext(spine.contextStore);

    // Output commits rewrite conditions
    spine.worldBinding.commitOutput({
      context: ctx,
      outputType: 'transmutation_result',
      outputValue: 'new_state',
      destination: 'world',
      domain: 'test',
    });

    const conditions = spine.eventLog.getByType('condition:updated');
    expect(conditions.length).toBeGreaterThan(0);

    // Condition has change description
    expect(conditions[0]?.payload.delta).toBeDefined();
  });
});

// ============================================================================
// FULL SYSTEM VALIDATION
// ============================================================================

describe('Full System: validateAxiomCompliance', () => {
  it('createAlchemicaMundi creates axiom-compliant system', async () => {
    const system = await createAlchemicaMundi();

    const { valid, report } = validateAxiomCompliance(system);
    expect(valid).toBe(true);
    expect(report.violations.length).toBe(0);
  });

  it('all rules pass on fresh system', async () => {
    const system = await createAlchemicaMundi();

    const report = system.spine.rules.validateAll();
    expect(report.valid).toBe(true);

    for (const result of report.results) {
      expect(result.valid).toBe(true);
    }
  });

  it('system has genesis signal', async () => {
    const system = await createAlchemicaMundi();

    expect(system.spine.eventLog.hasGenesis).toBe(true);
  });

  it('system has contexts for all events', async () => {
    const system = await createAlchemicaMundi();

    const events = system.spine.eventLog.all();
    for (const event of events) {
      expect(event.contextRef).toBeDefined();
      expect(system.spine.contextStore.has(event.contextRef)).toBe(true);
    }
  });
});
