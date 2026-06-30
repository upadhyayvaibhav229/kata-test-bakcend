import { Router } from "express";
import { verifyJWT, requireRole } from "../middlewares/auth.middleware";
import { authLimiter } from "../middlewares/rateLimit.middleware";
import { resetAllData } from "../controllers/admin.controller";

const router = Router();

router.post(
  "/reset-data",
  authLimiter,
  verifyJWT,
  requireRole("SUPER_ADMIN"),
  resetAllData,
);

export default router;
