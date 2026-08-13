import { Router } from "express";
import { getAnalytics } from "../controllers/report.controller";
import { authorize, protect } from "../middlewares/auth.middleware";

const router = Router();

router.get("/analytics", protect, authorize("ADMIN"), getAnalytics);

export default router;
