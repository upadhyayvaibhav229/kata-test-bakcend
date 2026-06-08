// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Zod validation errors → 422
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: "Validation failed",
      details: err.flatten().fieldErrors,
    });
  }

  // Prisma not-found
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Record not found" });
    }
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Duplicate record", meta: err.meta });
    }
  }

  const status = err.statusCode ?? 500;
  const message = status === 500 ? "Internal server error" : err.message;

  if (status === 500) {
    console.error("[ERROR]", err);
  }

  return res.status(status).json({ error: message });
}

// Wrap async route handlers so you don't need try/catch everywhere
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
