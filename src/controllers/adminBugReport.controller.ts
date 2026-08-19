import { Request, Response } from "express";

import { BugReport } from "../models/bugReport.model";
import { BugReply } from "../models/BugReply";

import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { logActivity } from "../utils/activityLogger";

/* =========================================================
   GET ALL BUG REPORTS
   GET /api/admin/bug-reports
========================================================= */

export const getAllBugReports = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const bugReports = await BugReport.find()
      .populate("user", "name email avatar")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: bugReports,
    });
  },
);

/* =========================================================
   GET SINGLE BUG REPORT
   GET /api/admin/bug-reports/:id
========================================================= */

export const getAdminBugReport = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const bugReport = await BugReport.findById(req.params.id)
      .populate("user", "name email avatar")
      .lean();

    if (!bugReport) {
      throw new AppError("Bug report not found", 404);
    }

    const replies = await BugReply.find({
      bugReport: bugReport._id,
    })
      .populate("sender", "name email avatar role")
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        bugReport,
        replies,
      },
    });
  },
);

/* =========================================================
   ADMIN REPLY
   POST /api/admin/bug-reports/:id/replies
========================================================= */

export const replyToBugReport = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { message } = req.body;

    if (!message || typeof message !== "string") {
      throw new AppError("Reply message is required", 400);
    }

    const trimmedMessage = message.trim();

    if (trimmedMessage.length < 1) {
      throw new AppError("Reply message cannot be empty", 400);
    }

    if (trimmedMessage.length > 5000) {
      throw new AppError("Reply cannot exceed 5000 characters", 400);
    }

    const bugReport = await BugReport.findById(req.params.id);

    if (!bugReport) {
      throw new AppError("Bug report not found", 404);
    }

    const reply = await BugReply.create({
      bugReport: bugReport._id,
      sender: req.user.id,
      senderType: "ADMIN",
      message: trimmedMessage,
    });

    /* Automatically move OPEN -> IN_PROGRESS */

    if (bugReport.status === "OPEN") {
      bugReport.status = "IN_PROGRESS";
      await bugReport.save();
    }

    await logActivity(
      "BUG_REPORT",
      `Admin replied to bug report: ${bugReport.title}`,
      {
        userId: bugReport.user,
        adminId: req.user.id,
        bugReportId: bugReport._id,
        replyId: reply._id,
      },
    );

    const populatedReply = await BugReply.findById(reply._id)
      .populate("sender", "name email avatar role")
      .lean();

    res.status(201).json({
      success: true,
      data: {
        message: "Reply sent successfully",
        reply: populatedReply,
      },
    });
  },
);

/* =========================================================
   UPDATE STATUS
   PATCH /api/admin/bug-reports/:id/status
========================================================= */

export const updateBugReportStatus = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { status } = req.body;

    const allowedStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

    if (!allowedStatuses.includes(status)) {
      throw new AppError("Invalid bug report status", 400);
    }

    const bugReport = await BugReport.findById(req.params.id);

    if (!bugReport) {
      throw new AppError("Bug report not found", 404);
    }

    bugReport.status = status;

    await bugReport.save();

    await logActivity(
      "BUG_REPORT",
      `Bug report status changed to ${status}: ${bugReport.title}`,
      {
        adminId: req.user.id,
        bugReportId: bugReport._id,
      },
    );

    res.status(200).json({
      success: true,
      data: {
        message: "Bug report status updated successfully",
        bugReport,
      },
    });
  },
);
