import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

type RequestPart = "body" | "query" | "params";

/**
 * Validates a specific part of the request against a Zod schema.
 * On failure, throws a ZodError which is caught by the global error middleware.
 */
const validate =
  (schema: ZodSchema, part: RequestPart = "body") =>
  (req: Request, _res: Response, next: NextFunction) => {
    schema.parse(req[part]);
    next();
  };

export { validate };
