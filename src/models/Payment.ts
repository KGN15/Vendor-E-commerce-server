import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type PaymentGateway = "BKASH" | "NAGAD" | "SSLCOMMERZ" | "MOCK";
export type PaymentRecordStatus =
  | "INITIATED"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED";
export type PaymentType = "FULL" | "PARTIAL";

export interface IPayment extends Document {
  order: Types.ObjectId;
  transactionId: string;
  amount: number;
  paymentType: PaymentType;
  gateway: PaymentGateway;
  status: PaymentRecordStatus;
  gatewayResponse: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, "Amount must be greater than zero"],
    },
    paymentType: {
      type: String,
      enum: ["FULL", "PARTIAL"],
      required: true,
    },
    gateway: {
      type: String,
      enum: ["BKASH", "NAGAD", "SSLCOMMERZ", "MOCK"],
      required: true,
    },
    status: {
      type: String,
      enum: ["INITIATED", "SUCCESS", "FAILED", "CANCELLED"],
      default: "INITIATED",
      index: true,
    },
    gatewayResponse: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export const PAYMENT_GATEWAYS: PaymentGateway[] = [
  "BKASH",
  "NAGAD",
  "SSLCOMMERZ",
  "MOCK",
];

export const PAYMENT_RECORD_STATUSES: PaymentRecordStatus[] = [
  "INITIATED",
  "SUCCESS",
  "FAILED",
  "CANCELLED",
];

export const Payment: Model<IPayment> =
  mongoose.models.Payment ?? mongoose.model<IPayment>("Payment", paymentSchema);
