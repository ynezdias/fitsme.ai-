import { Router } from "express";
import { createVideoSession, generateVideoToken, VideoConfigurationError, VideoSessionError, VideoTokenError } from "../vonage/video.service.js";
import type { VideoRole } from "../types/video.js";
import { AppError } from "../utils/app-error.js";

export const videoRouter = Router();
const sessionIdPattern = /^[A-Za-z0-9_+=:/.-]+$/;

const parseSessionId = (sessionId: unknown): string => {
  if (typeof sessionId !== "string" || sessionId.length === 0 || sessionId.length > 512 || !sessionIdPattern.test(sessionId)) {
    throw new AppError(400, "INVALID_SESSION", "A valid video session ID is required.");
  }
  return sessionId;
};

const handleVideoError = (error: unknown, next: (error: unknown) => void, operation: "session" | "token"): void => {
  if (error instanceof VideoConfigurationError) next(new AppError(503, "VIDEO_NOT_CONFIGURED", "Video calling is not configured."));
  else if (error instanceof VideoSessionError) next(new AppError(502, "VIDEO_SESSION_FAILED", "We couldn't create a video room. Please try again."));
  else if (error instanceof VideoTokenError) next(new AppError(502, "VIDEO_TOKEN_FAILED", "We couldn't create video credentials. Please try again."));
  else next(error);
};

videoRouter.post("/session", (_req, res, next) => {
  void createVideoSession().then((response) => res.json(response)).catch((error: unknown) => handleVideoError(error, next, "session"));
});

videoRouter.post("/token", (req, res, next) => {
  try {
    const { sessionId, role = "publisher" } = req.body ?? {};
    if (role !== "publisher") throw new AppError(400, "INVALID_REQUEST", "Only the publisher role is available for this video room.");
    res.json(generateVideoToken(parseSessionId(sessionId), role as VideoRole));
  } catch (error) {
    handleVideoError(error, next, "token");
  }
});
