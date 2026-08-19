import { Router } from "express";
import {
  getMe,
  googleAuth,
  login,
  register,
} from "../controllers/auth.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.post("/google", googleAuth);

router.get("/me", protect, getMe);

router.patch("/me", protect, updateMe);

export default router;
