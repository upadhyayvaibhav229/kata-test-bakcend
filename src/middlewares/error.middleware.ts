import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { ZodError } from "zod";

const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
    res.status(422).json({
      statusCode: 422,
      success: false,
      message: "Validation failed",
      errors,
      data: null,
    });
    return;
  }

  // Handle known ApiErrors
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      statusCode: err.statusCode,
      success: err.success,
      message: err.message,
      errors: err.errors,
      data: err.data,
    });
    return;
  }

  // Prisma errors
  if (err.constructor.name === "PrismaClientKnownRequestError") {
    const prismaError = err as unknown as { code: string; meta?: { target?: string[] } };

    if (prismaError.code === "P2002") {
      res.status(409).json({
        statusCode: 409,
        success: false,
        message: `Duplicate entry: ${prismaError.meta?.target?.join(", ")} already exists`,
        errors: [],
        data: null,
      });
      return;
    }

    if (prismaError.code === "P2025") {
      res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Record not found",
        errors: [],
        data: null,
      });
      return;
    }
  }

  // Fallback — generic 500
  console.error("Unhandled error:", err);
  res.status(500).json({
    statusCode: 500,
    success: false,
    message: "Internal server error",
    errors: [],
    data: null,
  });
};

export { errorMiddleware };
