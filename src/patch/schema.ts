/**
 * Zod validation schemas for patches and system state
 */

import { z } from 'zod';

// Binary state schema
export const BinaryStateSchema = z.enum(['A', 'B']);

// Hybrid condition schema
export const HybridConditionSchema = z.enum(['A', 'B', 'transitioning']);

// LFO shape schema
export const LFOShapeSchema = z.enum(['sine', 'saw', 'square', 'step', 'random', 'moon_phase']);

// Die type schema
export const DieTypeSchema = z.enum(['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100', 'd1000']);

// Affector type schema
export const AffectorTypeSchema = z.enum(['character', 'world', 'thread', 'user']);

// LFO config schema
export const LFOConfigSchema = z.object({
  shape: LFOShapeSchema,
  frequency: z.number().min(0.001).max(100),
  amplitude: z.number().min(0).max(1),
  phase: z.number().min(0).max(1),
});

// Affector config schema
export const AffectorConfigSchema = z.object({
  type: AffectorTypeSchema,
  id: z.string().min(1),
  influence: z.number().min(-1).max(1),
  active: z.boolean(),
});

// Ritual effect schema
export const RitualEffectSchema = z.object({
  type: z.enum(['ui', 'language', 'synth', 'character', 'mode']),
  target: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

// Ritual definition schema
export const RitualDefinitionSchema = z.object({
  name: z.string().min(1),
  dualityConditions: z.array(
    z.object({
      id: z.number().int().min(1).max(64),
      threshold: z.number().min(-1).max(1),
    })
  ),
  fusionSignal: z.string(),
  binaryLock: z.object({
    id: z.string().regex(/^B\d{2}$/),
    requiredState: BinaryStateSchema,
  }),
  effects: z.array(RitualEffectSchema),
});

// Duality state schema (for patches)
export const DualityStateSchema = z.object({
  value: z.number().min(-1).max(1),
  locked: z.boolean().optional().default(false),
});

// Binary state schema (for patches)
export const BinaryGateStateSchema = z.object({
  state: BinaryStateSchema,
  locked: z.boolean().optional().default(false),
});

// Hybrid state schema (for patches)
export const HybridStateSchema = z.object({
  condition: HybridConditionSchema,
  transitionProgress: z.number().min(0).max(1).optional().default(0),
});

// FX unit state schema
export const FXUnitStateSchema = z.object({
  id: z.string(),
  enabled: z.boolean(),
  parameters: z.record(z.string(), z.number()),
});

// Patch metadata schema
export const PatchMetadataSchema = z.object({
  author: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// Full patch schema
export const PatchSchema = z.object({
  name: z.string().min(1).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  dualities: z.record(z.coerce.number(), DualityStateSchema).optional(),
  binaries: z.record(z.string(), BinaryGateStateSchema).optional(),
  hybrids: z.record(z.string(), HybridStateSchema).optional(),
  lfoConfigs: z.record(z.coerce.number(), LFOConfigSchema).optional(),
  affectors: z.array(AffectorConfigSchema).optional(),
  fxChain: z.array(z.string()).optional(),
  rituals: z.array(RitualDefinitionSchema).optional(),
  metadata: PatchMetadataSchema.optional(),
});

// Character config schema
export const CharacterConfigSchema = z.object({
  signatureId: z.string().min(1),
  name: z.string().optional(),
  waveform: z.enum(['sine', 'square', 'noise', 'pulse', 'fractal', 'soulwave']).optional(),
  modAmplitude: z.number().min(-1).max(1).optional(),
  frequencyBase: z.number().min(0.01).max(100).optional(),
  fusionCompatible: z.array(z.string()).optional(),
  mythicTags: z.array(z.string()).optional(),
  alignedEvents: z.array(z.string()).optional(),
});

// Export type aliases for TypeScript inference
export type ValidatedPatch = z.infer<typeof PatchSchema>;
export type ValidatedLFOConfig = z.infer<typeof LFOConfigSchema>;
export type ValidatedAffectorConfig = z.infer<typeof AffectorConfigSchema>;
export type ValidatedRitualDefinition = z.infer<typeof RitualDefinitionSchema>;
export type ValidatedCharacterConfig = z.infer<typeof CharacterConfigSchema>;

/**
 * Validate a patch object
 */
export function validatePatch(data: unknown): { success: true; data: ValidatedPatch } | { success: false; errors: z.ZodError } {
  const result = PatchSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Validate an LFO config
 */
export function validateLFOConfig(data: unknown): { success: true; data: ValidatedLFOConfig } | { success: false; errors: z.ZodError } {
  const result = LFOConfigSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Validate a ritual definition
 */
export function validateRitual(data: unknown): { success: true; data: ValidatedRitualDefinition } | { success: false; errors: z.ZodError } {
  const result = RitualDefinitionSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}
