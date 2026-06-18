import { Request } from "express";
import { KataScore, Registration } from "@prisma/client";

export type { KataScore, Registration };

export type FormStatus = string;
export type RegistrationStatus = string;
export type SessionStatus = string;
export type Gender = string;

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

export interface CreateRegistrationInput {
  studentName: string;
  age: number;
  branch: string;
  belt: string;
  phone?: string;
  parentPhone?: string;
  kata1?: string;
  kata2?: string;
  kata3?: string;
}

export interface UpdateRegistrationInput extends Partial<CreateRegistrationInput> {
  status?: RegistrationStatus;
}

export interface CreateSessionInput {
  branch: string;
  belt: string;
}

export interface UpdateSessionInput {
  status?: SessionStatus;
  startedAt?: string;
  endedAt?: string;
}

export interface CreateScoreInput {
  registrationId: string;
  kata1Name: string;
  kata1Marks?: number;
  kata2Name: string;
  kata2Marks?: number;
  kata3Name: string;
  kata3Marks?: number;
}

export interface UpdateScoreInput extends Partial<CreateScoreInput> {}

export interface ResultFilters {
  branch?: string;
  belt?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}
