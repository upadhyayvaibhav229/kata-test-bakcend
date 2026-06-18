import { Registration } from "@prisma/client";

export type FormWithRelations = {
  registrations?: Registration[];
  _count?: {
    registrations: number;
  };
};
