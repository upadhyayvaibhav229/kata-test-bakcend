import { KataScore, Registration } from "@prisma/client";

export type KataScoreWithRelations = KataScore & {
  registration?: Registration;
};

export type RankedResult = KataScoreWithRelations & {
  rank: number;
};
