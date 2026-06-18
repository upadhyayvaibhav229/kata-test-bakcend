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
      medalStats,
      topPerformers,
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

      prisma.kataScore.groupBy({
        by: ["medal"],
        _count: {
          medal: true,
        },
      }),

      prisma.kataScore.findMany({
        take: 10,
        orderBy: {
          percentage: "desc",
        },
        include: {
          registration: {
            select: {
              id: true,
              studentName: true,
              branch: true,
              belt: true,
            },
          },
        },
      }),
    ]);

    const totalStudents = testedStudents + pendingStudents;

    const completionPercentage =
      totalStudents > 0
        ? Number(
            ((testedStudents / totalStudents) * 100).toFixed(2)
          )
        : 0;

    const medals = {
      gold:
        medalStats.find((m) => m.medal === "Gold")?._count.medal || 0,

      silver:
        medalStats.find((m) => m.medal === "Silver")?._count.medal || 0,

      bronze:
        medalStats.find((m) => m.medal === "Bronze")?._count.medal || 0,

      participation:
        medalStats.find((m) => m.medal === "Participation")?._count
          .medal || 0,
    };

    const branchPerformance = await Promise.all(
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

        return {
          branch,
          students,
          tested,
          pending,
        };
      })
    );

    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        {
          overview: {
            testedStudents,
            pendingStudents,
            totalBranches: branches.length,
            completionPercentage,
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