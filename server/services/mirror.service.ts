import type { MirrorAnalysisResponse } from "../types/mirror.js";

/** A safe response used when the AI provider is unavailable or returns invalid content. */
export const createFallbackMirrorAnalysis = (): MirrorAnalysisResponse => ({
  success: true,
  analysis: {
    summary: "Let's focus on the outfit rather than you. A few styling changes may change how the whole look feels.",
    observations: [{ category: "styling", text: "Try changing one element at a time so you can identify what makes the outfit feel more like you." }],
    reframe: "Your body is not the problem to solve. Styling is something you can experiment with.",
    bodyModificationSuggested: false
  },
  styleDirections: [
    { id: "comfort", name: "Comfort", description: "Keep things easy and familiar.", changes: ["Adjust the layering.", "Try a softer combination of pieces."] },
    { id: "confidence", name: "Confidence", description: "Make one element feel more intentional.", changes: ["Create a clear focal point.", "Add one structured or statement piece."] },
    { id: "experiment", name: "Experiment", description: "Try one noticeable styling change.", changes: ["Change the silhouette created by the garments.", "Try a contrasting accessory."] }
  ],
  guardrails: { bodyJudgment: false, bodyModification: false, weightEstimation: false }
});
