import mongoose, { Document, Model, Schema } from "mongoose";
import {
  FOUR_DIGIT_PATTERN,
  TWO_DIGIT_PATTERN,
} from "../utils/digitValidators";

export interface IBarcodeCounter extends Document {
  categoryPrefix: string;
  sizeCode: string;
  lastSerial: number;
}

const barcodeCounterSchema = new Schema<IBarcodeCounter>(
  {
    categoryPrefix: {
      type: String,
      required: true,
      validate: {
        validator: (value: string) => TWO_DIGIT_PATTERN.test(value),
        message: "Category prefix must be exactly 2 digits",
      },
    },
    sizeCode: {
      type: String,
      required: true,
      validate: {
        validator: (value: string) => FOUR_DIGIT_PATTERN.test(value),
        message: "Size code must be exactly 4 digits",
      },
    },
    lastSerial: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 9999,
    },
  },
  { timestamps: true }
);

barcodeCounterSchema.index(
  { categoryPrefix: 1, sizeCode: 1 },
  { unique: true }
);

export const BarcodeCounter: Model<IBarcodeCounter> =
  mongoose.models.BarcodeCounter ??
  mongoose.model<IBarcodeCounter>("BarcodeCounter", barcodeCounterSchema);
