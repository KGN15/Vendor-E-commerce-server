import mongoose, { Document, Model, Schema } from "mongoose";

export const ACTIVITY_TYPES = [
  "ORDER",
  "PAYMENT",
  "REVIEW",
  "USER",
  "PRODUCT",
  "WISHLIST",
  "BUG_REPORT",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

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
      enum: ACTIVITY_TYPES,
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
  {
    timestamps: true,
  },
);

activityLogSchema.index({ createdAt: -1 });

export const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog ||
  mongoose.model<IActivityLog>("ActivityLog", activityLogSchema);
