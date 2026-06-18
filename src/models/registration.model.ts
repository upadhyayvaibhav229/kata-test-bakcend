import { KataScore, Registration } from "@prisma/client";

export type RegistrationWithRelations = Registration & {
  scores?: KataScore[];
};
