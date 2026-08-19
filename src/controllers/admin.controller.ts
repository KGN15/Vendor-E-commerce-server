import { Request, Response } from "express";
import { User } from "../models/User";
import { Order } from "../models/Order";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

export const getCustomers = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const search = String(req.query.search || "").trim();

    const filter: Record<string, unknown> = {
      role: "CUSTOMER",
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

    const customerIds = customers.map((customer) => customer._id);

    const orderStats = await Order.aggregate([
      {
        $match: {
          "customer.user": { $in: customerIds },
        },
      },
      {
        $group: {
          _id: "$customer.user",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" },
        },
      },
    ]);

    const statsMap = new Map(
      orderStats.map((item) => [
        item._id.toString(),
        {
          orderCount: item.orderCount,
          totalSpent: item.totalSpent,
        },
      ])
    );

    const data = customers.map((customer) => {
      const stats = statsMap.get(customer._id.toString());

      return {
        ...customer,
        orderCount: stats?.orderCount ?? 0,
        totalSpent: stats?.totalSpent ?? 0,
      };
    });

    res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }
);

export const getCustomerById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const customer = await User.findOne({
      _id: id,
      role: "CUSTOMER",
    })
      .select("-password")
      .lean();

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    const orders = await Order.find({
      "customer.user": customer._id,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const totalSpent = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0
    );

    res.status(200).json({
      success: true,
      data: {
        customer,
        stats: {
          orderCount: orders.length,
          totalSpent,
        },
        orders,
      },
    });
  }
);

