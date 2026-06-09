import { z } from "zod";

export const createFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  venue: z.string().min(3, "Venue is required"),
  eventDate: z.string().datetime("Invalid event date format"),
  deadline: z.string().datetime("Invalid deadline format"),
  maxSlots: z.number().int().positive().optional(),
});

export const updateFormSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  venue: z.string().min(3).optional(),
  eventDate: z.string().datetime().optional(),
  deadline: z.string().datetime().optional(),
  maxSlots: z.number().int().positive().optional(),
  status: z.enum(["DRAFT", "OPEN", "CLOSED"]).optional(),
});

export type CreateFormInput = z.infer<typeof createFormSchema>;
export type UpdateFormInput = z.infer<typeof updateFormSchema>;
