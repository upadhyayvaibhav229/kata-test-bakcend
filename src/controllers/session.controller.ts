import prisma from "../db/prisma";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const startSession = asyncHandler(async (req, res) => {
  const { branch, belt } = req.body;

  const students = await prisma.registration.findMany({
    where: {
      branch,
      belt,
    },
    orderBy: {
      studentName: "asc",
    },
  });

  if (!students.length) {
    throw new ApiError(404, "No students found");
  }

  const sequence = students.map((student) => student.id);

  const session = await prisma.evaluationSession.create({
    data: {
      branch,
      belt,
      sequence,
    },
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        session,
        students,
      },
      "Session started successfully",
    ),
  );
});


export const getSessions =
  asyncHandler(async (req, res) => {
    const sessions =
      await prisma.evaluationSession.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

    return res.status(200).json(
      new ApiResponse(
        200,
        sessions,
        "Sessions fetched"
      )
    );
  });

  export const getSessionById =
  asyncHandler(async (req, res) => {
    const session =
      await prisma.evaluationSession.findUnique({
        where: {
          id: req.params.id,
        },
      });

    if (!session) {
      throw new ApiError(
        404,
        "Session not found"
      );
    }

    const sequence =
      (session.sequence as string[]) || [];

    const students =
      await prisma.registration.findMany({
        where: {
          id: {
            in: sequence,
          },
        },
      });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          session,
          students,
        },
        "Session fetched"
      )
    );
  });

  export const updateSequence =
  asyncHandler(async (req, res) => {
    const {
      sequence,
    } = req.body;

    const session =
      await prisma.evaluationSession.update({
        where: {
          id: req.params.id,
        },
        data: {
          sequence,
        },
      });

    return res.status(200).json(
      new ApiResponse(
        200,
        session,
        "Sequence updated"
      )
    );
  });