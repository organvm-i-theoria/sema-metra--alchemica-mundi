/**
 * CONTEXT STORE
 *
 * Context is not metadata; it is constitutive. No signal can be evaluated
 * independently of the matrix that produced it.
 *
 * Rule C: Context required. Every event must include context_ref,
 *         and interpretation must require it.
 *
 * Constraint C7: Context is First-Class
 * Invariant I5: interpret(signal, context_ref); no overload interpret(signal) allowed.
 *              context_ref resolves to a versioned context object.
 */

import type {
  ContextBundle,
  ContextAgent,
  ContextNature,
  ContextTemporal,
  ContextSpatial,
  ContextCausal,
  SignalType,
} from './types.js';

// ============================================================================
// CONTEXT STORE ERRORS
// ============================================================================

export class ContextError extends Error {
  constructor(
    message: string,
    public readonly code: ContextErrorCode
  ) {
    super(message);
    this.name = 'ContextError';
  }
}

export type ContextErrorCode =
  | 'CONTEXT_NOT_FOUND'
  | 'INVALID_CONTEXT_REF'
  | 'DUPLICATE_CONTEXT_ID'
  | 'VERSION_MISMATCH'
  | 'PARENT_NOT_FOUND';

// ============================================================================
// CONTEXT STORE CLASS
// ============================================================================

/**
 * Versioned context object store.
 *
 * Every signal must carry a context bundle that is required for interpretation.
 * The system enforces that no module can consume a signal without receiving
 * its context reference.
 */
export class ContextStore {
  private readonly _contexts: Map<string, ContextBundle> = new Map();
  private readonly _versionHistory: Map<string, ContextBundle[]> = new Map();
  private _sequence: number = 0;

  /**
   * Get the number of contexts in the store
   */
  get size(): number {
    return this._contexts.size;
  }

  /**
   * Create a new context bundle
   */
  create(params: ContextCreateParams): ContextBundle {
    const contextId = params.contextId ?? this.generateContextId();

    if (this._contexts.has(contextId)) {
      throw new ContextError(
        `Context already exists: ${contextId}`,
        'DUPLICATE_CONTEXT_ID'
      );
    }

    // Validate parent references
    if (params.parentRefs) {
      for (const parentRef of params.parentRefs) {
        if (!this._contexts.has(parentRef)) {
          throw new ContextError(
            `Parent context not found: ${parentRef}`,
            'PARENT_NOT_FOUND'
          );
        }
      }
    }

    const context: ContextBundle = {
      contextId,
      version: 1,
      who: params.who,
      what: params.what,
      when: params.when ?? { timestamp: Date.now() },
      where: params.where ?? { domain: 'system' },
      why: params.why ?? {},
      parentRefs: params.parentRefs,
      tags: params.tags ?? [],
    };

    this._contexts.set(contextId, context);
    this._versionHistory.set(contextId, [context]);

    return context;
  }

  /**
   * Get a context by ID
   *
   * This is the only way to resolve a context reference.
   * Invariant I5: context_ref resolves to a versioned context object.
   */
  resolve(contextRef: string): ContextBundle {
    const context = this._contexts.get(contextRef);
    if (!context) {
      throw new ContextError(
        `Context not found: ${contextRef}`,
        'CONTEXT_NOT_FOUND'
      );
    }
    return context;
  }

  /**
   * Check if a context exists
   */
  has(contextRef: string): boolean {
    return this._contexts.has(contextRef);
  }

  /**
   * Get a specific version of a context
   */
  getVersion(contextRef: string, version: number): ContextBundle | undefined {
    const history = this._versionHistory.get(contextRef);
    if (!history) return undefined;
    return history.find((c) => c.version === version);
  }

  /**
   * Get all versions of a context
   */
  getHistory(contextRef: string): readonly ContextBundle[] {
    return this._versionHistory.get(contextRef) ?? [];
  }

  /**
   * Update a context (creates new version)
   *
   * Contexts are versioned, not mutated.
   */
  update(contextRef: string, updates: ContextUpdateParams): ContextBundle {
    const existing = this.resolve(contextRef);
    const history = this._versionHistory.get(contextRef)!;

    const updated: ContextBundle = {
      ...existing,
      version: existing.version + 1,
      who: updates.who ?? existing.who,
      what: updates.what ?? existing.what,
      when: updates.when ?? existing.when,
      where: updates.where ?? existing.where,
      why: updates.why ?? existing.why,
      tags: updates.tags ?? existing.tags,
    };

    this._contexts.set(contextRef, updated);
    history.push(updated);

    return updated;
  }

  /**
   * Derive a new context from a parent
   *
   * This is used when a signal transforms and needs a new context
   * that inherits from the original.
   */
  derive(parentRef: string, params: ContextDeriveParams): ContextBundle {
    const parent = this.resolve(parentRef);
    const contextId = params.contextId ?? this.generateContextId();

    if (this._contexts.has(contextId)) {
      throw new ContextError(
        `Context already exists: ${contextId}`,
        'DUPLICATE_CONTEXT_ID'
      );
    }

    const context: ContextBundle = {
      contextId,
      version: 1,
      who: params.who ?? parent.who,
      what: params.what ?? parent.what,
      when: params.when ?? { ...parent.when, timestamp: Date.now() },
      where: params.where ?? parent.where,
      why: {
        ...parent.why,
        ...params.why,
        causeEventId: params.causeEventId ?? parent.why.causeEventId,
      },
      parentRefs: [parentRef, ...(parent.parentRefs ?? [])],
      tags: [...(parent.tags ?? []), ...(params.additionalTags ?? [])],
    };

    this._contexts.set(contextId, context);
    this._versionHistory.set(contextId, [context]);

    return context;
  }

  /**
   * Get all contexts
   */
  all(): readonly ContextBundle[] {
    return Array.from(this._contexts.values());
  }

  /**
   * Get contexts by tag
   */
  byTag(tag: string): ContextBundle[] {
    return Array.from(this._contexts.values()).filter((c) =>
      c.tags.includes(tag)
    );
  }

  /**
   * Get contexts by agent type
   */
  byAgentType(agentType: ContextAgent['type']): ContextBundle[] {
    return Array.from(this._contexts.values()).filter(
      (c) => c.who.type === agentType
    );
  }

  /**
   * Get contexts by domain
   */
  byDomain(domain: string): ContextBundle[] {
    return Array.from(this._contexts.values()).filter(
      (c) => c.where.domain === domain
    );
  }

  /**
   * Export store as JSON
   */
  toJSON(): ContextStoreSnapshot {
    return {
      version: '1.0',
      contexts: Array.from(this._contexts.entries()),
      versionHistory: Array.from(this._versionHistory.entries()),
      sequence: this._sequence,
      exportedAt: Date.now(),
    };
  }

  /**
   * Import from JSON snapshot
   */
  static fromJSON(snapshot: ContextStoreSnapshot): ContextStore {
    const store = new ContextStore();

    for (const [id, context] of snapshot.contexts) {
      store._contexts.set(id, context);
    }

    for (const [id, history] of snapshot.versionHistory) {
      store._versionHistory.set(id, history);
    }

    store._sequence = snapshot.sequence;

    return store;
  }

  /**
   * Generate a unique context ID
   */
  private generateContextId(): string {
    const seq = ++this._sequence;
    const timestamp = Date.now().toString(36);
    const seqHex = seq.toString(16).padStart(4, '0');
    return `CTX-${timestamp}-${seqHex}`;
  }
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export interface ContextCreateParams {
  contextId?: string;
  who: ContextAgent;
  what: ContextNature;
  when?: ContextTemporal;
  where?: ContextSpatial;
  why?: ContextCausal;
  parentRefs?: string[];
  tags?: string[];
}

export interface ContextUpdateParams {
  who?: ContextAgent;
  what?: ContextNature;
  when?: ContextTemporal;
  where?: ContextSpatial;
  why?: ContextCausal;
  tags?: string[];
}

export interface ContextDeriveParams {
  contextId?: string;
  who?: ContextAgent;
  what?: ContextNature;
  when?: ContextTemporal;
  where?: ContextSpatial;
  why?: ContextCausal;
  causeEventId?: string;
  additionalTags?: string[];
}

export interface ContextStoreSnapshot {
  version: string;
  contexts: [string, ContextBundle][];
  versionHistory: [string, ContextBundle[]][];
  sequence: number;
  exportedAt: number;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a system context for internal operations
 */
export function createSystemContext(
  store: ContextStore,
  params: { domain?: string; intent?: string; tags?: string[] } = {}
): ContextBundle {
  return store.create({
    who: { type: 'system', id: 'KERNEL', name: 'sema-metra--alchemica-mundi' },
    what: {
      signalType: 'command',
      domain: params.domain ?? 'system',
      intensity: 1.0,
      polarity: 'neutral',
    },
    when: { timestamp: Date.now() },
    where: { domain: params.domain ?? 'system' },
    why: { intent: params.intent ?? 'system operation' },
    tags: ['system', ...(params.tags ?? [])],
  });
}

/**
 * Create a user context for user-initiated signals
 */
export function createUserContext(
  store: ContextStore,
  params: {
    userId: string;
    signalType: SignalType;
    domain: string;
    intent?: string;
    tags?: string[];
  }
): ContextBundle {
  return store.create({
    who: { type: 'user', id: params.userId },
    what: {
      signalType: params.signalType,
      domain: params.domain,
      intensity: 1.0,
      polarity: 'neutral',
    },
    when: { timestamp: Date.now() },
    where: { domain: params.domain },
    why: { intent: params.intent ?? 'user request' },
    tags: ['user', ...(params.tags ?? [])],
  });
}

/**
 * Create a ritual context for ritual-triggered signals
 */
export function createRitualContext(
  store: ContextStore,
  params: {
    ritualName: string;
    domain: string;
    parentRef?: string;
    tags?: string[];
  }
): ContextBundle {
  if (params.parentRef) {
    return store.derive(params.parentRef, {
      who: { type: 'ritual', id: params.ritualName, name: params.ritualName },
      what: {
        signalType: 'ritual',
        domain: params.domain,
        intensity: 1.0,
        polarity: 'neutral',
      },
      why: { ritualName: params.ritualName },
      additionalTags: ['ritual', params.ritualName, ...(params.tags ?? [])],
    });
  }

  return store.create({
    who: { type: 'ritual', id: params.ritualName, name: params.ritualName },
    what: {
      signalType: 'ritual',
      domain: params.domain,
      intensity: 1.0,
      polarity: 'neutral',
    },
    when: { timestamp: Date.now() },
    where: { domain: params.domain },
    why: { ritualName: params.ritualName },
    tags: ['ritual', params.ritualName, ...(params.tags ?? [])],
  });
}

/**
 * Create a character context for character-driven signals
 */
export function createCharacterContext(
  store: ContextStore,
  params: {
    characterId: string;
    characterName: string;
    mythicTags: string[];
    domain: string;
    parentRef?: string;
  }
): ContextBundle {
  if (params.parentRef) {
    return store.derive(params.parentRef, {
      who: {
        type: 'character',
        id: params.characterId,
        name: params.characterName,
        mythicTags: params.mythicTags,
      },
      additionalTags: ['character', params.characterId, ...params.mythicTags],
    });
  }

  return store.create({
    who: {
      type: 'character',
      id: params.characterId,
      name: params.characterName,
      mythicTags: params.mythicTags,
    },
    what: {
      signalType: 'modulation',
      domain: params.domain,
      intensity: 1.0,
      polarity: 'neutral',
    },
    when: { timestamp: Date.now() },
    where: { domain: params.domain },
    why: { intent: `character influence: ${params.characterName}` },
    tags: ['character', params.characterId, ...params.mythicTags],
  });
}

/**
 * Create a genesis context for system initialization
 */
export function createGenesisContext(store: ContextStore): ContextBundle {
  return store.create({
    contextId: 'CTX-GENESIS',
    who: { type: 'system', id: 'GENESIS', name: 'primordial-signal' },
    what: {
      signalType: 'observation',
      domain: 'genesis',
      intensity: 1.0,
      polarity: 'neutral',
    },
    when: { timestamp: Date.now(), tick: 0 },
    where: { domain: 'genesis' },
    why: { intent: 'system genesis - primordial signal' },
    tags: ['genesis', 'system', 'primordial'],
  });
}
