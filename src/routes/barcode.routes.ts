import { Router } from "express";
import { getVariantByBarcode } from "../controllers/product.controller";

const router = Router();

router.get("/:code", getVariantByBarcode);

export default router;
