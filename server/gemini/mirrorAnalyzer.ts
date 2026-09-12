import { GoogleGenAI, Type } from "@google/genai";
import { createFallbackMirrorAnalysis } from "../services/mirror.service.js";
import type { ConcernType, GeminiMirrorAnalysis, MirrorAnalysisResponse, MirrorImageInput, ObservationCategory, StyleDirection } from "../types/mirror.js";

const model = "gemini-2.5-flash-lite";
const directionIds = ["comfort", "confidence", "experiment"] as const;
const observationCategories: ObservationCategory[] = ["fit", "proportion", "color", "silhouette", "styling", "layering", "accessory"];
const disallowedPhrases = ["lose weight", "gain weight", "fat", "skinny", "overweight", "underweight", "bmi", "body type", "pear shaped", "apple shaped", "hourglass", "slimming", "look thinner", "hide your stomach", "hide your belly", "hide your arms", "hide your thighs"];

const systemInstruction = `You are fitsme.ai, a body-positive AI fashion companion.

Your job is NOT to evaluate the person. Your job is to evaluate how clothing choices, styling, color relationships, layering, garment proportions, fabric behavior, accessories, and silhouette interact.

Never comment negatively on the person's body. Never estimate weight, body measurements, body shape, BMI, attractiveness, age, ethnicity, health, or physical fitness. Never suggest changing the person's body. Do not make gender assumptions. When the user expresses dissatisfaction with their body, gently redirect the analysis toward controllable styling factors. Use clothing-centered language. Preserve user agency. Suggestions should be supportive, practical, modern, and fashion-aware rather than clinical or overly emotional. The goal is to help the user discover whether changing styling choices changes how they feel about the look.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    observations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { category: { type: Type.STRING, enum: observationCategories }, text: { type: Type.STRING } }, required: ["category", "text"] } },
    styleDirections: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING, enum: directionIds }, name: { type: Type.STRING }, description: { type: Type.STRING }, changes: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["id", "name", "description", "changes"] } },
    reframe: { type: Type.STRING },
    bodyModificationSuggested: { type: Type.BOOLEAN }
  },
  required: ["summary", "observations", "styleDirections", "reframe", "bodyModificationSuggested"]
};

export class GeminiConfigurationError extends Error {}

const concernPrompt = (concern: ConcernType): string => {
  const focus: Record<ConcernType, string> = {
    fit: "Focus on garment proportions, garment looseness or tightness, lengths, layering, tailoring, drape, and fabric behavior. Do not discuss body dimensions.",
    colors: "Focus on color harmony, contrast, saturation, temperature, visual emphasis, and balance across garments. Prefer outfit-to-outfit relationships and do not assume skin tone.",
    silhouette: "Focus on garment shape, visual lines, volume distribution, layering, top/bottom balance, and garment lengths. Do not identify body shape.",
    styling: "Focus on accessories, shoes, layering, tucking, sleeves, outerwear, and coordination.",
    something_off: "Identify only observable styling opportunities in the outfit. Do not invent problems.",
    dont_know: "Identify only observable styling opportunities in the outfit. Do not invent problems.",
    body: "The discomfort is being directed at the person's body. Begin by gently redirecting to styling variables: say the feeling may come from how the pieces interact, then analyze only outfit proportions, garment fit, colors, layering, accessories, and clothing-created silhouette. Never analyze the body."
  };
  return `The selected concern is "${concern}". ${focus[concern]} Return only the requested JSON.`;
};

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

const isStyleDirection = (value: unknown): value is StyleDirection => {
  if (!value || typeof value !== "object") return false;
  const direction = value as Record<string, unknown>;
  return directionIds.includes(direction.id as (typeof directionIds)[number]) && isNonEmptyString(direction.name) && isNonEmptyString(direction.description) && Array.isArray(direction.changes) && direction.changes.every(isNonEmptyString);
};

const isSafeAnalysis = (analysis: MirrorAnalysisResponse): boolean => {
  const text = JSON.stringify(analysis).toLowerCase();
  return !disallowedPhrases.some((phrase) => text.includes(phrase));
};

const parseAnalysis = (text: string): MirrorAnalysisResponse | null => {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") return null;
    const value = parsed as Record<string, unknown>;
    if (!isNonEmptyString(value.summary) || !isNonEmptyString(value.reframe) || value.bodyModificationSuggested !== false || !Array.isArray(value.observations) || !Array.isArray(value.styleDirections)) return null;
    if (!value.observations.every((observation) => {
      if (!observation || typeof observation !== "object") return false;
      const item = observation as Record<string, unknown>;
      return observationCategories.includes(item.category as ObservationCategory) && isNonEmptyString(item.text);
    })) return null;
    if (!value.styleDirections.every(isStyleDirection) || directionIds.some((id) => !value.styleDirections.some((direction) => (direction as StyleDirection).id === id))) return null;
    const analysis: MirrorAnalysisResponse = { success: true, analysis: { summary: value.summary, observations: value.observations as GeminiMirrorAnalysis["observations"], reframe: value.reframe, bodyModificationSuggested: false }, styleDirections: value.styleDirections as StyleDirection[], guardrails: { bodyJudgment: false, bodyModification: false, weightEstimation: false } };
    return isSafeAnalysis(analysis) ? analysis : null;
  } catch { return null; }
};

export const analyzeOutfitWithGemini = async (image: MirrorImageInput, concern: ConcernType): Promise<MirrorAnalysisResponse> => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new GeminiConfigurationError("GEMINI_API_KEY is not configured.");
  try {
    const client = new GoogleGenAI({ apiKey });
    const response = await client.models.generateContent({
      model,
      contents: [{ inlineData: { data: image.data, mimeType: image.mimeType } }, { text: concernPrompt(concern) }],
      config: { systemInstruction, responseMimeType: "application/json", responseSchema }
    });
    const analysis = parseAnalysis(response.text ?? "");
    if (!analysis) console.warn("Gemini returned an unsafe or invalid analysis; using fallback.");
    return analysis ?? createFallbackMirrorAnalysis();
  } catch (error) {
    console.error("Gemini outfit analysis failed", { name: error instanceof Error ? error.name : "UnknownError" });
    return createFallbackMirrorAnalysis();
  }
};
