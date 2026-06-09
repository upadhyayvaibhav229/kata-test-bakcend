import { Request, Response } from "express";
import XLSX from "xlsx";

import prisma from "../db/prisma";

import { ApiResponse } from "../utils/ApiResponse";
import { HTTP_STATUS } from "../utils/constants";
import { asyncHandler } from "../utils/asyncHandler";


function getMedal(
  percentage: number
) {
  if (percentage >= 85) return "Gold";

  if (percentage >= 75) return "Silver";

  if (percentage >= 65) return "Bronze";

  return "Participation";
}

export const getResults =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ): Promise<Response> => {
      const {
        branch,
        belt,
      } = req.query;

      const where: any = {
        testCompleted: true,
      };

      if (branch) {
        where.branch =
          String(branch);
      }

      if (belt) {
        where.belt =
          String(belt);
      }

      const registrations =
        await prisma.registration.findMany({
          where,
          include: {
            score: true,
          },
        });

      const results =
        registrations
          .map((student) => {
            const score =
              student.score;

            const average =
              (
                Number(
                  score?.kata1Marks ||
                    0
                ) +
                Number(
                  score?.kata2Marks ||
                    0
                ) +
                Number(
                  score?.kata3Marks ||
                    0
                )
              ) / 3;

            const percentage =
              average * 10;

            return {
              registrationId:
                student.id,

              studentName:
                student.studentName,

              branch:
                student.branch,

              belt:
                student.belt,

              average,

              percentage,

              medal:
                getMedal(
                  percentage
                ),
            };
          })
          .sort(
            (
              a,
              b
            ) =>
              b.percentage -
              a.percentage
          )
          .map(
            (
              item,
              index
            ) => ({
              ...item,
              rank:
                index + 1,
            })
          );

      return res
        .status(
          HTTP_STATUS.OK
        )
        .json(
          new ApiResponse(
            HTTP_STATUS.OK,
            results,
            "Results fetched successfully"
          )
        );
    }
  );
export const exportResultsExcel = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const registrations = await prisma.registration.findMany({
      include: {
        score: true,
      },
    });

    const data = registrations
      .filter((r) => r.score)
      .map((r) => {
        const average =
          (Number(r.score?.kata1Marks || 0) +
            Number(r.score?.kata2Marks || 0) +
            Number(r.score?.kata3Marks || 0)) /
          3;

        const percentage = average * 10;

        return {
          Student: r.studentName,

          Branch: r.branch,

          Belt: r.belt,

          Average: average.toFixed(2),

          Percentage: percentage.toFixed(2),

          Medal: getMedal(percentage),
        };
      });

    const workbook = XLSX.utils.book_new();

    const worksheet = XLSX.utils.json_to_sheet(data);

    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader("Content-Disposition", 'attachment; filename="results.xlsx"');

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    return res.send(buffer);
  },
);
