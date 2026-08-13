import { Router } from "express";
import {
  addProductReview,
  createProduct,
  getProductById,
  getProducts,
} from "../controllers/product.controller";
import { authorize, protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", protect, authorize("ADMIN"), createProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/:id/reviews", protect, addProductReview);

export default router;
