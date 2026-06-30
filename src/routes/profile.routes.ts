import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/profile.controller";

const router = Router();

router.get("/me", verifyJWT, getProfile);
router.patch("/me", verifyJWT, updateProfile);
router.patch("/change-password", verifyJWT, changePassword);

export default router;