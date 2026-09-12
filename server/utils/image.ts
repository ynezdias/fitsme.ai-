import type { MirrorImageInput, SupportedImageMimeType } from "../types/mirror.js";
import { supportedImageMimeTypes } from "../types/mirror.js";
import { AppError } from "./app-error.js";

const maxImageBytes = 6 * 1024 * 1024;
const dataUrlPattern = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/i;

export const parseBase64Image = (image: unknown, declaredMimeType: unknown): MirrorImageInput => {
  if (typeof image !== "string" || image.trim().length === 0) throw new AppError(400, "INVALID_IMAGE", "A valid image is required.");
  const match = image.match(dataUrlPattern);
  const suppliedMimeType = match?.[1] ?? declaredMimeType;
  const mimeType = typeof suppliedMimeType === "string" ? suppliedMimeType.toLowerCase() : "";
  const data = (match?.[2] ?? image).replace(/\s/g, "");
  if (!supportedImageMimeTypes.includes(mimeType as SupportedImageMimeType)) throw new AppError(400, "UNSUPPORTED_IMAGE_TYPE", "Supported image formats are JPEG, PNG, and WebP.");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(data) || data.length === 0 || data.length % 4 !== 0) throw new AppError(400, "INVALID_IMAGE", "Image data must be valid base64.");
  const imageBytes = Buffer.from(data, "base64");
  if (imageBytes.length === 0 || imageBytes.length > maxImageBytes) throw new AppError(413, "IMAGE_TOO_LARGE", "Image must be 6 MB or smaller.");
  return { data, mimeType: mimeType as SupportedImageMimeType };
};
