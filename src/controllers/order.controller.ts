import { Request, Response } from "express";
import mongoose from "mongoose";
import { Cart } from "../models/Cart";
import {
  IOrderItemSnapshot,
  ORDER_STATUSES,
  Order,
  OrderStatus,
  PAYMENT_STATUSES,
  PaymentMethod,
  PaymentStatus,
} from "../models/Order";
import { Product } from "../models/Product";
import { ProductVariant } from "../models/ProductVariant";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { createCourierShipment } from "../utils/courierAdapter";
import { logActivity } from "../utils/activityLogger";

interface CheckoutItemInput {
  variant: string;
  quantity: number;
}

interface CheckoutBody {
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  paymentMethod: PaymentMethod;
  paidAmount?: number;
  items?: CheckoutItemInput[];
  cartId?: string;
  courierProvider?: "STEADFAST" | "PATHAO";
}

interface StockAdjustment {
  variantId: string;
  quantity: number;
}

const resolvePaymentStatus = (
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

const buildCheckoutItems = async (
  items: CheckoutItemInput[]
): Promise<{
  snapshots: IOrderItemSnapshot[];
  stockAdjustments: StockAdjustment[];
}> => {
  const snapshots: IOrderItemSnapshot[] = [];
  const stockAdjustments: StockAdjustment[] = [];

  for (const [index, item] of items.entries()) {
    if (!item.variant || !mongoose.Types.ObjectId.isValid(item.variant)) {
      throw new AppError(`Item at index ${index}: valid variant ID is required`, 400);
    }

    if (!item.quantity || item.quantity < 1) {
      throw new AppError(`Item at index ${index}: quantity must be at least 1`, 400);
    }

    const variant = await ProductVariant.findById(item.variant);

    if (!variant || !variant.isActive) {
      throw new AppError(`Item at index ${index}: variant not found or inactive`, 404);
    }

    if (variant.stock < item.quantity) {
      throw new AppError(
        `Insufficient stock for variant ${variant.barcode}. Available: ${variant.stock}, requested: ${item.quantity}`,
        409
      );
    }

    const product = await Product.findById(variant.product);

    if (!product || !product.isActive) {
      throw new AppError(`Item at index ${index}: product not found or inactive`, 404);
    }

    const unitPrice = variant.price;
    const subtotal = Number((unitPrice * item.quantity).toFixed(2));

    snapshots.push({
      variant: variant._id,
      product: product._id,
      productName: product.name,
      barcode: variant.barcode,
      size: variant.size,
      color: variant.color,
      design: variant.design,
      quantity: item.quantity,
      unitPrice,
      subtotal,
    });

    stockAdjustments.push({
      variantId: variant._id.toString(),
      quantity: item.quantity,
    });
  }

  return { snapshots, stockAdjustments };
};

const resolveCheckoutItems = async (
  body: CheckoutBody
): Promise<CheckoutItemInput[]> => {
  if (body.cartId) {
    if (!mongoose.Types.ObjectId.isValid(body.cartId)) {
      throw new AppError("Valid cart ID is required", 400);
    }

    const cart = await Cart.findById(body.cartId);

    if (!cart || cart.items.length === 0) {
      throw new AppError("Cart not found or empty", 404);
    }

    return cart.items.map((item) => ({
      variant: item.variant.toString(),
      quantity: item.quantity,
    }));
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw new AppError("Either cartId or a non-empty items array is required", 400);
  }

  return body.items;
};

const decrementStock = async (
  adjustments: StockAdjustment[]
): Promise<void> => {
  for (const adjustment of adjustments) {
    const updatedVariant = await ProductVariant.findOneAndUpdate(
      {
        _id: adjustment.variantId,
        stock: { $gte: adjustment.quantity },
      },
      { $inc: { stock: -adjustment.quantity } },
      { new: true }
    );

    if (!updatedVariant) {
      throw new AppError(
        `Unable to reserve stock for variant ${adjustment.variantId}`,
        409
      );
    }
  }
};

const restoreStock = async (adjustments: StockAdjustment[]): Promise<void> => {
  await Promise.all(
    adjustments.map((adjustment) =>
      ProductVariant.findByIdAndUpdate(adjustment.variantId, {
        $inc: { stock: adjustment.quantity },
      })
    )
  );
};

export const checkout = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CheckoutBody;

  if (!body.customer?.name || !body.customer?.phone || !body.customer?.address) {
    throw new AppError("Customer name, phone, and address are required", 400);
  }

  if (!body.paymentMethod || !["COD", "ONLINE"].includes(body.paymentMethod)) {
    throw new AppError("paymentMethod must be COD or ONLINE", 400);
  }

  const checkoutItems = await resolveCheckoutItems(body);
  const { snapshots, stockAdjustments } = await buildCheckoutItems(checkoutItems);

  const totalAmount = Number(
    snapshots.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)
  );

  const paidAmount =
    body.paidAmount !== undefined
      ? Number(body.paidAmount)
      : body.paymentMethod === "ONLINE"
        ? totalAmount
        : 0;

  if (paidAmount < 0 || paidAmount > totalAmount) {
    throw new AppError("paidAmount must be between 0 and totalAmount", 400);
  }

  const dueAmount = Number((totalAmount - paidAmount).toFixed(2));
  const paymentStatus = resolvePaymentStatus(totalAmount, paidAmount);

  await decrementStock(stockAdjustments);

  let order;

  try {
    order = await Order.create({
      customer: {
        name: body.customer.name.trim(),
        phone: body.customer.phone.trim(),
        address: body.customer.address.trim(),
      },
      items: snapshots,
      totalAmount,
      paidAmount,
      dueAmount,
      paymentStatus,
      orderStatus: "PENDING",
      paymentMethod: body.paymentMethod,
    });

    if (body.cartId) {
      await Cart.findByIdAndDelete(body.cartId);
    }

    await logActivity("ORDER", `Order placed: ${order._id}`, {
      orderId: order._id,
      totalAmount,
      dueAmount,
    });
  } catch (error) {
    await restoreStock(stockAdjustments);
    throw error;
  }

  res.status(201).json({
    success: true,
    data: order,
  });
});

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const { orderStatus, paymentStatus } = req.query;

  const filter: Record<string, string> = {};

  if (orderStatus) {
    if (
      typeof orderStatus !== "string" ||
      !ORDER_STATUSES.includes(orderStatus as OrderStatus)
    ) {
      throw new AppError("Invalid orderStatus filter", 400);
    }

    filter.orderStatus = orderStatus;
  }

  if (paymentStatus) {
    if (
      typeof paymentStatus !== "string" ||
      !PAYMENT_STATUSES.includes(paymentStatus as PaymentStatus)
    ) {
      throw new AppError("Invalid paymentStatus filter", 400);
    }

    filter.paymentStatus = paymentStatus;
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id;

    if (!id || Array.isArray(id) || !mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Valid order ID is required", 400);
    }

    const { orderStatus, courierProvider } = req.body as {
      orderStatus?: OrderStatus;
      courierProvider?: "STEADFAST" | "PATHAO";
    };

    if (!orderStatus || !ORDER_STATUSES.includes(orderStatus)) {
      throw new AppError("Valid orderStatus is required", 400);
    }

    const order = await Order.findById(id);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.orderStatus === "CANCELLED") {
      throw new AppError("Cannot update a cancelled order", 409);
    }

    if (order.orderStatus === "DELIVERED" && orderStatus !== "DELIVERED") {
      throw new AppError("Delivered orders cannot be moved to another status", 409);
    }

    order.orderStatus = orderStatus;

    if (orderStatus === "SHIPPED" && !order.consignmentId) {
      const shipment = await createCourierShipment(
        order._id,
        courierProvider ?? order.courierProvider ?? "STEADFAST"
      );

      order.courierProvider = shipment.provider;
      order.consignmentId = shipment.consignmentId;
      order.courierStatus = shipment.status;
    }

    await order.save();

    await logActivity("ORDER", `Order status updated to ${orderStatus}`, {
      orderId: order._id,
      orderStatus,
    });

    res.status(200).json({
      success: true,
      data: order,
    });
  }
);

export const payOrderDue = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id;

    if (!id || Array.isArray(id) || !mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Valid order ID is required", 400);
    }

    const { amount } = req.body as { amount?: number };

    if (amount === undefined || amount <= 0) {
      throw new AppError("A positive payment amount is required", 400);
    }

    const order = await Order.findById(id);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.orderStatus === "CANCELLED") {
      throw new AppError("Cannot collect payment for a cancelled order", 409);
    }

    if (order.dueAmount <= 0) {
      throw new AppError("No due amount remaining on this order", 409);
    }

    if (amount > order.dueAmount) {
      throw new AppError(
        `Payment amount exceeds due amount (${order.dueAmount})`,
        400
      );
    }

    order.paidAmount = Number((order.paidAmount + amount).toFixed(2));
    order.dueAmount = Number((order.totalAmount - order.paidAmount).toFixed(2));
    order.paymentStatus = resolvePaymentStatus(order.totalAmount, order.paidAmount);

    await order.save();

    await logActivity("PAYMENT", `Due payment collected for order ${order._id}`, {
      orderId: order._id,
      amount,
      dueAmount: order.dueAmount,
      paymentStatus: order.paymentStatus,
    });

    res.status(200).json({
      success: true,
      data: order,
    });
  }
);
