import { Router } from "express";
import { createMockMirrorAnalysis } from "../services/mirror.service.js";
import { concernTypes, type MirrorAnalysisRequest } from "../types/mirror.js";
import { AppError } from "../utils/app-error.js";

export const mirrorRouter = Router();
mirrorRouter.post("/analyze", (req, res, next) => {
  try {
    const { image, concern } = req.body ?? {};
    if (typeof image !== "string" || image.trim().length === 0) throw new AppError(400, "INVALID_REQUEST", "A valid image is required.");
    if (typeof concern !== "string" || !concernTypes.includes(concern as MirrorAnalysisRequest["concern"])) throw new AppError(400, "INVALID_REQUEST", "A valid concern is required.");
    res.json(createMockMirrorAnalysis({ image, concern } as MirrorAnalysisRequest));
  } catch (error) { next(error); }
});
