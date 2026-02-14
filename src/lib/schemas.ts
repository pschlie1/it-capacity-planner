import { z } from 'zod';

// ============================================
// AI Route Schemas
// ============================================

export const aiChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().max(10000),
  })).min(1).max(50),
});

export const aiForecastSchema = z.object({
  type: z.enum(['risk', 'crunch', 'attrition', 'trend']),
  resourceName: z.string().max(200).optional(),
});

export const aiIntakeSchema = z.object({
  description: z.string().min(1).max(5000),
});

export const aiOptimizeSchema = z.object({
  type: z.enum(['portfolio', 'resource', 'hiring', 'cost']),
});

export const aiScenarioSchema = z.object({
  description: z.string().min(1).max(5000),
});

export const aiMessageSchema = z.object({
  message: z.string().min(1).max(10000),
});

// ============================================
// CRUD Route Schemas
// ============================================

export const projectCreateSchema = z.object({
  name: z.string().min(1).max(200),
  priority: z.number().int().min(1),
  status: z.enum(['not_started', 'in_planning', 'active', 'on_hold', 'complete', 'cancelled']).default('not_started'),
  description: z.string().max(5000).default(''),
  startWeekOffset: z.number().int().min(0).default(0),
  tshirtSize: z.enum(['S', 'M', 'L', 'XL']).optional(),
  category: z.string().max(100).optional(),
  sponsor: z.string().max(200).optional(),
  businessValue: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  requiredSkills: z.array(z.string().max(100)).optional(),
  dependencies: z.array(z.string()).optional(),
  committedDate: z.string().optional(),
  riskLevel: z.enum(['high', 'medium', 'low']).optional(),
  riskNotes: z.string().max(2000).optional(),
}).passthrough();

export const teamCreateSchema = z.object({
  name: z.string().min(1).max(200),
  pmFte: z.number().min(0).default(0),
  productManagerFte: z.number().min(0).default(0),
  uxDesignerFte: z.number().min(0).nullable().default(null),
  businessAnalystFte: z.number().min(0).default(0),
  scrumMasterFte: z.number().min(0).default(0),
  architectFte: z.number().min(0).default(0),
  developerFte: z.number().min(0).default(0),
  qaFte: z.number().min(0).default(0),
  devopsFte: z.number().min(0).default(0),
  dbaFte: z.number().min(0).default(0),
  kloTlmHoursPerWeek: z.number().min(0).default(0),
  adminPct: z.number().min(0).max(100).default(25),
  skills: z.array(z.string().max(100)).optional(),
}).passthrough();

export const scenarioCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
}).passthrough();

// Type exports
export type AiChatInput = z.infer<typeof aiChatSchema>;
export type AiForecastInput = z.infer<typeof aiForecastSchema>;
export type AiIntakeInput = z.infer<typeof aiIntakeSchema>;
export type AiOptimizeInput = z.infer<typeof aiOptimizeSchema>;
export type AiScenarioInput = z.infer<typeof aiScenarioSchema>;
