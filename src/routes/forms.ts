// src/routes/forms.ts
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

// ── Validation schemas ────────────────────────────────────────────────────────

const createFormSchema = z.object({
  name:      z.string().trim().min(2).max(200),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  endDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  active:    z.boolean().optional().default(true),
}).refine((d) => d.startDate <= d.endDate, {
  message: "startDate must be before or equal to endDate",
  path: ["endDate"],
});

const updateFormSchema = z.object({
  name:      z.string().trim().min(2).max(200).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  active:    z.boolean().optional(),
});

// ── GET /api/forms ─────────────────────────────────────────────────────────────
// Returns all forms, newest first. Includes registration count.
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const forms = await prisma.form.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { registrations: true } },
      },
    });

    return res.json(
      forms.map((f) => ({
        id:           f.id,
        name:         f.name,
        startDate:    f.startDate,
        endDate:      f.endDate,
        active:       f.active,
        createdAt:    f.createdAt,
        updatedAt:    f.updatedAt,
        registrations: f._count.registrations,
      }))
    );
  })
);

// ── GET /api/forms/:id ─────────────────────────────────────────────────────────
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const form = await prisma.form.findUniqueOrThrow({
      where: { id: req.params.id },
      include: { _count: { select: { registrations: true } } },
    });

    return res.json({
      id:           form.id,
      name:         form.name,
      startDate:    form.startDate,
      endDate:      form.endDate,
      active:       form.active,
      createdAt:    form.createdAt,
      updatedAt:    form.updatedAt,
      registrations: form._count.registrations,
    });
  })
);

// ── POST /api/forms ────────────────────────────────────────────────────────────
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createFormSchema.parse(req.body);

    const form = await prisma.form.create({ data });

    return res.status(201).json(form);
  })
);

// ── PATCH /api/forms/:id ───────────────────────────────────────────────────────
router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = updateFormSchema.parse(req.body);

    const form = await prisma.form.update({
      where: { id: req.params.id },
      data,
    });

    return res.json(form);
  })
);

// ── PATCH /api/forms/:id/toggle ────────────────────────────────────────────────
// Convenience endpoint matching the frontend toggle switch
router.patch(
  "/:id/toggle",
  asyncHandler(async (req, res) => {
    const existing = await prisma.form.findUniqueOrThrow({
      where: { id: req.params.id },
    });

    const form = await prisma.form.update({
      where: { id: req.params.id },
      data: { active: !existing.active },
    });

    return res.json(form);
  })
);

// ── DELETE /api/forms/:id ─────────────────────────────────────────────────────
// Cascades to registrations (see schema onDelete: Cascade)
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.form.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  })
);

export default router;
