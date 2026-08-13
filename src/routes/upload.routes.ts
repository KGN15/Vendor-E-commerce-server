import { Router } from "express";
import { uploadImages } from "../controllers/upload.controller";
import { upload } from "../middlewares/upload.middleware";
import { authorize, protect } from "../middlewares/auth.middleware";

const router = Router();

router.post(
  "/",
  protect,
  authorize("ADMIN"),
  upload.array("images", 10),
  uploadImages
);

router.post(
  "/single",
  protect,
  authorize("ADMIN"),
  upload.single("image"),
  uploadImages
);

export default router;
