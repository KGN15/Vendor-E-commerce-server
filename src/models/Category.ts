import mongoose, { Document, Model, Schema } from "mongoose";
import { TWO_DIGIT_PATTERN } from "../utils/digitValidators";

export interface ICategory extends Document {
  name: string;
  slug: string;
  prefix: string;
  createdAt: Date;
  updatedAt: Date;
}

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    prefix: {
      type: String,
      required: [true, "Category prefix is required"],
      unique: true,
      validate: {
        validator: (value: string) => TWO_DIGIT_PATTERN.test(value),
        message: "Prefix must be exactly 2 digits (e.g. \"12\")",
      },
    },
  },
  { timestamps: true }
);

categorySchema.pre("save", function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
  next();
});

export const Category: Model<ICategory> =
  mongoose.models.Category ??
  mongoose.model<ICategory>("Category", categorySchema);
