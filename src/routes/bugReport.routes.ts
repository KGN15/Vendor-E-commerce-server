import { Router } from "express";

import {
  createBugReport,
  getMyBugReports,
  getMyBugReport,
} from "../controllers/bugReport.controller";

import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", protect, createBugReport);

router.get("/my", protect, getMyBugReports);

router.get("/:id", protect, getMyBugReport);

export default router;
