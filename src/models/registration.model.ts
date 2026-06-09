import { Registration, TournamentForm, KataScore } from "@prisma/client";

export type RegistrationWithRelations = Registration & {
  form?: TournamentForm;
  sessions?: KataScore[];
};
