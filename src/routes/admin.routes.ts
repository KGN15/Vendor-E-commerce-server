import { Router } from "express";
import {
  getAnalytics,
} from "../controllers/report.controller";
import {
  getCustomers,
  getCustomerById,
} from "../controllers/admin.controller";
import {
  authorize,
  protect,
} from "../middlewares/auth.middleware";

const router = Router();

router.use(protect, authorize("ADMIN"));

// Dashboard
router.get("/analytics", getAnalytics);

// Customers
router.get("/customers", getCustomers, protect,
  authorize("ADMIN"),);
router.get("/customers/:id", getCustomerById, protect,
  authorize("ADMIN"),);

export default router;