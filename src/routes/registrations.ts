// src/routes/registrations.ts
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/errorHandler";
import { BELT_KEYS, BRANCHES, availableKatasFor, type BeltKey } from "../lib/karate-data";

const router = Router();

// ── Validation schemas ─────────────────────────────────────────────────────────

// ── Validation schemas ─────────────────────────────────────────────────────────

const registrationBaseSchema = z.object({
  formId: z.string().min(1),
  studentName: z.string().trim().min(2).max(100),
  age: z.number().int().min(4).max(80),
  phone: z.string().trim().min(7).max(20),
  parentPhone: z.string().trim().min(7).max(20),
  branch: z.string().min(1),
  belt: z.enum(BELT_KEYS),
  kata1: z.string().min(1),
  kata2: z.string().min(1),
  kata3: z.string().min(1),
});

const createRegistrationSchema = registrationBaseSchema
  .refine((d) => new Set([d.kata1, d.kata2, d.kata3]).size === 3, {
    message: "All three katas must be different",
    path: ["kata3"],
  })
  .refine(
    (d) => {
      const allowed = new Set(availableKatasFor(d.belt as BeltKey));
      return [d.kata1, d.kata2, d.kata3].every((k) => allowed.has(k));
    },
    {
      message: "One or more katas are not allowed for this belt",
      path: ["kata1"],
    }
  )
  .refine((d) => (BRANCHES as readonly string[]).includes(d.branch), {
    message: "Unknown branch",
    path: ["branch"],
  });

const updateRegistrationSchema = registrationBaseSchema
  .omit({ formId: true })
  .partial();
const listQuerySchema = z.object({
  page:     z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
  search:   z.string().optional(),
  branch:   z.string().optional(),
  belt:     z.enum(BELT_KEYS).optional(),
  formId:   z.string().optional(),
});

// ── GET /api/registrations ────────────────────────────────────────────────────
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = listQuerySchema.parse(req.query);
    const { page, pageSize, search, branch, belt, formId } = query;

    const where = {
      ...(formId && { formId }),
      ...(branch && { branch }),
      ...(belt   && { belt }),
      ...(search && {
        studentName: { contains: search, mode: "insensitive" as const },
      }),
    };

    const [total, registrations] = await prisma.$transaction([
      prisma.registration.count({ where }),
      prisma.registration.findMany({
        where,
        orderBy: { registeredAt: "desc" },
        skip:  (page - 1) * pageSize,
        take:  pageSize,
        include: { form: { select: { name: true } } },
      }),
    ]);

    return res.json({
      data: registrations,
      meta: {
        total,
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
      },
    });
  })
);

// ── GET /api/registrations/stats ──────────────────────────────────────────────
// Quick summary numbers (used by the dashboard header cards)
router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const [total, byBelt, byBranch] = await prisma.$transaction([
      prisma.registration.count(),
      prisma.registration.groupBy({
        by: ["belt"],
        _count: { belt: true },
        orderBy: { _count: { belt: "desc" } },
      }),
      prisma.registration.groupBy({
        by: ["branch"],
        _count: { branch: true },
        orderBy: { _count: { branch: "desc" } },
      }),
    ]);

    return res.json({
      total,
      uniqueBelts:    byBelt.length,
      uniqueBranches: byBranch.length,
      byBelt:   byBelt.map((r) => ({ belt: r.belt,     count: r._count.belt })),
      byBranch: byBranch.map((r) => ({ branch: r.branch, count: r._count.branch })),
    });
  })
);

// ── GET /api/registrations/:id ────────────────────────────────────────────────
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const reg = await prisma.registration.findUniqueOrThrow({
      where: { id: req.params.id },
      include: { form: { select: { id: true, name: true } } },
    });
    return res.json(reg);
  })
);

// ── POST /api/registrations ───────────────────────────────────────────────────
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createRegistrationSchema.parse(req.body);

    // Verify the form exists and is active
    const form = await prisma.form.findUniqueOrThrow({
      where: { id: data.formId },
    });

    if (!form.active) {
      return res.status(403).json({ error: "This registration form is closed" });
    }

    const reg = await prisma.registration.create({
      data: {
        formId:      data.formId,
        studentName: data.studentName,
        age:         data.age,
        phone:       data.phone,
        parentPhone: data.parentPhone,
        branch:      data.branch,
        belt:        data.belt,
        kata1:       data.kata1,
        kata2:       data.kata2,
        kata3:       data.kata3,
      },
    });

    return res.status(201).json(reg);
  })
);

// ── PATCH /api/registrations/:id ─────────────────────────────────────────────
// Partial update — useful for admin corrections

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = updateRegistrationSchema.parse(req.body);

    const reg = await prisma.registration.update({
      where: { id: req.params.id },
      data,
    });

    return res.json(reg);
  })
);

// ── DELETE /api/registrations/:id ────────────────────────────────────────────
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.registration.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  })
);

export default router;
