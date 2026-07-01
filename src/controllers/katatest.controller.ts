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
  // Beginner & Intermediate Kyu
  white: "white",
  yellow: "yellow",
  orange: "orange",
  green: "green",
  blue: "blue",
  purple: "purple",

  // Brown Belt 3 (3rd Kyu) - Handles base "brown" fallback
  brown: "brown-3",
  "brown 3": "brown-3",
  "brown-3": "brown-3",
  "brown 3 stripes": "brown-3",
  "brown 3stripe": "brown-3",
  "brown-3stripe": "brown-3",
  "brown & white": "brown-3", // Legacy fallback map
  "brown and white": "brown-3",
  "brown-white": "brown-3",

  // Brown Belt 2 (2nd Kyu)
  "brown 2": "brown-2",
  "brown-2": "brown-2",
  "brown 2 stripes": "brown-2",
  "brown 2stripe": "brown-2",
  "brown-2stripe": "brown-2",

  // Brown Belt 1 (1st Kyu)
  "brown 1": "brown-1",
  "brown-1": "brown-1",
  "brown 1 stripe": "brown-1",
  "brown 1stripe": "brown-1",
  "brown-1stripe": "brown-1",

  // Full 10-Tier Black Belt (Dan) Setup
  black: "shodan",
  "black belt": "shodan",
  shodan: "shodan",
  "black belt shodan": "shodan",
  "1st dan": "shodan",

  nidan: "nidan",
  "black belt nidan": "nidan",
  "2nd dan": "nidan",

  sandan: "sandan",
  "black belt sandan": "sandan",
  "3rd dan": "sandan",

  yondan: "yondan",
  "black belt yondan": "yondan",
  "black belt yondan+": "yondan", // Legacy wildcard fallback map
  "4th dan": "yondan",

  godan: "godan",
  "black belt godan": "godan",
  "5th dan": "godan",

  rokudan: "rokudan",
  "black belt rokudan": "rokudan",
  "6th dan": "rokudan",

  shichidan: "shichidan",
  "black belt shichidan": "shichidan",
  "7th dan": "shichidan",

  hachidan: "hachidan",
  "black belt hachidan": "hachidan",
  "8th dan": "hachidan",

  kudan: "kudan",
  "black belt kudan": "kudan",
  "9th dan": "kudan",

  judan: "judan",
  "black belt judan": "judan",
  "10th dan": "judan",
};

// ── Flexible header matching for Excel import ───────────────────────────────
// Maps our internal field names to a list of acceptable column header variants
// (case-insensitive, trimmed). Lets users upload files with differently named
// columns (e.g. "Full Name" instead of "Student Name") without failing import.
const FIELD_ALIASES: Record<string, string[]> = {
  studentName: [
    "student name",
    "Student Name",
    "Full Name",
    "studentname",
    "full name",
    "fullname",
    "name",
    "Name",
    "NAME",
    "student",
    "Student",
  ],
  age: ["age", "years", "student age"],
  branch: [
    "branch",
    "dojo location",
    "dojo",
    "location",
    "Location",
    "Branch",
    "center",
  ],
  belt: ["belt", "rank", "belt rank"],
  phone: ["phone", "mobile no", "mobile", "contact", "phone number"],
  parentPhone: [
    "parent phone",
    "parentphone",
    "guardian contact",
    "guardian phone",
    "parent contact",
  ],
  kata1: ["kata 1", "kata1", "form 1", "form1", "KATA 1"],
  kata2: ["kata 2", "kata2", "form 2", "form2", "KATA 2"],
  kata3: ["kata 3", "kata3", "form 3", "form3", "KATA 3"],
  score1: ["score 1", "SCORE 1"],
  score2: ["score 2", "SCORE 2"],
  score3: ["score 3", "SCORE 3"],
  average: ["avr. score", "average score", "average"],
  medal: ["place", "medal"],
  rollNo: ["rollno", "rollno.", "roll no", "ROLLNO", "ROLLNO."],
  studentFirstName: [
    "student's first name",
    "student first name",
    "first name",
    "firstname",
    "first",
    "fname",
    "given name",
  ],

  studentMiddleName: [
    "student's middle name",
    "student middle name",
    "middle name",
    "middlename",
    "middle",
    "mname",
  ],

  studentLastName: [
    "student's last name",
    "student last name",
    "last name",
    "lastname",
    "last",
    "surname",
    "family name",
    "lname",
  ],
};

const KNOWN_BRANCH_NAMES = new Set([
  "catterflies",
  "marici",
  "pphs",
  "sunshine",
  "svp",
  "toddler tech",
]);

function normalizeBranch(raw: string): string {
  if (!raw) return "";

  const value = raw.trim();

  // Existing branch names
  const branch = [...KNOWN_BRANCH_NAMES].find((b) => b === value.toLowerCase());

  if (branch) {
    return branch
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // If value looks like a roll number (K011, B025, M101...)
  if (/^[A-Za-z]\d+$/.test(value)) {
    switch (value[0].toUpperCase()) {
      case "K":
        return "Kandivali";
      case "B":
        return "Borivali";
      case "M":
        return "Malad";
      case "D":
        return "Dahisar";
      case "V":
        return "Virar";
      // case "V":
      //   return "Virar";
      // Add more mappings if needed
    }
  }

  // Otherwise treat it as a location
  return value;
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

// Builds a lookup: internal field name -> actual header string found in the uploaded row
function buildFieldMap(row: Record<string, any>): Record<string, string> {
  const rowHeaders = Object.keys(row);
  const map: Record<string, string> = {};

  for (const [internalField, aliases] of Object.entries(FIELD_ALIASES)) {
    const normalizedAliases = aliases.map((a) => a.toLowerCase());
    const match = rowHeaders.find((h) =>
      normalizedAliases.includes(normalizeHeader(h)),
    );
    if (match) {
      map[internalField] = match;
    }
  }

  return map;
}

function normalizeBelt(raw: string): string {
  return (
    BELT_LABEL_TO_KEY[raw.trim().toLowerCase()] ?? raw.trim().toLowerCase()
  );
}
function getMedal(average: number) {
  if (average >= 5.8) return "Gold";
  if (average >= 5.6) return "Silver";
  if (average >= 5.0) return "Bronze";
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

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });

    let rows: Record<string, any>[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];

      const data = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
        defval: "",
      });

      if (!data.length) continue;

      const headers = Object.keys(data[0]).map((h) => h.trim().toLowerCase());

      // Check if this sheet looks like a student sheet
      const hasName =
        headers.includes("name") ||
        headers.includes("student name") ||
        headers.includes("student's first name") ||
        headers.includes("student first name") ||
        headers.includes("first name");

      const hasRoll =
        headers.includes("rollno.") ||
        headers.includes("rollno") ||
        headers.includes("roll no");

      if (hasName && headers.includes("belt") && hasRoll) {
        rows = data;
        console.log(`Using sheet: ${sheetName}`);
        break;
      }
    }

    if (!rows.length) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "No valid student data sheet found in the uploaded Excel.",
      );
    }

    if (!rows.length) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Excel file is empty");
    }

    // Build field map once from the first row's headers (all rows share the same headers)
    const fieldMap = buildFieldMap(rows[0]);

    if (
      !fieldMap.studentName &&
      !fieldMap.studentFirstName &&
      !fieldMap.studentLastName
    ) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Could not find student name columns.",
      );
    }
    if (!fieldMap.branch && !fieldMap.rollNo) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Could not find either a Branch/Location column or a Roll No column.",
      );
    }
    const matchedHeaders = new Set(Object.values(fieldMap));

    let imported = 0;

    await prisma.$transaction(async (tx) => {
      for (const row of rows) {
        const studentName = fieldMap.studentName
          ? row[fieldMap.studentName]
          : [
              fieldMap.studentFirstName ? row[fieldMap.studentFirstName] : "",
              fieldMap.studentMiddleName ? row[fieldMap.studentMiddleName] : "",
              fieldMap.studentLastName ? row[fieldMap.studentLastName] : "",
            ]
              .filter(Boolean)
              .join(" ")
              .trim();
        const age = Number(fieldMap.age ? row[fieldMap.age] : 0) || 0;
        const branch = normalizeBranch(
          fieldMap.branch
            ? row[fieldMap.branch]
            : fieldMap.rollNo
              ? row[fieldMap.rollNo]
              : "",
        );
        const belt = normalizeBelt(
          fieldMap.belt ? row[fieldMap.belt] || "" : "",
        );
        const phone = fieldMap.phone ? row[fieldMap.phone] || null : null;
        const parentPhone = fieldMap.parentPhone
          ? row[fieldMap.parentPhone] || null
          : null;
        const kata1 = fieldMap.kata1 ? row[fieldMap.kata1] || null : null;
        const kata2 = fieldMap.kata2 ? row[fieldMap.kata2] || null : null;
        const kata3 = fieldMap.kata3 ? row[fieldMap.kata3] || null : null;

        // Build extraData
        const extraData: Record<string, any> = {};
        for (const key of Object.keys(row)) {
          if (!matchedHeaders.has(key)) {
            extraData[key] = row[key];
          }
        }

        // ===== Read scores if present =====
        const kata1Marks = Number(row["SCORE 1"] || row["Score 1"] || 0);
        const kata2Marks = Number(row["SCORE 2"] || row["Score 2"] || 0);
        const kata3Marks = Number(row["SCORE 3"] || row["Score 3"] || 0);

        const average = Number(row["AVR. SCORE"] || row["Average"] || 0);

        const medal = row["PLACE"] || row["Medal"] || getMedal(average);

        const hasScore = kata1Marks > 0 || kata2Marks > 0 || kata3Marks > 0;

        // Create registration
        const registration = await tx.registration.create({
          data: {
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
            testCompleted: hasScore,
          },
        });

        // Create kata score if already tested
        if (hasScore) {
          await tx.kataScore.create({
            data: {
              registrationId: registration.id,
              kata1Name: kata1 || "",
              kata2Name: kata2 || "",
              kata3Name: kata3 || "",
              kata1Marks,
              kata2Marks,
              kata3Marks,
              average,
              medal,
            },
          });
        }

        imported++;
      }
    });
    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        {
          imported,
          mappedColumns: fieldMap,
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
  const { search, branch, belt, page = 1, limit = 10 } = req.query;

  const where: any = {};

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
      include: {
        sequenceOrder: true,
      },
      skip,
      take: Number(limit),
      orderBy: [
        {
          createdAt: "asc",
        },
      ],
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

    const medal = getMedal(average);

    await prisma.kataScore.upsert({
      where: {
        registrationId,
      },

      update: {
        kata1Marks,
        kata2Marks,
        kata3Marks,
        average,
        medal,
      },

      create: {
        registrationId,

        kata1Name: registration.kata1 || "",

        kata2Name: registration.kata2 || "",

        kata3Name: registration.kata3 || "",

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

  return res
    .status(200)
    .json(new ApiResponse(200, sequence, "Sequence fetched successfully"));
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

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Sequence saved successfully"));
});
