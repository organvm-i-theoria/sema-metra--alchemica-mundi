/**
 * BridgeGate class - 2:1 mapping from dualities to binary locks
 * Each bridge connects 2 dualities to 1 binary gate
 */

import type { BridgeMapping, BinaryState } from './types.js';
import type { DualityRegistry } from './duality.js';
import type { BinaryRegistry } from './binary.js';

export interface BridgeEvaluationResult {
  pairId: string;
  dualityA: { id: number; value: number; passed: boolean };
  dualityB: { id: number; value: number; passed: boolean };
  binaryId: string;
  binaryState: BinaryState;
  binaryPassed: boolean;
  overallPassed: boolean;
  fusionScore: number;
}

export class BridgeGate {
  readonly pairId: string;
  readonly dualityAId: number;
  readonly dualityBId: number;
  readonly binaryId: string;
  readonly lockType: string;

  // Thresholds for duality evaluation (can be configured)
  private _thresholdA: number = 0;
  private _thresholdB: number = 0;
  private _requiredBinaryState: BinaryState = 'A';

  constructor(mapping: BridgeMapping) {
    this.pairId = mapping.pairId;
    this.dualityAId = mapping.dualityA;
    this.dualityBId = mapping.dualityB;
    this.binaryId = mapping.binaryId;
    this.lockType = mapping.lockType;
  }

  /**
   * Set the threshold for duality A evaluation
   */
  setThresholdA(threshold: number): this {
    this._thresholdA = threshold;
    return this;
  }

  /**
   * Set the threshold for duality B evaluation
   */
  setThresholdB(threshold: number): this {
    this._thresholdB = threshold;
    return this;
  }

  /**
   * Set both thresholds at once
   */
  setThresholds(thresholdA: number, thresholdB: number): this {
    this._thresholdA = thresholdA;
    this._thresholdB = thresholdB;
    return this;
  }

  /**
   * Set the required binary state for passing
   */
  setRequiredBinaryState(state: BinaryState): this {
    this._requiredBinaryState = state;
    return this;
  }

  /**
   * Get current thresholds
   */
  get thresholds(): { a: number; b: number } {
    return { a: this._thresholdA, b: this._thresholdB };
  }

  /**
   * Get required binary state
   */
  get requiredBinaryState(): BinaryState {
    return this._requiredBinaryState;
  }

  /**
   * Evaluate the bridge against the current system state
   */
  evaluate(
    dualityRegistry: DualityRegistry,
    binaryRegistry: BinaryRegistry
  ): BridgeEvaluationResult {
    const dualityA = dualityRegistry.get(this.dualityAId);
    const dualityB = dualityRegistry.get(this.dualityBId);
    const binary = binaryRegistry.get(this.binaryId);

    if (!dualityA || !dualityB || !binary) {
      throw new Error(
        `Bridge ${this.pairId} references missing components: ` +
          `D${this.dualityAId}, D${this.dualityBId}, ${this.binaryId}`
      );
    }

    const valueA = dualityA.value;
    const valueB = dualityB.value;
    const passedA = this.evaluateDuality(valueA, this._thresholdA);
    const passedB = this.evaluateDuality(valueB, this._thresholdB);
    const binaryPassed = binary.matches(this._requiredBinaryState);

    // Fusion score is the combined "alignment" of both dualities
    const fusionScore = this.calculateFusionScore(valueA, valueB);

    return {
      pairId: this.pairId,
      dualityA: { id: this.dualityAId, value: valueA, passed: passedA },
      dualityB: { id: this.dualityBId, value: valueB, passed: passedB },
      binaryId: this.binaryId,
      binaryState: binary.state,
      binaryPassed,
      overallPassed: passedA && passedB && binaryPassed,
      fusionScore,
    };
  }

  /**
   * Quick check if the bridge passes without full evaluation
   */
  passes(dualityRegistry: DualityRegistry, binaryRegistry: BinaryRegistry): boolean {
    return this.evaluate(dualityRegistry, binaryRegistry).overallPassed;
  }

  /**
   * Evaluate a single duality against a threshold
   * Default: passes if value meets or exceeds threshold
   */
  private evaluateDuality(value: number, threshold: number): boolean {
    if (threshold >= 0) {
      return value >= threshold;
    } else {
      return value <= threshold;
    }
  }

  /**
   * Calculate fusion score based on both duality values
   * Higher score = more aligned/intense combination
   */
  private calculateFusionScore(valueA: number, valueB: number): number {
    // Fusion score based on combined intensity and alignment
    const intensityA = Math.abs(valueA);
    const intensityB = Math.abs(valueB);
    const combinedIntensity = (intensityA + intensityB) / 2;

    // Check if polarities are aligned or opposed
    const aligned = Math.sign(valueA) === Math.sign(valueB) || valueA === 0 || valueB === 0;
    const alignmentBonus = aligned ? 0.2 : -0.2;

    return Math.max(0, Math.min(1, combinedIntensity + alignmentBonus));
  }

  /**
   * Create a formatted string representation
   */
  toString(): string {
    return `${this.pairId}: D${this.dualityAId}+D${this.dualityBId} → ${this.binaryId} [${this.lockType}]`;
  }

  /**
   * Export configuration for serialization
   */
  toJSON(): {
    pairId: string;
    thresholdA: number;
    thresholdB: number;
    requiredBinaryState: BinaryState;
  } {
    return {
      pairId: this.pairId,
      thresholdA: this._thresholdA,
      thresholdB: this._thresholdB,
      requiredBinaryState: this._requiredBinaryState,
    };
  }

  /**
   * Restore configuration from serialized data
   */
  fromJSON(data: { thresholdA?: number; thresholdB?: number; requiredBinaryState?: BinaryState }): this {
    if (data.thresholdA !== undefined) this._thresholdA = data.thresholdA;
    if (data.thresholdB !== undefined) this._thresholdB = data.thresholdB;
    if (data.requiredBinaryState !== undefined) this._requiredBinaryState = data.requiredBinaryState;
    return this;
  }
}

/**
 * BridgeRegistry - Manages all 32 bridge mappings
 */
export class BridgeRegistry {
  private bridges: Map<string, BridgeGate> = new Map();

  constructor(mappings: BridgeMapping[]) {
    for (const mapping of mappings) {
      this.bridges.set(mapping.pairId, new BridgeGate(mapping));
    }
  }

  /**
   * Get a bridge by pair ID
   */
  get(pairId: string): BridgeGate | undefined {
    return this.bridges.get(pairId);
  }

  /**
   * Get a bridge by pair ID, throwing if not found
   */
  getOrThrow(pairId: string): BridgeGate {
    const bridge = this.bridges.get(pairId);
    if (!bridge) {
      throw new Error(`Bridge ${pairId} not found`);
    }
    return bridge;
  }

  /**
   * Get all bridges
   */
  all(): BridgeGate[] {
    return Array.from(this.bridges.values());
  }

  /**
   * Find bridges that include a specific duality
   */
  byDuality(dualityId: number): BridgeGate[] {
    return this.all().filter(
      (b) => b.dualityAId === dualityId || b.dualityBId === dualityId
    );
  }

  /**
   * Find bridges that use a specific binary
   */
  byBinary(binaryId: string): BridgeGate[] {
    return this.all().filter((b) => b.binaryId === binaryId);
  }

  /**
   * Find bridge by lock type
   */
  byLockType(lockType: string): BridgeGate[] {
    return this.all().filter((b) => b.lockType === lockType);
  }

  /**
   * Evaluate all bridges and return results
   */
  evaluateAll(
    dualityRegistry: DualityRegistry,
    binaryRegistry: BinaryRegistry
  ): BridgeEvaluationResult[] {
    return this.all().map((bridge) => bridge.evaluate(dualityRegistry, binaryRegistry));
  }

  /**
   * Get all bridges that currently pass
   */
  allPassing(
    dualityRegistry: DualityRegistry,
    binaryRegistry: BinaryRegistry
  ): BridgeGate[] {
    return this.all().filter((bridge) => bridge.passes(dualityRegistry, binaryRegistry));
  }

  /**
   * Get all bridges that currently fail
   */
  allFailing(
    dualityRegistry: DualityRegistry,
    binaryRegistry: BinaryRegistry
  ): BridgeGate[] {
    return this.all().filter((bridge) => !bridge.passes(dualityRegistry, binaryRegistry));
  }

  /**
   * Export all configurations for serialization
   */
  toJSON(): Record<string, { thresholdA: number; thresholdB: number; requiredBinaryState: BinaryState }> {
    const result: Record<string, { thresholdA: number; thresholdB: number; requiredBinaryState: BinaryState }> = {};
    for (const [id, bridge] of this.bridges) {
      result[id] = bridge.toJSON();
    }
    return result;
  }

  /**
   * Restore configurations from serialized data
   */
  fromJSON(
    data: Record<string, { thresholdA?: number; thresholdB?: number; requiredBinaryState?: BinaryState }>
  ): this {
    for (const [id, config] of Object.entries(data)) {
      const bridge = this.bridges.get(id);
      if (bridge) {
        bridge.fromJSON(config);
      }
    }
    return this;
  }

  /**
   * Get the count of bridges
   */
  get size(): number {
    return this.bridges.size;
  }
}
