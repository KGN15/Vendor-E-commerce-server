import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { env, isCloudinaryConfigured } from "../config/env";

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
  });
}

const ensureUploadDir = (): string => {
  const uploadPath = path.resolve(process.cwd(), env.uploadDir);

  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  return uploadPath;
};

export const saveLocally = async (
  fileBuffer: Buffer,
  originalName: string
): Promise<string> => {
  const uploadPath = ensureUploadDir();
  const ext = path.extname(originalName) || ".jpg";
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e5)}${ext}`;
  const filePath = path.join(uploadPath, filename);

  await fs.promises.writeFile(filePath, fileBuffer);

  return `${env.appBaseUrl}/uploads/${filename}`;
};

export const uploadImage = async (
  fileBuffer: Buffer,
  originalName: string
): Promise<string> => {
  if (!isCloudinaryConfigured()) {
    return saveLocally(fileBuffer, originalName);
  }

  const base64 = `data:image/jpeg;base64,${fileBuffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(base64, {
    folder: "ecommerce-products",
    resource_type: "image",
    public_id: `${Date.now()}-${path.parse(originalName).name}`,
  });

  return result.secure_url;
};
