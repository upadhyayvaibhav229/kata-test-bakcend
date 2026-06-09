import { Router } from "express";
import { getScore, saveScore } from "../controllers/score.controller";
// import {
//   saveScore,
//   getScore,
// } from "../controllers/score.controller";

const router = Router();

router.post(
  "/",
  saveScore
);

router.get(
  "/:registrationId",
  getScore
);

export default router;