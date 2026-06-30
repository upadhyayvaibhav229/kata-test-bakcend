import { Router } from "express";
import { validate } from "../middlewares/validation.middleware";
import { authLimiter } from "../middlewares/rateLimit.middleware";
import {
  forgotPassword,
  login,
  logout,
  me,
  resetPassword,
} from "../controllers/auth.controller";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "../validators/auth.validator";

const router = Router();

router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", logout);
router.get("/me", verifyJWT, me);
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);
router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  resetPassword,
);

export default router;
