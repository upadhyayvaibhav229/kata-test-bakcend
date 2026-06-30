import { Response } from "express";
import prisma from "../db/prisma";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { HTTP_STATUS } from "../utils/constants";
import { comparePasswords } from "../utils/auth";
import { AuthenticatedRequest } from "../types";

export const resetAllData = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Unauthorized");
    }

    if (req.user.role !== "SUPER_ADMIN") {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        "Only Super Admin can perform this action",
      );
    }

    const { password } = req.body;

    if (!password) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Password is required");
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
    }

    const isValid = await comparePasswords(password, user.password);

    if (!isValid) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Incorrect password");
    }

    // Order matters: delete children before parents to respect FK constraints
    await prisma.$transaction([
      prisma.kataScore.deleteMany({}),
      prisma.sequenceOrder.deleteMany({}),
      prisma.registration.deleteMany({}),
    //   prisma.result.deleteMany({}),
    ]);

    return res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(HTTP_STATUS.OK, null, "All tournament data has been reset"),
      );
  },
);