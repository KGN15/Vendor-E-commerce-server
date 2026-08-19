import dotenv from "dotenv";

dotenv.config();

const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;

  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export const env = {
  nodeEnv: getEnv("NODE_ENV", "development"),
  port: Number(getEnv("PORT", "5000")),
  mongodbUri: getEnv("MONGODB_URI"),
  corsOrigins: [
    getEnv("CORS_ORIGIN_1", process.env.CORS_ORIGIN_1),
    getEnv("CORS_ORIGIN_2", process.env.CORS_ORIGIN_1),
  ],
  isProduction: getEnv("NODE_ENV", "development") === "production",
  jwtSecret: getEnv("JWT_SECRET", "dev-jwt-secret-change-in-production"),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  uploadDir: getEnv("UPLOAD_DIR", "uploads"),
  appBaseUrl: getEnv("APP_BASE_URL", "http://localhost:5000"),
};

export const isCloudinaryConfigured = (): boolean =>
  Boolean(
    env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret,
  );
