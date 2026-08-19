import mongoose, { Document, Model, Schema } from "mongoose";

/* =========================================================
   ACTIVITY TYPES
========================================================= */

export type ActivityType =
  | "ORDER"
  | "PAYMENT"
  | "REVIEW"
  | "USER"
  | "PRODUCT"
  | "WISHLIST"
  | "BUG_REPORT";

/* =========================================================
   INTERFACE
========================================================= */

export interface IActivityLog extends Document {
  type: ActivityType;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/* =========================================================
   SCHEMA
========================================================= */

const activityLogSchema = new Schema<IActivityLog>(
  {
    type: {
      type: String,
      enum: [
        "ORDER",
        "PAYMENT",
        "REVIEW",
        "USER",
        "PRODUCT",
        "WISHLIST",
        "BUG_REPORT",
      ],
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

/* =========================================================
   INDEXES
========================================================= */

activityLogSchema.index({ createdAt: -1 });

/* =========================================================
   MODEL
========================================================= */

export const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog ??
  mongoose.model<IActivityLog>("ActivityLog", activityLogSchema);
