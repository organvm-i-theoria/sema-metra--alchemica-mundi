/**
 * Ritual condition evaluators
 * Evaluate duality, binary, and hybrid conditions for rituals
 */

import type { RitualCondition, BinaryState, HybridCondition } from '../core/types.js';
import type { SemaMetra } from '../core/system.js';

export interface ConditionResult {
  condition: RitualCondition;
  passed: boolean;
  actualValue: number | string | boolean;
  message: string;
}

/**
 * Evaluate a single ritual condition
 */
export function evaluateCondition(
  condition: RitualCondition,
  matrix: SemaMetra
): ConditionResult {
  switch (condition.type) {
    case 'duality':
      return evaluateDualityCondition(condition, matrix);
    case 'binary':
      return evaluateBinaryCondition(condition, matrix);
    case 'hybrid':
      return evaluateHybridCondition(condition, matrix);
    default:
      return {
        condition,
        passed: false,
        actualValue: 'unknown',
        message: `Unknown condition type: ${(condition as RitualCondition).type}`,
      };
  }
}

/**
 * Evaluate a duality condition
 */
function evaluateDualityCondition(
  condition: RitualCondition,
  matrix: SemaMetra
): ConditionResult {
  const dualityId = condition.id as number;
  const duality = matrix.dualities.get(dualityId);

  if (!duality) {
    return {
      condition,
      passed: false,
      actualValue: 'undefined',
      message: `Duality ${dualityId} not found`,
    };
  }

  const actualValue = duality.value;
  const targetValue = condition.value as number;
  let passed = false;

  switch (condition.operator) {
    case '=':
      passed = Math.abs(actualValue - targetValue) < 0.1; // Allow small tolerance
      break;
    case '>':
      passed = actualValue > targetValue;
      break;
    case '<':
      passed = actualValue < targetValue;
      break;
    case '>=':
      passed = actualValue >= targetValue;
      break;
    case '<=':
      passed = actualValue <= targetValue;
      break;
    case '!=':
      passed = Math.abs(actualValue - targetValue) >= 0.1;
      break;
  }

  const poleName = actualValue < 0 ? duality.leftPole : duality.rightPole;

  return {
    condition,
    passed,
    actualValue,
    message: passed
      ? `D${dualityId} (${poleName}) = ${actualValue.toFixed(2)} ${condition.operator} ${targetValue} ✓`
      : `D${dualityId} (${poleName}) = ${actualValue.toFixed(2)} ${condition.operator} ${targetValue} ✗`,
  };
}

/**
 * Evaluate a binary condition
 */
function evaluateBinaryCondition(
  condition: RitualCondition,
  matrix: SemaMetra
): ConditionResult {
  const binaryId = condition.id as string;
  const binary = matrix.binaries.get(binaryId);

  if (!binary) {
    return {
      condition,
      passed: false,
      actualValue: 'undefined',
      message: `Binary ${binaryId} not found`,
    };
  }

  const actualState = binary.state;
  const targetValue = condition.value;

  let passed = false;
  let targetState: BinaryState;

  // Handle different target value formats
  if (typeof targetValue === 'boolean') {
    targetState = targetValue ? 'A' : 'B';
  } else if (targetValue === 'A' || targetValue === 'B') {
    targetState = targetValue;
  } else {
    // Check if value matches state label
    targetState = targetValue === binary.stateA ? 'A' : 'B';
  }

  switch (condition.operator) {
    case '=':
      passed = actualState === targetState;
      break;
    case '!=':
      passed = actualState !== targetState;
      break;
    default:
      // Binary only supports = and !=
      passed = actualState === targetState;
  }

  return {
    condition,
    passed,
    actualValue: actualState,
    message: passed
      ? `${binaryId} = ${binary.stateLabel} (${actualState}) ${condition.operator} ${targetState} ✓`
      : `${binaryId} = ${binary.stateLabel} (${actualState}) ${condition.operator} ${targetState} ✗`,
  };
}

/**
 * Evaluate a hybrid condition
 */
function evaluateHybridCondition(
  condition: RitualCondition,
  matrix: SemaMetra
): ConditionResult {
  const hybridId = condition.id as string;
  const hybrid = matrix.hybrids.get(hybridId);

  if (!hybrid) {
    return {
      condition,
      passed: false,
      actualValue: 'undefined',
      message: `Hybrid ${hybridId} not found`,
    };
  }

  const actualCondition = hybrid.condition;
  const targetValue = condition.value;

  let passed = false;
  let targetCondition: HybridCondition;

  // Handle different target value formats
  if (typeof targetValue === 'boolean') {
    targetCondition = targetValue ? 'A' : 'B';
  } else if (targetValue === 'A' || targetValue === 'B' || targetValue === 'transitioning') {
    targetCondition = targetValue;
  } else {
    // Check if value matches condition label
    targetCondition = targetValue === hybrid.conditionA ? 'A' : 'B';
  }

  switch (condition.operator) {
    case '=':
      passed = actualCondition === targetCondition;
      break;
    case '!=':
      passed = actualCondition !== targetCondition;
      break;
    default:
      passed = actualCondition === targetCondition;
  }

  return {
    condition,
    passed,
    actualValue: actualCondition,
    message: passed
      ? `${hybridId} = ${hybrid.conditionLabel} ${condition.operator} ${targetCondition} ✓`
      : `${hybridId} = ${hybrid.conditionLabel} ${condition.operator} ${targetCondition} ✗`,
  };
}

/**
 * Evaluate multiple conditions with AND logic
 */
export function evaluateConditionsAnd(
  conditions: RitualCondition[],
  matrix: SemaMetra
): { allPassed: boolean; results: ConditionResult[] } {
  const results = conditions.map((c) => evaluateCondition(c, matrix));
  const allPassed = results.every((r) => r.passed);
  return { allPassed, results };
}

/**
 * Evaluate multiple conditions with OR logic
 */
export function evaluateConditionsOr(
  conditions: RitualCondition[],
  matrix: SemaMetra
): { anyPassed: boolean; results: ConditionResult[] } {
  const results = conditions.map((c) => evaluateCondition(c, matrix));
  const anyPassed = results.some((r) => r.passed);
  return { anyPassed, results };
}

/**
 * Create a duality threshold condition
 */
export function dualityThreshold(
  id: number,
  threshold: number,
  operator: '>' | '<' | '>=' | '<=' | '=' = '>='
): RitualCondition {
  return {
    type: 'duality',
    id,
    operator,
    value: threshold,
  };
}

/**
 * Create a binary state condition
 */
export function binaryState(id: string, requiredState: BinaryState | string): RitualCondition {
  return {
    type: 'binary',
    id,
    operator: '=',
    value: requiredState,
  };
}

/**
 * Create a hybrid condition check
 */
export function hybridCondition(id: string, requiredCondition: 'A' | 'B'): RitualCondition {
  return {
    type: 'hybrid',
    id,
    operator: '=',
    value: requiredCondition,
  };
}
