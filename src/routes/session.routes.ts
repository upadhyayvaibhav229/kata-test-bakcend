import { Router } from "express";
import { getSessionById, getSessions, startSession, updateSequence } from "../controllers/session.controller";

const router = Router();

router.post(
  "/start",
  startSession
);

router.get(
  "/",
  getSessions
);

router.get(
  "/:id",
  getSessionById
);

router.patch(
  "/:id/sequence",
  updateSequence
);