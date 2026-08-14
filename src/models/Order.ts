import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type PaymentStatus = "PENDING" | "PARTIAL" | "PAID";
export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";
export type PaymentMethod = "COD" | "ONLINE";
export type CourierProvider = "STEADFAST" | "PATHAO";

export interface ICustomerDetails {
  user: Types.ObjectId;
  name: string;
  phone: string;
  address: string;
}

export interface IOrderItemSnapshot {
  variant: Types.ObjectId;
  product: Types.ObjectId;
  productName: string;
  barcode: string;
  size?: string;
  color?: string;
  design?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}
export interface IOrder extends Document {
  user: Types.ObjectId;
  customer: ICustomerDetails;
  items: IOrderItemSnapshot[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  courierProvider?: CourierProvider;
  consignmentId?: string;
  courierStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomerDetails>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "Customer phone is required"],
      trim: true,
    },

    address: {
      type: String,
      required: [true, "Customer address is required"],
      trim: true,
    },
  },
  { _id: false }
);

const orderItemSnapshotSchema = new Schema<IOrderItemSnapshot>(
  {
    variant: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    barcode: {
      type: String,
      required: true,
      trim: true,
    },
    size: { type: String, trim: true },
    color: { type: String, trim: true },
    design: { type: String, trim: true },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, "Unit price cannot be negative"],
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, "Subtotal cannot be negative"],
    },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    customer: {
      type: customerSchema,
      required: true,
    },
    items: {
      type: [orderItemSnapshotSchema],
      required: true,
      validate: {
        validator: (items: IOrderItemSnapshot[]) => items.length > 0,
        message: "Order must contain at least one item",
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },
    paidAmount: {
      type: Number,
      required: true,
      min: [0, "Paid amount cannot be negative"],
      default: 0,
    },
    dueAmount: {
      type: Number,
      required: true,
      min: [0, "Due amount cannot be negative"],
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PARTIAL", "PAID"],
      required: true,
      default: "PENDING",
    },
    orderStatus: {
      type: String,
      enum: ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
      required: true,
      default: "PENDING",
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      required: true,
    },
    courierProvider: {
      type: String,
      enum: ["STEADFAST", "PATHAO"],
    },
    consignmentId: {
      type: String,
      trim: true,
    },
    courierStatus: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export const PAYMENT_STATUSES: PaymentStatus[] = [
  "PENDING",
  "PARTIAL",
  "PAID",
];

export const Order: Model<IOrder> =
  mongoose.models.Order ?? mongoose.model<IOrder>("Order", orderSchema);

  