// result.controller.ts
import { Request, Response } from "express";
import XLSX from "xlsx";

import prisma from "../db/prisma";

import { ApiResponse } from "../utils/ApiResponse";
import { HTTP_STATUS } from "../utils/constants";
import { asyncHandler } from "../utils/asyncHandler";




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

      const results = registrations
        .map((student) => ({
          registrationId: student.id,
          studentName: student.studentName,
          branch: student.branch,
          belt: student.belt,

          average: student.score?.average ?? 0,
          medal: student.score?.medal ?? "Participation",
          createdAt: student.createdAt,
        }))
        .sort((a, b) => {
          if (b.average !== a.average) return b.average - a.average;
          return a.createdAt.getTime() - b.createdAt.getTime();
        })
        .map((item, index) => ({
          registrationId: item.registrationId,
          studentName: item.studentName,
          branch: item.branch,
          belt: item.belt,
          average: item.average,
          medal: item.medal,
          rank: index + 1,
        }));

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
      .map((r) => ({
        "Student Name": r.studentName,
        Branch: r.branch,
        Belt: r.belt,
        "Average Score": Number(r.score?.average || 0).toFixed(2),
        Medal: r.score?.medal || "Participation",
      }));

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
