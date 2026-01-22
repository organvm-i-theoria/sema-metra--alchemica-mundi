/**
 * SEMA_LOG - Canonical Event Log
 *
 * The event store becomes the spine. All state must be derivable from
 * an append-only event stream.
 *
 * Rule A: No empty boot. If event_log has zero events, the system cannot render tables.
 * Rule B: Append-only. Any "change" is a new event that references prior events.
 *
 * Invariant I1: event_log.length > 0 before any state projection is accepted.
 * Invariant I2: events are immutable once committed.
 * Invariant I3: state_hash == hash(replay(event_log, projection_version))
 */

import { createHash } from 'crypto';
import type {
  SpineEvent,
  SpineEventType,
  SpineEventPayload,
  ContextBundle,
  CostVector,
  GenesisSignalPayload,
} from './types.js';

// ============================================================================
// EVENT LOG ERRORS
// ============================================================================

export class EventLogError extends Error {
  constructor(
    message: string,
    public readonly code: EventLogErrorCode
  ) {
    super(message);
    this.name = 'EventLogError';
  }
}

export type EventLogErrorCode =
  | 'EMPTY_BOOT'              // Rule A violated
  | 'MUTATION_ATTEMPTED'      // Rule B violated
  | 'NO_GENESIS'              // I1 violated
  | 'CONTEXT_MISSING'         // C7 violated
  | 'INVALID_SEQUENCE'
  | 'DUPLICATE_EVENT_ID'
  | 'INVALID_REFERENCE';

// ============================================================================
// EVENT LOG CLASS
// ============================================================================

/**
 * Append-only immutable event log.
 *
 * The system can delete every derived artifact and reconstruct state from the log.
 */
export class EventLog {
  private readonly _events: SpineEvent[] = [];
  private readonly _eventIndex: Map<string, number> = new Map();
  private _sequence: number = 0;
  private _genesisReceived: boolean = false;
  private _frozen: boolean = false;

  /**
   * Check if the log has received a genesis signal
   *
   * Rule A: No empty boot. The system cannot render tables without genesis.
   */
  get hasGenesis(): boolean {
    return this._genesisReceived;
  }

  /**
   * Get the current sequence number
   */
  get currentSequence(): number {
    return this._sequence;
  }

  /**
   * Get the number of events in the log
   */
  get length(): number {
    return this._events.length;
  }

  /**
   * Check if the log is empty (violates I1)
   */
  get isEmpty(): boolean {
    return this._events.length === 0;
  }

  /**
   * Append a genesis signal - REQUIRED before any other events
   *
   * Invariant I1: event_log.length > 0 before any state projection is accepted.
   */
  appendGenesis(
    payload: GenesisSignalPayload,
    context: ContextBundle
  ): SpineEvent<'genesis:signal'> {
    if (this._genesisReceived) {
      throw new EventLogError(
        'Genesis signal already received. Cannot re-genesis.',
        'DUPLICATE_EVENT_ID'
      );
    }

    const event = this.createEvent('genesis:signal', payload, context);
    this._genesisReceived = true;
    return event as SpineEvent<'genesis:signal'>;
  }

  /**
   * Append an event to the log
   *
   * Rule B: Append-only. Any "change" is a new event that references prior events.
   * Invariant I2: events are immutable once committed.
   */
  append<T extends SpineEventType>(
    type: T,
    payload: SpineEventPayload<T>,
    context: ContextBundle,
    options: AppendOptions = {}
  ): SpineEvent<T> {
    // Enforce genesis requirement (except for genesis itself)
    if (type !== 'genesis:signal' && !this._genesisReceived) {
      throw new EventLogError(
        'Cannot append events before genesis signal. System requires at least one interpretable signal event.',
        'NO_GENESIS'
      );
    }

    return this.createEvent(type, payload, context, options) as SpineEvent<T>;
  }

  /**
   * Internal event creation and commit
   */
  private createEvent<T extends SpineEventType>(
    type: T,
    payload: SpineEventPayload<T>,
    context: ContextBundle,
    options: AppendOptions = {}
  ): SpineEvent<T> {
    if (this._frozen) {
      throw new EventLogError(
        'Event log is frozen. Cannot append.',
        'MUTATION_ATTEMPTED'
      );
    }

    // Validate context reference (C7)
    if (!context.contextId) {
      throw new EventLogError(
        'Context bundle required. No module can consume a signal without its context reference.',
        'CONTEXT_MISSING'
      );
    }

    // Validate reference integrity
    if (options.supersedesRef && !this._eventIndex.has(options.supersedesRef)) {
      throw new EventLogError(
        `Invalid supersedes reference: ${options.supersedesRef}`,
        'INVALID_REFERENCE'
      );
    }
    if (options.causeRef && !this._eventIndex.has(options.causeRef)) {
      throw new EventLogError(
        `Invalid cause reference: ${options.causeRef}`,
        'INVALID_REFERENCE'
      );
    }

    const sequence = ++this._sequence;
    const timestamp = options.timestamp ?? Date.now();
    const eventId = options.eventId ?? this.generateEventId(type, sequence);

    // Check for duplicate
    if (this._eventIndex.has(eventId)) {
      throw new EventLogError(
        `Duplicate event ID: ${eventId}`,
        'DUPLICATE_EVENT_ID'
      );
    }

    const event: SpineEvent<T> = {
      eventId,
      type,
      timestamp,
      sequence,
      contextRef: context.contextId,
      payload,
      cost: options.cost,
      supersedesRef: options.supersedesRef,
      causeRef: options.causeRef,
    };

    // Compute hash for integrity
    (event as SpineEvent<T>).hash = this.computeHash(event);

    // Commit to log (immutable once committed)
    this._events.push(Object.freeze(event) as SpineEvent<T>);
    this._eventIndex.set(eventId, this._events.length - 1);

    return event;
  }

  /**
   * Get an event by ID
   */
  get(eventId: string): SpineEvent | undefined {
    const index = this._eventIndex.get(eventId);
    if (index === undefined) return undefined;
    return this._events[index];
  }

  /**
   * Get an event by sequence number
   */
  getBySequence(sequence: number): SpineEvent | undefined {
    return this._events.find((e) => e.sequence === sequence);
  }

  /**
   * Get events by type
   */
  getByType<T extends SpineEventType>(type: T): SpineEvent<T>[] {
    return this._events.filter((e) => e.type === type) as SpineEvent<T>[];
  }

  /**
   * Get events in a sequence range
   */
  getRange(fromSequence: number, toSequence: number): SpineEvent[] {
    return this._events.filter(
      (e) => e.sequence >= fromSequence && e.sequence <= toSequence
    );
  }

  /**
   * Get all events (readonly)
   */
  all(): readonly SpineEvent[] {
    return this._events;
  }

  /**
   * Get events caused by a specific event
   */
  getCaused(eventId: string): SpineEvent[] {
    return this._events.filter((e) => e.causeRef === eventId);
  }

  /**
   * Get the event chain (cause -> effect -> effect -> ...)
   */
  getChain(eventId: string, direction: 'forward' | 'backward' = 'forward'): SpineEvent[] {
    const chain: SpineEvent[] = [];
    let current = this.get(eventId);

    if (!current) return chain;

    if (direction === 'backward') {
      // Walk back through causes
      while (current) {
        chain.unshift(current);
        current = current.causeRef ? this.get(current.causeRef) : undefined;
      }
    } else {
      // Walk forward through effects
      const visited = new Set<string>();
      const queue = [current];

      while (queue.length > 0) {
        current = queue.shift()!;
        if (visited.has(current.eventId)) continue;
        visited.add(current.eventId);
        chain.push(current);
        queue.push(...this.getCaused(current.eventId));
      }
    }

    return chain;
  }

  /**
   * Replay the event log to compute state
   *
   * Invariant I3: state_hash == hash(replay(event_log, projection_version))
   */
  replay<S>(
    projector: EventProjector<S>,
    initialState: S,
    options: ReplayOptions = {}
  ): ReplayResult<S> {
    // Enforce I1: cannot replay empty log
    if (this.isEmpty) {
      throw new EventLogError(
        'Cannot replay empty event log. Genesis required.',
        'EMPTY_BOOT'
      );
    }

    let state = initialState;
    const fromSeq = options.fromSequence ?? 1;
    const toSeq = options.toSequence ?? this._sequence;

    for (const event of this._events) {
      if (event.sequence < fromSeq) continue;
      if (event.sequence > toSeq) break;

      state = projector(state, event);
    }

    const stateHash = this.computeStateHash(state);

    return {
      state,
      stateHash,
      projectionVersion: options.projectionVersion ?? 'v1.0',
      eventRange: { from: fromSeq, to: toSeq },
      eventCount: this._events.filter(
        (e) => e.sequence >= fromSeq && e.sequence <= toSeq
      ).length,
    };
  }

  /**
   * Freeze the log (no more appends allowed)
   */
  freeze(): void {
    this._frozen = true;
  }

  /**
   * Check if the log is frozen
   */
  get isFrozen(): boolean {
    return this._frozen;
  }

  /**
   * Export the log as JSON (for persistence)
   */
  toJSON(): EventLogSnapshot {
    return {
      version: '1.0',
      sequence: this._sequence,
      genesisReceived: this._genesisReceived,
      events: this._events.map((e) => ({ ...e })),
      exportedAt: Date.now(),
    };
  }

  /**
   * Import from JSON snapshot
   */
  static fromJSON(snapshot: EventLogSnapshot): EventLog {
    const log = new EventLog();

    for (const event of snapshot.events) {
      // Bypass normal append to restore exact state
      (log as unknown as { _events: SpineEvent[] })._events.push(
        Object.freeze(event)
      );
      log._eventIndex.set(event.eventId, log._events.length - 1);
    }

    log._sequence = snapshot.sequence;
    log._genesisReceived = snapshot.genesisReceived;

    return log;
  }

  /**
   * Generate a unique event ID
   */
  private generateEventId(type: SpineEventType, sequence: number): string {
    const typePart = type.split(':')[0] ?? 'EVT';
    const typePrefix = typePart.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36);
    const seqHex = sequence.toString(16).padStart(6, '0');
    return `${typePrefix}-${timestamp}-${seqHex}`;
  }

  /**
   * Compute hash for event integrity
   */
  private computeHash(event: Omit<SpineEvent, 'hash'>): string {
    const data = JSON.stringify({
      eventId: event.eventId,
      type: event.type,
      timestamp: event.timestamp,
      sequence: event.sequence,
      contextRef: event.contextRef,
      payload: event.payload,
      cost: event.cost,
      supersedesRef: event.supersedesRef,
      causeRef: event.causeRef,
    });
    return createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Compute state hash for projection verification
   */
  private computeStateHash(state: unknown): string {
    const data = JSON.stringify(state);
    return createHash('sha256').update(data).digest('hex');
  }
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export interface AppendOptions {
  eventId?: string;
  timestamp?: number;
  cost?: CostVector;
  supersedesRef?: string;
  causeRef?: string;
}

export type EventProjector<S> = (state: S, event: SpineEvent) => S;

export interface ReplayOptions {
  fromSequence?: number;
  toSequence?: number;
  projectionVersion?: string;
}

export interface ReplayResult<S> {
  state: S;
  stateHash: string;
  projectionVersion: string;
  eventRange: { from: number; to: number };
  eventCount: number;
}

export interface EventLogSnapshot {
  version: string;
  sequence: number;
  genesisReceived: boolean;
  events: SpineEvent[];
  exportedAt: number;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a new event log with genesis signal
 *
 * This is the preferred way to initialize a system.
 * A system cannot be initialized as an empty container.
 */
export function createEventLog(
  genesisPayload: GenesisSignalPayload,
  genesisContext: ContextBundle
): EventLog {
  const log = new EventLog();
  log.appendGenesis(genesisPayload, genesisContext);
  return log;
}

/**
 * Create an empty event log (for testing only)
 *
 * WARNING: This violates Rule A. Only use for testing scenarios
 * where you need to control genesis timing.
 */
export function createEmptyEventLog(): EventLog {
  return new EventLog();
}
