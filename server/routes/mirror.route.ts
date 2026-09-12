import { Router } from "express";
import { analyzeOutfitWithGemini, GeminiConfigurationError } from "../gemini/mirrorAnalyzer.js";
import { concernTypes, type MirrorAnalysisRequest } from "../types/mirror.js";
import { AppError } from "../utils/app-error.js";
import { parseBase64Image } from "../utils/image.js";

export const mirrorRouter = Router();

mirrorRouter.post("/analyze", (req, res, next) => {
  const run = async (): Promise<void> => {
    try {
      const { image, concern } = req.body ?? {};
      if (typeof concern !== "string" || !concernTypes.includes(concern as MirrorAnalysisRequest["concern"])) {
        throw new AppError(400, "INVALID_REQUEST", "A valid concern is required.");
      }
      const normalizedImage = parseBase64Image(image, req.body?.mimeType);
      res.json(await analyzeOutfitWithGemini(normalizedImage, concern as MirrorAnalysisRequest["concern"]));
    } catch (error) {
      if (error instanceof GeminiConfigurationError) {
        next(new AppError(503, "AI_NOT_CONFIGURED", "Gemini analysis is not configured. Set GEMINI_API_KEY on the server."));
      } else {
        next(error);
      }
    }
  };
  void run();
});
