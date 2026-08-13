import crypto from "crypto";
import { PaymentStatus } from "../models/Order";
import { PaymentGateway } from "../models/Payment";
import { env } from "../config/env";

export const resolvePaymentStatus = (
  totalAmount: number,
  paidAmount: number
): PaymentStatus => {
  if (paidAmount <= 0) {
    return "PENDING";
  }

  if (paidAmount >= totalAmount) {
    return "PAID";
  }

  return "PARTIAL";
};

export const generateTransactionId = (): string => {
  const serial = Math.floor(10000 + Math.random() * 90000);
  return `TRX-${serial}`;
};

export const buildMockCheckoutUrl = (
  transactionId: string,
  gateway: PaymentGateway,
  amount: number
): string => {
  const baseUrl = `http://localhost:${env.port}/api/payments/mock-checkout`;
  const params = new URLSearchParams({
    transactionId,
    gateway,
    amount: String(amount),
  });

  return `${baseUrl}?${params.toString()}`;
};

export const buildMockGatewayPayload = (
  transactionId: string,
  gateway: PaymentGateway,
  amount: number,
  orderId: string
) => ({
  transactionId,
  gateway,
  amount,
  orderId,
  checkoutUrl: buildMockCheckoutUrl(transactionId, gateway, amount),
  expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  instructions:
    "Use POST /api/payments/webhook with status SUCCESS to simulate gateway IPN callback.",
});

export const generateWebhookSignature = (transactionId: string): string =>
  crypto
    .createHmac("sha256", env.jwtSecret)
    .update(transactionId)
    .digest("hex");

export const verifyWebhookSignature = (
  transactionId: string,
  signature: string
): boolean => {
  const expected = generateWebhookSignature(transactionId);
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
};
