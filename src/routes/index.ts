import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import categoryRoutes from "./category.routes";
import productRoutes from "./product.routes";
import barcodeRoutes from "./barcode.routes";
import orderRoutes from "./order.routes";
import wishlistRoutes from "./wishlist.routes";
import adminRoutes from "./admin.routes";
import paymentRoutes from "./payment.routes";
import uploadRoutes from "./upload.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/barcodes", barcodeRoutes);
router.use("/orders", orderRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/admin", adminRoutes);
router.use("/payments", paymentRoutes);
router.use("/upload", uploadRoutes);

export default router;
