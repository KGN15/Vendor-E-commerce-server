import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";

export const getHealth = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});
