// This file defines the model-level interface and any derived types for TournamentForm.
// Prisma-generated types are re-exported from src/types/index.ts.
// Add computed/enriched types here as the project grows.

import { TournamentForm, Registration, EvaluationSession } from "@prisma/client";

export type FormWithRelations = TournamentForm & {
  registrations?: Registration[];
  sessions?: EvaluationSession[];
  _count?: {
    registrations: number;
    sessions: number;
  };
};
