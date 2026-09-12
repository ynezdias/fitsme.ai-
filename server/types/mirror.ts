export const concernTypes = ["fit", "colors", "silhouette", "styling", "something_off", "dont_know", "body"] as const;
export type ConcernType = (typeof concernTypes)[number];
export interface MirrorAnalysisRequest { image: string; concern: ConcernType; }
export interface StyleRecommendation { changes: string[]; }
export interface StyleDirection extends StyleRecommendation { id: "comfort" | "confidence" | "experiment"; name: string; description: string; }
export interface MirrorAnalysisResponse {
  success: true;
  analysis: { summary: string; observations: string[]; };
  styleDirections: StyleDirection[];
  guardrails: { bodyJudgment: false; bodyModification: false; weightEstimation: false; };
}
