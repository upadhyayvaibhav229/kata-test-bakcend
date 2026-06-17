import { Request, Response } from "express";
import XLSX from "xlsx";
import prisma from "../db/prisma";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { HTTP_STATUS } from "../utils/constants";
import { asyncHandler } from "../utils/asyncHandler";

const ALLOWED_EXCEL_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const BELT_LABEL_TO_KEY: Record<string, string> = {
  "white":               "white",
  "yellow":              "yellow",
  "orange":              "orange",
  "green":               "green",
  "blue":                "blue",
  "purple":              "purple",
  "brown":               "brown",
  "brown & white":       "brown-white",
  "brown and white":     "brown-white",
  "brown-white":         "brown-white",
  "brown 2 stripes":     "brown-2stripe",
  "brown 2stripe":       "brown-2stripe",
  "brown-2stripe":       "brown-2stripe",
  "brown 3 stripes":     "brown-3stripe",
  "brown 3stripe":       "brown-3stripe",
  "brown-3stripe":       "brown-3stripe",
  "black":               "shodan",
  "black belt":          "shodan",
  "shodan":              "shodan",
  "black belt shodan":   "shodan",
  "nidan":               "nidan",
  "black belt nidan":    "nidan",
  "sandan":              "sandan",
  "black belt sandan":   "sandan",
  "yondan":              "yondan",
  "black belt yondan":   "yondan",
  "black belt yondan+":  "yondan",
};

function normalizeBelt(raw: string): string {
  return BELT_LABEL_TO_KEY[raw.trim().toLowerCase()] ?? raw.trim().toLowerCase();
}
function getMedal(percentage: number) {
  if (percentage >= 85) return "Gold";

  if (percentage >= 75) return "Silver";

  if (percentage >= 65) return "Bronze";

  return "Participation";
}

export const importExcel = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.file) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Excel file is required");
    }

    if (!ALLOWED_EXCEL_TYPES.includes(req.file.mimetype)) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Only Excel files (.xlsx, .xls) are allowed",
      );
    }

    if (req.file.size > MAX_FILE_SIZE) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "File size exceeds maximum limit of 5MB",
      );
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      defval: "",
    });

    if (!rows.length) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Excel file is empty");
    }

    const registrations = rows.map((row) => {
      const studentName = row["Student Name"] || row["studentName"] || "";

      const age = Number(row["Age"] || row["age"] || 0);

      const branch = row["Branch"] || row["branch"] || "";

      const belt = normalizeBelt(row["Belt"] || row["belt"] || "");

      const phone = row["Phone"] || row["phone"] || null;

      const parentPhone = row["Parent Phone"] || row["parentPhone"] || null;

      const kata1 = row["Kata 1"] || row["kata1"] || null;

      const kata2 = row["Kata 2"] || row["kata2"] || null;

      const kata3 = row["Kata 3"] || row["kata3"] || null;

      const extraData = { ...row };

      [
        "Student Name",
        "studentName",
        "Age",
        "age",
        "Branch",
        "branch",
        "Belt",
        "belt",
        "Phone",
        "phone",
        "Parent Phone",
        "parentPhone",
        "Kata 1",
        "kata1",
        "Kata 2",
        "kata2",
        "Kata 3",
        "kata3",
      ].forEach((key) => delete extraData[key]);

      return {
        studentName,
        age,
        branch,
        belt,
        phone,
        parentPhone,
        kata1,
        kata2,
        kata3,
        extraData,
      };
    });

    await prisma.registration.createMany({
      data: registrations,
    });

    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        {
          imported: registrations.length,
        },
        "Registrations imported successfully",
      ),
    );
  },
);

export const downloadTemplate = (req: Request, res: Response) => {
  const workbook = XLSX.utils.book_new();

  // Empty row so headers get created with correct keys
  const worksheet = XLSX.utils.json_to_sheet([
    {
      "Student Name": "",
      Age: "",
      Branch: "",
      Belt: "",
      Phone: "",
      "Parent Phone": "",
      "Kata 1": "",
      "Kata 2": "",
      "Kata 3": "",
    },
  ]);

  // ── Column widths ──────────────────────────────────────────────────────────
  worksheet["!cols"] = [
    { wch: 22 }, // Student Name
    { wch: 8 }, // Age
    { wch: 18 }, // Branch
    { wch: 16 }, // Belt
    { wch: 16 }, // Phone
    { wch: 18 }, // Parent Phone
    { wch: 20 }, // Kata 1
    { wch: 20 }, // Kata 2
    { wch: 20 }, // Kata 3
  ];

  // ── Freeze header row ──────────────────────────────────────────────────────
  worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };

  XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  res.setHeader(
    "Content-Disposition",
    'attachment; filename="registration-template.xlsx"',
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );

  return res.send(buffer);
};


export const getBranches = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const branches = await prisma.registration.findMany({
      distinct: ["branch"],
      select: {
        branch: true,
      },
    });

    const branchList = branches.map((b) => b.branch).filter((b) => b);

    return res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          branchList,
          "Branches retrieved successfully",
        ),
      );
  },
);

export const getBelts = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const belts = await prisma.registration.findMany({
      distinct: ["belt"],
      select: {
        belt: true,
      },
    });

    const beltList = belts.map((b) => b.belt).filter((b) => b);

    return res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          beltList,
          "Belts retrieved successfully",
        ),
      );
  },
);

export const getRegistrations = asyncHandler(async (req, res) => {
    console.log("QUERY =>", req.query);
  const { search, branch, belt, page = 1, limit = 10 } = req.query;

  const where: any = {};
  console.log("WHERES =>", JSON.stringify(where, null, 2));

  if (search) {
    where.studentName = {
      contains: String(search),
      mode: "insensitive",
    };
  }

  if (branch) {
    where.branch = String(branch);
  }

  if (belt) {
    where.belt = String(belt);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [registrations, total] = await prisma.$transaction([
    prisma.registration.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.registration.count({
      where,
    }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        registrations,
        total,
        page: Number(page),
        limit: Number(limit),
      },
      "Registrations fetched successfully",
    ),
  );
});

export const getRegistrationById = asyncHandler(async (req, res) => {
  const registation = await prisma.registration.findUnique({
    where: {
      id: req.params.id,
    },
  });

  if (!registation) {
    throw new ApiError(404, "Registration not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, registation, "Registration fetched successfully"),
    );
});

// update regi students
export const updateregisterdStudent = asyncHandler(async (req, res) => {
  const registrtaion = await prisma.registration.update({
    where: {
      id: req.params.id,
    },
    data: req.body,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, registrtaion, "student data updated succesfully"),
    );
});

export const deleteRegistration = asyncHandler(async (req, res) => {
  await prisma.registration.delete({
    where: {
      id: req.params.id,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Registration deleted successfully"));
});

export const createRegistration = asyncHandler(async (req, res) => {
  const { studentName, age, branch, belt } = req.body;

  if (!studentName || !age || !branch || !belt) {
    throw new ApiError(400, "Student name, age, branch and belt are required");
  }

  const registration = await prisma.registration.create({
    data: {
      ...req.body,
      age: Number(age),
    },
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, registration, "Registration created successfully"),
    );
});

export const completeKataTest = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { registrationId, kata1Marks, kata2Marks, kata3Marks } = req.body;

    const registration = await prisma.registration.findUnique({
      where: {
        id: registrationId,
      },
    });

    if (!registration) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Student not found");
    }

    const average =
      (Number(kata1Marks) + Number(kata2Marks) + Number(kata3Marks)) / 3;

    const percentage = average * 10;

    const medal = getMedal(percentage);

    await prisma.kataScore.upsert({
      where: {
        registrationId,
      },

      update: {
        kata1Marks,
        kata2Marks,
        kata3Marks,
      },

      create: {
        registrationId,

        kata1Name: registration.kata1 || "",

        kata2Name: registration.kata2 || "",

        kata3Name: registration.kata3 || "",

        kata1Marks,
        kata2Marks,
        kata3Marks,
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

    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        {
          registrationId,

          studentName: registration.studentName,

          average,

          percentage,

          medal,
        },
        "Test completed successfully",
      ),
    );
  },
);

export const getSequence = asyncHandler(async (req, res) => {
  const { branch, belt } = req.query;

  const sequence = await prisma.sequenceOrder.findMany({
    where: {
      branch: String(branch),
      belt: String(belt),
    },
    include: {
      registration: true,
    },
    orderBy: {
      sequenceNo: "asc",
    },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      sequence,
      "Sequence fetched successfully"
    )
  );
});

export const saveSequence = asyncHandler(async (req, res) => {
  const { branch, belt, sequence } = req.body;

  if (!branch || !belt || !Array.isArray(sequence)) {
    throw new ApiError(400, "Branch, belt and sequence are required");
  }

  await prisma.$transaction(async (tx) => {
    // Remove old sequence
    await tx.sequenceOrder.deleteMany({
      where: {
        branch,
        belt,
      },
    });

    // Create new sequence
    await tx.sequenceOrder.createMany({
      data: sequence.map((registrationId: string, index: number) => ({
        registrationId,
        branch,
        belt,
        sequenceNo: index + 1,
      })),
    });
  });

  return res.status(200).json(
    new ApiResponse(200, null, "Sequence saved successfully")
  );
});