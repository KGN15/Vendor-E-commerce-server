import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { isCloudinaryConfigured } from "../config/env";
import { uploadImage } from "../utils/uploadService";

export const uploadImages = asyncHandler(
  async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;
    const singleFile = req.file as Express.Multer.File | undefined;

    const incomingFiles = files?.length
      ? files
      : singleFile
        ? [singleFile]
        : [];

    if (incomingFiles.length === 0) {
      throw new AppError("At least one image file is required", 400);
    }

    const urls = await Promise.all(
      incomingFiles.map((file) => uploadImage(file.buffer, file.originalname))
    );

    res.status(201).json({
      success: true,
      data: {
        urls,
        thumbnail: urls[0],
        provider: isCloudinaryConfigured() ? "cloudinary" : "local",
        count: urls.length,
      },
    });
  }
);
