import { Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../types";

// TODO: Replace with your actual auth strategy (JWT, session, API key, etc.)
const verifyJWT = asyncHandler(
  async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized: No token provided");
    }

    // TODO: Verify token and attach user to req
    // const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
    // req.user = decoded as { id: string; role: string };

    next();
  }
);

const requireRole = (...roles: string[]) =>
  asyncHandler(
    async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(401, "Unauthorized");
      }

      if (!roles.includes(req.user.role)) {
        throw new ApiError(403, "Forbidden: Insufficient permissions");
      }

      next();
    }
  );

export { verifyJWT, requireRole };
