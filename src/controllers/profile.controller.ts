import { Response } from "express";
import prisma from "../db/prisma";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { HTTP_STATUS } from "../utils/constants";
import { comparePasswords, hashPassword } from "../utils/auth";
import { AuthenticatedRequest } from "../types";

// GET /profile/me — fetch current logged-in user's profile
export const getProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
    }

    return res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, user, "Profile fetched successfully"));
  },
);

// PATCH /profile/me — update name and/or email
export const updateProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Unauthorized");
    }

    const { name, email } = req.body;

    if (!name && !email) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Nothing to update");
    }

    // If email is changing, make sure it isn't taken by someone else
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== req.user.id) {
        throw new ApiError(HTTP_STATUS.CONFLICT, "Email is already in use");
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, updated, "Profile updated successfully"));
  },
);

// PATCH /profile/change-password — update password while logged in (separate from forgot/reset flow)
export const changePassword = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Unauthorized");
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Current password and new password are required",
      );
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
    }

    const isValid = await comparePasswords(currentPassword, user.password);

    if (!isValid) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Current password is incorrect");
    }

    const hashed = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    return res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, null, "Password changed successfully"));
  },
);