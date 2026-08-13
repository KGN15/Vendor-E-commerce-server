import { Request, Response } from "express";
import { Category } from "../models/Category";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { validateTwoDigits } from "../utils/digitValidators";

export const createCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, slug, prefix } = req.body;

    if (!name || typeof name !== "string") {
      throw new AppError("Category name is required", 400);
    }

    if (!prefix || !validateTwoDigits(prefix)) {
      throw new AppError("Prefix must be exactly 2 digits", 400);
    }

    const category = await Category.create({
      name: name.trim(),
      slug: typeof slug === "string" ? slug.trim().toLowerCase() : undefined,
      prefix,
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  }
);

export const getCategories = asyncHandler(
  async (_req: Request, res: Response) => {
    const categories = await Category.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  }
);
