import mongoose, { Document, Model, Schema, Types } from "mongoose";
import {
  FOUR_DIGIT_PATTERN,
  TWELVE_DIGIT_PATTERN,
} from "../utils/digitValidators";

export interface IVariantAttributes {
  size?: string;
  color?: string;
  design?: string;
  [key: string]: string | undefined;
}

export interface IProductVariant extends Document {
  product: Types.ObjectId;
  category: Types.ObjectId;
  size?: string;
  color?: string;
  design?: string;
  attributes: Map<string, string>;
  stock: number;
  price: number;
  sizeCode: string;
  barcode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productVariantSchema = new Schema<IProductVariant>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category reference is required"],
      index: true,
    },
    size: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    design: {
      type: String,
      trim: true,
    },
    attributes: {
      type: Map,
      of: String,
      default: (): Map<string, string> => new Map(),
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    sizeCode: {
      type: String,
      required: [true, "Size code is required"],
      validate: {
        validator: (value: string) => FOUR_DIGIT_PATTERN.test(value),
        message: "Size code must be exactly 4 digits (e.g. \"0038\")",
      },
    },
    barcode: {
      type: String,
      required: [true, "Barcode is required"],
      unique: true,
      validate: {
        validator: (value: string) => TWELVE_DIGIT_PATTERN.test(value),
        message: "Barcode must be exactly 12 digits",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

productVariantSchema.index({ product: 1, sizeCode: 1, color: 1, design: 1 });

export const ProductVariant: Model<IProductVariant> =
  mongoose.models.ProductVariant ??
  mongoose.model<IProductVariant>("ProductVariant", productVariantSchema);
