import { Router } from "express";
import {
  addProductReview,
  createProduct,
  getProductById,
  getProducts,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller";
import { authorize, protect } from "../middlewares/auth.middleware";

const router = Router();

// Create
router.post("/", protect, authorize("ADMIN"), createProduct);

// Read
router.get("/", getProducts);
router.get("/:id", getProductById);

// Update
router.put("/:id", protect, authorize("ADMIN"), updateProduct);

// Delete
router.delete("/:id", protect, authorize("ADMIN"), deleteProduct);

// Reviews
router.post("/:id/reviews", protect, addProductReview);

export default router;