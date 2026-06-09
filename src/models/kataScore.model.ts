import { KataScore, EvaluationSession, Registration } from "@prisma/client";

export type KataScoreWithRelations = KataScore & {
  session?: EvaluationSession;
  registration?: Registration;
};

export type RankedResult = KataScoreWithRelations & {
  rank: number;
};
