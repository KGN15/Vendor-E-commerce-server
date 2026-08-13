import { Request, Response } from "express";
import mongoose, { FilterQuery } from "mongoose";
import { Category } from "../models/Category";
import { Product, IProduct } from "../models/Product";
import { ProductVariant } from "../models/ProductVariant";
import { Review } from "../models/Review";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { generate12DigitBarcode } from "../utils/barcodeGenerator";
import {
  validateFourDigits,
  validateTwelveDigits,
} from "../utils/digitValidators";
import { logActivity } from "../utils/activityLogger";
import { recalculateProductRating } from "../utils/productRating";

interface CreateVariantInput {
  size?: string;
  color?: string;
  design?: string;
  stock: number;
  price: number;
  sizeCode: string;
  attributes?: Record<string, string>;
}

interface CreateProductBody {
  name: string;
  slug?: string;
  description?: string;
  fullDescription?: string;
  images?: string[];
  thumbnail?: string;
  highlights?: string[];
  category: string;
  variants: CreateVariantInput[];
}

interface AddReviewBody {
  rating: number;
  comment: string;
}

type SortOption =
  | "price_asc"
  | "price_desc"
  | "name_asc"
  | "name_desc"
  | "newest";

const parseVariantInput = (variant: CreateVariantInput, index: number) => {
  if (!variant.sizeCode || !validateFourDigits(variant.sizeCode)) {
    throw new AppError(
      `Variant at index ${index}: sizeCode must be exactly 4 digits`,
      400
    );
  }

  if (variant.stock === undefined || variant.stock < 0) {
    throw new AppError(
      `Variant at index ${index}: stock must be a non-negative number`,
      400
    );
  }

  if (variant.price === undefined || variant.price < 0) {
    throw new AppError(
      `Variant at index ${index}: price must be a non-negative number`,
      400
    );
  }

  return variant;
};

const parseBooleanQuery = (value: unknown): boolean | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }

  return undefined;
};

const resolveCategoryFilter = async (
  categoryParam: string
): Promise<mongoose.Types.ObjectId | null> => {
  if (/^\d{2}$/.test(categoryParam)) {
    const category = await Category.findOne({ prefix: categoryParam });
    return category?._id ?? null;
  }

  if (mongoose.Types.ObjectId.isValid(categoryParam)) {
    return new mongoose.Types.ObjectId(categoryParam);
  }

  throw new AppError("Invalid category filter", 400);
};

export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      name,
      slug,
      description,
      fullDescription,
      images,
      thumbnail,
      highlights,
      category,
      variants,
    } = req.body as CreateProductBody;

    if (!name || typeof name !== "string") {
      throw new AppError("Product name is required", 400);
    }

    if (!category || !mongoose.Types.ObjectId.isValid(category)) {
      throw new AppError("Valid category ID is required", 400);
    }

    if (!Array.isArray(variants) || variants.length === 0) {
      throw new AppError("At least one variant is required", 400);
    }

    const categoryDoc = await Category.findById(category);

    if (!categoryDoc) {
      throw new AppError("Category not found", 404);
    }

    const parsedVariants = variants.map(parseVariantInput);

    const product = await Product.create({
      name: name.trim(),
      slug: typeof slug === "string" ? slug.trim().toLowerCase() : undefined,
      description:
        typeof description === "string" ? description.trim() : undefined,
      fullDescription:
        typeof fullDescription === "string" ? fullDescription.trim() : undefined,
      images: Array.isArray(images) ? images : [],
      thumbnail: typeof thumbnail === "string" ? thumbnail.trim() : undefined,
      highlights: Array.isArray(highlights) ? highlights : [],
      category: categoryDoc._id,
    });

    const createdVariants = [];

    try {
      for (const variant of parsedVariants) {
        const barcode = await generate12DigitBarcode(
          categoryDoc.prefix,
          variant.sizeCode
        );

        const attributes = new Map<string, string>();

        if (variant.size) attributes.set("size", variant.size);
        if (variant.color) attributes.set("color", variant.color);
        if (variant.design) attributes.set("design", variant.design);

        if (variant.attributes) {
          for (const [key, value] of Object.entries(variant.attributes)) {
            attributes.set(key, value);
          }
        }

        const productVariant = await ProductVariant.create({
          product: product._id,
          category: categoryDoc._id,
          size: variant.size,
          color: variant.color,
          design: variant.design,
          attributes,
          stock: variant.stock,
          price: variant.price,
          sizeCode: variant.sizeCode,
          barcode,
        });

        createdVariants.push(productVariant);
      }
    } catch (error) {
      await ProductVariant.deleteMany({ product: product._id });
      await Product.findByIdAndDelete(product._id);
      throw error;
    }

    await logActivity("PRODUCT", `Product created: ${product.name}`, {
      productId: product._id,
    });

    res.status(201).json({
      success: true,
      data: {
        product,
        variants: createdVariants,
      },
    });
  }
);

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    inStock,
    sortBy = "newest",
  } = req.query;

  const productFilter: FilterQuery<IProduct> = { isActive: true };

  if (search && typeof search === "string" && search.trim()) {
    productFilter.$or = [
      { name: { $regex: search.trim(), $options: "i" } },
      { description: { $regex: search.trim(), $options: "i" } },
      { fullDescription: { $regex: search.trim(), $options: "i" } },
    ];
  }

  if (category && typeof category === "string") {
    const categoryId = await resolveCategoryFilter(category);

    if (!categoryId) {
      res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
      return;
    }

    productFilter.category = categoryId;
  }

  const parsedMinPrice =
    minPrice !== undefined ? Number(minPrice) : undefined;
  const parsedMaxPrice =
    maxPrice !== undefined ? Number(maxPrice) : undefined;
  const inStockFilter = parseBooleanQuery(inStock);

  if (parsedMinPrice !== undefined && Number.isNaN(parsedMinPrice)) {
    throw new AppError("minPrice must be a valid number", 400);
  }

  if (parsedMaxPrice !== undefined && Number.isNaN(parsedMaxPrice)) {
    throw new AppError("maxPrice must be a valid number", 400);
  }

  const products = await Product.find(productFilter)
    .populate("category")
    .lean();

  const productIds = products.map((product) => product._id);

  if (productIds.length === 0) {
    res.status(200).json({
      success: true,
      count: 0,
      data: [],
    });
    return;
  }

  const variantFilter: FilterQuery<typeof ProductVariant> = {
    product: { $in: productIds },
    isActive: true,
  };

  if (parsedMinPrice !== undefined || parsedMaxPrice !== undefined) {
    variantFilter.price = {};
    if (parsedMinPrice !== undefined) {
      variantFilter.price.$gte = parsedMinPrice;
    }
    if (parsedMaxPrice !== undefined) {
      variantFilter.price.$lte = parsedMaxPrice;
    }
  }

  if (inStockFilter === true) {
    variantFilter.stock = { $gt: 0 };
  }

  const variants = await ProductVariant.find(variantFilter)
    .sort({ price: 1 })
    .lean();

  const variantsByProduct = variants.reduce<
    Record<string, typeof variants>
  >((acc, variant) => {
    const key = variant.product.toString();

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(variant);
    return acc;
  }, {});

  let data = products
    .map((product) => ({
      ...product,
      variants: variantsByProduct[product._id.toString()] ?? [],
    }))
    .filter((product) => product.variants.length > 0);

  const sortOption =
    typeof sortBy === "string" ? (sortBy as SortOption) : "newest";

  const getMinPrice = (item: (typeof data)[number]) =>
    Math.min(...item.variants.map((variant) => variant.price));

  const getMaxPrice = (item: (typeof data)[number]) =>
    Math.max(...item.variants.map((variant) => variant.price));

  switch (sortOption) {
    case "price_asc":
      data = data.sort((a, b) => getMinPrice(a) - getMinPrice(b));
      break;
    case "price_desc":
      data = data.sort((a, b) => getMaxPrice(b) - getMaxPrice(a));
      break;
    case "name_asc":
      data = data.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name_desc":
      data = data.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case "newest":
    default:
      data = data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;
  }

  res.status(200).json({
    success: true,
    count: data.length,
    data,
  });
});

export const getProductById = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id;

    if (!id || Array.isArray(id) || !mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Valid product ID is required", 400);
    }

    const product = await Product.findOne({ _id: id, isActive: true })
      .populate("category")
      .lean();

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const categoryId =
      typeof product.category === "object" &&
      product.category !== null &&
      "_id" in product.category
        ? (product.category as { _id: mongoose.Types.ObjectId })._id
        : product.category;

    const [variants, reviews, relatedProducts] = await Promise.all([
      ProductVariant.find({ product: id, isActive: true })
        .sort({ price: 1 })
        .lean(),
      Review.find({ product: id })
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .lean(),
      Product.find({
        category: categoryId,
        _id: { $ne: id },
        isActive: true,
      })
        .select(
          "name slug thumbnail images averageRating reviewCount description highlights"
        )
        .limit(4)
        .lean(),
    ]);

    const relatedWithVariants = await Promise.all(
      relatedProducts.map(async (related) => {
        const relatedVariants = await ProductVariant.find({
          product: related._id,
          isActive: true,
        })
          .sort({ price: 1 })
          .limit(1)
          .lean();

        return {
          ...related,
          variants: relatedVariants,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        product,
        variants,
        reviews,
        ratings: {
          averageRating: product.averageRating,
          reviewCount: product.reviewCount,
        },
        relatedProducts: relatedWithVariants,
      },
    });
  }
);

export const addProductReview = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const id = req.params.id;

    if (!id || Array.isArray(id) || !mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Valid product ID is required", 400);
    }

    const { rating, comment } = req.body as AddReviewBody;

    if (!rating || rating < 1 || rating > 5) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }

    if (!comment || typeof comment !== "string" || !comment.trim()) {
      throw new AppError("Comment is required", 400);
    }

    const product = await Product.findById(id);

    if (!product || !product.isActive) {
      throw new AppError("Product not found or inactive", 404);
    }

    const review = await Review.findOneAndUpdate(
      { user: req.user.id, product: id },
      {
        user: req.user.id,
        product: id,
        rating,
        comment: comment.trim(),
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    await recalculateProductRating(id);

    const updatedProduct = await Product.findById(id);

    await logActivity("REVIEW", `Review added for product: ${product.name}`, {
      productId: product._id,
      userId: req.user.id,
      rating,
    });

    res.status(201).json({
      success: true,
      data: {
        review,
        product: updatedProduct,
      },
    });
  }
);

export const getVariantByBarcode = asyncHandler(
  async (req: Request, res: Response) => {
    const code = req.params.code;

    if (!code || Array.isArray(code) || !validateTwelveDigits(code)) {
      throw new AppError("Barcode must be exactly 12 digits", 400);
    }

    const variant = await ProductVariant.findOne({ barcode: code })
      .populate("category")
      .populate("product");

    if (!variant) {
      throw new AppError("No variant found for this barcode", 404);
    }

    res.status(200).json({
      success: true,
      data: {
        variant,
        product: variant.product,
      },
    });
  }
);
