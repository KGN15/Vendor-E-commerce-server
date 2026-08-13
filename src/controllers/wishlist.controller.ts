import { Request, Response } from "express";
import mongoose from "mongoose";
import { Product } from "../models/Product";
import { Wishlist } from "../models/Wishlist";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { logActivity } from "../utils/activityLogger";

interface ToggleWishlistBody {
  productId: string;
}

export const toggleWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { productId } = req.body as ToggleWishlistBody;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      throw new AppError("Valid productId is required", 400);
    }

    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      throw new AppError("Product not found or inactive", 404);
    }

    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user.id,
        products: [product._id],
      });

      await logActivity("WISHLIST", `Product added to wishlist: ${product.name}`, {
        userId: req.user.id,
        productId: product._id,
      });

      res.status(200).json({
        success: true,
        data: {
          action: "added",
          wishlist,
        },
      });
      return;
    }

    const productIndex = wishlist.products.findIndex(
      (id) => id.toString() === productId
    );

    if (productIndex >= 0) {
      wishlist.products.splice(productIndex, 1);
      await wishlist.save();

      await logActivity("WISHLIST", `Product removed from wishlist: ${product.name}`, {
        userId: req.user.id,
        productId: product._id,
      });

      res.status(200).json({
        success: true,
        data: {
          action: "removed",
          wishlist,
        },
      });
      return;
    }

    wishlist.products.push(product._id);
    await wishlist.save();

    await logActivity("WISHLIST", `Product added to wishlist: ${product.name}`, {
      userId: req.user.id,
      productId: product._id,
    });

    res.status(200).json({
      success: true,
      data: {
        action: "added",
        wishlist,
      },
    });
  }
);

export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const wishlist = await Wishlist.findOne({ user: req.user.id }).populate({
    path: "products",
    populate: { path: "category" },
  });

  res.status(200).json({
    success: true,
    data: wishlist ?? { user: req.user.id, products: [] },
  });
});
