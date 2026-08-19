import { Schema, model, Document, Types } from "mongoose";

export type BugCategory = "UI" | "FUNCTIONAL" | "PERFORMANCE" | "OTHER";

export type BugPriority = "LOW" | "MEDIUM" | "HIGH";

export type BugStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface IBugReport extends Document {
  user: Types.ObjectId;
  title: string;
  description: string;
  category: BugCategory;
  priority: BugPriority;
  pageUrl?: string;
  status: BugStatus;
  createdAt: Date;
  updatedAt: Date;
}

const bugReportSchema = new Schema<IBugReport>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 5000,
    },

    category: {
      type: String,
      enum: ["UI", "FUNCTIONAL", "PERFORMANCE", "OTHER"],
      default: "OTHER",
      required: true,
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
      required: true,
    },

    pageUrl: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      default: "OPEN",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export const BugReport = model<IBugReport>("BugReport", bugReportSchema);
