/**
 * SemaMetra - Main container class for the Dualcore Spectral Matrix
 * sēma-mētra--alchemica-mundi: Signal-Matrix for World-Alchemy
 *
 * Kernel Law: Signals generate the matrix; the matrix transmutes signals;
 * and every transmutation rewrites the conditions of the world that will
 * interpret the next signal.
 */

import type {
  DualityDefinition,
  BinaryDefinition,
  HybridDefinition,
  BridgeMapping,
  BinaryState,
  HybridCondition,
  SystemEvent,
  SystemEventType,
  SystemEventListener,
  SystemState,
  AffectorConfig,
  LFOConfig,
  RitualResult,
} from './types.js';
import { Duality, DualityRegistry } from './duality.js';
import { BinaryGate, BinaryRegistry } from './binary.js';
import { HybridToggle, HybridRegistry } from './hybrid.js';
import { BridgeGate, BridgeRegistry, type BridgeEvaluationResult } from './bridge.js';
import type { Spine, ContextBundle, CostVector } from '../spine/index.js';
import { TRANSFORM_COSTS } from '../spine/index.js';

export interface SemaMetraConfig {
  dualities: DualityDefinition[];
  binaries: BinaryDefinition[];
  hybrids: HybridDefinition[];
  bridges: BridgeMapping[];
  /** Optional spine for axiom-compliant operation */
  spine?: Spine;
}

export class SemaMetra {
  private _dualities: DualityRegistry;
  private _binaries: BinaryRegistry;
  private _hybrids: HybridRegistry;
  private _bridges: BridgeRegistry;

  private _activeAffectors: AffectorConfig[] = [];
  private _activeLFOs: Map<number, LFOConfig> = new Map();
  private _lastRitualResult: RitualResult | null = null;

  private _eventListeners: Map<SystemEventType, Set<SystemEventListener>> = new Map();
  private _tickInterval: ReturnType<typeof setInterval> | null = null;
  private _tickRate: number = 60; // Hz

  /**
   * Optional spine for axiom-compliant operation.
   * When attached, all transforms emit spine events and cost vectors.
   */
  private _spine: Spine | null = null;

  /**
   * Current operation context (for spine events)
   */
  private _currentContext: ContextBundle | null = null;

  constructor(config: SemaMetraConfig) {
    this._dualities = new DualityRegistry(config.dualities);
    this._binaries = new BinaryRegistry(config.binaries);
    this._hybrids = new HybridRegistry(config.hybrids);
    this._bridges = new BridgeRegistry(config.bridges);

    // Attach spine if provided
    if (config.spine) {
      this.attachSpine(config.spine);
    }
  }

  // ========================================
  // Spine Integration
  // ========================================

  /**
   * Attach a spine for axiom-compliant operation.
   *
   * Once attached, all state changes emit spine events with:
   * - Context references (Rule C)
   * - Cost vectors (Rule E)
   * - Transform validation (Rule D)
   * - World-binding commits (Rule F)
   */
  attachSpine(spine: Spine): this {
    this._spine = spine;
    return this;
  }

  /**
   * Detach the spine (reverts to non-axiom mode)
   */
  detachSpine(): this {
    this._spine = null;
    this._currentContext = null;
    return this;
  }

  /**
   * Get the attached spine (if any)
   */
  get spine(): Spine | null {
    return this._spine;
  }

  /**
   * Check if operating in axiom-compliant mode
   */
  get isAxiomCompliant(): boolean {
    return this._spine !== null;
  }

  /**
   * Set the current operation context.
   *
   * All subsequent operations will use this context until changed.
   * Required for spine operations (Rule C: Context is First-Class).
   */
  setContext(context: ContextBundle): this {
    this._currentContext = context;
    return this;
  }

  /**
   * Get the current operation context
   */
  get currentContext(): ContextBundle | null {
    return this._currentContext;
  }

  /**
   * Create a derived context for an operation
   */
  deriveContext(params: { domain?: string; intent?: string; tags?: string[] }): ContextBundle | null {
    if (!this._spine || !this._currentContext) return null;

    return this._spine.contextStore.derive(this._currentContext.contextId, {
      what: {
        signalType: 'modulation',
        domain: params.domain ?? this._currentContext.what.domain,
        intensity: 1.0,
        polarity: 'neutral',
      },
      why: { intent: params.intent ?? 'matrix operation' },
      additionalTags: params.tags,
    });
  }

  /**
   * Get or create a context for operations
   */
  private getOperationContext(domain: string): ContextBundle | null {
    if (!this._spine) return null;

    if (this._currentContext) {
      return this.deriveContext({ domain });
    }

    // Create a system context if none set
    return this._spine.contextStore.create({
      who: { type: 'system', id: 'MATRIX', name: 'sema-metra' },
      what: {
        signalType: 'modulation',
        domain,
        intensity: 1.0,
        polarity: 'neutral',
      },
      when: { timestamp: Date.now() },
      where: { domain },
      why: { intent: 'matrix operation' },
      tags: ['matrix', 'auto-context'],
    });
  }

  /**
   * Emit a transform to the spine (if attached)
   */
  private emitSpineTransform(
    transformType: string,
    inputState: unknown,
    outputState: unknown,
    domain: string,
    cost: CostVector
  ): void {
    if (!this._spine) return;

    const context = this.getOperationContext(domain);
    if (!context) return;

    try {
      this._spine.transform.validateAndApply(
        transformType,
        inputState,
        outputState,
        context,
        context,
        { explicitCost: cost }
      );
    } catch (e) {
      // Log transform validation failures but don't block operation
      console.warn(`Spine transform validation failed: ${e}`);
    }
  }

  // ========================================
  // Duality Access
  // ========================================

  /**
   * Get the duality registry
   */
  get dualities(): DualityRegistry {
    return this._dualities;
  }

  /**
   * Get a specific duality by ID
   */
  duality(id: number): Duality {
    return this._dualities.getOrThrow(id);
  }

  /**
   * Set a duality value
   *
   * When spine is attached, this emits a transform event with cost vector.
   */
  setDuality(id: number, value: number): this {
    const duality = this._dualities.getOrThrow(id);
    const oldValue = duality.value;
    duality.set(value);

    if (oldValue !== duality.value) {
      this.emit('duality:changed', { id, oldValue, newValue: duality.value });

      // Emit spine transform (Rule D, E)
      this.emitSpineTransform(
        'duality:set',
        { id, value: oldValue },
        { id, value: duality.value },
        duality.domain,
        TRANSFORM_COSTS.DUALITY_MODULATION
      );
    }

    return this;
  }

  /**
   * Modulate a duality by adding a delta
   *
   * When spine is attached, this emits a transform event with cost vector.
   */
  modulateDuality(id: number, delta: number): this {
    const duality = this._dualities.getOrThrow(id);
    const oldValue = duality.value;
    duality.modulate(delta);

    if (oldValue !== duality.value) {
      this.emit('duality:changed', { id, oldValue, newValue: duality.value });

      // Emit spine transform (Rule D, E)
      this.emitSpineTransform(
        'duality:modulate',
        { id, value: oldValue, delta },
        { id, value: duality.value },
        duality.domain,
        TRANSFORM_COSTS.DUALITY_MODULATION
      );
    }

    return this;
  }

  // ========================================
  // Binary Access
  // ========================================

  /**
   * Get the binary registry
   */
  get binaries(): BinaryRegistry {
    return this._binaries;
  }

  /**
   * Get a specific binary gate by ID
   */
  binary(id: string): BinaryGate {
    return this._binaries.getOrThrow(id);
  }

  /**
   * Toggle a binary gate
   *
   * When spine is attached, this emits a transform event with cost vector.
   */
  toggleBinary(id: string): this {
    const gate = this._binaries.getOrThrow(id);
    const oldState = gate.state;
    gate.toggle();

    if (oldState !== gate.state) {
      this.emit('binary:toggled', { id, oldState, newState: gate.state });

      // Emit spine transform (Rule D, E)
      this.emitSpineTransform(
        'binary:toggle',
        { id, state: oldState },
        { id, state: gate.state },
        gate.domain,
        TRANSFORM_COSTS.BINARY_TOGGLE
      );
    }

    return this;
  }

  /**
   * Set a binary gate to a specific state
   *
   * When spine is attached, this emits a transform event with cost vector.
   */
  setBinary(id: string, state: BinaryState): this {
    const gate = this._binaries.getOrThrow(id);
    const oldState = gate.state;

    if (state === 'A') {
      gate.setA();
    } else {
      gate.setB();
    }

    if (oldState !== gate.state) {
      this.emit('binary:toggled', { id, oldState, newState: gate.state });

      // Emit spine transform (Rule D, E)
      this.emitSpineTransform(
        'binary:set',
        { id, state: oldState },
        { id, state: gate.state },
        gate.domain,
        TRANSFORM_COSTS.BINARY_TOGGLE
      );
    }

    return this;
  }

  // ========================================
  // Hybrid Access
  // ========================================

  /**
   * Get the hybrid registry
   */
  get hybrids(): HybridRegistry {
    return this._hybrids;
  }

  /**
   * Get a specific hybrid toggle by ID
   */
  hybrid(id: string): HybridToggle {
    return this._hybrids.getOrThrow(id);
  }

  /**
   * Set a hybrid toggle condition
   *
   * When spine is attached, this emits a transform event with cost vector.
   */
  setHybrid(id: string, condition: 'A' | 'B'): this {
    const toggle = this._hybrids.getOrThrow(id);
    const oldCondition = toggle.condition;

    if (condition === 'A') {
      toggle.setA();
    } else {
      toggle.setB();
    }

    if (oldCondition !== toggle.condition) {
      this.emit('hybrid:transitioned', { id, oldCondition, newCondition: toggle.condition });

      // Emit spine transform (Rule D, E)
      this.emitSpineTransform(
        'hybrid:set',
        { id, condition: oldCondition },
        { id, condition: toggle.condition },
        toggle.mode,
        TRANSFORM_COSTS.HYBRID_TRANSITION
      );
    }

    return this;
  }

  /**
   * Begin transitioning a hybrid toggle
   *
   * When spine is attached, this emits a transform event with cost vector.
   */
  transitionHybrid(id: string): this {
    const toggle = this._hybrids.getOrThrow(id);
    const oldCondition = toggle.condition;
    toggle.beginTransition();

    // Emit spine transform for transition start (Rule D, E)
    this.emitSpineTransform(
      'hybrid:begin_transition',
      { id, condition: oldCondition },
      { id, condition: 'transitioning' },
      toggle.mode,
      TRANSFORM_COSTS.HYBRID_TRANSITION
    );

    return this;
  }

  // ========================================
  // Bridge Access
  // ========================================

  /**
   * Get the bridge registry
   */
  get bridges(): BridgeRegistry {
    return this._bridges;
  }

  /**
   * Get a specific bridge by pair ID
   */
  bridge(pairId: string): BridgeGate {
    return this._bridges.getOrThrow(pairId);
  }

  /**
   * Evaluate a bridge
   */
  evaluateBridge(pairId: string): BridgeEvaluationResult {
    const bridge = this._bridges.getOrThrow(pairId);
    return bridge.evaluate(this._dualities, this._binaries);
  }

  /**
   * Evaluate all bridges
   */
  evaluateAllBridges(): BridgeEvaluationResult[] {
    return this._bridges.evaluateAll(this._dualities, this._binaries);
  }

  // ========================================
  // Modulation
  // ========================================

  /**
   * Get active affectors
   */
  get activeAffectors(): AffectorConfig[] {
    return [...this._activeAffectors];
  }

  /**
   * Add an affector
   */
  addAffector(affector: AffectorConfig): this {
    this._activeAffectors.push(affector);
    return this;
  }

  /**
   * Remove an affector by ID
   */
  removeAffector(id: string): this {
    this._activeAffectors = this._activeAffectors.filter((a) => a.id !== id);
    return this;
  }

  /**
   * Clear all affectors
   */
  clearAffectors(): this {
    this._activeAffectors = [];
    return this;
  }

  /**
   * Get active LFOs
   */
  get activeLFOs(): Map<number, LFOConfig> {
    return new Map(this._activeLFOs);
  }

  /**
   * Attach an LFO to a duality
   */
  attachLFO(dualityId: number, config: LFOConfig): this {
    this._activeLFOs.set(dualityId, config);
    return this;
  }

  /**
   * Detach an LFO from a duality
   */
  detachLFO(dualityId: number): this {
    this._activeLFOs.delete(dualityId);
    return this;
  }

  /**
   * Clear all LFOs
   */
  clearLFOs(): this {
    this._activeLFOs.clear();
    return this;
  }

  // ========================================
  // Tick System
  // ========================================

  /**
   * Start the modulation tick system
   */
  startTick(rate: number = 60): this {
    this._tickRate = rate;
    if (this._tickInterval) {
      clearInterval(this._tickInterval);
    }

    this._tickInterval = setInterval(() => {
      this.tick();
    }, 1000 / this._tickRate);

    return this;
  }

  /**
   * Stop the tick system
   */
  stopTick(): this {
    if (this._tickInterval) {
      clearInterval(this._tickInterval);
      this._tickInterval = null;
    }
    return this;
  }

  /**
   * Perform a single modulation tick
   */
  tick(): this {
    const now = Date.now();

    // Apply LFO modulations
    for (const [dualityId, lfoConfig] of this._activeLFOs) {
      const duality = this._dualities.get(dualityId);
      if (duality && !duality.locked) {
        const wave = this.calculateLFOWave(lfoConfig, now);
        duality.modulate(wave * 0.01); // Small per-tick modulation
      }
    }

    // Update hybrid transitions
    this._hybrids.tickTransitions(0.01);

    this.emit('modulation:tick', { timestamp: now });

    return this;
  }

  /**
   * Calculate LFO wave value at current time
   */
  private calculateLFOWave(config: LFOConfig, time: number): number {
    const phase = ((time * config.frequency) / 1000 + config.phase) % 1;

    let wave: number;
    switch (config.shape) {
      case 'sine':
        wave = Math.sin(phase * Math.PI * 2);
        break;
      case 'saw':
        wave = phase * 2 - 1;
        break;
      case 'square':
        wave = phase < 0.5 ? 1 : -1;
        break;
      case 'step':
        wave = Math.floor(phase * 4) / 2 - 1;
        break;
      case 'random':
        wave = Math.random() * 2 - 1;
        break;
      case 'moon_phase':
        // Simulate moon phase cycle (slow sine over ~29.5 day cycle)
        const moonCycle = 29.5 * 24 * 60 * 60 * 1000;
        wave = Math.sin((time / moonCycle) * Math.PI * 2);
        break;
      default:
        wave = 0;
    }

    return wave * config.amplitude;
  }

  // ========================================
  // State Management
  // ========================================

  /**
   * Get the last ritual result
   */
  get lastRitualResult(): RitualResult | null {
    return this._lastRitualResult;
  }

  /**
   * Set the last ritual result (used by ritual engine)
   */
  setLastRitualResult(result: RitualResult): this {
    this._lastRitualResult = result;
    return this;
  }

  /**
   * Get a snapshot of the current system state
   */
  getState(): SystemState {
    const dualityMap = new Map<number, number>();
    for (const d of this._dualities.all()) {
      dualityMap.set(d.id, d.value);
    }

    const binaryMap = new Map<string, BinaryState>();
    for (const b of this._binaries.all()) {
      binaryMap.set(b.id, b.state);
    }

    const hybridMap = new Map<string, HybridCondition>();
    for (const h of this._hybrids.all()) {
      hybridMap.set(h.id, h.condition);
    }

    return {
      timestamp: Date.now(),
      dualities: dualityMap,
      binaries: binaryMap,
      hybrids: hybridMap,
      activeAffectors: [...this._activeAffectors],
      activeLFOs: new Map(this._activeLFOs),
      lastRitualResult: this._lastRitualResult,
    };
  }

  /**
   * Reset the entire system to initial state
   */
  reset(): this {
    this._dualities.resetAll();
    this._binaries.resetAll();
    this._hybrids.resetAll();
    this._activeAffectors = [];
    this._activeLFOs.clear();
    this._lastRitualResult = null;
    return this;
  }

  // ========================================
  // Serialization
  // ========================================

  /**
   * Export the system state for serialization
   */
  toJSON(): {
    dualities: Record<number, { value: number; locked: boolean }>;
    binaries: Record<string, { state: BinaryState; locked: boolean }>;
    hybrids: Record<string, { condition: HybridCondition; transitionProgress: number }>;
    bridges: Record<string, { thresholdA: number; thresholdB: number; requiredBinaryState: BinaryState }>;
    affectors: AffectorConfig[];
    lfos: Array<[number, LFOConfig]>;
  } {
    return {
      dualities: this._dualities.toJSON(),
      binaries: this._binaries.toJSON(),
      hybrids: this._hybrids.toJSON(),
      bridges: this._bridges.toJSON(),
      affectors: this._activeAffectors,
      lfos: Array.from(this._activeLFOs.entries()),
    };
  }

  /**
   * Restore system state from serialized data
   */
  fromJSON(data: {
    dualities?: Record<number, { value: number; locked?: boolean }>;
    binaries?: Record<string, { state: BinaryState; locked?: boolean }>;
    hybrids?: Record<string, { condition: HybridCondition; transitionProgress?: number }>;
    bridges?: Record<string, { thresholdA?: number; thresholdB?: number; requiredBinaryState?: BinaryState }>;
    affectors?: AffectorConfig[];
    lfos?: Array<[number, LFOConfig]>;
  }): this {
    if (data.dualities) this._dualities.fromJSON(data.dualities);
    if (data.binaries) this._binaries.fromJSON(data.binaries);
    if (data.hybrids) this._hybrids.fromJSON(data.hybrids);
    if (data.bridges) this._bridges.fromJSON(data.bridges);
    if (data.affectors) this._activeAffectors = data.affectors;
    if (data.lfos) this._activeLFOs = new Map(data.lfos);
    return this;
  }

  // ========================================
  // Event System
  // ========================================

  /**
   * Subscribe to system events
   */
  on(eventType: SystemEventType, listener: SystemEventListener): this {
    if (!this._eventListeners.has(eventType)) {
      this._eventListeners.set(eventType, new Set());
    }
    this._eventListeners.get(eventType)!.add(listener);
    return this;
  }

  /**
   * Unsubscribe from system events
   */
  off(eventType: SystemEventType, listener: SystemEventListener): this {
    this._eventListeners.get(eventType)?.delete(listener);
    return this;
  }

  /**
   * Emit a system event
   */
  private emit(eventType: SystemEventType, data: unknown): void {
    const event: SystemEvent = {
      type: eventType,
      timestamp: Date.now(),
      data,
    };

    const listeners = this._eventListeners.get(eventType);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (e) {
          console.error(`Error in event listener for ${eventType}:`, e);
        }
      }
    }
  }

  /**
   * Emit a public event (for use by external engines)
   */
  emitEvent(eventType: SystemEventType, data: unknown): void {
    this.emit(eventType, data);
  }
}
