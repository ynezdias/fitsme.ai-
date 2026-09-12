import { Router } from "express";
import { GeminiConfigurationError } from "../gemini/mirrorAnalyzer.js";
import { GeminiTransformationError, GeminiTransformationTimeoutError, transformOutfitWithGemini } from "../gemini/outfitTransformer.js";
import type { StyleDirectionId, TransformRequest } from "../types/mirror.js";
import { AppError } from "../utils/app-error.js";
import { parseBase64Image } from "../utils/image.js";

const directionIds: StyleDirectionId[] = ["comfort", "confidence", "experiment"];
export const transformRouter = Router();

const parseChanges = (changes: unknown): string[] => {
  if (!Array.isArray(changes) || changes.length === 0 || changes.length > 6 || !changes.every((change) => typeof change === "string" && change.trim().length > 0 && change.length <= 300)) {
    throw new AppError(400, "INVALID_REQUEST", "Provide between 1 and 6 valid styling changes.");
  }
  return changes.map((change) => change.trim());
};

transformRouter.post("/transform", (req, res, next) => {
  const run = async (): Promise<void> => {
    try {
      const { image, mimeType, direction, changes } = req.body ?? {};
      if (typeof direction !== "string" || !directionIds.includes(direction as StyleDirectionId)) throw new AppError(400, "INVALID_DIRECTION", "Direction must be comfort, confidence, or experiment.");
      const normalizedImage = parseBase64Image(image, mimeType);
      const response = await transformOutfitWithGemini(normalizedImage, direction as TransformRequest["direction"], parseChanges(changes));
      res.json(response);
    } catch (error) {
      if (error instanceof GeminiConfigurationError) next(new AppError(503, "AI_NOT_CONFIGURED", "Gemini transformation is not configured. Set GEMINI_API_KEY on the server."));
      else if (error instanceof GeminiTransformationTimeoutError) next(new AppError(504, "AI_TIMEOUT", "Image transformation took too long. Please try again."));
      else if (error instanceof GeminiTransformationError) next(new AppError(502, "TRANSFORMATION_FAILED", "We couldn't create the visual transformation, but your styling recommendations are still available."));
      else next(error);
    }
  };
  void run();
});
