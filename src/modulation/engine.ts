/**
 * ModulationEngine - Universal modulation system
 * Combines LFOs, RNG, and affectors to modulate dualities
 */

import type { LFOConfig, DieType } from '../core/types.js';
import type { SemaMetra } from '../core/system.js';
import { LFO, LFO_PRESETS } from './lfo.js';
import { RNG, type RollResult } from './rng.js';
import { Affector, CharacterAffector, WorldAffector } from './affector.js';

export interface ModulationRoute {
  dualityId: number;
  lfo?: LFO;
  affectors: Affector[];
  rngDie?: DieType;
  rngWeight?: number;
  enabled: boolean;
}

export interface ModulationTickResult {
  dualityId: number;
  previousValue: number;
  newValue: number;
  lfoContribution: number;
  affectorContribution: number;
  rngContribution: number;
}

export class ModulationEngine {
  private _matrix: SemaMetra;
  private _routes: Map<number, ModulationRoute> = new Map();
  private _globalAffectors: Affector[] = [];
  private _rng: RNG;
  private _tickInterval: ReturnType<typeof setInterval> | null = null;
  private _tickRate: number = 60;
  private _running: boolean = false;
  private _lastTickTime: number = 0;

  // Modulation strength multipliers
  private _lfoStrength: number = 1.0;
  private _affectorStrength: number = 1.0;
  private _rngStrength: number = 1.0;

  constructor(matrix: SemaMetra) {
    this._matrix = matrix;
    this._rng = new RNG();
  }

  /**
   * Get the RNG instance
   */
  get rng(): RNG {
    return this._rng;
  }

  /**
   * Check if engine is running
   */
  get running(): boolean {
    return this._running;
  }

  /**
   * Get tick rate in Hz
   */
  get tickRate(): number {
    return this._tickRate;
  }

  // ========================================
  // Route Management
  // ========================================

  /**
   * Create a modulation route for a duality
   */
  createRoute(dualityId: number): ModulationRoute {
    if (this._routes.has(dualityId)) {
      return this._routes.get(dualityId)!;
    }

    const route: ModulationRoute = {
      dualityId,
      affectors: [],
      enabled: true,
    };

    this._routes.set(dualityId, route);
    return route;
  }

  /**
   * Get a modulation route
   */
  getRoute(dualityId: number): ModulationRoute | undefined {
    return this._routes.get(dualityId);
  }

  /**
   * Remove a modulation route
   */
  removeRoute(dualityId: number): this {
    this._routes.delete(dualityId);
    return this;
  }

  /**
   * Enable/disable a route
   */
  setRouteEnabled(dualityId: number, enabled: boolean): this {
    const route = this._routes.get(dualityId);
    if (route) {
      route.enabled = enabled;
    }
    return this;
  }

  // ========================================
  // LFO Management
  // ========================================

  /**
   * Attach an LFO to a duality
   */
  attachLFO(dualityId: number, lfoOrConfig: LFO | LFOConfig | keyof typeof LFO_PRESETS): this {
    const route = this.createRoute(dualityId);

    let lfo: LFO;
    if (lfoOrConfig instanceof LFO) {
      lfo = lfoOrConfig;
    } else if (typeof lfoOrConfig === 'string') {
      lfo = LFO_PRESETS[lfoOrConfig]();
    } else {
      lfo = new LFO(lfoOrConfig);
    }

    route.lfo = lfo;
    lfo.start();

    return this;
  }

  /**
   * Detach LFO from a duality
   */
  detachLFO(dualityId: number): this {
    const route = this._routes.get(dualityId);
    if (route?.lfo) {
      route.lfo.stop();
      route.lfo = undefined;
    }
    return this;
  }

  /**
   * Set global LFO strength multiplier
   */
  setLFOStrength(strength: number): this {
    this._lfoStrength = Math.max(0, Math.min(2, strength));
    return this;
  }

  // ========================================
  // Affector Management
  // ========================================

  /**
   * Add a global affector (affects all dualities)
   */
  addGlobalAffector(affector: Affector): this {
    this._globalAffectors.push(affector);
    return this;
  }

  /**
   * Remove a global affector
   */
  removeGlobalAffector(affectorId: string): this {
    this._globalAffectors = this._globalAffectors.filter((a) => a.id !== affectorId);
    return this;
  }

  /**
   * Add an affector to a specific route
   */
  addRouteAffector(dualityId: number, affector: Affector): this {
    const route = this.createRoute(dualityId);
    route.affectors.push(affector);
    return this;
  }

  /**
   * Remove an affector from a route
   */
  removeRouteAffector(dualityId: number, affectorId: string): this {
    const route = this._routes.get(dualityId);
    if (route) {
      route.affectors = route.affectors.filter((a) => a.id !== affectorId);
    }
    return this;
  }

  /**
   * Set global affector strength multiplier
   */
  setAffectorStrength(strength: number): this {
    this._affectorStrength = Math.max(0, Math.min(2, strength));
    return this;
  }

  /**
   * Create and add a character affector
   */
  addCharacter(
    name: string,
    influence: number,
    options: { mythicTags?: string[]; targetDualities?: number[] } = {}
  ): CharacterAffector {
    const affector = new CharacterAffector({
      id: `char_${name.toLowerCase().replace(/\s+/g, '_')}`,
      characterName: name,
      influence,
      mythicTags: options.mythicTags,
    });

    if (options.targetDualities) {
      for (const dualityId of options.targetDualities) {
        this.addRouteAffector(dualityId, affector);
      }
    } else {
      this.addGlobalAffector(affector);
    }

    return affector;
  }

  /**
   * Create and add a world affector
   */
  addWorldEvent(eventType: string, influence: number): WorldAffector {
    const affector = new WorldAffector({
      id: `world_${eventType}`,
      eventType,
      influence,
    });

    this.addGlobalAffector(affector);
    return affector;
  }

  // ========================================
  // RNG Integration
  // ========================================

  /**
   * Set RNG die for a route
   */
  setRouteRNG(dualityId: number, die: DieType, weight: number = 0.1): this {
    const route = this.createRoute(dualityId);
    route.rngDie = die;
    route.rngWeight = weight;
    return this;
  }

  /**
   * Remove RNG from a route
   */
  removeRouteRNG(dualityId: number): this {
    const route = this._routes.get(dualityId);
    if (route) {
      route.rngDie = undefined;
      route.rngWeight = undefined;
    }
    return this;
  }

  /**
   * Set global RNG strength multiplier
   */
  setRNGStrength(strength: number): this {
    this._rngStrength = Math.max(0, Math.min(2, strength));
    return this;
  }

  /**
   * Roll a die and apply to a duality
   */
  rollAndApply(dualityId: number, die: DieType, context?: string): RollResult {
    const result = this._rng.roll(die, context);
    const dualityValue = result.normalized * 2 - 1; // Map to -1 to +1
    this._matrix.modulateDuality(dualityId, dualityValue * 0.1);
    this._matrix.emitEvent('rng:rolled', { dualityId, result });
    return result;
  }

  // ========================================
  // Tick System
  // ========================================

  /**
   * Start the modulation engine
   */
  start(tickRate: number = 60): this {
    if (this._running) return this;

    this._tickRate = tickRate;
    this._running = true;
    this._lastTickTime = Date.now();

    this._tickInterval = setInterval(() => {
      this.tick();
    }, 1000 / this._tickRate);

    return this;
  }

  /**
   * Stop the modulation engine
   */
  stop(): this {
    this._running = false;
    if (this._tickInterval) {
      clearInterval(this._tickInterval);
      this._tickInterval = null;
    }
    return this;
  }

  /**
   * Perform a single modulation tick
   */
  tick(): ModulationTickResult[] {
    const now = Date.now();
    const deltaTime = (now - this._lastTickTime) / 1000;
    this._lastTickTime = now;

    const results: ModulationTickResult[] = [];

    for (const route of this._routes.values()) {
      if (!route.enabled) continue;

      const duality = this._matrix.dualities.get(route.dualityId);
      if (!duality || duality.locked) continue;

      const previousValue = duality.value;
      let lfoContribution = 0;
      let affectorContribution = 0;
      let rngContribution = 0;

      // LFO contribution
      if (route.lfo) {
        lfoContribution = route.lfo.tick(now) * this._lfoStrength * deltaTime;
      }

      // Affector contributions (route-specific + global)
      const allAffectors = [...route.affectors, ...this._globalAffectors];
      for (const affector of allAffectors) {
        if (affector.active) {
          affectorContribution += affector.getCurrentInfluence(now) * this._affectorStrength * deltaTime * 0.1;
        }
      }

      // RNG contribution (probabilistic)
      if (route.rngDie && route.rngWeight && Math.random() < 0.01) {
        // 1% chance per tick
        const rngValue = this._rng.rollDuality(route.rngDie);
        rngContribution = rngValue * (route.rngWeight ?? 0.1) * this._rngStrength;
      }

      // Apply total modulation
      const totalModulation = lfoContribution + affectorContribution + rngContribution;
      if (totalModulation !== 0) {
        duality.modulate(totalModulation);
      }

      results.push({
        dualityId: route.dualityId,
        previousValue,
        newValue: duality.value,
        lfoContribution,
        affectorContribution,
        rngContribution,
      });
    }

    this._matrix.emitEvent('modulation:tick', { timestamp: now, results });

    return results;
  }

  /**
   * Apply a one-shot modulation to a duality
   */
  applyModulation(
    dualityId: number,
    amount: number,
    options: { source?: string; instant?: boolean } = {}
  ): this {
    if (options.instant) {
      this._matrix.setDuality(dualityId, amount);
    } else {
      this._matrix.modulateDuality(dualityId, amount);
    }
    return this;
  }

  // ========================================
  // Cleanup
  // ========================================

  /**
   * Clear all routes
   */
  clearRoutes(): this {
    for (const route of this._routes.values()) {
      route.lfo?.stop();
    }
    this._routes.clear();
    return this;
  }

  /**
   * Clear all global affectors
   */
  clearGlobalAffectors(): this {
    this._globalAffectors = [];
    return this;
  }

  /**
   * Reset the engine completely
   */
  reset(): this {
    this.stop();
    this.clearRoutes();
    this.clearGlobalAffectors();
    this._rng.clearHistory();
    this._lfoStrength = 1.0;
    this._affectorStrength = 1.0;
    this._rngStrength = 1.0;
    return this;
  }

  // ========================================
  // Inspection
  // ========================================

  /**
   * Get all routes
   */
  get routes(): Map<number, ModulationRoute> {
    return new Map(this._routes);
  }

  /**
   * Get all global affectors
   */
  get globalAffectors(): Affector[] {
    return [...this._globalAffectors];
  }

  /**
   * Get summary of engine state
   */
  getSummary(): {
    running: boolean;
    tickRate: number;
    routeCount: number;
    globalAffectorCount: number;
    lfoCount: number;
    strengths: { lfo: number; affector: number; rng: number };
  } {
    let lfoCount = 0;
    for (const route of this._routes.values()) {
      if (route.lfo) lfoCount++;
    }

    return {
      running: this._running,
      tickRate: this._tickRate,
      routeCount: this._routes.size,
      globalAffectorCount: this._globalAffectors.length,
      lfoCount,
      strengths: {
        lfo: this._lfoStrength,
        affector: this._affectorStrength,
        rng: this._rngStrength,
      },
    };
  }
}
