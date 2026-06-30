import { Response, NextFunction } from "express";
import { jwtVerify } from "jose";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest, Role } from "../types";

const JWT_SECRET = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET!);

const verifyJWT = asyncHandler(
  async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized: No token provided");
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      req.user = {
        id: payload.sub as string,
        role: payload.role as Role,
      };

      next();
    } catch (err) {
      throw new ApiError(401, "Unauthorized: Invalid or expired token");
    }
  },
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
    },
  );

export { verifyJWT, requireRole };
