export const concernTypes = ["fit", "colors", "silhouette", "styling", "something_off", "dont_know", "body"] as const;
export type ConcernType = (typeof concernTypes)[number];
export const supportedImageMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export type SupportedImageMimeType = (typeof supportedImageMimeTypes)[number];

export interface MirrorAnalysisRequest { image: string; mimeType?: SupportedImageMimeType; concern: ConcernType; }
export interface MirrorImageInput { data: string; mimeType: SupportedImageMimeType; }
export interface StyleRecommendation { changes: string[]; }
export type StyleDirectionId = "comfort" | "confidence" | "experiment";
export interface StyleDirection extends StyleRecommendation { id: StyleDirectionId; name: string; description: string; }
export type ObservationCategory = "fit" | "proportion" | "color" | "silhouette" | "styling" | "layering" | "accessory";
export interface MirrorObservation { category: ObservationCategory; text: string; }
export interface GeminiMirrorAnalysis {
  summary: string;
  observations: MirrorObservation[];
  reframe: string;
  bodyModificationSuggested: false;
}
export interface MirrorAnalysisResponse {
  success: true;
  analysis: GeminiMirrorAnalysis;
  styleDirections: StyleDirection[];
  guardrails: { bodyJudgment: false; bodyModification: false; weightEstimation: false; };
}

export interface TransformRequest {
  image: string;
  mimeType?: SupportedImageMimeType;
  direction: StyleDirectionId;
  changes: string[];
}

export interface TransformResponse {
  success: true;
  transformation: {
    direction: StyleDirectionId;
    image: string;
    generated: boolean;
    changesApplied: string[];
    message: string;
  };
  guardrails: {
    bodyModified: false;
    identityModified: false;
  };
}
