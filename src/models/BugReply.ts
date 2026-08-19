import { Schema, model, Document, Types } from "mongoose";

export type BugReplySender = "USER" | "ADMIN";

export interface IBugReply extends Document {
  bugReport: Types.ObjectId;
  sender: Types.ObjectId;
  senderType: BugReplySender;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const bugReplySchema = new Schema<IBugReply>(
  {
    bugReport: {
      type: Schema.Types.ObjectId,
      ref: "BugReport",
      required: true,
      index: true,
    },

    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    senderType: {
      type: String,
      enum: ["USER", "ADMIN"],
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 5000,
    },
  },
  {
    timestamps: true,
  },
);

export const BugReply = model<IBugReply>("BugReply", bugReplySchema);
