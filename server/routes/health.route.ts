import { Router } from "express";
export const healthRouter = Router();
healthRouter.get("/health", (_req, res) => {
  res.json({ success: true, service: "fitsme.ai backend", status: "healthy" });
});
