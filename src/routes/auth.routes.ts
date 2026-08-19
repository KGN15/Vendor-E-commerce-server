import { Router } from "express";

import {
  getMe,
  googleAuth,
  login,
  register,
  updateMe,
} from "../controllers/auth.controller";

import { protect } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.post("/google", googleAuth);

router.get("/me", protect, getMe);

router.patch("/me", protect, upload.single("image"), updateMe);

export default router;
