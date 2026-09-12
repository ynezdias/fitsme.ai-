import { Router } from "express";
import { analyzeOutfitWithGemini, GeminiConfigurationError } from "../gemini/mirrorAnalyzer.js";
import { concernTypes, supportedImageMimeTypes, type MirrorAnalysisRequest, type MirrorImageInput, type SupportedImageMimeType } from "../types/mirror.js";
import { AppError } from "../utils/app-error.js";

export const mirrorRouter = Router();
const maxImageBytes = 6 * 1024 * 1024;
const dataUrlPattern = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/i;

const parseImage = (image: unknown, declaredMimeType: unknown): MirrorImageInput => {
  if (typeof image !== "string" || image.trim().length === 0) throw new AppError(400, "INVALID_REQUEST", "A valid image is required.");
  const match = image.match(dataUrlPattern);
  const suppliedMimeType = match?.[1] ?? declaredMimeType;
  const mimeType = typeof suppliedMimeType === "string" ? suppliedMimeType.toLowerCase() : "";
  const data = (match?.[2] ?? image).replace(/\s/g, "");
  if (!supportedImageMimeTypes.includes(mimeType as SupportedImageMimeType)) throw new AppError(400, "UNSUPPORTED_IMAGE_TYPE", "Supported image formats are JPEG, PNG, and WebP.");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(data) || data.length === 0 || data.length % 4 !== 0) throw new AppError(400, "INVALID_REQUEST", "Image data must be valid base64.");
  const imageBytes = Buffer.from(data, "base64");
  if (imageBytes.length === 0 || imageBytes.length > maxImageBytes) throw new AppError(413, "IMAGE_TOO_LARGE", "Image must be 6 MB or smaller.");
  return { data, mimeType: mimeType as SupportedImageMimeType };
};

mirrorRouter.post("/analyze", (req, res, next) => {
  const run = async (): Promise<void> => {
    try {
    const { image, concern } = req.body ?? {};
    if (typeof concern !== "string" || !concernTypes.includes(concern as MirrorAnalysisRequest["concern"])) throw new AppError(400, "INVALID_REQUEST", "A valid concern is required.");
    const normalizedImage = parseImage(image, req.body?.mimeType);
    res.json(await analyzeOutfitWithGemini(normalizedImage, concern as MirrorAnalysisRequest["concern"]));
    } catch (error) {
      if (error instanceof GeminiConfigurationError) next(new AppError(503, "AI_NOT_CONFIGURED", "Gemini analysis is not configured. Set GEMINI_API_KEY on the server."));
      else next(error);
    }
  };
  void run();
});
