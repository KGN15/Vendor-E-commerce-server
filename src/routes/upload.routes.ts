import { Router } from "express";
import { uploadImage } from "../controllers/upload.controller";
import { authorize, protect } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

/**
 * Upload a single product image.
 *
 * POST /api/uploads/image
 *
 * Requires:
 * - Authentication
 * - ADMIN role
 * - Multipart form-data
 * - Field name: image
 */
router.post(
  "/image",
  protect,
  authorize("ADMIN"),
  upload.single("image"),
  uploadImage,
);

export default router;