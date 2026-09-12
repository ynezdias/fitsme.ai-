import { Auth } from "@vonage/auth";
import { Video } from "@vonage/video";
import type { VideoCredentialsResponse, VideoRole, VideoRoomResponse } from "../types/video.js";

const tokenLifetimeSeconds = 60 * 60;

export class VideoConfigurationError extends Error {}
export class VideoSessionError extends Error {}
export class VideoTokenError extends Error {}

const getVideoClient = (): { applicationId: string; video: Video } => {
  const applicationId = process.env.VONAGE_APPLICATION_ID?.trim();
  const privateKey = process.env.VONAGE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim() || process.env.VONAGE_PRIVATE_KEY_PATH?.trim();
  if (!applicationId || !privateKey) throw new VideoConfigurationError("Vonage Video credentials are not configured.");
  const credentials = new Auth({ applicationId, privateKey });
  return { applicationId, video: new Video(credentials, {}) };
};

export const createVideoSession = async (): Promise<VideoRoomResponse> => {
  const { applicationId, video } = getVideoClient();
  try {
    const session = await video.createSession({ mediaMode: "enabled" });
    if (!session.sessionId) throw new VideoSessionError("Vonage did not return a session ID.");
    return { success: true, room: { sessionId: session.sessionId, applicationId } };
  } catch (error) {
    if (error instanceof VideoSessionError) throw error;
    console.error("Vonage video session creation failed", { name: error instanceof Error ? error.name : "UnknownError" });
    throw new VideoSessionError("Vonage could not create a video session.");
  }
};

export const generateVideoToken = (sessionId: string, role: VideoRole = "publisher"): VideoCredentialsResponse => {
  const { applicationId, video } = getVideoClient();
  try {
    const token = video.generateClientToken(sessionId, { role, expireTime: Math.floor(Date.now() / 1000) + tokenLifetimeSeconds });
    if (!token) throw new VideoTokenError("Vonage did not return a token.");
    return { success: true, credentials: { applicationId, sessionId, token } };
  } catch (error) {
    if (error instanceof VideoTokenError) throw error;
    console.error("Vonage video token generation failed", { name: error instanceof Error ? error.name : "UnknownError" });
    throw new VideoTokenError("Vonage could not generate a video token.");
  }
};
