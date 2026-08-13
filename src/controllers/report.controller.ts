import { Request, Response } from "express";
import { Order } from "../models/Order";
import { ProductVariant } from "../models/ProductVariant";
import { ActivityLog } from "../models/ActivityLog";
import { asyncHandler } from "../utils/asyncHandler";

const LOW_STOCK_THRESHOLD = 5;

export const getAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const [
    revenueResult,
    dueResult,
    totalOrders,
    lowStockVariants,
    recentActivity,
  ] = await Promise.all([
    Order.aggregate([
      {
        $group: {
          _id: null,
          totalSalesRevenue: { $sum: "$paidAmount" },
        },
      },
    ]),
    Order.aggregate([
      { $match: { dueAmount: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          outstandingDueTotal: { $sum: "$dueAmount" },
        },
      },
    ]),
    Order.countDocuments(),
    ProductVariant.countDocuments({
      isActive: true,
      stock: { $lte: LOW_STOCK_THRESHOLD },
    }),
    ActivityLog.find().sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalSalesRevenue: revenueResult[0]?.totalSalesRevenue ?? 0,
      outstandingDueTotal: dueResult[0]?.outstandingDueTotal ?? 0,
      totalOrdersCount: totalOrders,
      lowStockVariantsCount: lowStockVariants,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      recentActivityLogs: recentActivity,
    },
  });
});
