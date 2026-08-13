import { Error as MongooseError } from "mongoose";
import { AppError } from "./AppError";

interface MongoDuplicateKeyError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

interface MulterErrorLike extends Error {
  code?: string;
}

export const normalizeError = (err: Error): AppError => {
  if (err instanceof AppError) {
    return err;
  }

  const multerError = err as MulterErrorLike;

  if (multerError.code === "LIMIT_FILE_SIZE") {
    return new AppError("File too large. Maximum size is 5MB", 400);
  }

  if (multerError.code === "LIMIT_FILE_COUNT") {
    return new AppError("Too many files. Maximum is 10 images", 400);
  }

  if (err.message === "Only image files are allowed") {
    return new AppError(err.message, 400);
  }

  if (err instanceof MongooseError.ValidationError) {
    const messages = Object.values(err.errors).map((item) => item.message);
    return new AppError(messages.join(", "), 400);
  }

  if (err instanceof MongooseError.CastError) {
    return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  const mongoError = err as MongoDuplicateKeyError;

  if (mongoError.code === 11000 && mongoError.keyValue) {
    const field = Object.keys(mongoError.keyValue)[0];
    const value = mongoError.keyValue[field];
    return new AppError(`Duplicate value for ${field}: ${value}`, 409);
  }

  return new AppError(err.message || "Internal server error", 500);
};
