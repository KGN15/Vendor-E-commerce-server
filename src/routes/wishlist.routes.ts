import { Router } from "express";
import {
  getWishlist,
  toggleWishlist,
} from "../controllers/wishlist.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/toggle", protect, toggleWishlist);
router.get("/", protect, getWishlist);

export default router;
