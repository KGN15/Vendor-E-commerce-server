
import { Router } from "express";

import {
  getAllBugReports,
  getAdminBugReport,
  replyToBugReport,
  updateBugReportStatus,
} from "../controllers/adminBugReport.controller";

import { protect } from "../middlewares/auth.middleware";

const router = Router();

/*
  IMPORTANT:
  এখানে শুধু protect দিলেই হবে না।
  তোমার existing admin/role middleware থাকলে
  সেটা অবশ্যই এখানে বসাবে।
*/

router.get("/", protect, getAllBugReports);

router.get("/:id", protect, getAdminBugReport);

router.post("/:id/replies", protect, replyToBugReport);

router.patch("/:id/status", protect, updateBugReportStatus);

export default router;
