import type { MirrorAnalysisRequest, MirrorAnalysisResponse } from "../types/mirror.js";

export const createMockMirrorAnalysis = (_request: MirrorAnalysisRequest): MirrorAnalysisResponse => ({
  success: true,
  analysis: { summary: "The outfit itself may be creating the feeling you're noticing.", observations: ["The outfit proportions may be creating a visually heavier lower half.", "The color relationship between the pieces could feel more balanced."] },
  styleDirections: [
    { id: "comfort", name: "Comfort", description: "Keep the feeling easy and natural while making small styling changes.", changes: ["Try a softer layer.", "Keep the current color family."] },
    { id: "confidence", name: "Confidence", description: "Make the outfit feel more intentional without changing who you are.", changes: ["Add a structured layer.", "Use one statement accessory."] },
    { id: "experiment", name: "Experiment", description: "Try a direction that feels noticeably different.", changes: ["Introduce a contrasting layer.", "Experiment with a different silhouette."] }
  ],
  guardrails: { bodyJudgment: false, bodyModification: false, weightEstimation: false }
});
