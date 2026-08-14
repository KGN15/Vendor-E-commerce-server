import { Router } from "express";
import {
  getAdminReviews,
  getAdminReviewById,
  deleteAdminReview,
} from "../controllers/review.controller";
import { authorize, protect } from "../middlewares/auth.middleware";

const router = Router();

router.get(
  "/admin/reviews",
  protect,
  authorize("ADMIN"),
  getAdminReviews
);

router.get(
  "/admin/reviews/:id",
  protect,
  authorize("ADMIN"),
  getAdminReviewById
);

router.delete(
  "/admin/reviews/:id",
  protect,
  authorize("ADMIN"),
  deleteAdminReview
);

export default router;