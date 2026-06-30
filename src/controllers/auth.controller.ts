import { Request, Response } from "express";
import prisma from "../db/prisma";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { HTTP_STATUS } from "../utils/constants";
import {
  comparePasswords,
  createPasswordResetToken,
  hashPassword,
  hashResetToken,
  signAccessToken,
} from "../utils/auth";
import { sendEmail } from "../utils/email";
import { AuthenticatedRequest } from "../types";

const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:5173";
const RESET_PASSWORD_EXPIRES_MS = 1000 * 60 * 60; // 1 hour

export const login = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid email or password");
    }

    const isPasswordValid = await comparePasswords(password, user.password);

    if (!isPasswordValid) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid email or password");
    }

    const token = await signAccessToken({ sub: user.id, role: user.role });

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60,
      path: "/",
    });

    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
        "Logged in successfully",
      ),
    );
  },
);

export const logout = asyncHandler(
  async (_req: Request, res: Response): Promise<Response> => {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    return res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, null, "Logged out successfully"));
  },
);

export const me = asyncHandler(
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
      },
    });

    if (!user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Unauthorized");
    }

    return res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(HTTP_STATUS.OK, { user }, "User fetched successfully"),
      );
  },
);

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const { token, hashedToken } = createPasswordResetToken();
      const expiresAt = new Date(Date.now() + RESET_PASSWORD_EXPIRES_MS);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: hashedToken as unknown as string,
          resetPasswordExpires: expiresAt,
        },
      });

      const resetUrl = `${CLIENT_URL}/reset-password?token=${token}`;
      const message = `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;
      const html = `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, please ignore this email.</p>`;

      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: message,
        html,
      });
    }

    return res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          null,
          "If that email is registered, a password reset link has been sent",
        ),
      );
  },
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { token, password } = req.body;
    const hashedToken = hashResetToken(token);

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Invalid or expired reset token",
      );
    }

    const hashedPassword = await hashPassword(password);

    const accessToken = await signAccessToken({
      sub: user.id,
      role: user.role,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60,
      path: "/",
    });

    return res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          null,
          "Password has been reset successfully",
        ),
      );
  },
);
