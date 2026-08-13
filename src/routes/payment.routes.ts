import { Router } from "express";
import {
  getPaymentReference,
  handlePaymentWebhook,
  initiatePayment,
  verifyPayment,
} from "../controllers/payment.controller";

const router = Router();

router.get("/reference", getPaymentReference);
router.post("/initiate", initiatePayment);
router.post("/webhook", handlePaymentWebhook);
router.get("/verify/:trxId", verifyPayment);

export default router;
