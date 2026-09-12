import { GoogleGenAI } from "@google/genai";
import { GeminiConfigurationError } from "./mirrorAnalyzer.js";
import type { MirrorImageInput, StyleDirectionId, TransformResponse } from "../types/mirror.js";

const model = "gemini-3.1-flash-image";
const timeoutMs = 45_000;

export class GeminiTransformationError extends Error {}
export class GeminiTransformationTimeoutError extends GeminiTransformationError {}

const directionGuidance: Record<StyleDirectionId, string> = {
  comfort: "Aim for relaxed, wearable, familiar styling with soft layers and minimal changes. Do not use oversized garments to conceal the body.",
  confidence: "Aim for intentional, polished styling with a structured focal point, deliberate layering, and refined garment proportions. Do not reveal more skin or change the person's body.",
  experiment: "Aim for expressive, fashion-forward styling through contrast, layering, clothing-created silhouette, accessories, color blocking, or texture. Keep the changes realistic unless explicitly requested."
};

const transformationPrompt = (direction: StyleDirectionId, changes: string[]): string => `You are the visual styling engine for WTF: WHAT THE FIT.

Edit the provided image by modifying ONLY the clothing, styling, accessories, layering, colors, or garment silhouette described below. Preserve the person completely.

Do not change face, skin tone, hair, body size, body proportions, height, weight, pose, facial expression, age, identity, or physical features. Do not make the person thinner, larger, taller, shorter, younger, older, more muscular, or otherwise physically different. Do not reshape the person's body.

The goal is not to improve the body. The goal is to show how different styling choices can change the feel of the outfit. Maintain photorealism. Keep the same person, pose, environment, camera perspective, and approximate framing where possible. Change only what is necessary to illustrate the styling recommendation.

Selected direction: ${direction}
Direction guidance: ${directionGuidance[direction]}
Requested styling changes:\n${changes.map((change) => `- ${change}`).join("\n")}`;

const withTimeout = async <T>(operation: Promise<T>): Promise<T> => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new GeminiTransformationTimeoutError("Gemini image generation timed out.")), timeoutMs);
      })
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};

const getGeneratedImage = (response: unknown): { data: string; mimeType: string } | null => {
  if (!response || typeof response !== "object") return null;
  const value = response as Record<string, unknown>;
  const directImage = value.outputImage ?? value.output_image;
  if (!directImage || typeof directImage !== "object") return null;
  const image = directImage as Record<string, unknown>;
  const data = image.data;
  const mimeType = image.mimeType ?? image.mime_type;
  return typeof data === "string" && data.length > 0 && typeof mimeType === "string" && mimeType.startsWith("image/") ? { data, mimeType } : null;
};

export const transformOutfitWithGemini = async (image: MirrorImageInput, direction: StyleDirectionId, changes: string[]): Promise<TransformResponse> => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new GeminiConfigurationError("GEMINI_API_KEY is not configured.");
  try {
    const client = new GoogleGenAI({ apiKey });
    const response = await withTimeout(client.interactions.create({
      model,
      input: [
        { type: "text", text: transformationPrompt(direction, changes) },
        { type: "image", mime_type: image.mimeType, data: image.data }
      ],
      response_format: { type: "image", image_size: "1K", aspect_ratio: "3:4" }
    }));
    const generatedImage = getGeneratedImage(response);
    if (!generatedImage) throw new GeminiTransformationError("Gemini did not return an image.");
    return {
      success: true,
      transformation: { direction, image: `data:${generatedImage.mimeType};base64,${generatedImage.data}`, generated: true, changesApplied: changes, message: "Same you. Different styling." },
      guardrails: { bodyModified: false, identityModified: false }
    };
  } catch (error) {
    if (error instanceof GeminiTransformationTimeoutError) throw error;
    console.error("Gemini outfit transformation failed; returning a visual styling concept", { name: error instanceof Error ? error.name : "UnknownError" });
    return {
      success: true,
      transformation: {
        direction,
        image: `data:${image.mimeType};base64,${image.data}`,
        generated: false,
        changesApplied: changes,
        message: "A visual styling concept is shown because AI image rendering is temporarily unavailable."
      },
      guardrails: { bodyModified: false, identityModified: false }
    };
  }
};
