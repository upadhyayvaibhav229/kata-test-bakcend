import { Request, Response } from "express";
import prisma from "../db/prisma";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { HTTP_STATUS } from "../utils/constants";

export const getDashboard = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const [
      testedStudents,
      pendingStudents,
      branches,
      scores,
    ] = await prisma.$transaction([
      prisma.registration.count({
        where: {
          testCompleted: true,
        },
      }),

      prisma.registration.count({
        where: {
          testCompleted: false,
        },
      }),

      prisma.registration.findMany({
        distinct: ["branch"],
        select: {
          branch: true,
        },
      }),

      prisma.kataScore.findMany({
        select: {
          medal: true,
        },
      }),
    ]);

    const medals = {
      gold:
        scores.filter((score) => score.medal === "Gold").length,

      silver:
        scores.filter((score) => score.medal === "Silver").length,

      bronze:
        scores.filter((score) => score.medal === "Bronze").length,

      participation:
        scores.filter((score) => score.medal === "Participation").length,
    };

    const branchPerformance = (
      await Promise.all(
      branches.map(async ({ branch }) => {
        const students = await prisma.registration.count({
          where: {
            branch,
          },
        });

        const tested = await prisma.registration.count({
          where: {
            branch,
            testCompleted: true,
          },
        });

        const pending = await prisma.registration.count({
          where: {
            branch,
            testCompleted: false,
          },
        });

        const branchScores = await prisma.kataScore.findMany({
          where: {
            registration: {
              branch,
              testCompleted: true,
            },
          },
          select: {
            average: true,
          },
        });

        const averageScore =
          branchScores.length > 0
            ? Number(
                (
                  branchScores.reduce(
                    (sum, score) => sum + Number(score.average || 0),
                    0,
                  ) / branchScores.length
                ).toFixed(2),
              )
            : 0;

        return {
          branch,
          students,
          tested,
          pending,
          averageScore,
        };
      })
      )
    ).sort((a, b) => b.averageScore - a.averageScore);

    const topPerformers = (
      await prisma.kataScore.findMany({
        include: {
          registration: {
            select: {
              id: true,
              studentName: true,
              branch: true,
              belt: true,
              createdAt: true,
            },
          },
        },
      })
    )
      .sort((a, b) => {
        const averageDiff = Number(b.average || 0) - Number(a.average || 0);
        if (averageDiff !== 0) return averageDiff;
        return (
          a.registration.createdAt.getTime() -
          b.registration.createdAt.getTime()
        );
      })
      .slice(0, 10)
      .map((score) => ({
        id: score.id,
        average: score.average || 0,
        medal: score.medal,
        registration: {
          id: score.registration.id,
          studentName: score.registration.studentName,
          branch: score.registration.branch,
          belt: score.registration.belt,
        },
      }));

    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        {
          overview: {
            testedStudents,
            pendingStudents,
            totalBranches: branches.length,
          },

          medals,

          branchPerformance,

          topPerformers,
        },
        "Dashboard fetched successfully"
      )
    );
  }
);
