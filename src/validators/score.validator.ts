import { z } from "zod";

const scoreRange = z
  .number()
  .min(0, "Score cannot be negative")
  .max(10, "Score cannot exceed 10");

export const createScoreSchema = z.object({
  sessionId: z.string().cuid("Invalid session ID"),
  registrationId: z.string().cuid("Invalid registration ID"),
  technicalScore: scoreRange,
  athleticScore: scoreRange,
  timingScore: scoreRange,
  penaltyPoints: z.number().min(0).max(10).default(0),
  judgeNotes: z.string().max(500).optional(),
});

export const updateScoreSchema = z.object({
  technicalScore: scoreRange.optional(),
  athleticScore: scoreRange.optional(),
  timingScore: scoreRange.optional(),
  penaltyPoints: z.number().min(0).max(10).optional(),
  judgeNotes: z.string().max(500).optional(),
});

export const createSessionSchema = z.object({
  formId: z.string().cuid("Invalid form ID"),
  name: z.string().min(2, "Session name is required"),
  category: z.string().min(1, "Category is required"),
  round: z.number().int().positive().default(1),
});

export const updateSessionSchema = z.object({
  status: z.enum(["PENDING", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
});

export type CreateScoreInput = z.infer<typeof createScoreSchema>;
export type UpdateScoreInput = z.infer<typeof updateScoreSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
