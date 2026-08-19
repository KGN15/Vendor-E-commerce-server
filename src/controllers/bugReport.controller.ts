import { Request, Response } from "express";
import { BugReport } from "../models/bugReport.model";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { logActivity } from "../utils/activityLogger";
import { BugReply } from "../models/BugReply";


/* =========================================================
   TYPES
========================================================= */

interface CreateBugReportBody {
  title: string;
  description: string;
  category?: "UI" | "FUNCTIONAL" | "PERFORMANCE" | "OTHER";
  priority?: "LOW" | "MEDIUM" | "HIGH";
  pageUrl?: string;
}

/* =========================================================
   CREATE BUG REPORT
   POST /api/bug-reports
========================================================= */

export const createBugReport = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const {
      title,
      description,
      category = "OTHER",
      priority = "MEDIUM",
      pageUrl,
    } = req.body as CreateBugReportBody;

    /* -------------------------------------------------------
       VALIDATE TITLE
    ------------------------------------------------------- */

    if (!title || typeof title !== "string") {
      throw new AppError("Bug title is required", 400);
    }

    const trimmedTitle = title.trim();

    if (trimmedTitle.length < 3) {
      throw new AppError("Bug title must be at least 3 characters", 400);
    }

    if (trimmedTitle.length > 150) {
      throw new AppError("Bug title cannot exceed 150 characters", 400);
    }

    /* -------------------------------------------------------
       VALIDATE DESCRIPTION
    ------------------------------------------------------- */

    if (!description || typeof description !== "string") {
      throw new AppError("Bug description is required", 400);
    }

    const trimmedDescription = description.trim();

    if (trimmedDescription.length < 10) {
      throw new AppError("Bug description must be at least 10 characters", 400);
    }

    if (trimmedDescription.length > 5000) {
      throw new AppError("Bug description cannot exceed 5000 characters", 400);
    }

    /* -------------------------------------------------------
       VALIDATE CATEGORY
    ------------------------------------------------------- */

    const allowedCategories = [
      "UI",
      "FUNCTIONAL",
      "PERFORMANCE",
      "OTHER",
    ] as const;

    if (!allowedCategories.includes(category as any)) {
      throw new AppError("Invalid bug category", 400);
    }

    /* -------------------------------------------------------
       VALIDATE PRIORITY
    ------------------------------------------------------- */

    const allowedPriorities = ["LOW", "MEDIUM", "HIGH"] as const;

    if (!allowedPriorities.includes(priority as any)) {
      throw new AppError("Invalid bug priority", 400);
    }

    /* -------------------------------------------------------
       VALIDATE PAGE URL
    ------------------------------------------------------- */

    let normalizedPageUrl: string | undefined;

    if (pageUrl !== undefined) {
      if (typeof pageUrl !== "string") {
        throw new AppError("Page URL must be a string", 400);
      }

      normalizedPageUrl = pageUrl.trim();

      if (normalizedPageUrl.length > 1000) {
        throw new AppError("Page URL cannot exceed 1000 characters", 400);
      }
    }

    /* -------------------------------------------------------
       CREATE REPORT
    ------------------------------------------------------- */

    const bugReport = await BugReport.create({
      user: req.user.id,
      title: trimmedTitle,
      description: trimmedDescription,
      category,
      priority,
      pageUrl: normalizedPageUrl,
      status: "OPEN",
    });

    /* -------------------------------------------------------
       ACTIVITY LOG
    ------------------------------------------------------- */

    await logActivity(
      'BUG_REPORT',
      `New bug report submitted: ${bugReport.title}`,
      {
        userId: req.user.id,
        bugReportId: bugReport._id,
      },
    );

    /* -------------------------------------------------------
       RESPONSE
    ------------------------------------------------------- */

    res.status(201).json({
      success: true,
      data: {
        message: "Bug report submitted successfully",
        bugReport,
      },
    });
  },
);

/* =========================================================
   GET MY BUG REPORTS
   GET /api/bug-reports/my
========================================================= */

export const getMyBugReports = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const bugReports = await BugReport.find({
      user: req.user.id,
    })
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
   GET /api/bug-reports/:id
========================================================= */

export const getMyBugReport = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const bugReport = await BugReport.findOne({
      _id: req.params.id,
      user: req.user.id,
    })
      .populate("user", "name email avatar")
      .lean();

    if (!bugReport) {
      throw new AppError("Bug report not found", 404);
    }

    const replies = await BugReply.find({
      bugReport: bugReport._id,
    })
      .populate("sender", "name email avatar")
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
