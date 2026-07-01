// scroe.controller.ts
import { Request, Response } from "express";
import prisma from "../db/prisma";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { HTTP_STATUS } from "../utils/constants";
import { asyncHandler } from "../utils/asyncHandler";

function getMedal(average: number) {
  if (average > 7) return "Gold";
  if (average >= 6) return "Silver";
  if (average >= 5) return "Bronze";
  return "No Medal";
}

export const saveScore = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const {
      registrationId,
      kata1Marks,
      kata2Marks,
      kata3Marks,
      kata1Name,
      kata2Name,
      kata3Name,
    } = req.body;

    const registration = await prisma.registration.findUnique({
      where: {
        id: registrationId,
      },
    });

    if (!registration) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Registration not found");
    }

    const average =
      (Number(kata1Marks) + Number(kata2Marks) + Number(kata3Marks)) / 3;

    const medal = getMedal(average);

    const resolvedKata1Name = kata1Name?.trim() || registration.kata1 || "";
    const resolvedKata2Name = kata2Name?.trim() || registration.kata2 || "";
    const resolvedKata3Name = kata3Name?.trim() || registration.kata3 || "";

    const registrationData: Record<string, string | boolean> = {
      testCompleted: true,
    };

    if (!registration.kata1 && resolvedKata1Name) {
      registrationData.kata1 = resolvedKata1Name;
    }
    if (!registration.kata2 && resolvedKata2Name) {
      registrationData.kata2 = resolvedKata2Name;
    }
    if (!registration.kata3 && resolvedKata3Name) {
      registrationData.kata3 = resolvedKata3Name;
    }

    const score = await prisma.kataScore.upsert({
      where: {
        registrationId,
      },
      update: {
        kata1Marks,
        kata2Marks,
        kata3Marks,
        kata1Name: resolvedKata1Name,
        kata2Name: resolvedKata2Name,
        kata3Name: resolvedKata3Name,
        average,
        medal,
      },
      create: {
        registrationId,

        kata1Name: resolvedKata1Name,
        kata2Name: resolvedKata2Name,
        kata3Name: resolvedKata3Name,

        kata1Marks,
        kata2Marks,
        kata3Marks,

        average,
        medal,
      },
    });

    await prisma.registration.update({
      where: {
        id: registrationId,
      },
      data: registrationData,
    });

    return res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, score, "Score saved successfully"));
  },
);

export const getScore = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const score = await prisma.kataScore.findUnique({
      where: {
        registrationId: req.params.registrationId,
      },
    });

    return res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(HTTP_STATUS.OK, score, "Score fetched successfully"),
      );
  },
);
