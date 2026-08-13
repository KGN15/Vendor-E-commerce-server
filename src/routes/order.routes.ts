import { Router } from "express";
import {
  checkout,
  getOrders,
  payOrderDue,
  updateOrderStatus,
} from "../controllers/order.controller";
import { authorize, optionalProtect, protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/checkout", optionalProtect, checkout);
router.get("/", getOrders);
router.patch("/:id/pay-due", protect, authorize("ADMIN"), payOrderDue);
router.patch("/:id/status", protect, authorize("ADMIN"), updateOrderStatus);

export default router;
