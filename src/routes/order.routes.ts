import { Router } from "express";

import {
  checkout,
  getOrders,
  getMyOrders,
  getMyOrderById,
  getOrderById,
  payOrderDue,
  updateOrderStatus,
} from "../controllers/order.controller";

import {
  authorize,
  protect,
} from "../middlewares/auth.middleware";

const router = Router();

/*
|--------------------------------------------------------------------------
| Customer
|--------------------------------------------------------------------------
*/

router.post("/checkout", protect, checkout);

router.get("/my-orders", protect, getMyOrders);

router.get("/my-orders/:id", protect, getMyOrderById);

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  protect,
  authorize("ADMIN"),
  getOrders
);

router.get(
  "/:id",
  protect,
  authorize("ADMIN"),
  getOrderById
);

router.patch(
  "/:id/status",
  protect,
  authorize("ADMIN"),
  updateOrderStatus
);

router.patch(
  "/:id/pay-due",
  protect,
  authorize("ADMIN"),
  payOrderDue
);

export default router;