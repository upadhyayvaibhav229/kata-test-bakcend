import { Request, Response } from "express";
import prisma from "../db/prisma";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { HTTP_STATUS } from "../utils/constants";
import { asyncHandler } from "../utils/asyncHandler";

export const saveScore = asyncHandler(
  async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const {
      registrationId,
      kata1Marks,
      kata2Marks,
      kata3Marks,
    } = req.body;

    const registration =
      await prisma.registration.findUnique({
        where: {
          id: registrationId,
        },
      });

    if (!registration) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "Registration not found"
      );
    }

    const average =
      (
        Number(kata1Marks) +
        Number(kata2Marks) +
        Number(kata3Marks)
      ) / 3;

    const percentage =
      average * 10;

    let medal = "Participation";

    if (percentage >= 85) {
      medal = "Gold";
    } else if (percentage >= 75) {
      medal = "Silver";
    } else if (percentage >= 65) {
      medal = "Bronze";
    }

    const score =
      await prisma.kataScore.upsert({
        where: {
          registrationId,
        },
        update: {
          kata1Marks,
          kata2Marks,
          kata3Marks,
          average,
          percentage,
          medal,
        },
        create: {
          registrationId,

          kata1Name:
            registration.kata1 || "",

          kata2Name:
            registration.kata2 || "",

          kata3Name:
            registration.kata3 || "",

          kata1Marks,
          kata2Marks,
          kata3Marks,

          average,
          percentage,
          medal,
        },
      });

    await prisma.registration.update({
      where: {
        id: registrationId,
      },
      data: {
        testCompleted: true,
      },
    });

    return res.status(
      HTTP_STATUS.OK
    ).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        score,
        "Score saved successfully"
      )
    );
  }
);

export const getScore = asyncHandler(
  async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const score =
      await prisma.kataScore.findUnique({
        where: {
          registrationId:
            req.params.registrationId,
        },
      });

    return res.status(
      HTTP_STATUS.OK
    ).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        score,
        "Score fetched successfully"
      )
    );
  }
);

