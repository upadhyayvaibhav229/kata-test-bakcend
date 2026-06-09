import { Router } from "express";
import { exportResultsExcel, getResults } from "../controllers/result.controller";
// import {
//   getResults,
//   exportResultsExcel,
// } from "../controllers/result.controller";

const router = Router();

router.get(
  "/",
  getResults
);

router.get(
  "/export",
  exportResultsExcel
);

export default router;