import { Request, Response } from "express";
import { Review } from "../models/Review";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

export const getAdminReviews = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const filter: Record<string, any> = {};

    if (search) {
      filter.$or = [
        { comment: { $regex: search, $options: "i" } },
      ];
    }

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("user", "name email")
        .populate("product", "name thumbnail")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Review.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
);

export const getAdminReviewById = asyncHandler(
  async (req: Request, res: Response) => {
    const review = await Review.findById(req.params.id)
      .populate("user", "name email")
      .populate("product", "name thumbnail");

    if (!review) {
      throw new AppError("Review not found", 404);
    }

    res.status(200).json({
      success: true,
      data: review,
    });
  }
);

export const deleteAdminReview = asyncHandler(
  async (req: Request, res: Response) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
      throw new AppError("Review not found", 404);
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  }
);