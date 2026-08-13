import mongoose from "mongoose";
import { Product } from "../models/Product";
import { Review } from "../models/Review";

export const recalculateProductRating = async (
  productId: string
): Promise<void> => {
  const stats = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const summary = stats[0];

  await Product.findByIdAndUpdate(productId, {
    averageRating: summary
      ? Number(summary.averageRating.toFixed(2))
      : 0,
    reviewCount: summary ? summary.reviewCount : 0,
  });
};
