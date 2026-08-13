import { Router } from "express";
import {
  createCategory,
  getCategories,
} from "../controllers/category.controller";
import { authorize, protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", protect, authorize("ADMIN"), createCategory);
router.get("/", getCategories);

export default router;
