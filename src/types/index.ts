import { Request } from "express";
import {
  TournamentForm,
  Registration,
  EvaluationSession,
  KataScore,
  FormStatus,
  RegistrationStatus,
  SessionStatus,
  Gender,
} from "@prisma/client";

// ─── Re-exports from Prisma ──────────────────────────────────────────────────

export type {
  TournamentForm,
  Registration,
  EvaluationSession,
  KataScore,
  FormStatus,
  RegistrationStatus,
  SessionStatus,
  Gender,
};

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Form ────────────────────────────────────────────────────────────────────

export interface CreateFormInput {
  title: string;
  description?: string;
  venue: string;
  eventDate: string;
  deadline: string;
  maxSlots?: number;
}

export interface UpdateFormInput extends Partial<CreateFormInput> {
  status?: FormStatus;
}

// ─── Registration ────────────────────────────────────────────────────────────

export interface CreateRegistrationInput {
  formId: string;
  studentName: string;
  dateOfBirth: string;
  gender: Gender;
  belt: string;
  dojo: string;
  coachName: string;
  contactNumber: string;
  email?: string;
  weightClass: string;
  ageCategory: string;
  kataCategory: string;
}

export interface UpdateRegistrationInput {
  status?: RegistrationStatus;
}

// ─── Session ─────────────────────────────────────────────────────────────────

export interface CreateSessionInput {
  formId: string;
  name: string;
  category: string;
  round?: number;
}

export interface UpdateSessionInput {
  status?: SessionStatus;
  startedAt?: string;
  endedAt?: string;
}

// ─── Score ───────────────────────────────────────────────────────────────────

export interface CreateScoreInput {
  sessionId: string;
  registrationId: string;
  technicalScore: number;
  athleticScore: number;
  timingScore: number;
  penaltyPoints?: number;
  judgeNotes?: string;
}

export interface UpdateScoreInput extends Partial<Omit<CreateScoreInput, "sessionId" | "registrationId">> {}

// ─── Result ──────────────────────────────────────────────────────────────────

export interface ResultFilters {
  formId?: string;
  sessionId?: string;
  category?: string;
}

// ─── Express Extensions ──────────────────────────────────────────────────────

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}
