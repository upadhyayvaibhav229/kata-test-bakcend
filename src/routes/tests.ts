// src/routes/tests.ts
// ─────────────────────────────────────────────────────────────────────────────
// TEST MODULE — structure scaffold. Implement logic where marked TODO.
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/errorHandler";
import { BELT_KEYS } from "../lib/karate-data";

const router = Router();

// ── Schemas (fill out constraints as needed) ──────────────────────────────────

const createEventSchema = z.object({
  name:  z.string().trim().min(2).max(200),
  date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  venue: z.string().trim().optional(),
});

const createPanelSchema = z.object({
  eventId:  z.string().min(1),
  examiner: z.string().trim().min(2).max(100),
  belt:     z.enum(BELT_KEYS),
});

const createCandidateSchema = z.object({
  panelId:     z.string().min(1),
  studentName: z.string().trim().min(2).max(100),
  branch:      z.string().min(1),
  currentBelt: z.enum(BELT_KEYS),
  targetBelt:  z.enum(BELT_KEYS),
});

const gradeCandidateSchema = z.object({
  score:  z.number().min(0).max(100),
  passed: z.boolean(),
  notes:  z.string().optional(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST EVENTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/tests/events
router.get(
  "/events",
  asyncHandler(async (_req, res) => {
    // TODO: add pagination / filtering if needed
    const events = await prisma.testEvent.findMany({
      orderBy: { date: "desc" },
      include: { _count: { select: { panels: true } } },
    });
    return res.json(events);
  })
);

// GET /api/tests/events/:id  (with panels and candidates)
router.get(
  "/events/:id",
  asyncHandler(async (req, res) => {
    const event = await prisma.testEvent.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        panels: {
          include: { candidates: true },
        },
      },
    });
    return res.json(event);
  })
);

// POST /api/tests/events
router.post(
  "/events",
  asyncHandler(async (req, res) => {
    const data = createEventSchema.parse(req.body);
    // TODO: add duplicate date/name check if required
    const event = await prisma.testEvent.create({ data });
    return res.status(201).json(event);
  })
);

// PATCH /api/tests/events/:id
router.patch(
  "/events/:id",
  asyncHandler(async (req, res) => {
    const data = createEventSchema.partial().parse(req.body);
    const event = await prisma.testEvent.update({
      where: { id: req.params.id },
      data,
    });
    return res.json(event);
  })
);

// DELETE /api/tests/events/:id  (cascades panels + candidates)
router.delete(
  "/events/:id",
  asyncHandler(async (req, res) => {
    await prisma.testEvent.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  })
);

// ═══════════════════════════════════════════════════════════════════════════════
// TEST PANELS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/tests/panels?eventId=xxx
router.get(
  "/panels",
  asyncHandler(async (req, res) => {
    const eventId = req.query.eventId as string | undefined;
    const panels = await prisma.testPanel.findMany({
      where: eventId ? { eventId } : undefined,
      include: { _count: { select: { candidates: true } } },
    });
    return res.json(panels);
  })
);

// POST /api/tests/panels
router.post(
  "/panels",
  asyncHandler(async (req, res) => {
    const data = createPanelSchema.parse(req.body);
    // TODO: verify event exists and is upcoming
    const panel = await prisma.testPanel.create({ data });
    return res.status(201).json(panel);
  })
);

// DELETE /api/tests/panels/:id
router.delete(
  "/panels/:id",
  asyncHandler(async (req, res) => {
    await prisma.testPanel.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  })
);

// ═══════════════════════════════════════════════════════════════════════════════
// TEST CANDIDATES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/tests/candidates?panelId=xxx
router.get(
  "/candidates",
  asyncHandler(async (req, res) => {
    const panelId = req.query.panelId as string | undefined;
    const candidates = await prisma.testCandidate.findMany({
      where: panelId ? { panelId } : undefined,
      orderBy: { studentName: "asc" },
    });
    return res.json(candidates);
  })
);

// POST /api/tests/candidates  — add a candidate to a panel
router.post(
  "/candidates",
  asyncHandler(async (req, res) => {
    const data = createCandidateSchema.parse(req.body);
    // TODO: validate targetBelt is exactly one rank above currentBelt
    const candidate = await prisma.testCandidate.create({ data });
    return res.status(201).json(candidate);
  })
);

// PATCH /api/tests/candidates/:id/grade  — record score/pass/fail
router.patch(
  "/candidates/:id/grade",
  asyncHandler(async (req, res) => {
    const data = gradeCandidateSchema.parse(req.body);
    // TODO: lock grading if event date hasn't arrived yet
    const candidate = await prisma.testCandidate.update({
      where: { id: req.params.id },
      data,
    });
    return res.json(candidate);
  })
);

// DELETE /api/tests/candidates/:id
router.delete(
  "/candidates/:id",
  asyncHandler(async (req, res) => {
    await prisma.testCandidate.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  })
);

export default router;
