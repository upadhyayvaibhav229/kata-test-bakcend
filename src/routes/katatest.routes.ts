import { Router } from "express";
import multer from "multer";
import {
  createRegistration,
  deleteRegistration,
  downloadTemplate,
  getBelts,
  getBranches,
  getRegistrationById,
  getRegistrations,
  getSequence,
  importExcel,
  saveSequence,
  updateregisterdStudent,
} from "../controllers/katatest.controller";

const router = Router();

const upload = multer({
  dest: "uploads/",
});

router.get("/branches", getBranches);

router.post("/import", upload.single("file"), importExcel);

router.get("/download-temp", downloadTemplate);

router.get("/belts", getBelts);

router.get("/sequence", getSequence);

router.post("/save-sequence", saveSequence);
router.get("/",  getRegistrations);


router.post("/", createRegistration);

router.get("/:id", getRegistrationById);


router.put(
  "/:id",
  updateregisterdStudent
);

router.delete(
  "/:id",
  deleteRegistration
);


export default router;


// GET /api/registrations?page=1&limit=10

// GET /api/registrations?search=rahul

// GET /api/registrations?branch=Borivali

// GET /api/registrations?belt=orange

// GET /api/registrations?branch=Borivali&belt=orange

// GET /api/registrations?page=1&limit=20&search=rahul&branch=Borivali