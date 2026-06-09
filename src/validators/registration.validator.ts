import { z } from "zod";

export const createRegistrationSchema = z.object({
  formId: z.string().cuid("Invalid form ID"),
  studentName: z.string().min(2, "Student name is required"),
  dateOfBirth: z.string().datetime("Invalid date of birth"),
  gender: z.enum(["MALE", "FEMALE"]),
  belt: z.string().min(1, "Belt rank is required"),
  dojo: z.string().min(1, "Dojo name is required"),
  coachName: z.string().min(2, "Coach name is required"),
  contactNumber: z
    .string()
    .regex(/^\+?[0-9]{8,15}$/, "Invalid contact number"),
  email: z.string().email("Invalid email").optional(),
  weightClass: z.string().min(1, "Weight class is required"),
  ageCategory: z.string().min(1, "Age category is required"),
  kataCategory: z.string().min(1, "Kata category is required"),
});

export const updateRegistrationSchema = z.object({
  status: z
    .enum(["PENDING", "APPROVED", "REJECTED", "WITHDRAWN"])
    .optional(),
});

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;
export type UpdateRegistrationInput = z.infer<typeof updateRegistrationSchema>;
