import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { requestLogger } from "./middleware/request-logger.js";
import { healthRouter } from "./routes/health.route.js";
import { mirrorRouter } from "./routes/mirror.route.js";
import { transformRouter } from "./routes/transform.route.js";

const configuredOrigin = process.env.FRONTEND_ORIGIN;
const isProduction = process.env.NODE_ENV === "production";
export const app = express();
app.use(cors({ origin: configuredOrigin ?? (isProduction ? false : "http://localhost:5173"), methods: ["GET", "POST"] }));
app.use(express.json({ limit: "8mb" }));
if (!isProduction) app.use(requestLogger);
app.use("/api", healthRouter);
app.use("/api/mirror", mirrorRouter);
app.use("/api/mirror", transformRouter);
app.use(notFoundHandler);
app.use(errorHandler);
