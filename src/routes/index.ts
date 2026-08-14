import { Router } from "express";

import authRoutes from "./auth.routes";
import productRoutes from "./product.routes";
import categoryRoutes from "./category.routes";
import orderRoutes from "./order.routes";
import paymentRoutes from "./payment.routes";
import wishlistRoutes from "./wishlist.routes";
import uploadRoutes from "./upload.routes";
import barcodeRoutes from "./barcode.routes";
import reviewRoutes from "./review.routes";
import adminRoutes from "./admin.routes";
import healthRoutes from "./health.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use(reviewRoutes);
router.use("/categories", categoryRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/uploads", uploadRoutes);
router.use("/barcode", barcodeRoutes);
router.use("/admin", adminRoutes);
router.use("/health", healthRoutes);

export default router;