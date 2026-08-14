import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import cloudinary from "../config/cloudinary";

export const uploadImage = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError("No image file provided.", 400);
    }

    const file = req.file;

    const uploadResult = await new Promise<{
      secure_url: string;
      public_id: string;
      width?: number;
      height?: number;
      format?: string;
      bytes?: number;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "vendorstore/products",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          if (!result) {
            reject(new Error("Cloudinary upload returned no result."));
            return;
          }

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        },
      );

      uploadStream.end(file.buffer);
    });

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully.",
      data: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        size: uploadResult.bytes,
      },
    });
  },
);