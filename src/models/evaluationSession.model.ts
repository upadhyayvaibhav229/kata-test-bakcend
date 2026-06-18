import { KataScore } from "@prisma/client";

export type SessionWithRelations = {
  id?: string;
  branch?: string;
  belt?: string;
  sequence?: string[];
  scores?: KataScore[];
  _count?: {
    scores: number;
  };
};
