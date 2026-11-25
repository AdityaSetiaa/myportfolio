import "server-only";
import { v2 as cloudinary } from "cloudinary";

export function cloudStorage() {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (name && key && secret) cloudinary.config({ cloud_name: name, api_key: key, api_secret: secret });
  const config = cloudinary.config();
  if (!config.cloud_name || !config.api_key || !config.api_secret) return null;
  cloudinary.config({ secure: true });
  return cloudinary;
}
