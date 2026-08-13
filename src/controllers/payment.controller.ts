import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  PAYMENT_GATEWAYS,
  PAYMENT_RECORD_STATUSES,
  Payment,
  PaymentGateway,
  PaymentRecordStatus,
  PaymentType,
} from "../models/Payment";
import { Order } from "../models/Order";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { logActivity } from "../utils/activityLogger";
import {
  buildMockGatewayPayload,
  generateTransactionId,
  generateWebhookSignature,
  resolvePaymentStatus,
  verifyWebhookSignature,
} from "../utils/paymentHelpers";

interface InitiatePaymentBody {
  orderId: string;
  amount: number;
  gateway: PaymentGateway;
  paymentType: PaymentType;
}

interface PaymentWebhookBody {
  transactionId: string;
  status: PaymentRecordStatus;
  val_id?: string;
  signature: string;
}

const GATEWAY_SET = new Set<string>(PAYMENT_GATEWAYS);
const WEBHOOK_STATUS_SET = new Set<string>([
  "SUCCESS",
  "FAILED",
  "CANCELLED",
]);

const generateUniqueTransactionId = async (): Promise<string> => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const transactionId = generateTransactionId();
    const exists = await Payment.exists({ transactionId });

    if (!exists) {
      return transactionId;
    }
  }

  throw new AppError("Unable to generate a unique transaction ID", 500);
};

export const initiatePayment = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderId, amount, gateway, paymentType } =
      req.body as InitiatePaymentBody;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      throw new AppError("Valid orderId is required", 400);
    }

    if (!amount || amount <= 0) {
      throw new AppError("A positive amount is required", 400);
    }

    if (!gateway || !GATEWAY_SET.has(gateway)) {
      throw new AppError("Valid gateway is required", 400);
    }

    if (!paymentType || !["FULL", "PARTIAL"].includes(paymentType)) {
      throw new AppError("paymentType must be FULL or PARTIAL", 400);
    }

    const order = await Order.findById(orderId);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.orderStatus === "CANCELLED") {
      throw new AppError("Cannot initiate payment for a cancelled order", 409);
    }

    if (order.dueAmount <= 0) {
      throw new AppError("No due balance remaining on this order", 409);
    }

    if (amount > order.dueAmount) {
      throw new AppError(
        `Payment amount exceeds due balance (${order.dueAmount})`,
        400
      );
    }

    if (paymentType === "FULL" && amount !== order.dueAmount) {
      throw new AppError(
        "FULL payment amount must equal the remaining due balance",
        400
      );
    }

    if (paymentType === "PARTIAL" && amount > order.dueAmount) {
      throw new AppError(
        "PARTIAL payment amount cannot exceed the remaining due balance",
        400
      );
    }

    const transactionId = await generateUniqueTransactionId();
    const gatewayPayload = buildMockGatewayPayload(
      transactionId,
      gateway,
      amount,
      order._id.toString()
    );

    const payment = await Payment.create({
      order: order._id,
      transactionId,
      amount,
      paymentType,
      gateway,
      status: "INITIATED",
      gatewayResponse: gatewayPayload,
    });

    await logActivity("PAYMENT", `Payment initiated: ${transactionId}`, {
      orderId: order._id,
      transactionId,
      amount,
      gateway,
    });

    res.status(201).json({
      success: true,
      data: {
        payment,
        checkout: gatewayPayload,
        webhookSignatureHint: generateWebhookSignature(transactionId),
      },
    });
  }
);

export const handlePaymentWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const { transactionId, status, val_id, signature } =
      req.body as PaymentWebhookBody;

    if (!transactionId || typeof transactionId !== "string") {
      throw new AppError("transactionId is required", 400);
    }

    if (!status || !WEBHOOK_STATUS_SET.has(status)) {
      throw new AppError("Valid webhook status is required", 400);
    }

    if (!signature || typeof signature !== "string") {
      throw new AppError("signature is required", 400);
    }

    if (signature.length !== 64 || !verifyWebhookSignature(transactionId, signature)) {
      throw new AppError("Invalid webhook signature", 401);
    }

    const payment = await Payment.findOne({ transactionId });

    if (!payment) {
      throw new AppError("Payment transaction not found", 404);
    }

    if (payment.status === "SUCCESS") {
      res.status(200).json({
        success: true,
        message: "Payment already processed",
        data: payment,
      });
      return;
    }

    if (payment.status === "FAILED" || payment.status === "CANCELLED") {
      throw new AppError("Payment is already closed and cannot be updated", 409);
    }

    payment.gatewayResponse = {
      ...payment.gatewayResponse,
      val_id,
      signature,
      webhookStatus: status,
      receivedAt: new Date().toISOString(),
    };

    if (status === "SUCCESS") {
      const order = await Order.findById(payment.order);

      if (!order) {
        throw new AppError("Associated order not found", 404);
      }

      if (order.orderStatus === "CANCELLED") {
        payment.status = "FAILED";
        payment.gatewayResponse = {
          ...payment.gatewayResponse,
          failureReason: "Order is cancelled",
        };
        await payment.save();
        throw new AppError("Cannot apply payment to a cancelled order", 409);
      }

      payment.status = "SUCCESS";

      order.paidAmount = Number((order.paidAmount + payment.amount).toFixed(2));
      order.dueAmount = Number((order.totalAmount - order.paidAmount).toFixed(2));
      order.paymentStatus = resolvePaymentStatus(
        order.totalAmount,
        order.paidAmount
      );

      await Promise.all([payment.save(), order.save()]);

      await logActivity("PAYMENT", `Gateway payment successful: ${transactionId}`, {
        orderId: order._id,
        transactionId,
        amount: payment.amount,
        paymentStatus: order.paymentStatus,
        dueAmount: order.dueAmount,
      });

      res.status(200).json({
        success: true,
        message: "Payment applied successfully",
        data: {
          payment,
          order,
        },
      });
      return;
    }

    payment.status = status;
    await payment.save();

    await logActivity("PAYMENT", `Gateway payment ${status.toLowerCase()}: ${transactionId}`, {
      transactionId,
      status,
    });

    res.status(200).json({
      success: true,
      message: `Payment marked as ${status}`,
      data: payment,
    });
  }
);

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const trxId = req.params.trxId;

  if (!trxId || Array.isArray(trxId)) {
    throw new AppError("Transaction ID is required", 400);
  }

  const payment = await Payment.findOne({ transactionId: trxId }).populate("order");

  if (!payment) {
    throw new AppError("Payment transaction not found", 404);
  }

  res.status(200).json({
    success: true,
    data: payment,
  });
});

export const getPaymentReference = asyncHandler(
  async (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        gateways: PAYMENT_GATEWAYS,
        statuses: PAYMENT_RECORD_STATUSES,
        signatureExample: {
          note: "signature = HMAC-SHA256(transactionId, JWT_SECRET)",
          transactionId: "TRX-98231",
        },
      },
    });
  }
);
