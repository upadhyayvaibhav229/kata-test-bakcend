import { EvaluationSession, TournamentForm, KataScore } from "@prisma/client";

export type SessionWithRelations = EvaluationSession & {
  form?: TournamentForm;
  scores?: KataScore[];
  _count?: {
    scores: number;
  };
};
