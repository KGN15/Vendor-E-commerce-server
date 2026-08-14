import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

/**
 * Allowed image MIME types.
 */
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/**
 * Maximum allowed image size.
 *
 * 5 MB per image.
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Store uploaded files in memory.
 *
 * The file buffer will be passed directly to Cloudinary,
 * so we don't need to create temporary files on the server.
 */
const storage = multer.memoryStorage();

/**
 * Validate uploaded file type.
 */
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback,
) => {
  if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
    return callback(
      new Error(
        "Invalid image format. Only JPEG, PNG, WEBP, and GIF images are allowed.",
      ),
    );
  }

  callback(null, true);
};

/**
 * Multer configuration for image uploads.
 */
export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter,
});