import mongoose, { Document, Model, Schema } from "mongoose";

export type ActivityType =
  | "ORDER"
  | "PAYMENT"
  | "REVIEW"
  | "USER"
  | "PRODUCT"
  | "WISHLIST"
  | "BUG_REPORT";
  

export interface IActivityLog extends Document {
  type: ActivityType;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    type: {
      type: String,
      enum: ["ORDER", "PAYMENT", "REVIEW", "USER", "PRODUCT", "WISHLIST"],
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });

export const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog ??
  mongoose.model<IActivityLog>("ActivityLog", activityLogSchema);
